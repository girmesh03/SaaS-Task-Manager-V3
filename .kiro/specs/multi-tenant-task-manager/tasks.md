# Implementation Plan: Multi-Tenant Task Manager

## Overview

This implementation plan provides a comprehensive, actionable task list for building the multi-tenant task management system. The plan is organized into sequential phases covering backend implementation, frontend implementation, integration, testing, and alignment corrections.

**Total Requirements**: 63 requirements with 1,104 lines of acceptance criteria
**Design Scope**: 2,807 lines covering architecture, data models, API endpoints, and authorization
**Technology Stack**: MERN (MongoDB, Express, React, Node.js) with Socket.IO, Redux Toolkit, Material UI

**Implementation Order**:

1. Backend foundation (database, models, middleware)
2. Backend API (controllers, routes, services)
3. Frontend foundation (setup, authentication, layouts)
4. Frontend features (components, pages, real-time)
5. Integration and testing
6. Alignment corrections

**Key Constraints**:

- No test frameworks allowed (Jest, Mocha, Chai, Supertest, Vitest, Cypress forbidden)
- Manual testing only with comprehensive test scenarios
- Soft delete only (no hard deletes)
- Multi-tenant data isolation enforced at all layers
- RBAC authorization matrix enforced on all operations

---

## Phase 1: Backend Foundation

### 1. Database Setup and Configuration

- [ ] 1.1 Initialize MongoDB connection

  - Create `backend/config/database.js` with Mongoose connection
  - Configure connection options (useNewUrlParser, useUnifiedTopology)
  - Add connection event handlers (connected, error, disconnected)
  - Add graceful shutdown on SIGINT
  - _Requirements: 19.1, 19.2_

- [ ] 1.2 Create environment configuration

  - Create `backend/.env.example` with all required variables
  - Document: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
  - Document: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  - Document: NODE_ENV, PORT, CLIENT_URL, CORS_ORIGIN
  - _Requirements: 19.1, 19.2_

- [ ] 1.3 Create database seeding script

  - Create `backend/mock/seed.js` for platform organization setup
  - Create platform organization with isPlatformOrg=true
  - Create platform department with status=ACTIVE
  - Create Platform SuperAdmin user with isPlatformOrgUser=true, isHod=true, isVerified=true
  - Resolve circular dependencies (org → dept → user → update manager/createdBy)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.4 Create database wipe script
  - Create `backend/mock/wipe.js` to clear all collections
  - Add confirmation prompt before wiping
  - Preserve platform organization (skip deletion)
  - _Requirements: Testing support_

### 2. Mongoose Models

- [ ] 2.1 Create Organization model

  - Create `backend/models/Organization.js` with schema
  - Fields: name, email, phone, address, industry, size, description, logo, isPlatformOrg, isVerified, verifiedAt, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: name (2-100 chars, pattern), email (unique), phone (Ethiopian format), industry (enum), size (enum)
  - Indexes: { email: 1 } unique, { isPlatformOrg: 1 }, { isDeleted: 1 }
  - Virtuals: departments, users
  - Hooks: pre-save (validate email uniqueness), pre-delete (prevent if isPlatformOrg=true)
  - _Requirements: 2.2, 2.3, 2.9, Design: Organization Schema_

- [ ] 2.2 Create Department model

  - Create `backend/models/Department.js` with schema
  - Fields: name, description, status, manager, organization, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: name (2-100 chars, pattern), description (max 500 chars), status (enum: ACTIVE|INACTIVE)
  - Indexes: { organization: 1, name: 1 } unique (case-insensitive), { organization: 1, status: 1 }, { organization: 1, isDeleted: 1 }, { manager: 1 }
  - Virtuals: users, tasks, materials, memberCount, taskCount, activeTaskCount
  - Hooks: pre-delete (cascade soft-delete to users, tasks, materials, activities, comments, attachments, notifications)
  - _Requirements: 5.1, 5.2, 5.4, 5.5, Design: Department Schema_

- [ ] 2.3 Create User model

  - Create `backend/models/User.js` with schema
  - Fields: firstName, lastName, position, email, password, phone, role, status, department, organization, isHod, employeeId, joinedAt, dateOfBirth, skills, profilePicture, preferences, security, isPlatformOrgUser, isVerified, emailVerifiedAt, verificationToken, verificationTokenExpiry, passwordResetToken, passwordResetExpiry, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: firstName/lastName (2-50 chars, pattern), position (2-100 chars), email (unique per org), phone (Ethiopian format), role (enum), employeeId (4 digits, not 0000, unique per org)
  - Preferences: themeMode, dateFormat, timeFormat, timezone, notifications (emailEnabled, inAppEnabled, emailEvents, inAppEvents)
  - Indexes: { organization: 1, email: 1 } unique, { organization: 1, employeeId: 1 } unique, { organization: 1, department: 1, status: 1 }, { organization: 1, role: 1 }, { verificationToken: 1 } sparse, { passwordResetToken: 1 } sparse, { isDeleted: 1 }
  - Virtuals: fullName, createdTasks, assignedTasks, watchingTasks
  - Hooks: pre-save (hash password with bcrypt >=12 rounds, auto-generate employeeId), pre-delete (cascade soft-delete, remove from watchers/assignees/mentions)
  - Immutability: department, role, employeeId, joinedAt, isHod for Admin/Manager/User targets
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.8, Design: User Schema_

- [ ] 2.4 Create Task base model with discriminators

  - Create `backend/models/Task.js` with base schema and discriminators
  - Base fields: type, title, description, status, priority, tags, watchers, organization, department, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: title (3-200 chars), description (10-5000 chars), status (enum), priority (enum), tags (max 5, each max 50 chars, lowercase, unique case-insensitive)
  - ProjectTask discriminator: vendor, startDate, dueDate (must be after startDate)
  - AssignedTask discriminator: assignees (min 1, max 50), startDate, dueDate
  - RoutineTask discriminator: date, materials (max 20 embedded subdocuments with material ref and quantity)
  - Indexes: { organization: 1, department: 1, status: 1 }, { organization: 1, department: 1, type: 1 }, { organization: 1, department: 1, priority: 1 }, { organization: 1, department: 1, createdBy: 1 }, { organization: 1, department: 1, dueDate: 1 }, { organization: 1, department: 1, date: 1 }, { assignees: 1 }, { watchers: 1 }, { vendor: 1 }, { isDeleted: 1 }, text index on title and description
  - Virtuals: activities, comments, attachments
  - Hooks: pre-save (validate dueDate > startDate, normalize tags, validate watchers/assignees are active), post-save (create initial TaskActivity for ProjectTask/AssignedTask, emit socket events, create notifications), pre-delete (cascade soft-delete, restore material stock for RoutineTask)
  - _Requirements: 7.1-7.10, 8.1-8.10, 9.1-9.10, Design: Task Schema_

- [ ] 2.5 Create TaskActivity model

  - Create `backend/models/TaskActivity.js` with schema
  - Fields: parent, parentModel, activity, materials (embedded subdocuments), attachments, organization, department, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: activity (2-1000 chars), materials (max 20, unique by materialId), parentModel (enum: Task|TaskActivity|TaskComment)
  - Business rule: parentModel=Task requires parent to be ProjectTask or AssignedTask (NOT RoutineTask)
  - Indexes: { parent: 1, parentModel: 1 }, { organization: 1, department: 1 }, { createdBy: 1 }, { isDeleted: 1 }
  - Hooks: pre-save (validate parent exists, decrement material stock atomically), post-save (emit socket event, create notifications), pre-delete (restore material stock, cascade soft-delete)
  - _Requirements: 7.7, 7.8, 8.6, 8.7, Design: TaskActivity Schema_

- [ ] 2.6 Create TaskComment model

  - Create `backend/models/TaskComment.js` with schema
  - Fields: parent, parentModel, comment, mentions, depth, attachments, organization, department, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: comment (2-2000 chars), mentions (max 20), depth (0-5), parentModel (enum: Task|TaskActivity|TaskComment)
  - Indexes: { parent: 1, parentModel: 1 }, { organization: 1, department: 1 }, { createdBy: 1 }, { mentions: 1 }, { isDeleted: 1 }
  - Hooks: pre-save (parse @mentions, validate mentioned users, calculate depth), post-save (emit socket event, create notifications), pre-delete (cascade soft-delete to nested comments)
  - _Requirements: 10.1-10.10, Design: TaskComment Schema_

- [ ] 2.7 Create Material model

  - Create `backend/models/Material.js` with schema
  - Fields: name, sku, status, description, unit, category, price, inventory (stockOnHand, lowStockThreshold, reorderQuantity, lastRestockedAt), organization, department, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: name (2-200 chars, unique per dept case-insensitive), sku (pattern, uppercase, unique per dept), unit (1-50 chars), category (enum), price (min 0), inventory fields (min 0)
  - Indexes: { organization: 1, department: 1, name: 1 } unique, { organization: 1, department: 1, sku: 1 } unique, { organization: 1, department: 1, category: 1 }, { organization: 1, department: 1, status: 1 }, { 'inventory.stockOnHand': 1 }, { isDeleted: 1 }
  - Virtuals: isLowStock, usageHistory
  - Hooks: pre-save (normalize SKU to uppercase), pre-delete (check associations with RoutineTask/TaskActivity using .withDeleted(), return 409 if associated)
  - _Requirements: 12.1-12.11, Design: Material Schema_

- [ ] 2.8 Create Vendor model

  - Create `backend/models/Vendor.js` with schema
  - Fields: name, email, phone, website, location, address, description, status, isVerifiedPartner, rating, organization, createdBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: name (2-200 chars, unique per org), email (unique per org), phone (Ethiopian format, unique per org), website (valid URL), rating (1-5, 0.5 increments)
  - Indexes: { organization: 1, name: 1 } unique, { organization: 1, email: 1 } unique, { organization: 1, phone: 1 } unique, { organization: 1, status: 1 }, { organization: 1, rating: 1 }, { isDeleted: 1 }
  - Virtuals: projects, metrics (total projects, active projects, completed projects, on-time delivery rate, average project duration, total spend)
  - Hooks: pre-delete (check associations with ProjectTasks using .withDeleted(), return 409 if associated)
  - _Requirements: 13.1-13.11, Design: Vendor Schema_

- [ ] 2.9 Create Attachment model

  - Create `backend/models/Attachment.js` with schema
  - Fields: filename, fileUrl, fileType, fileSize, parent, parentModel, organization, department, uploadedBy, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: filename (1-255 chars), fileUrl (Cloudinary URL pattern with version segment), fileType (enum: Image|Video|Document|Audio|Other), fileSize (max 10MB), parentModel (enum: Task|TaskActivity|TaskComment)
  - Indexes: { parent: 1, parentModel: 1 }, { organization: 1, department: 1 }, { uploadedBy: 1 }, { isDeleted: 1 }
  - Hooks: pre-save (validate fileUrl matches Cloudinary pattern)
  - _Requirements: 11.1-11.10, Design: Attachment Schema_

- [ ] 2.10 Create Notification model
  - Create `backend/models/Notification.js` with schema
  - Fields: title, message, entity, entityModel, isRead, expiresAt, organization, department, user, isDeleted, deletedAt, deletedBy, timestamps
  - Validation: title (max 200 chars), message (1-500 chars), entityModel (enum: Task|TaskActivity|TaskComment|User|Department|Material|Vendor)
  - Indexes: { user: 1, isRead: 1 }, { organization: 1, department: 1 }, { entity: 1, entityModel: 1 }, { expiresAt: 1 } TTL index (30 days), { isDeleted: 1 }
  - Hooks: post-save (emit socket event to user room)
  - _Requirements: 15.1-15.11, Design: Notification Schema_

### 3. Middleware Layer

- [ ] 3.1 Create authentication middleware

  - Create `backend/middleware/auth.js` with JWT verification
  - Extract token from HttpOnly cookies (accessToken)
  - Verify token using JWT_SECRET
  - Decode user payload (userId, organizationId, departmentId, role, isPlatformOrgUser)
  - Attach user object to req.user
  - Handle token expiration (401 UNAUTHENTICATED_ERROR)
  - Handle invalid token (401 UNAUTHENTICATED_ERROR)
  - Handle missing token (401 UNAUTHENTICATED_ERROR)
  - _Requirements: 19.1, 19.2, 19.3, Design: Authentication Middleware_

- [ ] 3.2 Create validation middleware

  - Create `backend/middleware/validate.js` with express-validator schemas
  - Implement validation runner using `.run(req)` and `validationResult(req)`
  - Create validation schemas for all resources (Organization, Department, User, Task, Material, Vendor, Attachment, Notification)
  - Implement existence checks using `.withDeleted()` for create/restore operations
  - Scope validators by req.user.organization for org-level resources (Vendor)
  - Scope validators by req.user.organization AND req.user.department for dept-level resources (User, Task, Material)
  - Return 400 VALIDATION_ERROR with detailed error messages
  - _Requirements: 23.1-23.12, Design: Validation Middleware, Alignment Gap 2.3_

- [ ] 3.3 Create authorization middleware

  - Create `backend/middleware/authorize.js` with RBAC checks
  - Implement authorization matrix evaluation logic (ANY rule passes → ALLOW)
  - Check requires predicates (isPlatformOrgUser, !isPlatformOrgUser)
  - Check scope (any, ownOrg, ownOrg.ownDept, ownOrg.crossDept)
  - Check ownership (self, createdBy, assignees, watchers, uploadedBy)
  - Check resourceType for task subtypes (ProjectTask, AssignedTask, RoutineTask)
  - Enforce multi-tenant data isolation (filter by organization and department)
  - Return 403 UNAUTHORIZED_ERROR with clear message
  - Block INACTIVE users from login/refresh (403 FORBIDDEN)
  - Block unverified users from protected routes (403 FORBIDDEN)
  - _Requirements: 4.1-4.10, 43.1-43.10, Design: Authorization Matrix, Alignment Gap 3.6_

- [ ] 3.4 Create error handling middleware

  - Create `backend/middleware/errorHandler.js` with centralized error handling
  - Handle Mongoose validation errors (400 VALIDATION_ERROR)
  - Handle Mongoose duplicate key errors (409 CONFLICT_ERROR)
  - Handle Mongoose cast errors (400 VALIDATION_ERROR)
  - Handle JWT errors (401 UNAUTHENTICATED_ERROR)
  - Handle custom error classes (VALIDATION_ERROR, UNAUTHENTICATED_ERROR, UNAUTHORIZED_ERROR, NOT_FOUND_ERROR, CONFLICT_ERROR, RATE_LIMITED_ERROR, INTERNAL_ERROR)
  - Format error response: { success: false, message, error: { code, details } }
  - Log errors using Winston
  - _Requirements: 24.1-24.10, Design: Error Handling_

- [ ] 3.5 Create rate limiting middleware

  - Create `backend/middleware/rateLimit.js` with express-rate-limit
  - Configure rate limits per endpoint (login: 5 req/15min, register: 3 req/hour, general: 100 req/15min)
  - Return 429 RATE_LIMITED_ERROR when limit exceeded
  - _Requirements: 19.7, Design: Security_

- [ ] 3.6 Create security middleware
  - Create `backend/middleware/security.js` with helmet, cors, express-mongo-sanitize
  - Configure helmet for security headers (CSP, HSTS, etc.)
  - Configure CORS with CLIENT_URL origin
  - Configure express-mongo-sanitize for NoSQL injection prevention
  - _Requirements: 19.7, Design: Security_

---

## Phase 2: Backend API Implementation

### 4. Authentication Controllers and Routes

**Mapped PRD tests**

- AUTH-VAL-*, AUTH-AUTH-*, AUTH-AUTHZ-*, AUTH-CTRL-*
- ORG-VALX-CREATE-*, DEPT-VALX-CREATE-*, USER-VALX-CREATE-* (registration payload validators)
- ORG-AUTHZX-CREATE-*, DEPT-AUTHZX-CREATE-*, USER-AUTHZX-CREATE-* (registration authz pathways)
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 4.1 or 4.2 complete.


- [ ] 4.1 Create authentication controller

  - Create `backend/controllers/authController.js` with authentication logic
  - Implement register (4-step wizard backend handling): create org, dept, user, resolve circular dependencies, generate verification token, send verification email
  - Implement verifyEmail: validate token, set isVerified=true for org and user, clear tokens, send welcome email (idempotent)
  - Implement resendVerification: generate new token, send email
  - Implement login: validate credentials, check isVerified, check status=ACTIVE, generate access and refresh tokens, set HttpOnly cookies
  - Implement refresh: validate refresh token, generate new access token, rotate refresh token
  - Implement logout: clear cookies, invalidate refresh token
  - Implement forgotPassword: generate reset token, send email
  - Implement resetPassword: validate token, hash new password, clear token
  - Implement changePassword: validate old password, hash new password
  - _Requirements: 2.1-2.9, 19.1-19.10, Design: Authentication Flow_

- [ ] 4.2 Create authentication routes
  - Create `backend/routes/authRoutes.js` with authentication endpoints
  - POST /api/auth/register (no auth, rate limit: 3 req/hour)
  - POST /api/auth/verify-email (no auth)
  - POST /api/auth/resend-verification (no auth, rate limit: 3 req/15min)
  - POST /api/auth/login (no auth, rate limit: 5 req/15min)
  - POST /api/auth/refresh (no auth, requires refresh token cookie)
  - POST /api/auth/logout (requires auth)
  - POST /api/auth/forgot-password (no auth, rate limit: 3 req/15min)
  - POST /api/auth/reset-password (no auth)
  - POST /api/auth/change-password (requires auth)
  - Apply validation middleware to all routes
  - _Requirements: 19.1-19.10, Design: API Endpoints_

### 5. Organization Controllers and Routes

**Mapped PRD tests**

- ORG-AUTH-*, ORG-VAL-*, ORG-AUTHZ-*, ORG-CTRL-*
- ORG-VALX-GET-*, ORG-VALX-GETALL-*, ORG-VALX-UPDATE-*, ORG-VALX-DELETE-*, ORG-VALX-RESTORE-*
- ORG-AUTHZX-GET-*, ORG-AUTHZX-GETALL-*, ORG-AUTHZX-UPDATE-*, ORG-AUTHZX-DELETE-*, ORG-AUTHZX-RESTORE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 5.1 or 5.2 complete.


- [ ] 5.1 Create organization controller

  - Create `backend/controllers/organizationController.js` with organization logic
  - Implement listOrganizations: filter by isPlatformOrg, includeDeleted (Platform SuperAdmin only), pagination, sorting
  - Implement getOrganization: fetch by ID, check authorization
  - Implement updateOrganization: validate fields, check authorization, emit socket event
  - Implement deleteOrganization: soft delete (Platform SuperAdmin only, NOT platform org), cascade to departments/users/tasks, emit socket event
  - Implement restoreOrganization: restore soft-deleted org (Platform SuperAdmin only), restore cascaded resources
  - _Requirements: 1.3, 1.4, 1.5, Design: Organization Endpoints_

- [ ] 5.2 Create organization routes
  - Create `backend/routes/organizationRoutes.js` with organization endpoints
  - GET /api/organizations (requires auth, authorization check)
  - GET /api/organizations/:organizationId (requires auth, authorization check)
  - PUT /api/organizations/:organizationId (requires auth, authorization check, validation)
  - DELETE /api/organizations/:organizationId (requires auth, authorization check)
  - PATCH /api/organizations/:organizationId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 1.3, 1.4, 1.5, Design: API Endpoints_

### 6. Department Controllers and Routes

**Mapped PRD tests**

- DEPT-AUTH-*, DEPT-VAL-*, DEPT-AUTHZ-*, DEPT-CTRL-*
- DEPT-VALX-GET-*, DEPT-VALX-GETALL-*, DEPT-VALX-CREATE-*, DEPT-VALX-UPDATE-*, DEPT-VALX-DELETE-*, DEPT-VALX-RESTORE-*
- DEPT-AUTHZX-GET-*, DEPT-AUTHZX-GETALL-*, DEPT-AUTHZX-CREATE-*, DEPT-AUTHZX-UPDATE-*, DEPT-AUTHZX-DELETE-*, DEPT-AUTHZX-RESTORE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 6.1 or 6.2 complete.


- [ ] 6.1 Create department controller

  - Create `backend/controllers/departmentController.js` with department logic
  - Implement listDepartments: filter by organization, status, includeDeleted, pagination, sorting, search
  - Implement createDepartment: validate fields, check authorization, set organization, emit socket event
  - Implement getDepartment: fetch by ID, check authorization, populate manager
  - Implement getDepartmentDashboard: aggregate stats (total users, total tasks, active tasks)
  - Implement getDepartmentActivity: fetch activity feed with filtering by entityModel
  - Implement updateDepartment: validate fields, check authorization, emit socket event
  - Implement deleteDepartment: soft delete, cascade to users/tasks/materials/activities/comments/attachments/notifications, emit socket event
  - Implement restoreDepartment: restore soft-deleted dept, restore cascaded resources
  - _Requirements: 5.1-5.9, Design: Department Endpoints_

- [ ] 6.2 Create department routes
  - Create `backend/routes/departmentRoutes.js` with department endpoints
  - GET /api/departments (requires auth, authorization check, validation)
  - POST /api/departments (requires auth, authorization check, validation)
  - GET /api/departments/:departmentId (requires auth, authorization check)
  - GET /api/departments/:departmentId/dashboard (requires auth, authorization check)
  - GET /api/departments/:departmentId/activity (requires auth, authorization check, validation)
  - PUT /api/departments/:departmentId (requires auth, authorization check, validation)
  - DELETE /api/departments/:departmentId (requires auth, authorization check)
  - PATCH /api/departments/:departmentId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 5.1-5.9, Design: API Endpoints_

### 7. User Controllers and Routes

**Mapped PRD tests**

- USER-AUTH-*, USER-VAL-*, USER-AUTHZ-*, USER-CTRL-*
- USER-VALX-GET-*, USER-VALX-GETALL-*, USER-VALX-CREATE-*, USER-VALX-UPDATE-*, USER-VALX-DELETE-*, USER-VALX-RESTORE-*
- USER-AUTHZX-GET-*, USER-AUTHZX-GETALL-*, USER-AUTHZX-CREATE-*, USER-AUTHZX-UPDATE-*, USER-AUTHZX-DELETE-*, USER-AUTHZX-RESTORE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 7.1 or 7.2 complete.


- [ ] 7.1 Create user controller

  - Create `backend/controllers/userController.js` with user logic
  - Implement listUsers: filter by organization, department, role, status, includeInactive, includeDeleted, pagination, sorting, search
  - Implement createUser: validate fields, check authorization, auto-generate employeeId, set isVerified=true, generate temp password, send welcome email with setup link
  - Implement getUser: fetch by ID, check authorization, populate department
  - Implement getUserActivity: fetch activity feed
  - Implement getUserPerformance: calculate metrics (completion rate, avg task time, throughput, comparison to dept averages)
  - Implement updateUser: validate fields, check authorization, enforce immutability rules (department, role, employeeId, joinedAt, isHod for Admin/Manager/User targets), emit socket event
  - Implement updateUserPreferences: update preferences (theme, date format, time format, timezone, notifications)
  - Implement updateUserSecurity: update security settings (twoFactorEnabled)
  - Implement deleteUser: soft delete, cascade to tasks/activities/comments/attachments/notifications, remove from watchers/assignees/mentions, emit socket event
  - Implement restoreUser: restore soft-deleted user, restore cascaded resources
  - _Requirements: 6.1-6.11, Design: User Endpoints_

- [ ] 7.2 Create user routes
  - Create `backend/routes/userRoutes.js` with user endpoints
  - GET /api/users (requires auth, authorization check, validation)
  - POST /api/users (requires auth, authorization check, validation)
  - GET /api/users/:userId (requires auth, authorization check)
  - GET /api/users/:userId/activity (requires auth, authorization check, validation)
  - GET /api/users/:userId/performance (requires auth, authorization check)
  - PUT /api/users/:userId (requires auth, authorization check, validation)
  - PUT /api/users/:userId/preferences (requires auth, authorization check, validation)
  - PUT /api/users/:userId/security (requires auth, authorization check, validation)
  - DELETE /api/users/:userId (requires auth, authorization check)
  - PATCH /api/users/:userId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 6.1-6.11, Design: API Endpoints_

### 8. Task Controllers and Routes

**Mapped PRD tests**

- TASK-AUTH-*, TASK-VAL-*, TASK-AUTHZ-*, TASK-CTRL-*
- ACT-AUTH-*, ACT-VAL-*, ACT-AUTHZ-*, ACT-CTRL-*
- COMM-AUTH-*, COMM-VAL-*, COMM-AUTHZ-*, COMM-CTRL-*
- TASK-VALX-GET-*, TASK-VALX-GETALL-*, TASK-VALX-CREATE-*, TASK-VALX-UPDATE-*, TASK-VALX-DELETE-*, TASK-VALX-RESTORE-*
- TASK-AUTHZX-GET-*, TASK-AUTHZX-GETALL-*, TASK-AUTHZX-CREATE-*, TASK-AUTHZX-UPDATE-*, TASK-AUTHZX-DELETE-*, TASK-AUTHZX-RESTORE-*
- ACT-VALX-*, ACT-AUTHZX-*, COMM-VALX-*, COMM-AUTHZX-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 8.1 or 8.2 complete.


- [ ] 8.1 Create task controller

  - Create `backend/controllers/taskController.js` with task logic
  - Implement listTasks: filter by organization, department, type, status, priority, createdBy, assignees, watchers, tags (union filters), date ranges, includeDeleted, pagination, sorting, search (min 3 chars)
  - Implement createTask: validate fields based on type (ProjectTask: vendor, startDate, dueDate; AssignedTask: assignees, startDate, dueDate; RoutineTask: date, materials), check authorization, decrement material stock for RoutineTask, create initial TaskActivity for ProjectTask/AssignedTask, emit socket events, create notifications
  - Implement getTask: fetch by ID, check authorization, populate vendor/assignees/watchers/materials
  - Implement getTaskActivities: fetch activities for task (ProjectTask/AssignedTask only)
  - Implement createTaskActivity: validate fields, check authorization, validate parent is ProjectTask or AssignedTask (NOT RoutineTask), decrement material stock, emit socket event, create notifications
  - Implement getTaskComments: fetch comments for task with nested replies (max depth 5)
  - Implement createTaskComment: validate fields, check authorization, parse @mentions, validate mentioned users, calculate depth, emit socket event, create notifications
  - Implement updateTask: validate fields, check authorization, enforce dueDate > startDate, emit socket event
  - Implement deleteTask: soft delete, cascade to activities/comments/attachments/notifications, restore material stock for RoutineTask, emit socket event
  - Implement restoreTask: restore soft-deleted task, restore cascaded resources (do NOT restore material stock for RoutineTask)
  - _Requirements: 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10, Design: Task Endpoints_

- [ ] 8.2 Create task routes
  - Create `backend/routes/taskRoutes.js` with task endpoints
  - GET /api/tasks (requires auth, authorization check, validation)
  - POST /api/tasks (requires auth, authorization check, validation)
  - GET /api/tasks/:taskId (requires auth, authorization check)
  - GET /api/tasks/:taskId/activities (requires auth, authorization check, validation)
  - POST /api/tasks/:taskId/activities (requires auth, authorization check, validation)
  - GET /api/tasks/:taskId/comments (requires auth, authorization check, validation)
  - POST /api/tasks/:taskId/comments (requires auth, authorization check, validation)
  - PUT /api/tasks/:taskId (requires auth, authorization check, validation)
  - DELETE /api/tasks/:taskId (requires auth, authorization check)
  - PATCH /api/tasks/:taskId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10, Design: API Endpoints_

### 9. Material Controllers and Routes

**Mapped PRD tests**

- MAT-AUTH-*, MAT-VAL-*, MAT-AUTHZ-*, MAT-CTRL-*
- MAT-VALX-GET-*, MAT-VALX-GETALL-*, MAT-VALX-CREATE-*, MAT-VALX-UPDATE-*, MAT-VALX-DELETE-*, MAT-VALX-RESTORE-*, MAT-VALX-RESTOCK-*
- MAT-AUTHZX-GET-*, MAT-AUTHZX-GETALL-*, MAT-AUTHZX-CREATE-*, MAT-AUTHZX-UPDATE-*, MAT-AUTHZX-DELETE-*, MAT-AUTHZX-RESTORE-*, MAT-AUTHZX-RESTOCK-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 9.1 or 9.2 complete.


- [ ] 9.1 Create material controller

  - Create `backend/controllers/materialController.js` with material logic
  - Implement listMaterials: filter by organization, department, category, status, lowStock, includeDeleted, pagination, sorting, search
  - Implement createMaterial: validate fields, check authorization, normalize SKU to uppercase, set organization and department
  - Implement getMaterial: fetch by ID, check authorization, populate usageHistory
  - Implement restockMaterial: increment inventory.stockOnHand atomically, update inventory.lastRestockedAt
  - Implement updateMaterial: validate fields, check authorization
  - Implement deleteMaterial: check associations with RoutineTask/TaskActivity using .withDeleted(), return 409 CONFLICT_ERROR if associated, otherwise soft delete
  - Implement restoreMaterial: restore soft-deleted material
  - _Requirements: 12.1-12.11, Design: Material Endpoints_

- [ ] 9.2 Create material routes
  - Create `backend/routes/materialRoutes.js` with material endpoints
  - GET /api/materials (requires auth, authorization check, validation)
  - POST /api/materials (requires auth, authorization check, validation)
  - GET /api/materials/:materialId (requires auth, authorization check)
  - POST /api/materials/:materialId/restock (requires auth, authorization check, validation)
  - PUT /api/materials/:materialId (requires auth, authorization check, validation)
  - DELETE /api/materials/:materialId (requires auth, authorization check)
  - PATCH /api/materials/:materialId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 12.1-12.11, Design: API Endpoints_

### 10. Vendor Controllers and Routes

**Mapped PRD tests**

- VEND-AUTH-*, VEND-VAL-*, VEND-AUTHZ-*, VEND-CTRL-*
- VEND-VALX-GET-*, VEND-VALX-GETALL-*, VEND-VALX-CREATE-*, VEND-VALX-UPDATE-*, VEND-VALX-DELETE-*, VEND-VALX-RESTORE-*
- VEND-AUTHZX-GET-*, VEND-AUTHZX-GETALL-*, VEND-AUTHZX-CREATE-*, VEND-AUTHZX-UPDATE-*, VEND-AUTHZX-DELETE-*, VEND-AUTHZX-RESTORE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 10.1 or 10.2 complete.


- [ ] 10.1 Create vendor controller

  - Create `backend/controllers/vendorController.js` with vendor logic
  - Implement listVendors: filter by organization, status, rating, includeDeleted, pagination, sorting, search
  - Implement createVendor: validate fields, check authorization (non-platform SuperAdmin/Admin only), set organization
  - Implement getVendor: fetch by ID, check authorization, populate projects, calculate metrics
  - Implement updateVendor: validate fields, check authorization
  - Implement deleteVendor: check associations with ProjectTasks using .withDeleted(), return 409 CONFLICT_ERROR if associated, otherwise soft delete
  - Implement restoreVendor: restore soft-deleted vendor
  - _Requirements: 13.1-13.11, Design: Vendor Endpoints_

- [ ] 10.2 Create vendor routes
  - Create `backend/routes/vendorRoutes.js` with vendor endpoints
  - GET /api/vendors (requires auth, authorization check, validation)
  - POST /api/vendors (requires auth, authorization check, validation)
  - GET /api/vendors/:vendorId (requires auth, authorization check)
  - PUT /api/vendors/:vendorId (requires auth, authorization check, validation)
  - DELETE /api/vendors/:vendorId (requires auth, authorization check)
  - PATCH /api/vendors/:vendorId/restore (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 13.1-13.11, Design: API Endpoints_

### 11. Attachment Controllers and Routes

**Mapped PRD tests**

- ATT-AUTH-*, ATT-VAL-*, ATT-AUTHZ-*, ATT-CTRL-*
- ATT-VALX-GET-*, ATT-VALX-CREATE-*, ATT-VALX-DELETE-*
- ATT-AUTHZX-GET-*, ATT-AUTHZX-CREATE-*, ATT-AUTHZX-DELETE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 11.1 or 11.2 complete.


- [ ] 11.1 Create attachment controller

  - Create `backend/controllers/attachmentController.js` with attachment logic
  - Implement createAttachment: validate fields (filename, fileUrl, fileType, fileSize, parent, parentModel), check authorization, validate fileUrl matches Cloudinary pattern, set organization and department
  - Implement getAttachment: fetch by ID, check authorization
  - Implement deleteAttachment: soft delete, check authorization (uploadedBy only)
  - _Requirements: 11.1-11.10, Design: Attachment Endpoints_

- [ ] 11.2 Create attachment routes
  - Create `backend/routes/attachmentRoutes.js` with attachment endpoints
  - POST /api/attachments (requires auth, authorization check, validation)
  - GET /api/attachments/:attachmentId (requires auth, authorization check)
  - DELETE /api/attachments/:attachmentId (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 11.1-11.10, Design: API Endpoints_

### 12. Notification Controllers and Routes

**Mapped PRD tests**

- NOTIF-AUTH-*, NOTIF-VAL-*, NOTIF-AUTHZ-*, NOTIF-CTRL-*
- NOTIF-VALX-GETALL-*, NOTIF-VALX-READ-*, NOTIF-VALX-READALL-*, NOTIF-VALX-DELETE-*, NOTIF-VALX-RESTORE-*
- NOTIF-AUTHZX-GETALL-*, NOTIF-AUTHZX-READ-*, NOTIF-AUTHZX-READALL-*, NOTIF-AUTHZX-DELETE-*, NOTIF-AUTHZX-RESTORE-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 12.1 or 12.2 complete.


- [ ] 12.1 Create notification controller

  - Create `backend/controllers/notificationController.js` with notification logic
  - Implement listNotifications: filter by user, isRead, pagination (newest first)
  - Implement markAsRead: update isRead=true for single notification
  - Implement markAllAsRead: update isRead=true for all user notifications
  - Implement deleteNotification: soft delete notification
  - _Requirements: 15.1-15.11, Design: Notification Endpoints_

- [ ] 12.2 Create notification routes
  - Create `backend/routes/notificationRoutes.js` with notification endpoints
  - GET /api/notifications (requires auth, authorization check, validation)
  - PATCH /api/notifications/:notificationId/read (requires auth, authorization check)
  - PATCH /api/notifications/read-all (requires auth, authorization check)
  - DELETE /api/notifications/:notificationId (requires auth, authorization check)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 15.1-15.11, Design: API Endpoints_

### 13. Dashboard Controllers and Routes

**Mapped PRD tests**

- DASH-AUTH-*, DASH-VAL-*, DASH-AUTHZ-*, DASH-CTRL-*
- DASH-VALX-GET-*, DASH-VALX-GETALL-*
- DASH-AUTHZX-GET-*, DASH-AUTHZX-GETALL-*
- CROSS-VAL-001..005, CROSS-CTRL-001..005

**Pass criteria**

- Required IDs above MUST be executed and test evidence recorded in the execution log before marking tasks 13.1 or 13.2 complete.


- [ ] 13.1 Create dashboard controller

  - Create `backend/controllers/dashboardController.js` with dashboard logic
  - Implement getDashboardOverview: aggregate KPIs (My Tasks, Department Tasks, Overdue, Completed This Week), charts (status distribution, priority breakdown, timeline trends), activity feed (newest first), upcoming deadlines (next 7 days)
  - Support filters: date range, departmentId (Managers/Admins only), status, priority, taskType
  - Calculate team performance metrics for Managers/Admins (comparison to department averages)
  - _Requirements: 16.1-16.12, Design: Dashboard Endpoints_

- [ ] 13.2 Create dashboard routes
  - Create `backend/routes/dashboardRoutes.js` with dashboard endpoints
  - GET /api/dashboard/overview (requires auth, authorization check, validation)
  - Apply authentication, validation, and authorization middleware
  - _Requirements: 16.1-16.12, Design: API Endpoints_

### 14. Services Layer

- [ ] 14.1 Create email service

  - Create `backend/services/emailService.js` with Nodemailer
  - Configure Gmail SMTP transport
  - Implement sendVerificationEmail: send email with verification token link
  - Implement sendWelcomeEmail: send welcome email after verification (idempotent)
  - Implement sendPasswordResetEmail: send email with reset token link
  - Implement sendPasswordSetupEmail: send email with setup link for new users
  - Implement sendNotificationEmail: send email for important events (task assignments, mentions, due date reminders)
  - Implement sendVendorContactEmail: send email to vendor (role-gated)
  - _Requirements: 2.6, 6.4, 15.3, Design: Email Service_

- [ ] 14.2 Create Socket.IO service

  - Create `backend/services/socketService.js` with Socket.IO server
  - Configure Socket.IO with CORS (CLIENT_URL)
  - Implement JWT authentication on connection (verify token from auth object)
  - Implement room management: join user:{userId}, org:{orgId}, dept:{deptId}, task:{taskId}
  - Implement event emitters: task:created, task:updated, task:deleted, task:activity:added, task:comment:added, notification, user:status:changed
  - Implement automatic reconnection with exponential backoff
  - Implement connection status tracking
  - _Requirements: 14.1-14.12, Design: Socket.IO Service_

- [ ] 14.3 Create logger service

  - Create `backend/utils/logger.js` with Winston
  - Configure log levels (error, warn, info, debug)
  - Configure log transports (console, file)
  - Configure log format (timestamp, level, message, metadata)
  - Implement error logging with stack traces
  - _Requirements: Design: Logging_

- [ ] 14.4 Create utility functions
  - Create `backend/utils/constants.js` with enums and constants
  - Create `backend/utils/errors.js` with custom error classes (ValidationError, UnauthenticatedError, UnauthorizedError, NotFoundError, ConflictError, RateLimitedError, InternalError)
  - Create `backend/utils/helpers.js` with helper functions (generateEmployeeId, generateToken, hashPassword, comparePassword, etc.)
  - _Requirements: Design: Utilities_

---

## Phase 3: Frontend Foundation

### 15. Project Setup and Configuration

- [ ] 15.1 Initialize React project with Vite

  - Create `client/` directory with Vite + React + SWC
  - Configure `vite.config.js` with path aliases (@components, @pages, @store, @services, @hooks, @utils, @theme)
  - Configure `eslint.config.js` with React hooks and React refresh plugins
  - Create `client/.env.example` with VITE_API_URL, VITE_SOCKET_URL, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET
  - _Requirements: Design: Frontend Architecture_

- [ ] 15.2 Install and configure dependencies

  - Install core dependencies: react, react-dom, react-router, redux toolkit, react-redux, redux-persist
  - Install UI dependencies: @mui/material, @mui/icons-material, @mui/x-data-grid, @mui/x-charts, @mui/x-date-pickers, @emotion/react, @emotion/styled
  - Install form dependencies: react-hook-form (no watch() usage)
  - Install HTTP dependencies: axios, socket.io-client
  - Install file upload dependencies: react-dropzone
  - Install notification dependencies: react-toastify
  - Install utility dependencies: dayjs (internal use only for date-picker adapter)
  - _Requirements: Design: Technology Stack_

- [ ] 15.3 Configure Redux store

  - Create `client/src/store/index.js` with store configuration
  - Configure redux-persist for auth state and user preferences
  - Configure RTK Query API with baseQuery (axios interceptor for token refresh)
  - Create `client/src/store/slices/authSlice.js` with auth state (user, isAuthenticated, loading)
  - Create `client/src/store/slices/themeSlice.js` with theme preferences (mode: light|dark|system)
  - Create `client/src/store/slices/taskSlice.js` with task UI state (filters, view mode: list|grid)
  - Create `client/src/store/slices/userSlice.js` with user UI state (filters, view mode: list|grid)
  - Create `client/src/store/slices/departmentSlice.js` with department UI state (filters, view mode: list|grid)
  - Create `client/src/store/slices/notificationSlice.js` with notification state (unread count, notifications)
  - _Requirements: Design: State Management_

- [ ] 15.4 Configure MUI theme

  - Create `client/src/theme/themePrimitives.js` with design tokens (colors, spacing, typography, breakpoints)
  - Create `client/src/theme/AppTheme.jsx` with theme provider and mode toggle (light|dark|system)
  - Create `client/src/theme/customizations/index.js` with component overrides
  - Create `client/src/theme/customizations/inputs.js` (TextField, Select, Checkbox, Radio, Switch)
  - Create `client/src/theme/customizations/surfaces.js` (Paper, Card, Accordion, AppBar)
  - Create `client/src/theme/customizations/navigation.js` (Drawer, Menu, Tabs, BottomNavigation)
  - Create `client/src/theme/customizations/feedback.js` (Alert, Snackbar, Progress, Skeleton)
  - Create `client/src/theme/customizations/dataDisplay.js` (Typography, Avatar, Badge, Chip, Divider, List)
  - Create `client/src/theme/customizations/dataGrid.js` (MUI X DataGrid)
  - Create `client/src/theme/customizations/charts.js` (MUI X Charts)
  - Create `client/src/theme/customizations/datePickers.js` (MUI X DatePickers)
  - _Requirements: Design: Theme Configuration_

- [ ] 15.5 Configure routing
  - Create `client/src/router/routes.js` with route definitions
  - Configure public routes: /, /login, /register, /verify-email, /forgot-password, /reset-password
  - Configure protected routes: /dashboard, /dashboard/tasks, /dashboard/tasks/:taskId, /dashboard/users, /dashboard/users/:userId, /dashboard/departments, /dashboard/departments/:departmentId, /dashboard/materials, /dashboard/materials/:materialId, /dashboard/vendors, /dashboard/vendors/:vendorId, /dashboard/settings
  - Implement route guards: redirect to /dashboard if authenticated on public routes, redirect to /login if not authenticated on protected routes
  - Implement lazy loading for all page components
  - _Requirements: Design: Routing Structure_

### 16. API Services

- [ ] 16.1 Create RTK Query API service

  - Create `client/src/services/api.js` with RTK Query setup
  - Configure baseQuery with axios interceptor for token refresh
  - Define endpoints for all resources:
    - Auth: register, verifyEmail, resendVerification, login, refresh, logout, forgotPassword, resetPassword, changePassword
    - Organizations: listOrganizations, getOrganization, updateOrganization, deleteOrganization, restoreOrganization
    - Departments: listDepartments, createDepartment, getDepartment, getDepartmentDashboard, getDepartmentActivity, updateDepartment, deleteDepartment, restoreDepartment
    - Users: listUsers, createUser, getUser, getUserActivity, getUserPerformance, updateUser, updateUserPreferences, updateUserSecurity, deleteUser, restoreUser
    - Tasks: listTasks, createTask, getTask, getTaskActivities, createTaskActivity, getTaskComments, createTaskComment, updateTask, deleteTask, restoreTask
    - Materials: listMaterials, createMaterial, getMaterial, restockMaterial, updateMaterial, deleteMaterial, restoreMaterial
    - Vendors: listVendors, createVendor, getVendor, updateVendor, deleteVendor, restoreVendor
    - Attachments: createAttachment, getAttachment, deleteAttachment
    - Notifications: listNotifications, markAsRead, markAllAsRead, deleteNotification
    - Dashboard: getDashboardOverview
  - Configure cache tags for automatic invalidation
  - Configure optimistic updates for create/update/delete operations
  - _Requirements: Design: API Services_

- [ ] 16.2 Create Socket.IO service
  - Create `client/src/services/socketService.js` with Socket.IO client
  - Configure connection with JWT token from auth state
  - Implement event listeners: task:created, task:updated, task:deleted, task:activity:added, task:comment:added, notification, user:status:changed
  - Route events to RTK Query cache updates (invalidate tags, update cache entries)
  - Implement automatic reconnection with exponential backoff
  - Implement connection status tracking (connected, disconnected, reconnecting)
  - Implement room management: join task:{taskId} on task detail page, leave on unmount
  - _Requirements: 14.1-14.12, Design: Socket.IO Integration_

### 17. Custom Hooks

- [ ] 17.1 Create custom hooks
  - Create `client/src/hooks/useAuth.js` with authentication hook (user, isAuthenticated, login, logout, register, etc.)
  - Create `client/src/hooks/useSocket.js` with Socket.IO hook (socket, isConnected, emit, on, off)
  - Create `client/src/hooks/useAuthorization.js` with RBAC hook (canCreate, canRead, canUpdate, canDelete based on authorization matrix)
  - Create `client/src/hooks/useTimezone.js` with timezone handling hook (formatDate, formatTime, parseDate)
  - Create `client/src/hooks/useResponsive.js` with responsive breakpoint hook (isMobile, isTablet, isDesktop)
  - Create `client/src/hooks/useDebounce.js` with debounce hook for search (300ms delay)
  - Create `client/src/hooks/useInfiniteScroll.js` with infinite scroll hook for feeds
  - _Requirements: Design: Custom Hooks_

### 18. Utility Functions

- [ ] 18.1 Create utility functions
  - Create `client/src/utils/constants.js` with enums, patterns, limits (same as backend)
  - Create `client/src/utils/validators.js` with form validation helpers (aligned with backend validation)
  - Create `client/src/utils/authorization.js` with RBAC helper functions (checkPermission, filterByPermission)
  - Create `client/src/utils/dateUtils.js` with date formatting using native Intl API (dayjs only for internal computations and date-picker adapter)
  - Create `client/src/utils/fileUtils.js` with file validation and Cloudinary upload
  - Create `client/src/utils/errorHandlers.js` with error handling utilities (parseError, showErrorToast)
  - _Requirements: Design: Utilities_

---

## Phase 4: Frontend Features

### 19. Authentication Pages

- [ ] 19.1 Create Login page

  - Create `client/src/pages/Login.jsx` with login form
  - Fields: email, password
  - Validation: email format, password required
  - Submit: call login endpoint, set auth state, redirect to /dashboard
  - Links: forgot password, register
  - Error handling: display error toast
  - _Requirements: 19.4, Design: Authentication Flow_

- [ ] 19.2 Create Register page

  - Create `client/src/pages/Register.jsx` with 4-step wizard
  - Step 1 (Organization Details): name, email, phone, address, industry, size
  - Step 2 (Department Setup): name, description
  - Step 3 (Account Creation): firstName, lastName, position, email, password
  - Step 4 (Review & Submit): display summary, submit button
  - Validation: aligned with backend validation rules
  - Submit: call register endpoint, redirect to /verify-email
  - Error handling: display error toast, allow back navigation to fix errors
  - _Requirements: 2.1-2.9, Design: Registration Flow_

- [ ] 19.3 Create VerifyEmail page

  - Create `client/src/pages/VerifyEmail.jsx` with verification pending state
  - Display message: "Please check your email to verify your account"
  - Button: "Resend verification email" (rate limited)
  - Auto-verify on mount if token in URL query params
  - Redirect to /login after successful verification
  - _Requirements: 2.7, 2.8, Design: Email Verification_

- [ ] 19.4 Create ForgotPassword page

  - Create `client/src/pages/ForgotPassword.jsx` with email input
  - Field: email
  - Validation: email format
  - Submit: call forgotPassword endpoint, display success message
  - Link: back to login
  - _Requirements: 19.8, Design: Password Reset_

- [ ] 19.5 Create ResetPassword page
  - Create `client/src/pages/ResetPassword.jsx` with password reset form
  - Fields: password, confirmPassword
  - Validation: password (8-128 chars), passwords match
  - Submit: call resetPassword endpoint with token from URL, redirect to /login
  - Error handling: display error toast if token invalid/expired
  - _Requirements: 19.8, Design: Password Reset_

### 20. Layout Components

- [ ] 20.1 Create PublicLayout

  - Create `client/src/components/layouts/PublicLayout/index.jsx` with public layout
  - Header: logo, navigation links (Home, Login, Register)
  - Footer: copyright, links
  - Content area: render children
  - _Requirements: Design: Layout Structure_

- [ ] 20.2 Create DashboardLayout

  - Create `client/src/components/layouts/DashboardLayout/index.jsx` with authenticated layout
  - Header: logo (sidebar only), page title, organization switcher (Platform SuperAdmin only), theme toggle, search, notifications bell, user menu
  - Sidebar: navigation menu (Dashboard, Tasks, Users, Departments, Materials, Vendors), department selector (HOD only), collapsible on tablet
  - Bottom Navigation (mobile only, xs breakpoint): 4 items (Dashboard, Tasks, Users, Profile) + centered FAB (Add icon, primary color)
  - Content area: render children
  - Responsive: permanent sidebar on md+, temporary drawer on xs/sm, bottom nav on xs only
  - _Requirements: 18.1-18.12, Design: Layout Structure, Alignment Gap 2.2_

- [ ] 20.3 Create Header component

  - Create `client/src/components/layouts/DashboardLayout/Header.jsx`
  - Display: page title, organization switcher (Platform SuperAdmin only), theme toggle, search bar, notifications bell with badge, user menu
  - Menu icon (mobile): toggle sidebar drawer
  - User menu: profile, settings, logout
  - _Requirements: 18.1, Design: Header Component, Alignment Gap 2.2_

- [ ] 20.4 Create Sidebar component

  - Create `client/src/components/layouts/DashboardLayout/Sidebar.jsx`
  - Display: logo, navigation menu, department selector (HOD only)
  - Navigation items: Dashboard, Tasks, Users, Departments, Materials, Vendors
  - Active item: highlighted with primary color
  - Collapsible: temporary drawer on xs/sm, permanent on md+
  - _Requirements: 18.3, 18.4, Design: Sidebar Component_

- [ ] 20.5 Create BottomNavigation component
  - Create `client/src/components/layouts/DashboardLayout/BottomNavigation.jsx`
  - Display: 4 items (Dashboard, Tasks, Users, Profile) + centered FAB
  - FAB: Add icon, primary color, opens dialog/menu for creating new items
  - Active item: highlighted with primary color
  - Visible: xs breakpoint only (width < 600)
  - _Requirements: 18.2, Design: Bottom Navigation, Alignment Gap 2.2_

### 21. Common Components

- [ ] 21.1 Create reusable components

  - Create `client/src/components/common/ErrorBoundary.jsx` with error boundary
  - Create `client/src/components/common/LoadingSkeleton.jsx` with loading skeletons
  - Create `client/src/components/common/EmptyState.jsx` with empty state message and icon
  - Create `client/src/components/common/ConfirmDialog.jsx` with confirmation dialog
  - _Requirements: Design: Common Components_

- [ ] 21.2 Create MuiDataGrid wrapper

  - Create `client/src/components/reusable/MuiDataGrid.jsx` with reusable DataGrid wrapper
  - Props: columns, rows, loading, pagination, onPageChange, onSortChange, onRowClick, checkboxSelection, actions
  - Features: column visibility controls, density controls, export to CSV, search bar, filter button
  - Responsive: hide less important columns on xs/sm breakpoints
  - _Requirements: 17.12, Design: MuiDataGrid Wrapper, Alignment Gap 2.2_

- [ ] 21.3 Create MuiDataGridToolbar

  - Create `client/src/components/reusable/MuiDataGridToolbar.jsx` with shared toolbar
  - Features: search bar, filter button, column visibility, density, export to CSV
  - _Requirements: Design: MuiDataGrid Toolbar_

- [ ] 21.4 Create MuiLoading component
  - Create `client/src/components/reusable/MuiLoading.jsx` with loading component
  - Display: circular progress with backdrop
  - _Requirements: Design: Loading Component_

### 22. Column Definitions

- [ ] 22.1 Create column definitions for all resources
  - Create `client/src/components/columns/taskColumns.js` with task grid columns (title, status, priority, assignees, due date, actions)
  - Create `client/src/components/columns/userColumns.js` with user grid columns (name, email, role, department, status, actions)
  - Create `client/src/components/columns/departmentColumns.js` with department grid columns (name, description, HOD, member count, actions)
  - Create `client/src/components/columns/materialColumns.js` with material grid columns (name + SKU, category, unit, unit price, inventory stock, low-stock indicators, actions)
  - Create `client/src/components/columns/vendorColumns.js` with vendor grid columns (name, contact info - email + phone, rating, projects - active/total, partner badge, actions)
  - _Requirements: Design: Column Definitions, Alignment Gap 2.2_

### 23. Task Feature Components

- [ ] 23.1 Create TaskList component (List View)

  - Create `client/src/components/task/TaskList.jsx` with list view (MUI Cards layout)
  - Display: tabs (All Tasks, Assigned to Me, Completed), cards in responsive Grid (1 col xs, 2 cols sm, 3-4 cols md+)
  - Card content: title, status badge, priority indicator, assignees avatars, due date, description preview
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: 17.1, Design: Task List View, Alignment Gap 2.2_

- [ ] 23.2 Create TaskGrid component (Grid View)

  - Create `client/src/components/task/TaskGrid.jsx` with grid view (MuiDataGrid wrapper)
  - Display: tabular grid with columns from taskColumns.js, row selection checkboxes, action buttons
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: 17.1, Design: Task Grid View, Alignment Gap 2.2_

- [ ] 23.3 Create TaskCard component

  - Create `client/src/components/task/TaskCard.jsx` with task summary card for list view
  - Display: title, status badge, priority indicator, assignees avatars, due date, description preview, tags
  - Click: navigate to task detail page
  - _Requirements: Design: Task Card_

- [ ] 23.4 Create TaskFilters component

  - Create `client/src/components/task/TaskFilters.jsx` with filter dialog
  - Filters: status (multi-select, union), priority (multi-select, union), type (multi-select, union), created date range (presets + custom), due date range (presets + custom), department (multi-select, Managers/Admins only), assignment (Assigned to me, Created by me, Watching, All department tasks, Unassigned), tags (multi-select, AND/OR toggle), deleted toggle (SuperAdmin only)
  - Actions: apply, clear all, close
  - Persist filters in URL query params
  - _Requirements: 17.2-17.11, Design: Task Filters, Alignment Gap 2.2_

- [ ] 23.5 Create TaskForm component

  - Create `client/src/components/task/TaskForm.jsx` with create/update dialog
  - Fields: type selector (ProjectTask, AssignedTask, RoutineTask), title, description, priority, tags, vendor (ProjectTask), assignees (AssignedTask), date (RoutineTask), materials (RoutineTask), watchers (ProjectTask), startDate, dueDate
  - Validation: aligned with backend validation rules, type-specific field visibility
  - Submit: call createTask or updateTask endpoint, close dialog, show success toast
  - Error handling: display error toast, keep dialog open
  - _Requirements: 7.1, 8.1, 9.1, Design: Task Form, Alignment Gap 2.2_

- [ ] 23.6 Create TaskDetails component

  - Create `client/src/components/task/TaskDetails.jsx` with task detail page
  - Tabs: Overview, Activities (ProjectTask/AssignedTask only), Comments, Attachments
  - Overview: task header (title, status, priority, type, dates, vendor/assignees, watchers), description, tags
  - Actions: edit, delete, restore (if soft-deleted)
  - _Requirements: Design: Task Details_

- [ ] 23.7 Create TaskActivity component

  - Create `client/src/components/task/TaskActivity.jsx` with activity timeline
  - Display: timeline with user avatars, timestamps, activity descriptions, materials, attachments, expandable details
  - Actions: add activity button (opens dialog)
  - Visible: ProjectTask and AssignedTask only (NOT RoutineTask)
  - _Requirements: 7.7, 8.6, Design: Task Activity_

- [ ] 23.8 Create TaskComments component

  - Create `client/src/components/task/TaskComments.jsx` with comments section
  - Display: threaded comments (max depth 5), user avatars, timestamps, @mentions highlighted, reply/edit/delete buttons
  - Actions: add comment button (opens dialog), reply button (nested comment), edit button (own comments only), delete button (own comments only)
  - _Requirements: 10.1-10.10, Design: Task Comments_

- [ ] 23.9 Create TaskAttachments component
  - Create `client/src/components/task/TaskAttachments.jsx` with attachments section
  - Display: gallery view with previews (images), download buttons (all files), lightbox for images
  - Actions: upload button (opens file picker), delete button (own attachments only)
  - _Requirements: 11.1-11.10, Design: Task Attachments_

### 24. User Feature Components

- [ ] 24.1 Create UserList component (List View)

  - Create `client/src/components/user/UserList.jsx` with list view (MUI Cards layout)
  - Display: cards in responsive Grid (1 col xs, 2 cols sm, 3-4 cols md+)
  - Card content: avatar, name, position, department, skills chart, role badge, status indicator
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: Design: User List View, Alignment Gap 2.2_

- [ ] 24.2 Create UserGrid component (Grid View)

  - Create `client/src/components/user/UserGrid.jsx` with grid view (MuiDataGrid wrapper)
  - Display: tabular grid with columns from userColumns.js, action buttons
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: Design: User Grid View, Alignment Gap 2.2_

- [ ] 24.3 Create UserCard component

  - Create `client/src/components/user/UserCard.jsx` with user summary card for list view
  - Display: avatar, name, position, department, skills chart, role badge, status indicator
  - Click: navigate to user detail page
  - _Requirements: Design: User Card_

- [ ] 24.4 Create UserFilters component

  - Create `client/src/components/user/UserFilters.jsx` with filter dialog
  - Filters: role (multi-select), department (multi-select, Admins only), status (multi-select), joined date range, employee ID, include inactive toggle
  - Actions: apply, clear all, close
  - Persist filters in URL query params
  - _Requirements: Design: User Filters, Alignment Gap 2.2_

- [ ] 24.5 Create UserForm component

  - Create `client/src/components/user/UserForm.jsx` with create/update dialog
  - Fields: firstName, lastName, position, email, phone, role, department, isHod, employeeId (auto-generated, read-only), joinedAt, dateOfBirth, skills (array of skill + percentage), profilePicture (Cloudinary upload)
  - Validation: aligned with backend validation rules, enforce immutability rules (department, role, employeeId, joinedAt, isHod for Admin/Manager/User targets)
  - Submit: call createUser or updateUser endpoint, close dialog, show success toast
  - Error handling: display error toast (409 for immutability violations), keep dialog open
  - _Requirements: 6.1, 6.8, Design: User Form, Alignment Gap 2.2_

- [ ] 24.6 Create UserDetails component

  - Create `client/src/components/user/UserDetails.jsx` with user detail page
  - Tabs: Overview, Tasks, Activity, Performance
  - Overview: profile header (avatar, name, contact info, role, department, employee ID, joined date), skills chart
  - Actions: edit, delete, restore (if soft-deleted)
  - _Requirements: Design: User Details_

- [ ] 24.7 Create UserTasks component

  - Create `client/src/components/user/UserTasks.jsx` with user tasks tab
  - Display: tabs (Created, Assigned, Watching), task list with filters
  - _Requirements: Design: User Tasks_

- [ ] 24.8 Create UserActivity component

  - Create `client/src/components/user/UserActivity.jsx` with user activity feed
  - Display: chronological feed of user actions (newest first)
  - _Requirements: Design: User Activity_

- [ ] 24.9 Create UserPerformance component
  - Create `client/src/components/user/UserPerformance.jsx` with user performance metrics
  - Display: KPIs (completion rate, avg task time, throughput), comparison to dept averages, charts
  - _Requirements: Design: User Performance_

### 25. Department Feature Components

- [ ] 25.1 Create DepartmentList component (List View)

  - Create `client/src/components/department/DepartmentList.jsx` with list view (MUI Cards layout)
  - Display: cards in responsive Grid (1 col xs, 2 cols sm, 3-4 cols md+)
  - Card content: name, description, manager info, member count, task count, status badge
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: Design: Department List View, Alignment Gap 2.2_

- [ ] 25.2 Create DepartmentGrid component (Grid View)

  - Create `client/src/components/department/DepartmentGrid.jsx` with grid view (MuiDataGrid wrapper)
  - Display: tabular grid with columns from departmentColumns.js, action buttons
  - Actions: search bar, filter button, create button, view toggle (list|grid), pagination
  - _Requirements: Design: Department Grid View, Alignment Gap 2.2_

- [ ] 25.3 Create DepartmentCard component

  - Create `client/src/components/department/DepartmentCard.jsx` with department summary card for list view
  - Display: name, description, manager info, member count, task count, status badge
  - Click: navigate to department detail page
  - _Requirements: Design: Department Card_

- [ ] 25.4 Create DepartmentFilters component

  - Create `client/src/components/department/DepartmentFilters.jsx` with filter dialog
  - Filters: status (multi-select), manager (select), member count range, created date range, include deleted toggle (SuperAdmin only)
  - Actions: apply, clear all, close
  - Persist filters in URL query params
  - _Requirements: Design: Department Filters, Alignment Gap 2.2_

- [ ] 25.5 Create DepartmentForm component

  - Create `client/src/components/department/DepartmentForm.jsx` with create/update dialog
  - Fields: name, description, status, manager (SuperAdmin/Admin with isHod=true)
  - Validation: aligned with backend validation rules
  - Submit: call createDepartment or updateDepartment endpoint, close dialog, show success toast
  - Error handling: display error toast, keep dialog open
  - _Requirements: 5.1, Design: Department Form, Alignment Gap 2.2_

- [ ] 25.6 Create DepartmentDetails component

  - Create `client/src/components/department/DepartmentDetails.jsx` with department detail page
  - Tabs: Overview, Users, Tasks, Activity
  - Overview: department header (name, description, manager, creation date, stats - total users, total tasks, active tasks)
  - Actions: edit, delete, restore (if soft-deleted)
  - _Requirements: Design: Department Details, Alignment Gap 2.2_

- [ ] 25.7 Create DepartmentOverview component

  - Create `client/src/components/department/DepartmentOverview.jsx` with overview tab
  - Display: department header, manager, stats, description
  - _Requirements: Design: Department Overview_

- [ ] 25.8 Create DepartmentUsers component

  - Create `client/src/components/department/DepartmentUsers.jsx` with users tab
  - Display: user list filtered by department
  - _Requirements: Design: Department Users_

- [ ] 25.9 Create DepartmentTasks component

  - Create `client/src/components/department/DepartmentTasks.jsx` with tasks tab
  - Display: task list filtered by department
  - _Requirements: Design: Department Tasks_

- [ ] 25.10 Create DepartmentActivity component
  - Create `client/src/components/department/DepartmentActivity.jsx` with activity tab
  - Display: chronological feed with filtering by entity type (Task, TaskActivity, TaskComment, Attachment)
  - _Requirements: Design: Department Activity_

### 26. Material Feature Components

- [ ] 26.1 Create MaterialGrid component (Grid View Only)

  - Create `client/src/components/material/MaterialGrid.jsx` with grid view (MuiDataGrid wrapper, NO list view)
  - Display: tabular grid with columns from materialColumns.js (name + SKU, category, unit, unit price, inventory stock, low-stock indicators, actions)
  - Actions: search bar, filter button, create button, pagination (NO view toggle)
  - _Requirements: Design: Material Grid View, Alignment Gap 2.2_

- [ ] 26.2 Create MaterialFilters component

  - Create `client/src/components/material/MaterialFilters.jsx` with filter dialog
  - Filters: category (multi-select), status (multi-select), low-stock toggle, date range, include deleted toggle (SuperAdmin only)
  - Actions: apply, clear all, close
  - Persist filters in URL query params
  - _Requirements: Design: Material Filters, Alignment Gap 2.2_

- [ ] 26.3 Create MaterialForm component

  - Create `client/src/components/material/MaterialForm.jsx` with create/update dialog
  - Fields: name, sku (uppercase), status, description, unit, category, price, inventory (stockOnHand, lowStockThreshold, reorderQuantity)
  - Validation: aligned with backend validation rules
  - Submit: call createMaterial or updateMaterial endpoint, close dialog, show success toast
  - Error handling: display error toast, keep dialog open
  - _Requirements: 12.1, Design: Material Form, Alignment Gap 2.2_

- [ ] 26.4 Create MaterialDetails component

  - Create `client/src/components/material/MaterialDetails.jsx` with material detail page
  - Display: material header (name, SKU, category, unit, unit price, inventory stock, low-stock state), description, restock button, usage history
  - Actions: edit, delete (with confirmation dialog, 409 handling), restore (if soft-deleted)
  - _Requirements: Design: Material Details, Alignment Gap 2.2_

- [ ] 26.5 Create RestockDialog component
  - Create `client/src/components/material/RestockDialog.jsx` with restock dialog
  - Fields: quantity (min 1)
  - Submit: call restockMaterial endpoint, close dialog, show success toast
  - _Requirements: 12.6, Design: Restock Dialog_

### 27. Vendor Feature Components

- [ ] 27.1 Create VendorGrid component (Grid View Only)

  - Create `client/src/components/vendor/VendorGrid.jsx` with grid view (MuiDataGrid wrapper, NO list view)
  - Display: tabular grid with columns from vendorColumns.js (name, contact info - email + phone, rating, projects - active/total, partner badge, actions)
  - Actions: search bar, filter button, create button, pagination (NO view toggle)
  - _Requirements: Design: Vendor Grid View, Alignment Gap 2.2_

- [ ] 27.2 Create VendorFilters component

  - Create `client/src/components/vendor/VendorFilters.jsx` with filter dialog
  - Filters: status (multi-select), rating (range), include deleted toggle (SuperAdmin only)
  - Actions: apply, clear all, close
  - Persist filters in URL query params
  - _Requirements: Design: Vendor Filters, Alignment Gap 2.2_

- [ ] 27.3 Create VendorForm component

  - Create `client/src/components/vendor/VendorForm.jsx` with create/update dialog
  - Fields: name, email, phone, website, location, address, description, status, isVerifiedPartner, rating
  - Validation: aligned with backend validation rules
  - Submit: call createVendor or updateVendor endpoint, close dialog, show success toast
  - Error handling: display error toast, keep dialog open
  - _Requirements: 13.1, Design: Vendor Form, Alignment Gap 2.2_

- [ ] 27.4 Create VendorDetails component
  - Create `client/src/components/vendor/VendorDetails.jsx` with vendor detail page
  - Display: vendor header (name, contact info, address, rating, verified partner badge), description, performance metrics (total projects, active projects, completed projects, on-time delivery rate, average project duration, total spend), linked projects
  - Actions: edit, delete (with confirmation dialog, 409 handling), restore (if soft-deleted), contact vendor (opens email dialog, role-gated)
  - _Requirements: 13.7, 13.8, Design: Vendor Details, Alignment Gap 2.2_

### 28. Attachment Feature Components

- [ ] 28.1 Create FileUpload component

  - Create `client/src/components/attachment/FileUpload.jsx` with drag-and-drop upload
  - Features: drag-and-drop zone, file picker, file validation (size, extension), Cloudinary upload, progress indicator
  - Validation: max 10MB per file, allowed extensions (.svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3)
  - Submit: upload to Cloudinary, call createAttachment endpoint with fileUrl
  - _Requirements: 11.1-11.3, Design: File Upload_

- [ ] 28.2 Create FilePreview component

  - Create `client/src/components/attachment/FilePreview.jsx` with image preview
  - Display: thumbnail for images, icon for other file types
  - _Requirements: Design: File Preview_

- [ ] 28.3 Create FileList component

  - Create `client/src/components/attachment/FileList.jsx` with attachment list
  - Display: list of attachments with filename, file type, file size, uploaded by, uploaded at, download button, delete button (own attachments only)
  - _Requirements: Design: File List_

- [ ] 28.4 Create Lightbox component
  - Create `client/src/components/attachment/Lightbox.jsx` with image lightbox
  - Features: full-screen image viewer, navigation (prev/next), zoom, close
  - _Requirements: Design: Lightbox_

### 29. Notification Feature Components

- [ ] 29.1 Create NotificationBell component

  - Create `client/src/components/notification/NotificationBell.jsx` with bell icon and badge
  - Display: bell icon, unread count badge
  - Click: toggle notification dropdown
  - Real-time: pulse animation on new notification, update badge count
  - _Requirements: 15.4, 15.10, Design: Notification Bell_

- [ ] 29.2 Create NotificationDropdown component

  - Create `client/src/components/notification/NotificationDropdown.jsx` with notification list
  - Display: list of recent notifications (newest first), "Mark all as read" button, "View all" link
  - _Requirements: 15.5, 15.8, Design: Notification Dropdown_

- [ ] 29.3 Create NotificationItem component
  - Create `client/src/components/notification/NotificationItem.jsx` with single notification
  - Display: title, message, timestamp, entity link, read/unread indicator
  - Click: navigate to related entity, mark as read
  - _Requirements: 15.6, 15.7, Design: Notification Item_

### 30. Dashboard Feature Components

- [ ] 30.1 Create Dashboard page

  - Create `client/src/pages/Dashboard.jsx` with dashboard overview
  - Display: KPI cards, charts, activity feed, upcoming deadlines, team performance (Managers/Admins only)
  - Filters: date range, departmentId (Managers/Admins only), status, priority, taskType
  - Actions: refresh button (manual data reload), export button (PDF export with jspdf + jspdf-autotable)
  - _Requirements: 16.1-16.12, Design: Dashboard Overview, Alignment Gap 2.2_

- [ ] 30.2 Create StatCard component

  - Create `client/src/components/dashboard/StatCard.jsx` with KPI card
  - Display: title, value, icon, trend indicator, clickable
  - Click: navigate to filtered view (e.g., My Tasks → /dashboard/tasks?assignment=me)
  - _Requirements: 16.1, Design: Stat Card_

- [ ] 30.3 Create StatusChart component

  - Create `client/src/components/dashboard/StatusChart.jsx` with pie chart
  - Display: status distribution (TODO, IN_PROGRESS, COMPLETED, PENDING) using MUI X Charts
  - Click: navigate to filtered view (e.g., TODO slice → /dashboard/tasks?status=TODO)
  - Use theme tokens for colors (no hardcoded palettes)
  - _Requirements: 16.2, 16.7, 16.11, Design: Status Chart_

- [ ] 30.4 Create PriorityChart component

  - Create `client/src/components/dashboard/PriorityChart.jsx` with bar chart
  - Display: priority breakdown (LOW, MEDIUM, HIGH, URGENT) using MUI X Charts
  - Click: navigate to filtered view (e.g., HIGH bar → /dashboard/tasks?priority=HIGH)
  - Use theme tokens for colors (no hardcoded palettes)
  - _Requirements: 16.2, 16.8, 16.11, Design: Priority Chart_

- [ ] 30.5 Create TimelineChart component

  - Create `client/src/components/dashboard/TimelineChart.jsx` with line chart
  - Display: timeline trends (tasks created, completed over time) using MUI X Charts
  - Use theme tokens for colors (no hardcoded palettes)
  - _Requirements: 16.2, 16.11, Design: Timeline Chart_

- [ ] 30.6 Create ActivityFeed component

  - Create `client/src/components/dashboard/ActivityFeed.jsx` with activity feed
  - Display: real-time chronological feed (newest first) with avatars, timestamps, actions
  - _Requirements: 16.3, 16.12, Design: Activity Feed, Alignment Gap 2.2_

- [ ] 30.7 Create UpcomingDeadlines component

  - Create `client/src/components/dashboard/UpcomingDeadlines.jsx` with deadlines table
  - Display: MuiDataGrid table with tasks due in next 7 days
  - _Requirements: 16.4, Design: Upcoming Deadlines_

- [ ] 30.8 Create TeamPerformance component
  - Create `client/src/components/dashboard/TeamPerformance.jsx` with performance widget
  - Display: comparison charts (Managers/Admins only)
  - _Requirements: 16.5, Design: Team Performance_

### 31. Settings Page

- [ ] 31.1 Create Settings page

  - Create `client/src/pages/Settings.jsx` with settings tabs
  - Tabs: Profile, Account, Security
  - _Requirements: Design: Settings Page_

- [ ] 31.2 Create Profile tab

  - Display: personal info (firstName, lastName, position, phone, dateOfBirth), profile picture (Cloudinary upload), skills (array of skill + percentage), preferences (theme, date format, time format, timezone, notifications)
  - Actions: update profile, update preferences
  - _Requirements: 6.8, Design: Settings Profile Tab, Alignment Gap 3.4_

- [ ] 31.3 Create Account tab

  - Display: email, phone, password change form
  - Actions: update email, update phone, change password
  - _Requirements: Design: Settings Account Tab_

- [ ] 31.4 Create Security tab
  - Display: two-factor authentication toggle
  - Actions: enable/disable 2FA
  - _Requirements: Design: Settings Security Tab_

---

## Phase 5: Integration and Testing

### 32. Real-Time Integration

- [ ] 32.1 Integrate Socket.IO with RTK Query

  - Connect socketService event listeners to RTK Query cache updates
  - task:created → invalidate listTasks cache tag
  - task:updated → update getTask cache entry, invalidate listTasks cache tag
  - task:deleted → invalidate listTasks and getTask cache tags
  - task:activity:added → invalidate getTaskActivities cache tag
  - task:comment:added → invalidate getTaskComments cache tag
  - notification → invalidate listNotifications cache tag, update unread count
  - user:status:changed → invalidate listUsers cache tag
  - _Requirements: 14.10, Design: Socket.IO Integration_

- [ ] 32.2 Implement connection status indicator

  - Display connection status (connected, disconnected, reconnecting) in header or footer
  - Show warning when disconnected
  - _Requirements: 14.11, Design: Connection Status, Alignment Gap 2.2_

- [ ] 32.3 Implement optimistic updates
  - Create task: add to cache immediately, rollback on error
  - Update task: update cache immediately, rollback on error
  - Delete task: remove from cache immediately, rollback on error
  - Mark notification as read: update cache immediately, rollback on error
  - _Requirements: Design: Optimistic Updates_

### 33. End-to-End User Flows

- [ ] 33.1 Test registration flow

  - Complete 4-step wizard with valid data
  - Verify email sent
  - Click verification link
  - Verify redirect to login
  - Login with verified account
  - Verify redirect to dashboard
  - _Requirements: 2.1-2.9, Manual Testing_

- [ ] 33.2 Test task creation flow

  - Create ProjectTask with vendor, watchers, dates
  - Verify initial TaskActivity created
  - Verify notification sent to watchers
  - Verify Socket.IO event emitted
  - Verify task appears in list without refresh
  - _Requirements: 7.1-7.10, Manual Testing_

- [ ] 33.3 Test task activity flow

  - Add TaskActivity to ProjectTask with materials
  - Verify material stock decremented
  - Verify Socket.IO event emitted
  - Verify activity appears in timeline without refresh
  - _Requirements: 7.7, 7.8, Manual Testing_

- [ ] 33.4 Test task comment flow

  - Add TaskComment with @mentions
  - Verify mentioned users receive notifications
  - Verify Socket.IO event emitted
  - Verify comment appears without refresh
  - Reply to comment (nested)
  - Verify depth calculated correctly
  - _Requirements: 10.1-10.10, Manual Testing_

- [ ] 33.5 Test material stock flow

  - Create RoutineTask with materials
  - Verify material stock decremented atomically
  - Verify 409 error if stock insufficient
  - Restock material
  - Verify stock incremented
  - _Requirements: 9.2, 9.3, 12.3, 12.4, 12.6, Manual Testing_

- [ ] 33.6 Test soft delete and restore flow

  - Soft delete department
  - Verify cascade to users, tasks, activities, comments, attachments, notifications
  - Restore department
  - Verify cascaded resources restored
  - _Requirements: 5.4, 5.5, Manual Testing_

- [ ] 33.7 Test authorization flow

  - Login as User
  - Verify cannot create department (403)
  - Verify cannot access other departments (403)
  - Login as Manager
  - Verify can create tasks in own department
  - Verify cannot access other departments (403)
  - Login as Admin
  - Verify can read across departments
  - Verify can create users in own organization
  - Login as Platform SuperAdmin
  - Verify can access customer organizations
  - _Requirements: 4.1-4.10, Manual Testing_

- [ ] 33.8 Test immutability flow

  - Login as Admin
  - Create User
  - Attempt to update User's department (409)
  - Attempt to update User's role (409)
  - Attempt to update User's employeeId (409)
  - Verify error messages clear
  - _Requirements: 6.7, Manual Testing_

- [ ] 33.9 Test responsive layout flow

  - Open on mobile (xs breakpoint)
  - Verify bottom navigation visible
  - Verify sidebar hidden
  - Verify FAB centered
  - Click FAB, verify dialog opens
  - Open on tablet (sm breakpoint)
  - Verify bottom navigation hidden
  - Verify sidebar collapsible
  - Open on desktop (md+ breakpoint)
  - Verify sidebar permanent
  - _Requirements: 18.1-18.12, Manual Testing_

- [ ] 33.10 Test filter and search flow
  - Apply multiple filters (status, priority, type)
  - Verify union filters work (status=TODO,IN_PROGRESS)
  - Verify URL query params updated
  - Refresh page, verify filters persisted
  - Clear filters, verify all tasks shown
  - Search with min 3 chars, verify debounce (300ms)
  - _Requirements: 17.1-17.12, Manual Testing_

### 34. Manual Testing Checklist

- [ ] 34.1 Authentication testing

  - Register with valid data (4-step wizard)
  - Register with invalid data (validation errors)
  - Verify email with valid token
  - Verify email with invalid token (error)
  - Login with valid credentials
  - Login with invalid credentials (error)
  - Login with unverified account (403)
  - Login with INACTIVE user (403)
  - Refresh token rotation
  - Logout (clear cookies)
  - Forgot password flow
  - Reset password with valid token
  - Reset password with invalid token (error)
  - Change password (authenticated)
  - _Requirements: 19.1-19.10, 46.1-46.10_

- [ ] 34.2 Authorization testing

  - Test all CRUD operations for all roles (Platform SuperAdmin, Org SuperAdmin, Admin, Manager, User)
  - Test cross-organization access (Platform SuperAdmin only)
  - Test cross-department access (Admins can read, Managers/Users cannot)
  - Test ownership checks (createdBy, assignees, watchers, uploadedBy)
  - Test immutability rules (department, role, employeeId, joinedAt, isHod for Admin/Manager/User targets)
  - Test INACTIVE department restrictions (cannot create users/tasks/materials)
  - Test INACTIVE user restrictions (cannot login/refresh)
  - _Requirements: 4.1-4.10, 43.1-43.10, 46.1-46.10_

- [ ] 34.3 Validation testing

  - Test all field validations (length, pattern, enum, required)
  - Test unique constraints (email, phone, sku, employeeId)
  - Test date validations (dueDate > startDate, joinedAt not future)
  - Test array validations (max items, unique items)
  - Test nested validations (materials, skills, preferences)
  - Test existence checks with .withDeleted() for create/restore
  - Test scoping (organization, department)
  - _Requirements: 23.1-23.12, 46.1-46.10_

- [ ] 34.4 Multi-tenant isolation testing

  - Create multiple customer organizations
  - Verify data isolation (users cannot access other orgs)
  - Verify Platform SuperAdmin can access customer orgs per authorization matrix
  - Verify department-level isolation (users cannot access other depts)
  - _Requirements: 3.1-3.5, 46.1-46.10_

- [ ] 34.5 Task type testing

  - Create ProjectTask with vendor, watchers, dates
  - Verify TaskActivity allowed
  - Create AssignedTask with assignees, dates
  - Verify TaskActivity allowed
  - Create RoutineTask with date, materials
  - Verify TaskActivity FORBIDDEN (409)
  - Verify materials embedded
  - Verify material stock decremented
  - _Requirements: 7.1-7.10, 8.1-8.10, 9.1-9.10, 46.1-46.10_

- [ ] 34.6 Soft delete and cascade testing

  - Soft delete organization (Platform SuperAdmin only, NOT platform org)
  - Verify cascade to departments, users, tasks, activities, comments, attachments, notifications
  - Restore organization
  - Verify cascaded resources restored
  - Soft delete department
  - Verify cascade to users, tasks, materials, activities, comments, attachments, notifications
  - Restore department
  - Verify cascaded resources restored
  - Soft delete user
  - Verify cascade to tasks, activities, comments, attachments, notifications
  - Verify removal from watchers/assignees/mentions
  - Restore user
  - Verify cascaded resources restored
  - _Requirements: 5.4, 5.5, 6.6, 46.1-46.10_

- [ ] 34.7 Material and vendor deletion testing

  - Create material, associate with RoutineTask
  - Attempt to delete material (409 CONFLICT_ERROR)
  - Verify error message suggests status=INACTIVE
  - Set material status=INACTIVE
  - Verify excluded from selection dropdowns
  - Create vendor, associate with ProjectTask
  - Attempt to delete vendor (409 CONFLICT_ERROR)
  - Verify error message suggests status=INACTIVE
  - Set vendor status=INACTIVE
  - Verify excluded from selection dropdowns
  - _Requirements: 12.8, 12.9, 13.4, 13.5, 46.1-46.10_

- [ ] 34.8 Real-time testing

  - Open two browser windows (User A, User B)
  - User A creates task
  - Verify User B sees task without refresh
  - User A adds activity
  - Verify User B sees activity without refresh
  - User A adds comment with @mention of User B
  - Verify User B receives notification without refresh
  - User A updates task status
  - Verify User B sees updated status without refresh
  - Disconnect network
  - Verify connection status indicator shows disconnected
  - Reconnect network
  - Verify automatic reconnection
  - _Requirements: 14.1-14.12, 46.1-46.10_

- [ ] 34.9 Notification testing

  - Create task with assignees
  - Verify assignees receive notifications
  - Add comment with @mentions
  - Verify mentioned users receive notifications
  - Mark notification as read
  - Verify badge count decreases
  - Mark all as read
  - Verify badge cleared
  - Wait 30 days
  - Verify notifications auto-expired via TTL index
  - _Requirements: 15.1-15.11, 46.1-46.10_

- [ ] 34.10 Dashboard testing

  - View dashboard as User
  - Verify KPI cards (My Tasks, Department Tasks, Overdue, Completed This Week)
  - Verify charts (status, priority, timeline)
  - Verify activity feed (real-time updates)
  - Verify upcoming deadlines (next 7 days)
  - Apply filters (date range, status, priority)
  - Verify all widgets update
  - Click status slice in pie chart
  - Verify navigate to filtered tasks page
  - Click refresh button
  - Verify manual data reload
  - Click export button
  - Verify PDF export with jspdf + jspdf-autotable
  - View dashboard as Manager/Admin
  - Verify team performance widget visible
  - _Requirements: 16.1-16.12, 46.1-46.10_

- [ ] 34.11 Responsive testing

  - Test on mobile (xs: 0-599px)
  - Verify bottom navigation visible
  - Verify sidebar hidden (temporary drawer)
  - Verify FAB centered
  - Verify single-column layout
  - Verify dialogs full-height
  - Test on tablet (sm: 600-899px)
  - Verify bottom navigation hidden
  - Verify sidebar collapsible
  - Verify 2-column layout
  - Test on desktop (md: 900-1199px)
  - Verify sidebar permanent
  - Verify 3-4 column layout
  - Test on large desktop (lg: 1200-1535px, xl: 1536+)
  - Verify expanded content
  - _Requirements: 18.1-18.12, 46.1-46.10_

- [ ] 34.12 File upload testing
  - Upload file within size limit (10MB)
  - Verify Cloudinary upload
  - Verify attachment created
  - Upload file exceeding size limit
  - Verify error message
  - Upload file with invalid extension
  - Verify error message
  - Upload image
  - Verify preview shown
  - Click image
  - Verify lightbox opens
  - Delete own attachment
  - Verify soft delete
  - Attempt to delete other user's attachment
  - Verify 403 error
  - _Requirements: 11.1-11.10, 46.1-46.10_

---

## Phase 6: Alignment Corrections

### 35. Requirements Document Updates

- [ ] 35.1 Add technology stack section to requirements.md

  - Add new section "Technology Stack" after Introduction
  - List backend dependencies with exact versions (Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Socket.IO, Nodemailer, etc.)
  - List frontend dependencies with exact versions (React, Vite, Redux Toolkit, Material UI, axios, socket.io-client, etc.)
  - List development scripts (npm run dev, npm run seed, npm run wipe, npm run build, etc.)
  - _Alignment Gap: 2.1_

- [ ] 35.2 Add missing SHALL statements for UI/UX requirements

  - Add SHALL statements for DashboardLayout structure (header, sidebar, content area)
  - Add SHALL statements for Header components (page title, organization switcher, theme toggle, search, user menu, logo in sidebar only)
  - Add SHALL statements for mobile menu icon toggle
  - Add SHALL statements for FAB (Add icon, primary color, opens dialog/menu)
  - Add SHALL statements for active navigation item highlighting (primary color)
  - Add SHALL statements for edit task dialog
  - Add SHALL statements for create/edit vendor dialog
  - Add SHALL statements for delete material/vendor confirmation dialog with 409 handling
  - Add SHALL statements for material detail header (inventory stock, low-stock state)
  - Add SHALL statements for department header (creation date, summary stats)
  - Add SHALL statements for dashboard real-time updates
  - Add SHALL statements for Socket.IO connection status indicator
  - _Alignment Gap: 2.2_

- [ ] 35.3 Add validation middleware scoping requirements

  - Add new requirement "Validation Middleware Scoping"
  - Add SHALL statement: validators MUST use .run(req) and validationResult(req)
  - Add SHALL statement: existence checks for create/restore MUST use .withDeleted()
  - Add SHALL statement: department/vendor validators MUST scope by req.user.organization
  - Add SHALL statement: user/task/material validators MUST scope by req.user.organization AND req.user.department
  - _Alignment Gap: 2.3_

- [ ] 35.4 Add TTL expiry policy requirements

  - Add new requirement "TTL Expiry Policies"
  - Add SHALL statement: Organization TTL = never (immutable if isPlatformOrg=true)
  - Add SHALL statement: Department TTL = 365 days
  - Add SHALL statement: User TTL = 365 days
  - Add SHALL statement: Task TTL = 365 days
  - Add SHALL statement: TaskActivity TTL = 365 days
  - Add SHALL statement: TaskComment TTL = 365 days
  - Add SHALL statement: Material TTL = 365 days
  - Add SHALL statement: Vendor TTL = 365 days
  - Add SHALL statement: Attachment TTL = 365 days
  - Add SHALL statement: Notification TTL = 30 days (auto-delete via TTL index)
  - _Alignment Gap: 2.4_

- [ ] 35.5 Add user preferences notifications object
  - Update Requirement 33 (User Preferences)
  - Add SHALL statement: User.preferences MUST include notifications object
  - Add SHALL statement: notifications.emailEnabled (boolean, default: true)
  - Add SHALL statement: notifications.inAppEnabled (boolean, default: true)
  - Add SHALL statement: notifications.emailEvents (object with event-level toggles: taskAssigned, taskDueSoon, mentioned, commentReply)
  - Add SHALL statement: notifications.inAppEvents (object with event-level toggles: taskAssigned, taskDueSoon, mentioned, commentReply)
  - _Alignment Gap: 2.5_

### 36. Design Document Updates

- [ ] 36.1 Add platform/customer organization setup details

  - Add new section "Organization Creation Process" after Overview
  - Document platform organization creation via backend seeding only
  - Document customer organization creation via 4-step registration wizard only
  - Document circular dependency resolution (org → dept → user → update manager/createdBy)
  - Document backend handling of 4-step wizard (single transaction, rollback on error)
  - _Alignment Gap: 3.1_

- [ ] 36.2 Add TTL expiry implementation

  - Update all model schemas with TTL index configuration
  - Add TTL index to Notification schema: { expiresAt: 1 } with expireAfterSeconds: 0
  - Document TTL periods for each model (Organization: never, Department: 365d, User: 365d, Task: 365d, TaskActivity: 365d, TaskComment: 365d, Material: 365d, Vendor: 365d, Attachment: 365d, Notification: 30d)
  - Document automatic deletion behavior via MongoDB TTL indexes
  - _Alignment Gap: 3.2_

- [ ] 36.3 Add validation middleware scoping rules

  - Add new section "Validation Middleware Implementation" after Authorization Matrix
  - Document validator execution using .run(req) and validationResult(req)
  - Document existence checks using .withDeleted() for create/restore operations
  - Document scoping by req.user.organization for org-level resources (Vendor)
  - Document scoping by req.user.organization AND req.user.department for dept-level resources (User, Task, Material)
  - Provide code examples for each scoping pattern
  - _Alignment Gap: 3.3_

- [ ] 36.4 Update User schema with notification preferences

  - Update User.preferences schema to include notifications object
  - Add notifications.emailEnabled (boolean, default: true)
  - Add notifications.inAppEnabled (boolean, default: true)
  - Add notifications.emailEvents (object: taskAssigned, taskDueSoon, mentioned, commentReply)
  - Add notifications.inAppEvents (object: taskAssigned, taskDueSoon, mentioned, commentReply)
  - _Alignment Gap: 3.4_

- [ ] 36.5 Document TaskActivity creation restriction

  - Update TaskActivity schema section with business rule
  - Add SHALL statement: TaskActivity can ONLY be created for ProjectTask and AssignedTask
  - Add SHALL statement: TaskActivity creation for RoutineTask MUST return 409 CONFLICT_ERROR
  - Add SHALL statement: parentModel=Task requires parent to be ProjectTask or AssignedTask (NOT RoutineTask)
  - Add code example for validation logic
  - _Alignment Gap: 3.5_

- [ ] 36.6 Complete authorization matrix with JSON rule-set

  - Replace simplified table with complete JSON-based rule-set
  - Add requires predicates (isPlatformOrgUser, !isPlatformOrgUser)
  - Add resourceType for task subtypes (ProjectTask, AssignedTask, RoutineTask)
  - Add complex ownership combinations (createdBy, assignees, watchers, uploadedBy)
  - Document evaluation logic: ANY rule passes → ALLOW
  - Provide code examples for rule evaluation
  - _Alignment Gap: 3.6_

- [ ] 36.7 Add API query convention details

  - Update API Endpoints section with canonical list query conventions
  - Document query parameters: page, limit, sortBy, sortOrder, search, includeDeleted
  - Document multi-select filters as comma-separated values (e.g., status=TODO,IN_PROGRESS)
  - Document Platform SuperAdmin organizationId parameter
  - Document 400 VALIDATION_ERROR for non-platform users providing organizationId
  - Document exact pagination response shape: { data: [], pagination: { page, limit, total, totalPages } }
  - _Alignment Gap: 3.7_

- [ ] 36.8 Add detailed API error response format

  - Update Error Handling section with canonical error response format
  - Document success response: { success: true, data: {...}, message: "..." }
  - Document error response: { success: false, message: "...", error: { code: "ERROR_CODE", details: {...} } }
  - Document all error codes: VALIDATION_ERROR, UNAUTHENTICATED_ERROR, UNAUTHORIZED_ERROR, NOT_FOUND_ERROR, CONFLICT_ERROR, RATE_LIMITED_ERROR, INTERNAL_ERROR
  - Provide examples for each error code
  - _Alignment Gap: 3.8_

- [ ] 36.9 Update testing strategy
  - Replace "No test frameworks" note with comprehensive manual testing strategy
  - Document manual testing checklist (authentication, authorization, validation, multi-tenant isolation, task types, soft delete, material/vendor deletion, real-time, notifications, dashboard, responsive, file upload)
  - Document test data requirements (platform org, multiple customer orgs, multiple depts, multiple users per role, all task types, materials with low stock, vendors with ratings, soft-deleted resources)
  - Document test scenarios from prd-test-cases.md (15,280 lines)
  - _Alignment Gap: 3.9_

---

## Phase 7: Final Integration and Deployment Preparation

### 37. Backend Integration

- [ ] 37.1 Create Express app configuration

  - Create `backend/app.js` with Express app setup
  - Configure middleware: helmet, cors, compression, cookie-parser, express-mongo-sanitize, morgan (dev only)
  - Configure body parser (JSON, URL-encoded)
  - Mount routes: /api/auth, /api/organizations, /api/departments, /api/users, /api/tasks, /api/materials, /api/vendors, /api/attachments, /api/notifications, /api/dashboard
  - Configure error handling middleware (last)
  - _Requirements: Design: Express App_

- [ ] 37.2 Create HTTP server entry point

  - Create `backend/server.js` with HTTP server
  - Import app from app.js
  - Import database connection from config/database.js
  - Import Socket.IO service from services/socketService.js
  - Start HTTP server on PORT
  - Attach Socket.IO to HTTP server
  - Handle graceful shutdown (SIGINT, SIGTERM)
  - _Requirements: Design: Server Entry Point_

- [ ] 37.3 Configure package.json scripts
  - Add scripts: "dev" (nodemon server.js), "start" (node server.js), "seed" (node mock/seed.js), "wipe" (node mock/wipe.js)
  - _Requirements: Design: Package Scripts_

### 38. Frontend Integration

- [ ] 38.1 Create main entry point

  - Create `client/src/main.jsx` with React root
  - Import AppTheme provider
  - Import Redux store provider with redux-persist
  - Import React Router
  - Import react-toastify ToastContainer
  - Render app
  - _Requirements: Design: Main Entry Point_

- [ ] 38.2 Create Home page

  - Create `client/src/pages/Home.jsx` with landing page
  - Display: hero section, features, pricing, testimonials, CTA buttons
  - _Requirements: Design: Home Page_

- [ ] 38.3 Create NotFound page

  - Create `client/src/pages/NotFound.jsx` with 404 page
  - Display: 404 message, back to home button
  - _Requirements: Design: NotFound Page_

- [ ] 38.4 Configure index.html
  - Update `client/index.html` with meta tags, title, favicon
  - _Requirements: Design: HTML Entry Point_

### 39. Documentation

- [ ] 39.1 Update README.md

  - Document project overview
  - Document technology stack
  - Document setup instructions (backend, frontend)
  - Document environment variables
  - Document database seeding
  - Document common commands
  - Document project structure
  - Document API endpoints
  - Document manual testing checklist
  - _Requirements: Design: Documentation_

- [ ] 39.2 Create API documentation
  - Document all API endpoints with request/response examples
  - Document authentication flow
  - Document authorization matrix
  - Document error codes
  - Document query conventions
  - _Requirements: Design: API Documentation_

---

## Notes

**Implementation Dependencies**:

- Backend models must be completed before controllers
- Backend middleware must be completed before routes
- Frontend store must be configured before components
- Frontend layouts must be completed before feature components
- Real-time integration requires both backend Socket.IO service and frontend socketService

**Testing Approach**:

- Manual testing only (no test frameworks allowed per PRD)
- Use comprehensive test scenarios from prd-test-cases.md (15,280 lines)
- Test all CRUD operations for all roles
- Test all validation rules
- Test all authorization rules
- Test multi-tenant isolation
- Test soft delete and cascade
- Test real-time updates
- Test responsive layout

**Alignment Corrections**:

- Can be done in parallel with implementation
- Should be completed before final review
- Ensure requirements.md and design.md are single source of truth

**Deployment Preparation**:

- Configure production environment variables
- Configure MongoDB Atlas connection
- Configure Cloudinary production account
- Configure Gmail SMTP production credentials
- Configure CORS for production CLIENT_URL
- Configure rate limiting for production
- Configure logging for production (file transport)
- Configure error monitoring (optional: Sentry)

---


## Appendix: PRD Test Traceability (Global)

| Test ID Family | Task/Subtask |
| --- | --- |
| AUTH-* | 4.1, 4.2 |
| ORG-* | 4.1, 5.1, 5.2 |
| DEPT-* | 4.1, 6.1, 6.2 |
| USER-* | 4.1, 7.1, 7.2 |
| TASK-* | 8.1, 8.2 |
| ACT-* | 8.1, 8.2 |
| COMM-* | 8.1, 8.2 |
| MAT-* | 9.1, 9.2 |
| VEND-* | 10.1, 10.2 |
| ATT-* | 11.1, 11.2 |
| NOTIF-* | 12.1, 12.2 |
| DASH-* | 13.1, 13.2 |
| CROSS-* | 3.2, 3.3, 4.1-13.2 |

**Execution Gate**

- A task/subtask is not complete until all mapped PRD IDs are executed and recorded with status, evidence link, and execution date.
