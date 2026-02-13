# Requirements Document

## Introduction

This document specifies the requirements for an enterprise-grade, multi-tenant SaaS task management system designed for organizations with hierarchical structures (Organization → Department → User). The system enables comprehensive task management across three distinct task types (ProjectTask, AssignedTask, RoutineTask), real-time collaboration via Socket.IO, materials and vendor tracking, role-based access control (RBAC) with four user roles, and rich dashboard analytics.

The system serves two types of organizations:

- **Platform Organization**: System administration organization created via backend seeding with cross-organization access capabilities
- **Customer Organizations**: Tenant organizations created via frontend registration workflow with complete data isolation

## Glossary

- **System**: The multi-tenant task manager web application
- **Platform_Organization**: Organization with isPlatformOrg=true, created via backend seeding, immutable
- **Customer_Organization**: Organization with isPlatformOrg=false, created via frontend registration
- **Platform_SuperAdmin**: SuperAdmin with isPlatformOrgUser=true, can access customer organizations per authorization matrix
- **Organization_SuperAdmin**: SuperAdmin with isPlatformOrgUser=false, full control within own organization
- **HOD**: Head of Department, user with isHod=true, can switch departments via sidebar selector
- **ProjectTask**: Long-term task with vendor, watchers, and activity tracking
- **AssignedTask**: Short-term task with specific assignees and deadlines
- **RoutineTask**: Recurring task with embedded materials, no activities allowed
- **TaskActivity**: Progress log entry for ProjectTask and AssignedTask only
- **Soft_Delete**: Mark resource as deleted via isDeleted flag without database removal
- **Authorization_Matrix**: Role-based permission system defining CRUD operations per resource
- **MuiDataGrid**: Reusable wrapper around MUI X DataGrid for tabular grid view
- **Grid_View**: Tabular view using MuiDataGrid component
- **List_View**: Card-based layout using MUI Cards in responsive Grid
- **DashboardLayout**: Main authenticated layout with header, sidebar, and content area
- **Bottom_Navigation**: Mobile-only navigation bar (xs breakpoint) with 4 items and centered FAB

## Requirements

### Requirement 1: Platform Organization Management

**User Story:** As a system administrator, I want to manage the platform organization, so that I can oversee the entire system and access customer organizations when needed.

#### Acceptance Criteria

1. WHEN the backend seeding script runs, THE System SHALL create a platform organization with isPlatformOrg=true
2. WHEN the platform organization is created, THE System SHALL create a platform department and a Platform SuperAdmin user with isPlatformOrgUser=true and isHod=true
3. THE System SHALL prevent deletion of the platform organization
4. WHEN a Platform SuperAdmin attempts to access a customer organization, THE System SHALL allow access based on the authorization matrix
5. WHEN a Platform SuperAdmin attempts to update the platform organization, THE System SHALL allow the update for own organization only

### Requirement 2: Customer Organization Registration

**User Story:** As a business owner, I want to register my organization through a 4-step wizard, so that I can start using the task management system.

#### Acceptance Criteria

1. WHEN a user accesses the registration page, THE System SHALL display a 4-step wizard with steps: Organization Details, Department Setup, Account Creation, Review & Submit
2. WHEN a user completes Step 1 (Organization Details), THE System SHALL validate organization name (2-100 chars), email, phone (Ethiopian format), address, industry (enum), and size (enum)
3. WHEN a user completes Step 2 (Department Setup), THE System SHALL validate department name (2-100 chars) and description (max 500 chars, required)
4. WHEN a user completes Step 3 (Account Creation), THE System SHALL validate first name (2-50 chars), last name (2-50 chars), position (2-100 chars), email, and password (8-128 chars)
5. WHEN a user submits the registration in Step 4, THE System SHALL create the organization with isPlatformOrg=false, create the department, and create the user with role=SuperAdmin, isHod=true, and isPlatformOrgUser=false
6. WHEN the registration is submitted, THE System SHALL generate an email verification token and send a verification email to the user
7. WHEN the user is created, THE System SHALL set isVerified=false and block login until email verification completes
8. WHEN email verification succeeds, THE System SHALL set Organization.isVerified=true and User.isVerified=true, clear verification tokens, and send a welcome email exactly once
9. THE System SHALL resolve the circular dependency by creating organization, department, and user in sequence, then updating department.manager and organization.createdBy

### Requirement 3: Multi-Tenant Data Isolation

**User Story:** As a customer organization administrator, I want complete data isolation from other organizations, so that my organization's data remains private and secure.

#### Acceptance Criteria

1. WHEN a non-platform user attempts to access resources, THE System SHALL restrict access to own organization only
2. WHEN a query is executed for department-level resources, THE System SHALL filter by both organization and department
3. WHEN a query is executed for organization-level resources, THE System SHALL filter by organization only
4. THE System SHALL prevent cross-organization data access for all non-platform users
5. WHEN a Platform SuperAdmin accesses customer organization data, THE System SHALL allow access only as permitted by the authorization matrix

### Requirement 4: Role-Based Access Control (RBAC)

**User Story:** As a system architect, I want a comprehensive authorization matrix, so that users can only perform operations they are permitted to based on their role, organization, and department.

#### Acceptance Criteria

1. THE System SHALL implement four user roles: SuperAdmin, Admin, Manager, and User
2. WHEN a user attempts any CRUD operation, THE System SHALL evaluate permissions using the authorization matrix
3. WHEN a Platform SuperAdmin attempts cross-organization read operations, THE System SHALL allow access where the matrix specifies scope=any
4. WHEN an Organization SuperAdmin attempts operations, THE System SHALL restrict access to own organization (scope=ownOrg)
5. WHEN an Admin attempts operations, THE System SHALL restrict access to own organization with cross-department read where allowed
6. WHEN a Manager attempts operations, THE System SHALL restrict access to own department (scope=ownOrg.ownDept)
7. WHEN a User attempts operations, THE System SHALL restrict access to own department and ownership-based resources
8. WHEN a user attempts to update immutable fields (department, role, employeeId, joinedAt, isHod) for Admin/Manager/User targets, THE System SHALL return 409 CONFLICT_ERROR
9. THE System SHALL enforce ownership checks for operations requiring ownership (createdBy, assignees, watchers)
10. WHEN authorization fails, THE System SHALL return 403 UNAUTHORIZED_ERROR with a clear message

### Requirement 5: Department Management

**User Story:** As an organization administrator, I want to create and manage departments, so that I can organize my organization's structure.

#### Acceptance Criteria

1. WHEN a SuperAdmin creates a department, THE System SHALL validate name (2-100 chars), description (max 500 chars), and optional manager (SuperAdmin or Admin with isHod=true)
2. WHEN a department is created, THE System SHALL set status=ACTIVE and organization reference
3. WHEN a department status is set to INACTIVE, THE System SHALL prevent creation of new users, tasks, and materials under that department (409 CONFLICT_ERROR)
4. WHEN a department is soft-deleted, THE System SHALL cascade soft-delete to all users, tasks, activities, comments, attachments, and notifications in that department
5. WHEN a department is restored, THE System SHALL restore cascaded resources in correct order
6. WHEN an HOD user accesses the sidebar, THE System SHALL display a department selector for switching departments
7. WHEN a non-HOD user accesses the sidebar, THE System SHALL display read-only department context
8. THE System SHALL allow SuperAdmins and Admins to read departments across the organization
9. THE System SHALL restrict Managers and Users to read only their own department

### Requirement 6: User Management

**User Story:** As an organization administrator, I want to create and manage users, so that I can control who has access to the system and their permissions.

#### Acceptance Criteria

1. WHEN a SuperAdmin creates a user, THE System SHALL validate first name (2-50 chars), last name (2-50 chars), position (2-100 chars), email, phone (Ethiopian format), role (enum), department, and optional isHod
2. WHEN a user is created by an organization SuperAdmin, THE System SHALL set isVerified=true (auto-verified)
3. WHEN a user is created, THE System SHALL auto-generate employeeId (4 digits, not 0000, sequential)
4. WHEN a user is created, THE System SHALL generate a temporary password, hash it with bcrypt (>=12 rounds), generate a password setup token, and send a welcome email with the setup link
5. WHEN a user status is set to INACTIVE, THE System SHALL deny login and refresh token operations (403 FORBIDDEN)
6. WHEN a user is soft-deleted, THE System SHALL cascade soft-delete to all tasks, activities, comments, attachments, and notifications created by that user
7. THE System SHALL prevent updates to immutable fields (department, role, employeeId, joinedAt, isHod) for Admin/Manager/User targets
8. WHEN a user updates their own profile, THE System SHALL allow updates to firstName, lastName, position, phone, profilePicture, and preferences
9. THE System SHALL allow Platform SuperAdmins to read any user across all organizations
10. THE System SHALL allow SuperAdmins and Admins to read users in their own organization
11. THE System SHALL restrict Managers and Users to read only users in their own department

### Requirement 7: ProjectTask Management

**User Story:** As a department manager, I want to create and manage project tasks with vendors and watchers, so that I can track long-term projects with external partners.

#### Acceptance Criteria

1. WHEN a SuperAdmin or Admin creates a ProjectTask, THE System SHALL validate title (3-200 chars), description (10-5000 chars), priority (enum), vendor (required), startDate, dueDate (must be after startDate), and optional tags (max 5, each max 50 chars, lowercase, unique case-insensitive)
2. WHEN a ProjectTask is created, THE System SHALL set status=TODO, include creator as watcher by default, and set organization and department automatically
3. WHEN a ProjectTask is created, THE System SHALL create a TaskActivity with activity="Task created"
4. WHEN a ProjectTask is created, THE System SHALL create a notification and send optional email alerts
5. WHEN a ProjectTask is created, THE System SHALL emit Socket.IO events: task:created and notification
6. WHEN a user adds or removes watchers, THE System SHALL validate that watchers are active users in the same organization and department
7. WHEN a user adds a TaskActivity to a ProjectTask, THE System SHALL validate activity description (2-1000 chars), optional materials (max 20), and optional attachments (max 20)
8. THE System SHALL allow TaskActivity creation for ProjectTask only (not RoutineTask)
9. WHEN a ProjectTask is updated, THE System SHALL validate dueDate > startDate and emit task:updated event
10. WHEN a ProjectTask is soft-deleted, THE System SHALL cascade soft-delete to all activities, comments, and attachments

### Requirement 8: AssignedTask Management

**User Story:** As a team lead, I want to create and assign tasks to team members with deadlines, so that I can track short-term assignments and ensure timely completion.

#### Acceptance Criteria

1. WHEN a SuperAdmin, Admin, or Manager creates an AssignedTask, THE System SHALL validate title, description, priority, assignees (min 1, max 50), startDate, and dueDate
2. WHEN an AssignedTask is created, THE System SHALL validate that all assignees are active users in the same organization
3. WHEN an AssignedTask is created, THE System SHALL set status=TODO and create a TaskActivity with activity="Task created"
4. WHEN an AssignedTask is created, THE System SHALL create notifications for all assignees and send optional email alerts
5. WHEN an AssignedTask due date is 1 hour away, THE System SHALL send a reminder notification to all assignees
6. WHEN a user adds a TaskActivity to an AssignedTask, THE System SHALL validate activity description and optional materials/attachments
7. THE System SHALL allow TaskActivity creation for AssignedTask
8. WHEN an assignee updates an AssignedTask status, THE System SHALL allow the update and emit task:updated event
9. WHEN an AssignedTask is completed, THE System SHALL set status=COMPLETED and create a TaskActivity
10. WHEN an AssignedTask is soft-deleted, THE System SHALL cascade soft-delete to all activities, comments, and attachments

### Requirement 9: RoutineTask Management

**User Story:** As a team member, I want to create routine tasks with embedded materials for specific dates, so that I can track recurring maintenance and operational tasks.

#### Acceptance Criteria

1. WHEN any user creates a RoutineTask, THE System SHALL validate title, description, priority, date (specific date for routine task), and optional materials (max 20 embedded)
2. WHEN a RoutineTask is created with materials, THE System SHALL decrement material stock atomically in the same database session
3. WHEN material stock would go below 0, THE System SHALL return 409 CONFLICT_ERROR and reject the RoutineTask creation
4. WHEN a RoutineTask is created, THE System SHALL set status=TODO and embed materials directly in the task (no TaskActivity)
5. THE System SHALL prevent TaskActivity creation for RoutineTask
6. WHEN a RoutineTask is completed, THE System SHALL set status=COMPLETED for that date
7. WHEN a RoutineTask is updated, THE System SHALL validate that materials are embedded and not linked via TaskActivity
8. WHEN a RoutineTask is soft-deleted, THE System SHALL cascade soft-delete to comments and attachments only (no activities)
9. THE System SHALL allow all roles to create RoutineTasks in their own department
10. WHEN a RoutineTask is restored, THE System SHALL not restore material stock (stock changes are permanent)

### Requirement 10: Task Comments and Mentions

**User Story:** As a team member, I want to comment on tasks and mention other users, so that I can collaborate and notify specific team members about important updates.

#### Acceptance Criteria

1. WHEN a user creates a TaskComment, THE System SHALL validate comment text (2-2000 chars), parent (Task, TaskActivity, or TaskComment), and optional attachments
2. WHEN a TaskComment is created with @mentions, THE System SHALL parse @username patterns and validate that mentioned users belong to the same organization (max 20 mentions per comment)
3. WHEN a TaskComment is created with mentions, THE System SHALL create notifications for all mentioned users and emit notification events
4. WHEN a user replies to a TaskComment, THE System SHALL create a nested TaskComment with depth incremented by 1
5. WHEN a TaskComment depth would exceed 5, THE System SHALL return 400 VALIDATION_ERROR
6. WHEN a user edits their own TaskComment, THE System SHALL allow the update and preserve the original createdAt timestamp
7. WHEN a user deletes their own TaskComment, THE System SHALL soft-delete the comment and cascade to nested comments
8. WHEN a TaskComment is created, THE System SHALL emit task:comment:added event to the task room
9. THE System SHALL allow all roles to create TaskComments in their own department
10. THE System SHALL support polymorphic parent types: Task, TaskActivity, and TaskComment

### Requirement 11: File Attachments

**User Story:** As a user, I want to attach files to tasks, activities, and comments, so that I can share relevant documents and media with my team.

#### Acceptance Criteria

1. WHEN a user uploads a file, THE System SHALL validate file size (max 10MB per file) and file extension against the allowlist (.svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3)
2. WHEN a file passes validation, THE System SHALL upload directly to Cloudinary and receive a secure URL with version segment
3. WHEN Cloudinary returns the URL, THE System SHALL create an Attachment record with fileUrl, fileName, fileType (Image, Document, Video, Audio, Other), fileSize, parent reference, and uploadedBy
4. WHEN an Attachment is created, THE System SHALL validate the fileUrl matches the Cloudinary pattern for image, video, or raw resource types with version segment
5. THE System SHALL support polymorphic parent types for Attachments: Task, TaskActivity, and TaskComment
6. THE System SHALL NOT support Attachments for Material (CAN-021)
7. WHEN a user deletes their own Attachment, THE System SHALL soft-delete the Attachment record
8. WHEN a parent resource is soft-deleted, THE System SHALL cascade soft-delete to all Attachments
9. THE System SHALL allow all roles to create Attachments in their own department
10. WHEN an Attachment is displayed, THE System SHALL show preview for images and download link for all file types

### Requirement 12: Material Inventory Management

**User Story:** As a department manager, I want to manage materials with inventory tracking, so that I can monitor stock levels and prevent stockouts.

#### Acceptance Criteria

1. WHEN a SuperAdmin, Admin, or Manager creates a Material, THE System SHALL validate name (2-200 chars), SKU (required, unique per department), category (enum), unit (enum), unitPrice (optional), status (ACTIVE/INACTIVE), and inventory fields (stockOnHand, lowStockThreshold, reorderQuantity)
2. WHEN a Material is created, THE System SHALL set organization and department references and createdBy
3. WHEN a Material is used in a RoutineTask, THE System SHALL decrement inventory.stockOnHand atomically
4. WHEN a Material is used in a TaskActivity, THE System SHALL decrement inventory.stockOnHand atomically
5. WHEN material stock would go below 0, THE System SHALL return 409 CONFLICT_ERROR and reject the operation
6. WHEN a user restocks a Material, THE System SHALL increment inventory.stockOnHand atomically and update inventory.lastRestockedAt
7. WHEN a Material status is set to INACTIVE, THE System SHALL prevent selection for new tasks but allow viewing
8. WHEN a user attempts to delete a Material, THE System SHALL check for associations with tasks (including soft-deleted) using .withDeleted()
9. IF a Material is associated with any tasks, THE System SHALL return 409 CONFLICT_ERROR with message suggesting status=INACTIVE instead
10. THE System SHALL allow all roles to read Materials in their own department
11. THE System SHALL display low-stock indicators when inventory.stockOnHand <= inventory.lowStockThreshold

### Requirement 13: Vendor Management

**User Story:** As an organization administrator, I want to manage vendors with contact information and ratings, so that I can track external partners for project tasks.

#### Acceptance Criteria

1. WHEN a non-platform SuperAdmin or Admin creates a Vendor, THE System SHALL validate name (2-200 chars), email, phone (Ethiopian format), optional website, optional location, optional address, status (ACTIVE/INACTIVE), optional description, optional isVerifiedPartner, and optional rating (1-5, 0.5 increments)
2. WHEN a Vendor is created, THE System SHALL set organization reference (org-level resource) and createdBy
3. WHEN a Vendor status is set to INACTIVE, THE System SHALL prevent selection for new ProjectTasks but allow viewing
4. WHEN a user attempts to delete a Vendor, THE System SHALL check for associations with ProjectTasks (including soft-deleted) using .withDeleted()
5. IF a Vendor is associated with any ProjectTasks, THE System SHALL return 409 CONFLICT_ERROR with message suggesting status=INACTIVE instead
6. WHEN a Vendor is displayed, THE System SHALL show verified partner badge if isVerifiedPartner=true
7. WHEN a user views Vendor details, THE System SHALL display performance metrics: total projects, active projects, completed projects, on-time delivery rate, average project duration, and total spend (derived from project material costs)
8. WHEN a user clicks "Contact Vendor", THE System SHALL open a dialog to compose an email and send it via the backend email service (role-gated)
9. THE System SHALL allow Platform SuperAdmins to read any Vendor across all organizations
10. THE System SHALL allow all roles to read Vendors in their own organization
11. THE System SHALL restrict Vendor creation to non-platform SuperAdmins and Admins in their own organization

### Requirement 14: Real-Time Collaboration via Socket.IO

**User Story:** As a user, I want to see real-time updates for tasks, activities, comments, and notifications, so that I can stay informed without refreshing the page.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL establish a Socket.IO connection with JWT authentication
2. WHEN the Socket.IO connection is established, THE System SHALL verify the JWT token and join the user to rooms: user:{userId}, org:{orgId}, dept:{deptId}
3. WHEN a task is created, THE System SHALL emit task:created event to org and dept rooms
4. WHEN a task is updated, THE System SHALL emit task:updated event to org, dept, and task:{taskId} rooms
5. WHEN a task is soft-deleted, THE System SHALL emit task:deleted event to org and dept rooms
6. WHEN a TaskActivity is added, THE System SHALL emit task:activity:added event to task:{taskId} room
7. WHEN a TaskComment is added, THE System SHALL emit task:comment:added event to task:{taskId} room
8. WHEN a notification is created, THE System SHALL emit notification event to user:{userId} rooms for all recipients including watchers and mentioned users
9. WHEN a user status changes, THE System SHALL emit user:status:changed event to org room
10. WHEN the frontend receives Socket.IO events, THE System SHALL route events to RTK Query cache updates via socketService
11. WHEN a Socket.IO connection is lost, THE System SHALL automatically reconnect with exponential backoff
12. WHEN a user logs out, THE System SHALL close the Socket.IO connection and leave all rooms

### Requirement 15: Notification System

**User Story:** As a user, I want to receive in-app and email notifications for important events, so that I stay informed about tasks, mentions, and deadlines.

#### Acceptance Criteria

1. WHEN a notification is created, THE System SHALL validate title (max 200 chars), message (1-500 chars), entity reference (optional), organization, department, and set isRead=false and expiresAt=now+30days
2. WHEN a notification is created, THE System SHALL emit notification event to user:{userId} rooms for all recipients
3. WHEN a notification is created for an important event, THE System SHALL send an email via Nodemailer using Gmail SMTP
4. WHEN a user views the notification bell, THE System SHALL display unread count badge
5. WHEN a user clicks the notification bell, THE System SHALL display a dropdown with recent notifications (newest first)
6. WHEN a user clicks a notification, THE System SHALL navigate to the related entity and mark the notification as read
7. WHEN a notification is marked as read, THE System SHALL set isRead=true and decrease the badge count
8. WHEN a user clicks "Mark all as read", THE System SHALL mark all notifications as read and clear the badge
9. WHEN a notification expires (expiresAt < now), THE System SHALL automatically delete it via TTL index
10. WHEN a new notification arrives, THE System SHALL pulse the bell icon briefly and show browser notification if permitted
11. THE System SHALL deliver notifications to watchers and mentioned users' active sessions via Socket.IO

### Requirement 16: Dashboard Analytics

**User Story:** As a manager, I want to view dashboard analytics with KPIs, charts, and activity feeds, so that I can monitor team performance and task progress.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard, THE System SHALL display KPI cards: My Tasks, Department Tasks, Overdue, Completed This Week (clickable)
2. WHEN a user views the dashboard, THE System SHALL display charts: status distribution (pie), priority breakdown (bar), timeline trends (line)
3. WHEN a user views the dashboard, THE System SHALL display a real-time activity feed (newest first) with avatars, timestamps, and actions
4. WHEN a user views the dashboard, THE System SHALL display an upcoming deadlines table (MuiDataGrid) with tasks due in the next 7 days
5. WHEN a Manager or Admin views the dashboard, THE System SHALL display team performance widgets with comparison to department averages
6. WHEN a user applies filters (date range, departmentId, status, priority, taskType), THE System SHALL update all dashboard widgets to reflect the filtered data
7. WHEN a user clicks a status slice in the pie chart, THE System SHALL navigate to the Tasks page with that status filter applied
8. WHEN a user clicks a priority bar in the bar chart, THE System SHALL navigate to the Tasks page with that priority filter applied
9. WHEN a user clicks the refresh button, THE System SHALL trigger manual data reload (cache bust/refetch)
10. WHEN a user clicks the export button, THE System SHALL export the currently filtered dashboard snapshot as PDF using jspdf + jspdf-autotable, including applied filters summary, export timestamp, and widget tables
11. THE System SHALL use MUI X Charts for all chart rendering with theme tokens (no hardcoded palettes)
12. THE System SHALL cache dashboard data using RTK Query for performance

### Requirement 17: Advanced Filtering and Search

**User Story:** As a user, I want to filter and search tasks by multiple criteria, so that I can quickly find relevant tasks.

#### Acceptance Criteria

1. WHEN a user types in the search field, THE System SHALL filter tasks by title or description with debounce (300ms) and minimum 3 characters
2. WHEN a user clicks the filter button, THE System SHALL display a filter dialog with status, priority, type, created date range, due date range, department, assignment, tags, and deleted toggle filters
3. WHEN a user applies filters, THE System SHALL update the task list to show only matching tasks and display active filter chips
4. WHEN a user applies multiple values for a single filter (e.g., status=TODO,IN_PROGRESS), THE System SHALL treat them as union (OR) filters
5. WHEN a user applies date range filters, THE System SHALL support presets: Today, This Week, This Month, Custom
6. WHEN a user applies assignment filter, THE System SHALL support options: Assigned to me, Created by me, Watching, All department tasks, Unassigned
7. WHEN a user applies department filter (Managers/Admins only), THE System SHALL support multi-select with cross-department read permission check
8. WHEN a user applies tags filter, THE System SHALL support multi-select with AND/OR toggle
9. WHEN a user clicks a filter chip remove icon, THE System SHALL remove that filter and update the list
10. WHEN a user clicks "Clear All", THE System SHALL remove all filters at once
11. THE System SHALL persist filter state in URL query params for bookmarking
12. THE System SHALL support sorting by due date, priority, created date, and title

### Requirement 18: Responsive Layout and Navigation

**User Story:** As a user, I want a responsive interface that works on mobile, tablet, and desktop, so that I can access the system from any device.

#### Acceptance Criteria

1. WHEN a user accesses the system on xs screens (width < 600), THE System SHALL display a bottom navigation bar with 4 items (Dashboard, Tasks, Users, Profile) and a centered FAB
2. WHEN a user accesses the system on sm+ screens (width >= 600), THE System SHALL hide the bottom navigation bar
3. WHEN a user accesses the system on xs/sm screens (width < 900), THE System SHALL display a temporary drawer sidebar that opens on menu button click
4. WHEN a user accesses the system on md+ screens (width >= 900), THE System SHALL display a permanent sidebar that is always visible
5. WHEN a user clicks the FAB on mobile, THE System SHALL open a dialog or menu for creating new items
6. WHEN a user clicks the Profile navigation item on mobile, THE System SHALL open a menu with additional navigation options (Departments, Materials, Vendors) and profile actions
7. WHEN a user navigates to a different page on mobile, THE System SHALL automatically close the sidebar drawer
8. WHEN a user views a dialog on xs screens (width <= 600), THE System SHALL display the dialog as full-height (100vh)
9. WHEN a user views a list page on xs screens, THE System SHALL display cards in a single column
10. WHEN a user views a list page on sm screens, THE System SHALL display cards in 2 columns
11. WHEN a user views a list page on md+ screens, THE System SHALL display cards in 3-4 columns
12. WHEN a user views a MuiDataGrid on xs/sm screens, THE System SHALL hide less important columns and provide column visibility controls

### Requirement 19: Authentication and Security

**User Story:** As a system architect, I want secure authentication with JWT token rotation and bcrypt password hashing, so that user credentials and sessions are protected.

#### Acceptance Criteria

1. WHEN a user logs in with valid credentials, THE System SHALL verify the password using bcrypt comparison and generate access and refresh tokens
2. WHEN tokens are generated, THE System SHALL set access token expiry to 15 minutes and refresh token expiry to 7 days
3. WHEN tokens are generated, THE System SHALL store them in HttpOnly cookies with Secure and SameSite=Strict flags
4. WHEN an access token expires, THE System SHALL use the refresh token to generate a new access token (token rotation)
5. WHEN a refresh token is used, THE System SHALL generate a new refresh token and invalidate the old one
6. WHEN a user logs out, THE System SHALL clear both access and refresh tokens from cookies and database
7. WHEN a user registers or resets password, THE System SHALL hash the password with bcrypt using minimum 12 rounds
8. WHEN a user attempts login with INACTIVE status, THE System SHALL return 403 FORBIDDEN
9. WHEN a user attempts login without email verification (isVerified=false), THE System SHALL return 403 FORBIDDEN with message to verify email
10. THE System SHALL apply rate limiting to all endpoints using express-rate-limit
11. THE System SHALL sanitize all inputs using express-mongo-sanitize to prevent NoSQL injection
12. THE System SHALL apply security headers using helmet (CSP, HSTS, etc.)
13. THE System SHALL use identical JWT secrets for HTTP and Socket.IO authentication
14. THE System SHALL include user role, organization, and department identifiers in JWT payload

### Requirement 20: Email Workflows

**User Story:** As a user, I want to receive email notifications for important events, so that I stay informed even when not actively using the system.

#### Acceptance Criteria

1. WHEN a customer organization completes registration, THE System SHALL send an email verification message to the initial SuperAdmin email address
2. WHEN email verification succeeds, THE System SHALL send a welcome email exactly once (idempotent) via Nodemailer using Gmail SMTP
3. WHEN a user is created by an organization SuperAdmin, THE System SHALL generate a password setup token and send a welcome email with the setup link
4. WHEN a user requests password reset, THE System SHALL generate a reset token with expiry and send a reset email
5. WHEN a user is mentioned in a comment, THE System SHALL send an email notification with the comment text and link to the task
6. WHEN an AssignedTask due date is 1 hour away, THE System SHALL send a reminder email to all assignees
7. WHEN a task is assigned to a user, THE System SHALL send an email notification with task details
8. WHEN a user clicks "Contact Vendor", THE System SHALL send an email via the backend email service (role-gated)
9. THE System SHALL use email templates with organization branding and consistent formatting
10. THE System SHALL handle email delivery failures gracefully and log errors

### Requirement 21: Soft Delete and Restore

**User Story:** As an administrator, I want to soft delete resources instead of permanently removing them, so that I can restore them if needed.

#### Acceptance Criteria

1. WHEN a resource is soft-deleted, THE System SHALL set isDeleted=true, deletedAt=now, and deletedBy=currentUser
2. WHEN a department is soft-deleted, THE System SHALL cascade soft-delete to all users, tasks, activities, comments, attachments, and notifications in that department
3. WHEN a user is soft-deleted, THE System SHALL cascade soft-delete to all tasks, activities, comments, attachments, and notifications created by that user
4. WHEN a task is soft-deleted, THE System SHALL cascade soft-delete to all activities, comments, and attachments linked to that task
5. WHEN a resource is restored, THE System SHALL set isDeleted=false, deletedAt=null, and deletedBy=null
6. WHEN a department is restored, THE System SHALL restore cascaded resources in correct order (department → users → tasks → activities/comments → attachments)
7. WHEN a query excludes deleted resources, THE System SHALL filter by isDeleted=false
8. WHEN a query includes deleted resources (includeDeleted=true), THE System SHALL use .withDeleted() to include soft-deleted documents
9. WHEN checking for resource associations before deletion, THE System SHALL use .withDeleted() to include soft-deleted parents
10. THE System SHALL display a "Restore" button for soft-deleted resources instead of a "Delete" button
11. THE System SHALL restrict includeDeleted=true to SuperAdmin role only

### Requirement 22: View Modes (Grid vs List)

**User Story:** As a user, I want to toggle between grid view (tabular) and list view (cards) for tasks, users, and departments, so that I can choose my preferred viewing format.

#### Acceptance Criteria

1. WHEN a user views Tasks, Users, or Departments pages, THE System SHALL display a view toggle button (grid/list icons)
2. WHEN a user selects Grid view, THE System SHALL display resources using MuiDataGrid (reusable wrapper around MUI X DataGrid)
3. WHEN a user selects List view, THE System SHALL display resources using MUI Cards in a responsive Grid layout
4. WHEN a user views Materials or Vendors pages, THE System SHALL display Grid view only (no list view option)
5. WHEN MuiDataGrid is displayed, THE System SHALL include row selection checkboxes, action buttons, and MuiDataGridToolbar
6. WHEN MuiDataGridToolbar is displayed, THE System SHALL include search, filter, export, column visibility, and density controls
7. WHEN List view is displayed, THE System SHALL use MUI Grid with size prop: xs=12, sm=6, md=4, lg=4, xl=3 (values vary by screen)
8. THE System SHALL persist view mode preference in user preferences or local storage
9. THE System SHALL load column definitions from client/src/components/columns/\* and pass to MuiDataGrid
10. THE System SHALL implement MuiDataGrid and MuiDataGridToolbar as reusable components in client/src/components/reusable/\*

### Requirement 23: Data Validation

**User Story:** As a developer, I want consistent validation rules between frontend and backend, so that users receive immediate feedback and data integrity is maintained.

#### Acceptance Criteria

1. WHEN a user submits organization data, THE System SHALL validate name (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/), email (max 100 chars), phone (Ethiopian format: /^(\+251\d{9}|0\d{9})$/), address (5-500 chars), industry (enum), and size (enum)
2. WHEN a user submits department data, THE System SHALL validate name (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/), description (max 500 chars, required), and status (enum)
3. WHEN a user submits user data, THE System SHALL validate firstName (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/), lastName (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/), position (2-100 chars, pattern: /^[a-zA-Z\s\-']+$/), email, phone, role (enum), and status (enum)
4. WHEN a user submits task data, THE System SHALL validate title (3-200 chars), description (10-5000 chars), status (enum), priority (enum), type (enum), and tags (max 5, each max 50 chars, lowercase, unique case-insensitive)
5. WHEN a user submits ProjectTask data, THE System SHALL validate vendor (required), startDate, dueDate (must be after startDate), and watchers (active users in same org+dept)
6. WHEN a user submits AssignedTask data, THE System SHALL validate assignees (min 1, max 50, active users in same org), startDate, and dueDate
7. WHEN a user submits RoutineTask data, THE System SHALL validate date (required) and materials (max 20 embedded)
8. WHEN a user submits TaskActivity data, THE System SHALL validate activity description (2-1000 chars), materials (max 20), and attachments (max 20)
9. WHEN a user submits TaskComment data, THE System SHALL validate comment text (2-2000 chars), mentions (max 20, same org), and depth (max 5)
10. WHEN a user submits Material data, THE System SHALL validate name (2-200 chars), SKU (required, unique per dept), category (enum), unit (enum), unitPrice (optional), status (enum), and inventory fields (stockOnHand >= 0, lowStockThreshold >= 0)
11. WHEN a user submits Vendor data, THE System SHALL validate name (2-200 chars), email, phone, optional website, status (enum), optional rating (1-5, 0.5 increments)
12. WHEN a user submits Attachment data, THE System SHALL validate fileSize (max 10MB), fileExtension (allowlist: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3), and fileUrl (Cloudinary pattern with version segment)
13. WHEN a user submits Notification data, THE System SHALL validate title (max 200 chars), message (1-500 chars), and expiresAt (default now+30days)
14. WHEN validation fails, THE System SHALL return 400 VALIDATION_ERROR with detailed field-level error messages
15. THE System SHALL apply validation on both frontend (real-time) and backend (express-validator) with identical rules

### Requirement 24: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a 400 VALIDATION_ERROR occurs, THE System SHALL display field-level error messages below the relevant input fields
2. WHEN a 401 UNAUTHENTICATED_ERROR occurs, THE System SHALL redirect to the login page and display a toast message
3. WHEN a 403 UNAUTHORIZED_ERROR occurs, THE System SHALL display a toast notification with the error message (no dedicated 403 page)
4. WHEN a 404 NOT_FOUND_ERROR occurs, THE System SHALL display a 404 page with a message and "Go Home" button
5. WHEN a 409 CONFLICT_ERROR occurs, THE System SHALL display a toast notification with the specific conflict reason (e.g., "Cannot delete material: associated with active tasks. Set status to INACTIVE instead.")
6. WHEN a 429 RATE_LIMITED_ERROR occurs, THE System SHALL display a toast notification with retry-after information
7. WHEN a 500 INTERNAL_ERROR occurs, THE System SHALL display a toast notification with a generic error message and log the error
8. WHEN a network error occurs, THE System SHALL display a toast notification with "Network error. Please check your connection."
9. WHEN a loading operation is in progress, THE System SHALL display loading skeletons or spinners
10. WHEN no data is found, THE System SHALL display an empty state with a message and relevant action button (e.g., "No tasks found. Create Task")
11. WHEN a success operation completes, THE System SHALL display a success toast notification (e.g., "Task created successfully")
12. THE System SHALL use react-toastify for all toast notifications with consistent styling and auto-dismiss after 5 seconds

### Requirement 25: Performance and Optimization

**User Story:** As a user, I want fast page loads and smooth interactions, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN a user navigates to any page, THE System SHALL lazy load all page components using React.lazy
2. WHEN a user navigates to any page, THE System SHALL lazy load heavy components (charts, data grids) dynamically
3. WHEN a user opens a dialog or modal, THE System SHALL lazy load the dialog component
4. WHEN the frontend makes API calls, THE System SHALL use RTK Query for automatic caching with tags
5. WHEN Socket.IO events are received, THE System SHALL trigger RTK Query cache invalidation for affected resources
6. WHEN a user performs an action, THE System SHALL use optimistic updates for immediate feedback
7. WHEN a user types in a search field, THE System SHALL debounce input (300ms) to reduce API calls
8. WHEN a user scrolls through a long list, THE System SHALL use pagination (20 items per page default) or infinite scroll
9. WHEN a user views a MuiDataGrid, THE System SHALL use virtual scrolling for long lists
10. THE System SHALL use React.memo for expensive components to prevent unnecessary re-renders
11. THE System SHALL use useMemo for expensive computations and useCallback for stable function references
12. THE System SHALL optimize bundle size with code splitting by route and vendor chunk separation
13. THE System SHALL optimize images and assets for mobile devices
14. THE System SHALL ensure initial page load is under 3 seconds on 3G networks
15. THE System SHALL optimize Core Web Vitals (LCP, FID, CLS)

### Requirement 26: Accessibility

**User Story:** As a user with disabilities, I want an accessible interface, so that I can use the system effectively with assistive technologies.

#### Acceptance Criteria

1. WHEN a user navigates the interface, THE System SHALL support full keyboard navigation with visible focus indicators
2. WHEN a user uses a screen reader, THE System SHALL provide ARIA labels, roles, and descriptions for all interactive elements
3. WHEN a user views form inputs, THE System SHALL associate labels with inputs using htmlFor and id attributes
4. WHEN a user encounters an error, THE System SHALL announce error messages to screen readers using aria-live regions
5. WHEN a user views images, THE System SHALL provide descriptive alt text for all images
6. WHEN a user views icons, THE System SHALL provide aria-label or title attributes for icon-only buttons
7. WHEN a user views color-coded information, THE System SHALL provide additional non-color indicators (icons, text)
8. WHEN a user views text, THE System SHALL ensure minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text
9. WHEN a user interacts with buttons, THE System SHALL ensure minimum touch target size of 44x44px
10. WHEN a user opens a dialog, THE System SHALL trap focus within the dialog and return focus on close
11. WHEN a user views tables, THE System SHALL provide proper table headers and scope attributes
12. THE System SHALL support browser zoom up to 200% without breaking layout

### Requirement 27: Theming and Styling

**User Story:** As a user, I want a consistent and visually appealing interface with light and dark mode support, so that I can customize my viewing experience.

#### Acceptance Criteria

1. WHEN a user accesses the system, THE System SHALL apply the MUI theme from client/src/theme/\* with theme tokens
2. WHEN a user toggles theme mode, THE System SHALL switch between light and dark mode and persist the preference
3. WHEN components are styled, THE System SHALL use theme tokens (background.default, background.paper, text.primary, text.secondary, divider, primary.main, etc.) instead of hardcoded colors
4. WHEN charts are rendered, THE System SHALL use MUI X Charts with theme tokens (no hardcoded chart palettes)
5. WHEN dialogs are displayed on mobile (xs), THE System SHALL apply full-height (100vh) styling with required MUI props
6. WHEN cards are displayed, THE System SHALL use consistent elevation, border-radius, and padding from theme
7. WHEN buttons are displayed, THE System SHALL use consistent variants (contained, outlined, text) and colors from theme
8. WHEN typography is displayed, THE System SHALL use theme typography variants (h1-h6, body1, body2, caption, etc.)
9. WHEN spacing is applied, THE System SHALL use theme spacing function (theme.spacing(1) = 8px)
10. THE System SHALL use Emotion for CSS-in-JS with styled components and sx prop
11. THE System SHALL use @fontsource/inter for the Inter font family
12. THE System SHALL avoid inline styles and use sx prop or styled components instead

### Requirement 28: Immutability Rules

**User Story:** As a system architect, I want to enforce immutability rules for critical fields, so that data integrity is maintained and audit trails are preserved.

#### Acceptance Criteria

1. WHEN a user attempts to update department field for Admin/Manager/User targets, THE System SHALL return 409 CONFLICT_ERROR
2. WHEN a user attempts to update role field for Admin/Manager/User targets, THE System SHALL return 409 CONFLICT_ERROR
3. WHEN a user attempts to update employeeId field for any user, THE System SHALL return 409 CONFLICT_ERROR
4. WHEN a user attempts to update joinedAt field for any user, THE System SHALL return 409 CONFLICT_ERROR
5. WHEN a user attempts to update isHod field for Admin/Manager/User targets, THE System SHALL return 409 CONFLICT_ERROR
6. WHEN a user attempts to delete the platform organization, THE System SHALL return 403 UNAUTHORIZED_ERROR
7. WHEN a user attempts to update isPlatformOrg field for any organization, THE System SHALL return 409 CONFLICT_ERROR
8. WHEN a user attempts to update isPlatformOrgUser field for any user, THE System SHALL return 409 CONFLICT_ERROR
9. WHEN a user attempts to update createdBy field for any resource, THE System SHALL return 409 CONFLICT_ERROR
10. WHEN a user attempts to update createdAt field for any resource, THE System SHALL return 409 CONFLICT_ERROR
11. THE System SHALL provide clear error messages explaining which fields are immutable and why

### Requirement 29: Pagination and Sorting

**User Story:** As a user, I want to paginate and sort large lists, so that I can navigate through data efficiently.

#### Acceptance Criteria

1. WHEN a user views a list page, THE System SHALL display pagination controls with page number, total pages, and items per page
2. WHEN a user changes the page, THE System SHALL fetch and display the requested page of data
3. WHEN a user changes items per page, THE System SHALL update the list to show the selected number of items (default 20)
4. WHEN a user sorts a column in MuiDataGrid, THE System SHALL sort the data by that column in ascending or descending order
5. WHEN a user sorts by multiple columns, THE System SHALL apply multi-column sorting
6. WHEN a user applies sorting, THE System SHALL persist the sort state in URL query params
7. WHEN a user applies sorting, THE System SHALL send sort parameter to backend (e.g., ?sort=-createdAt for descending)
8. WHEN the backend receives a sort parameter, THE System SHALL parse the parameter and apply sorting to the query
9. WHEN the backend returns paginated data, THE System SHALL include metadata: page, limit, totalPages, totalItems, hasNextPage, hasPrevPage
10. THE System SHALL support sorting by common fields: createdAt, updatedAt, name, title, dueDate, priority, status

### Requirement 30: Department Details and Activity Feed

**User Story:** As a department manager, I want to view department details with tabs for overview, members, and tasks, so that I can monitor department performance and activity.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/departments/:departmentId, THE System SHALL display the department detail page with 3 top-level tabs: Overview, Members, Tasks
2. WHEN a user views the Overview tab, THE System SHALL display department header, manager info, stats (total users, total tasks, active tasks), and description
3. WHEN a user views the Members tab, THE System SHALL display a user list filtered by the current department
4. WHEN a user views the Tasks tab, THE System SHALL display a task list filtered by the current department with a secondary sub-tab "All Activity"
5. WHEN a user views the "All Activity" sub-tab, THE System SHALL display a chronological activity feed with filtering by entity type (Task, TaskActivity, TaskComment, Attachment)
6. WHEN a user filters the activity feed, THE System SHALL support filtering by activity type (tasks, comments, files) and date range
7. WHEN a user views an activity item, THE System SHALL display user avatar, name, action description, timestamp (relative), and expandable details
8. WHEN a user clicks an activity item, THE System SHALL navigate to the related entity (task, comment, attachment)
9. THE System SHALL fetch activity feed data from GET /api/departments/:departmentId/activity endpoint
10. THE System SHALL display activity feed in real-time with Socket.IO updates

### Requirement 31: User Details and Performance Metrics

**User Story:** As a manager, I want to view user details with performance metrics, so that I can evaluate team member contributions and productivity.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/users/:userId, THE System SHALL display the user detail page with 4 tabs: Overview, Tasks, Activity, Performance
2. WHEN a user views the Overview tab, THE System SHALL display profile header with avatar, contact info, role, department, employee ID, joined date, and skills chart
3. WHEN a user views the Tasks tab, THE System SHALL display tabs (Created, Assigned, Watching) with task lists and filters
4. WHEN a user views the Activity tab, THE System SHALL display a chronological feed of user actions
5. WHEN a user views the Performance tab (Manager/Admin only), THE System SHALL display KPIs: completion rate, average task time, throughput, and comparison to department averages
6. WHEN a user views the Performance tab, THE System SHALL display charts: task completion trend, priority distribution, and status breakdown
7. THE System SHALL fetch performance data from GET /api/users/:userId/performance endpoint
8. THE System SHALL calculate completion rate as (completed tasks / total tasks) \* 100
9. THE System SHALL calculate average task time as average duration from startDate to completedAt for completed tasks
10. THE System SHALL calculate throughput as tasks completed per week/month

### Requirement 32: Task Details with Tabs

**User Story:** As a user, I want to view task details with tabs for overview, activities, comments, and attachments, so that I can access all task-related information in one place.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/tasks/:taskId, THE System SHALL display the task detail page with 4 tabs: Overview, Activities, Comments, Attachments
2. WHEN a user views the Overview tab, THE System SHALL display task header, status, priority, type, dates, assignees/watchers, vendor (ProjectTask), description, and tags
3. WHEN a user views the Activities tab (ProjectTask/AssignedTask only), THE System SHALL display a timeline of TaskActivity entries with user avatars, timestamps, materials, attachments, and expandable details
4. WHEN a user views the Comments tab, THE System SHALL display threaded comments (max depth 5) with @mentions, reply, edit, delete, and attachments
5. WHEN a user views the Attachments tab, THE System SHALL display a gallery view with file previews, download buttons, and lightbox for images
6. WHEN a user adds a comment with @mentions, THE System SHALL parse @username patterns, validate mentioned users, and create notifications
7. WHEN a user replies to a comment, THE System SHALL create a nested comment with depth incremented by 1
8. WHEN a user edits their own comment, THE System SHALL allow the update and preserve the original createdAt timestamp
9. WHEN a user deletes their own comment, THE System SHALL soft-delete the comment and cascade to nested comments
10. WHEN a user uploads an attachment, THE System SHALL validate file size (max 10MB) and extension, upload to Cloudinary, and create Attachment record

### Requirement 33: Settings Page

**User Story:** As a user, I want to manage my profile, account, and security settings, so that I can customize my experience and maintain account security.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/settings, THE System SHALL display the settings page with 3 tabs: Profile, Account, Security
2. WHEN a user views the Profile tab, THE System SHALL display fields: profile picture, first name, last name, position, phone, skills, and preferences (theme, date format, time format, timezone)
3. WHEN a user updates profile information, THE System SHALL validate and save the changes
4. WHEN a user views the Account tab, THE System SHALL display fields: email, phone, and password change form
5. WHEN a user changes their password, THE System SHALL validate current password, new password (8-128 chars), and confirmation, then hash with bcrypt (>=12 rounds)
6. WHEN a user views the Security tab, THE System SHALL display two-factor authentication toggle
7. WHEN a user enables 2FA, THE System SHALL generate a QR code and backup codes
8. WHEN a user disables 2FA, THE System SHALL require password confirmation
9. THE System SHALL display success toast notifications for all settings updates
10. THE System SHALL persist theme preference in Redux with redux-persist

### Requirement 34: Constraints and Engineering Rules

**User Story:** As a developer, I want clear engineering constraints and rules, so that I implement the system correctly and consistently.

#### Acceptance Criteria

1. THE System SHALL use soft delete only (no hard deletes) across the entire system
2. THE System SHALL NOT use test frameworks (Jest, Mocha, Chai, Supertest, Vitest, Cypress are forbidden)
3. THE System SHALL NOT use React Hook Form watch() to avoid performance issues
4. THE System SHALL NOT use deprecated MUI syntax (item prop, renderTags)
5. THE System SHALL use native Intl.DateTimeFormat for all user-facing date formatting (dayjs only for internal computations and date-picker adapters)
6. THE System SHALL NOT create organizations via direct API endpoint (only via registration flow or backend seeding)
7. THE System SHALL NOT include a terms acceptance checkbox in registration
8. THE System SHALL use Ethiopian phone format only: /^(\+251\d{9}|0\d{9})$/
9. THE System SHALL use ES modules (type: "module") for both backend and frontend
10. THE System SHALL use identical JWT secrets for HTTP and Socket.IO authentication
11. THE System SHALL store all dates in UTC and convert to user timezone for display
12. THE System SHALL use select:false for sensitive fields (password, refreshToken, passwordResetToken, etc.)
13. THE System SHALL use compound unique indexes for multi-tenancy (e.g., organization + email for users)
14. THE System SHALL use TTL index for notification expiration (expiresAt field)
15. THE System SHALL use text indexes for search functionality (title, description fields)

### Requirement 35: Canonical Design Decisions

**User Story:** As a system architect, I want a complete and unambiguous record of all canonical design decisions, so that the implementation matches the intended behavior and no conflicts remain.

#### Acceptance Criteria

1. THE System SHALL use canonical breakpoints: xs 0-599, sm 600-899, md 900-1199, lg 1200-1535, xl 1536+
2. WHEN a user accesses the system on xs screens (width < 600), THE System SHALL display a bottom navigation bar with exactly 4 items: Dashboard, Tasks, Users, Profile; the Profile item SHALL open a menu with additional navigation (Departments, Materials, Vendors)
3. THE System SHALL enforce TaskComment thread maximum depth of 5 (depth 0-5) via validators and UI
4. THE System SHALL support the union of all filters for task lists: status, priority, type, created date range, due date range, department, assignment, tags, deleted toggle, and resource-specific filters
5. THE System SHALL use the authorization matrix (Section 8.4 of PRD) as the single source of truth for all permission decisions
6. THE System SHALL validate all phone numbers (Organization, User, Vendor) against regex: /^(\+251\d{9}|0\d{9})$/
7. THE System SHALL NOT include a terms acceptance checkbox in the registration flow
8. WHEN a customer organization completes registration, THE System SHALL require email verification before login; users created by organization SuperAdmin SHALL be auto-verified
9. WHEN an HOD user accesses the sidebar, THE System SHALL display a department selector in the sidebar only (not in Department Details header)
10. THE System SHALL use "Tasks" as the sidebar navigation label (not "My Tasks")
11. THE System SHALL display User Details page with exactly four tabs: Overview, Tasks, Activity, Performance
12. WHEN a 403 error occurs on the frontend, THE System SHALL display a toast notification only (no dedicated 403 page)
13. THE System SHALL map API enums to UI display labels: TODO→"To Do", IN_PROGRESS→"In Progress", PENDING→"In Review", COMPLETED→"Completed", URGENT→"Critical"
14. THE System SHALL use Intl.DateTimeFormat for all user-facing date formatting (dayjs only for internal computations and date-picker adapters)
15. WHEN a resource (Material, Vendor) is associated with other data, THE System SHALL prevent deletion and return 409 CONFLICT_ERROR with message suggesting status=INACTIVE
16. THE System SHALL enforce immutable fields for Admin/Manager/User targets: department, role, employeeId, joinedAt, isHod
17. WHEN a dialog is displayed on xs screens (width <= 600), THE System SHALL render it as full-height (100vh) with required MUI props
18. THE System SHALL display Department Details with exactly three top-level tabs: Overview, Members, Tasks; Activity SHALL be a secondary sub-tab inside Tasks labeled "All Activity"
19. THE System SHALL implement Material as department-scoped inventory with SKU (unique per dept), status (ACTIVE/INACTIVE), inventory.stockOnHand, inventory.lowStockThreshold, and inventory.lastRestockedAt
20. THE System SHALL implement Vendor as organization-scoped with email, phone, optional website, optional location, status (ACTIVE/INACTIVE), optional isVerifiedPartner, optional rating (1-5, 0.5 increments)
21. THE System SHALL NOT support Attachments for Material; Attachment parentModel enum SHALL NOT include Material
22. THE System SHALL implement Department with status enum ACTIVE/INACTIVE; INACTIVE departments SHALL block creation of new users/tasks/materials (409 CONFLICT_ERROR)
23. THE System SHALL use "Grid view" to mean MuiDataGrid (tabular) and "List view" to mean MUI Cards in responsive Grid layout
24. THE System SHALL NOT include the product logo in DashboardLayout header; logo SHALL appear only in sidebar header
25. THE System SHALL use "Log In" (outlined) and "Sign Up" (contained) as PublicLayout header CTA buttons
26. THE System SHALL enforce Department description max length of 500 characters
27. THE System SHALL validate Attachment fileUrl against Cloudinary pattern allowing image, video, raw resource types with version segment; allowed extensions: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3

### Requirement 36: Public Pages and Authentication UI

**User Story:** As an unauthenticated visitor, I want to access a polished landing page and complete registration, login, and password recovery flows, so that I can sign up and use the system.

#### Acceptance Criteria

1. WHEN a user accesses the landing page, THE System SHALL display a hero section with headline, subheadline, announcement pill ("V2.0 IS NOW LIVE"), CTA buttons ("Start Free Trial", "Watch Demo"), and trust row
2. WHEN a user views the landing page, THE System SHALL display a features section with 6 cards: Task Management, Real-time Collaboration, Department Organization, Progress Tracking, Vendor Management, Detailed Analytics
3. WHEN a user views the landing page, THE System SHALL display a "How It Works" stepper with 4 steps: Create Organization, Set up Departments, Assign Tasks, Track Progress (horizontal desktop, vertical mobile)
4. WHEN a user views the landing page, THE System SHALL display a CTA section and footer with product, company, legal columns and "System Operational" status
5. WHEN a user accesses the registration page, THE System SHALL display a 4-step wizard: Organization, Department, Account, Review & Submit with fields and validations as defined in PRD Section 10.2
6. WHEN a user submits registration, THE System SHALL create organization, department, and user in unverified state, send email verification, and transition UI to verification-pending state
7. WHEN email verification succeeds, THE System SHALL mark user and organization as verified, send one-time welcome email, and redirect to login after 3 seconds
8. WHEN a user accesses the login page, THE System SHALL display email, password with toggle, "Remember me" checkbox, "Forgot password?" link, and "Sign In" button
9. WHEN login succeeds, THE System SHALL redirect to dashboard and set HttpOnly cookies with access/refresh tokens
10. WHEN a user requests password reset, THE System SHALL display "Check Your Email" success state
11. WHEN a user accesses reset password with valid token, THE System SHALL display new password, confirm password, and strength indicator
12. THE System SHALL follow responsive rules for all public pages: xs (single column), sm+ (multi-column as appropriate)

### Requirement 37: Dashboard Detailed Requirements

**User Story:** As a user, I want a comprehensive, filterable dashboard with real-time widgets and role-specific KPIs, so that I can quickly assess the state of my work and organization.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard, THE System SHALL display a welcome message with user's name and current date
2. WHEN an org-wide role (SuperAdmin, Admin) views the dashboard, THE System SHALL display Organization Tasks (total, active, completed, overdue, delta) and Organization Users (total, online, offline, admins, delta)
3. WHEN a department/personal role (Manager, User) views the dashboard, THE System SHALL display My Tasks, Department Tasks, Overdue, Completed This Week
4. WHEN a user clicks a KPI card, THE System SHALL navigate to the corresponding filtered list page
5. WHEN a user views dashboard charts, THE System SHALL render using MUI X Charts with theme tokens: status distribution (pie), priority breakdown (bar), timeline (line)
6. WHEN a user clicks a status slice or priority bar, THE System SHALL navigate to Tasks page with that filter applied
7. WHEN an org-wide role views the dashboard, THE System SHALL display Department Performance section with cards per department showing completion % and status
8. WHEN a user views the dashboard, THE System SHALL display Recent Activity Feed (last 10 items, real-time)
9. WHEN a user views the dashboard, THE System SHALL display Upcoming Deadlines table (MuiDataGrid) with tasks due in next 7 days
10. WHEN an org-wide role views the dashboard, THE System SHALL display Projects Overview widget (ProjectTask rollups), Materials Usage widget (stock health), and Vendor Performance widget (on-time delivery %, active contracts, average rating)
11. WHEN a Manager or Admin views the dashboard, THE System SHALL display Team Performance widget with active tasks, completed this week, average completion time, workload indicator
12. WHEN a user applies filters (date range, departmentId, status, priority, taskType), THE System SHALL update all dashboard widgets to reflect filtered data
13. WHEN a user clicks Export button, THE System SHALL export filtered dashboard snapshot as PDF using jspdf + jspdf-autotable with applied filters, timestamp, and widget tables
14. WHEN a user clicks Refresh button, THE System SHALL trigger manual cache bust and reload all dashboard data
15. THE System SHALL fetch dashboard data from GET /api/dashboard/overview and cache with RTK Query

### Requirement 38: Vendors List and Detail Pages

**User Story:** As an administrator, I want to manage vendors with full CRUD, filtering, and performance metrics, so that I can track external partners effectively.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/vendors, THE System SHALL display a MuiDataGrid with columns: Vendor Name, Contact Info (email+phone), Rating (stars), Projects (active/total), Actions (View/Edit/Delete/Restore)
2. WHEN a user types in the search field, THE System SHALL filter vendors by name, email, or phone with debounce (>=3 characters)
3. WHEN a user clicks the filter button, THE System SHALL display a filter dialog with status, rating range, verified partner, and include deleted toggle
4. WHEN a user attempts to delete a vendor, THE System SHALL check for associations with ProjectTasks (including soft-deleted) using .withDeleted()
5. IF a vendor is associated with any ProjectTasks, THE System SHALL return 409 CONFLICT_ERROR with message suggesting status=INACTIVE
6. WHEN a soft-deleted vendor is displayed, THE System SHALL show a "Restore" button instead of "Delete"
7. WHEN a user navigates to /dashboard/vendors/:vendorId, THE System SHALL display header with name, rating stars, rating count, verified partner badge, contact info, and actions (Edit, Contact Vendor)
8. WHEN a user views Vendor details, THE System SHALL display performance metrics cards: Active Projects, Avg. Duration, Total Spend (this fiscal quarter) with trend pills
9. WHEN a user views Vendor details, THE System SHALL display projects list (ProjectTasks) with search/filter and columns: Project Name, Start Date, Due Date, Status, Actions
10. WHEN a user clicks "Contact Vendor", THE System SHALL open a dialog to compose an email and send via backend email service (role-gated)
11. THE System SHALL support pagination (20 per page default), sorting, and row selection for bulk export

### Requirement 39: Materials List and Detail Pages

**User Story:** As a department manager, I want to manage material inventory with full CRUD, usage tracking, and restocking, so that I can prevent stockouts and monitor costs.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/materials, THE System SHALL display a MuiDataGrid with columns: Name + SKU, Category (colored chip), Unit, Unit Price, Created By, Actions
2. WHEN a user views the materials grid, THE System SHALL provide optional columns: Stock On Hand, Low Stock, Created Date, Usage Count
3. WHEN a user types in the search field, THE System SHALL filter materials by name, SKU, or category
4. WHEN a user clicks the filter button, THE System SHALL display a filter dialog with category, status, low-stock toggle, date range, and include deleted
5. WHEN a user creates or edits a material, THE System SHALL validate name, SKU (unique per department), unit, category, unit price, initial stock, low stock threshold, status
6. WHEN a user attempts to delete a material, THE System SHALL check for associations with RoutineTask.materials or TaskActivity.materials (including soft-deleted) using .withDeleted()
7. IF a material is associated with any tasks, THE System SHALL return 409 CONFLICT_ERROR with message suggesting status=INACTIVE
8. WHEN a user navigates to /dashboard/materials/:materialId, THE System SHALL display header with category icon, name, status chip, SKU, unit, unit price, and actions (Edit, Restock)
9. WHEN a user views Material details, THE System SHALL display KPI cards: Total Usage (quantity), Associated Tasks, Usage Rate
10. WHEN a user views Material details, THE System SHALL display Usage History table with Task Name, Task Type, Date Used, Quantity, Task Status, Cost (Qty × Unit Price)
11. WHEN a user clicks Restock action, THE System SHALL open a dialog to add quantity; upon submission increment inventory.stockOnHand atomically and update lastRestockedAt
12. THE System SHALL NOT support Attachments for Material

### Requirement 40: Users List and Detail Pages (Enhanced)

**User Story:** As an administrator, I want a feature-rich user management interface with advanced filtering, creation flows, and performance analytics.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/users, THE System SHALL support both Grid view (MuiDataGrid) and List view (cards)
2. WHEN Grid view is selected, THE System SHALL display columns: User (avatar + name + email), Position, Role (colored badge), Department, Joined Date, Status, Actions
3. WHEN a user clicks the filter button, THE System SHALL display a filter dialog with Department (multi-select), Role, Joined At date range, Include deleted
4. WHEN a user creates a new user, THE System SHALL follow the flow: Personal Info, Role & Department, Profile Details (skills, profile picture)
5. WHEN a user is created successfully, THE System SHALL auto-verify the user, generate temporary password, send welcome email with password setup link, and set welcomeEmailSentAt
6. WHEN a user attempts to update immutable fields (department, role, employeeId, joinedAt, isHod) for Admin/Manager/User targets, THE System SHALL reject with 409 CONFLICT_ERROR
7. WHEN a user navigates to /dashboard/users/:userId, THE System SHALL display tabs: Overview, Tasks, Activity, Performance
8. WHEN a user views Overview tab, THE System SHALL display profile header, personal info card, task stats, skills with proficiency bars, recent activity list
9. WHEN a user views Tasks tab, THE System SHALL display sub-tabs: Assigned, Created, Watching with search/filter and task table
10. WHEN a user views Activity tab, THE System SHALL display timeline with filter dropdown for comments, completions, uploads, status changes
11. WHEN a Manager or Admin views Performance tab, THE System SHALL display KPIs (completion rate, avg task time, tasks completed), monthly throughput chart, efficiency radar, recent performance reviews

### Requirement 41: Departments List and Detail Pages (Enhanced)

**User Story:** As a manager, I want comprehensive department management with status control, member oversight, and a real-time activity feed.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/departments, THE System SHALL display Grid view with columns: Name (icon + dept ID), Description, Manager, Users (avatar stack), Tasks (count pill + status), Created Date, Actions
2. WHEN a user clicks the filter button, THE System SHALL display a filter dialog with Department Name search, Status (Active/Inactive), Head of Department, Member Count range, Date Added, Organization (Platform SuperAdmin only), Include deleted
3. WHEN a user creates or edits a department, THE System SHALL validate Name, Description (max 500), optional Manager
4. WHEN a department status is set to INACTIVE, THE System SHALL block creation of new users/tasks/materials under that department (409 CONFLICT_ERROR)
5. WHEN a user navigates to /dashboard/departments/:departmentId, THE System SHALL display tabs: Overview, Members, Tasks
6. WHEN a user views Overview tab, THE System SHALL display KPI cards (Tasks in Progress, Overdue, Team Velocity, Efficiency), Weekly Task Completion chart, Active Members list, Recent Activity table
7. WHEN a user views Members tab, THE System SHALL display user list scoped to department with search, filter, and add user button (role-gated)
8. WHEN a user views Tasks tab, THE System SHALL display summary cards, task list with filters, and "All Activity" sub-tab
9. WHEN a user views "All Activity" sub-tab, THE System SHALL display chronological feed of department events (tasks, activities, comments, files) filterable by entity type
10. THE System SHALL display department selector in the sidebar (HOD only), NOT in the department details header

### Requirement 42: Tasks List and Detail Pages (Enhanced)

**User Story:** As a user, I want a powerful task management interface with multiple views, advanced filters, and rich task details.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/tasks, THE System SHALL display tabs: All Tasks, Assigned to Me, Completed
2. WHEN a user views the tasks page, THE System SHALL provide view toggle between Grid view (MuiDataGrid) and List view (cards)
3. WHEN Grid view is selected, THE System SHALL display columns: Title, Type, Status, Priority, Assignees, Due Date, Actions
4. WHEN a user clicks the filter button, THE System SHALL display a filter dialog supporting union of all filters: status, priority, type, date ranges, department, assignment, tags, include deleted
5. WHEN a user applies filters, THE System SHALL display active filter chips with "Clear All" option
6. WHEN a user creates a task, THE System SHALL display a dynamic dialog based on task type (Project, Assigned, Routine) with appropriate fields and validation
7. WHEN a user creates a RoutineTask with materials, THE System SHALL show stock on hand, quantity required, and cost preview; backend SHALL enforce inventory rule
8. WHEN a soft-deleted task is displayed, THE System SHALL show a "Restore" button instead of "Delete"
9. WHEN a user navigates to /dashboard/tasks/:taskId, THE System SHALL display tabs: Overview, Activities, Comments, Attachments
10. WHEN a user views Overview tab, THE System SHALL display title, chips, description, dates, assignees/watchers, vendor (ProjectTask), tags, required materials table (RoutineTask)
11. WHEN a user views Activities tab (ProjectTask/AssignedTask only), THE System SHALL display timeline of TaskActivity entries with search and "Add Note"
12. WHEN a user views Comments tab, THE System SHALL display threaded comments (max depth 5) with rich text editor, @mention detection, reply, edit, delete, attachments
13. WHEN a user views Attachments tab, THE System SHALL display upload dropzone with file type/size validation, gallery view, preview, download
14. WHEN a ProjectTask is created, THE System SHALL auto-add creator as watcher; any active user in same org+dept can be added as watcher

### Requirement 43: Comprehensive Authorization Matrix

**User Story:** As a system architect, I want the complete authorization matrix enforced as the single source of truth, so that every operation is correctly gated by role, scope, and ownership.

#### Acceptance Criteria

1. THE System SHALL implement the exact authorization matrix defined in PRD Section 8.4 covering all resources: Organization, Department, User, Task (and subtypes), TaskActivity, TaskComment, Material, Vendor, Attachment, Notification
2. WHEN evaluating permissions, THE System SHALL allow if ANY rule passes based on roles, requires predicates, scope, ownership, and resourceType
3. WHEN a request is made, THE System SHALL use authorization middleware to check permissions before every controller operation
4. WHEN rendering UI, THE System SHALL use useAuthorization hook and authorizationHelper to hide/disable elements according to the matrix
5. THE System SHALL treat the authorization matrix as immutable; any changes SHALL be reviewed and updated in source code

### Requirement 44: Data Models and Validation Rules (Complete)

**User Story:** As a developer, I need a complete and precise specification of all data models, fields, validation rules, indexes, and TTL policies to ensure database integrity.

#### Acceptance Criteria

1. THE System SHALL implement all models exactly as defined in PRD Section 7: Organization, Department, User, Task (base), ProjectTask, AssignedTask, RoutineTask, TaskActivity, TaskComment, Material, Vendor, Attachment, Notification
2. WHEN defining models, THE System SHALL follow each field's type, required status, default value, enum options, regex pattern, min/max, uniqueness constraints, and scoping rules
3. THE System SHALL set select:false for sensitive fields: password, refreshToken, passwordResetToken, emailVerificationToken, and any other sensitive fields
4. WHEN performing write operations, THE System SHALL use MongoDB sessions (transactions) to maintain atomicity
5. THE System SHALL apply TTL expiry periods: Department/User (365 days), Task/TaskComment (180 days), TaskActivity (90 days), Material/Vendor (90 days), Notification/Attachment (30 days), Organization (never/manual only)
6. THE System SHALL enforce validation on both backend (express-validator) and frontend (React Hook Form) with identical rules using shared constants module

### Requirement 45: API Contract and Endpoints

**User Story:** As a frontend developer, I need a complete, canonical API contract so that I can integrate with the backend correctly and reliably.

#### Acceptance Criteria

1. THE System SHALL implement all endpoints listed in PRD Section 18: Authentication (/api/auth/_), Users (/api/users/_), Departments (/api/departments/_), Tasks/Activities/Comments (/api/tasks/_), Materials (/api/materials/_), Vendors (/api/vendors/_), Notifications (/api/notifications/_), Dashboard (/api/dashboard/_), Attachments (/api/attachments/\*)
2. WHEN handling list endpoints, THE System SHALL follow canonical query conventions: page, limit, sortBy, sortOrder, search, includeDeleted
3. WHEN handling multi-select filters, THE System SHALL accept comma-separated values in a single query parameter
4. WHEN Platform SuperAdmin passes organizationId, THE System SHALL allow it; when non-platform users pass it, THE System SHALL return 400
5. THE System SHALL adhere to canonical success/error/paginated response formats defined in PRD Section 18
6. THE System SHALL implement authentication flow (register, verify-email, resend-verification, login, refresh, logout, forgot-password, reset-password, change-password) following exact contracts in Section 18.2
7. THE System SHALL document all endpoints with JSDoc (TypeScript-compatible) in the codebase

### Requirement 46: Testing and QA Requirements

**User Story:** As a quality assurance engineer, I need a rigorous testing strategy that validates business logic, validators, controllers, and multi-tenant isolation without using testing frameworks.

#### Acceptance Criteria

1. THE System SHALL write all tests as plain JavaScript scripts that execute real application code (no Jest, Mocha, Vitest, Cypress, etc.)
2. WHEN testing validators, THE System SHALL directly invoke validators via .run(req) and assert results with validationResult(req)
3. WHEN testing controllers, THE System SHALL invoke as plain functions with fully constructed req.user and req.validated objects
4. THE System SHALL verify: validation rules (required, format, uniqueness, existence with .withDeleted()), authorization/ownership/scoping, soft delete/restore/cascade behavior using DB sessions, multi-tenant isolation, platform org immutability, association checks before deletion
5. THE System SHALL name test scripts by resource and action (e.g., task-create.js) and run independently
6. THE System SHALL NOT alter the platform organization in any test

### Requirement 47: Engineering Constraints and Implementation Rules (Detailed)

**User Story:** As a developer, I need a complete set of engineering constraints and coding standards to ensure consistency, security, and maintainability.

#### Acceptance Criteria

1. THE System SHALL use express-async-handler for all controllers
2. WHEN implementing controllers, THE System SHALL read actor/context only from req.user and request data only from req.validated.body, req.validated.params, req.validated.query
3. WHEN implementing write controllers, THE System SHALL start a MongoDB session, wrap operations in try/catch/finally, commit on success, abort on failure, and end the session
4. THE System SHALL use custom soft delete plugin for all models; native Mongoose delete methods SHALL NOT be used
5. THE System SHALL document every exported function with strict JSDoc including TypeScript-compatible types, input types, return types, and thrown errors
6. THE System SHALL import all magic strings, enums, regex patterns from shared constants module (backend source of truth; frontend mirrors exactly)
7. WHEN implementing frontend search, THE System SHALL use refs/memos for debouncing, not state, to avoid re-renders
8. WHEN implementing RTK Query endpoints, THE System SHALL transform both success and error responses (transformResponse, transformErrorResponse)
9. WHEN implementing page containers, THE System SHALL follow fetch → loading → error/success pipeline
10. WHEN implementing mobile dialogs (width <= 600), THE System SHALL use full-height (100vh) with required MUI props and sx block
11. THE System SHALL use size="small" for all MUI size props
12. THE System SHALL use tree-shakable MUI imports only; no deprecated v5/v6 syntax
13. THE System SHALL end any overflowing text with ellipsis
14. THE System SHALL implement cascade delete operations as defined in PRD Section 20 for all resources
15. THE System SHALL store dates in UTC using dayjs with UTC plugin; frontend SHALL use Intl.DateTimeFormat for user-facing formatting

### Requirement 48: Task Execution Protocol (7 Steps)

**User Story:** As a developer, I must follow a strict, repeatable task execution protocol to ensure clean Git history, consistency, and no regressions.

#### Acceptance Criteria

1. WHEN starting any task, THE System SHALL perform Step 1 (Pre-Git): check current state, handle uncommitted changes, sync with remote, create descriptive feature branch
2. WHEN analyzing codebase, THE System SHALL perform Step 2 (Comprehensive Codebase Analysis): deeply analyze all relevant backend and frontend files to understand existing patterns
3. WHEN reviewing previous work, THE System SHALL perform Step 3 (Analysis of Previously Implemented Tasks): review tasks N-1 to ensure consistency in patterns, naming, validation, dependencies
4. WHEN implementing, THE System SHALL perform Step 4 (Task Execution Without Deviation): adhere exactly to PRD, use existing patterns, follow mandatory compliance documents
5. WHEN testing backend, THE System SHALL perform Step 5 (Backend Testing): execute validator/controller test scripts; if any test fails, halt and fix
6. WHEN presenting work, THE System SHALL perform Step 6 (User Review and Feedback Integration): present implementation to user, incorporate feedback, obtain explicit approval
7. WHEN completing task, THE System SHALL perform Step 7 (Post-Git): stage, commit (conventional format), push feature branch, merge into main, push merged changes, delete feature branch locally and remotely, verify synchronization
8. THE System SHALL complete all seven steps in order for every task with no shortcuts

### Requirement 49: Phased Delivery Plan

**User Story:** As a project manager, I need a clear, incremental delivery plan that ensures backend readiness before frontend work and surfaces integration issues early.

#### Acceptance Criteria

1. THE System SHALL follow the 8-phase plan defined in PRD Section 22: Phase 0 (Deep project understanding), Phase 1 (Core foundations - backend only), Phase 2 (Authentication and basic security - backend → frontend), Phase 3 (Cross-cutting services and middleware - backend only), Phase 4 (Organization-level CRUD - backend → frontend), Phase 5 (Task domain - backend → frontend), Phase 6 (Materials, vendors, notifications - backend → frontend), Phase 7 (Dashboard and authorization finalization - backend → frontend), Phase 8 (Integration, polish, handoff)
2. WHEN starting from Phase 1, THE System SHALL run backend and frontend development servers concurrently to detect integration issues early
3. WHEN implementing a feature, THE System SHALL start frontend work only after corresponding backend API is validated
4. WHEN completing each phase/sub-task, THE System SHALL update previously built components for integration correctness

### Requirement 50: Acceptance Criteria and Traceability Checklist

**User Story:** As a quality assurance lead, I need a definitive checklist to verify that every requirement and canonical decision has been correctly implemented before marking a task as done.

#### Acceptance Criteria

1. THE System SHALL maintain a traceability checklist (as defined in PRD Section 23) that MUST be fully satisfied for a task to be considered complete
2. THE System SHALL verify all Canonical Decisions (CAN-\*) are implemented
3. THE System SHALL verify all Required UI Screens (by reference name) for desktop structure (matching reference images) and tablet/mobile behavior (per PRD specs)
4. THE System SHALL verify API Coverage: every UI data dependency has corresponding endpoint; all endpoints follow contract
5. THE System SHALL verify Data Models and Validation: all models implemented exactly with session support, soft delete, association checks
6. THE System SHALL verify Engineering Constraints: controller patterns, JSDoc, constants, frontend constraints, cascade delete
7. THE System SHALL verify Frontend UX & Error Handling: page rendering pipeline, 401/403 behavior, mobile dialogs, ellipsis
8. THE System SHALL verify Process: Task Execution Protocol followed, phases respected
9. THE System SHALL NOT merge any task without checklist verification

### Requirement 51: Real-Time Updates and Notifications (Detailed)

**User Story:** As a user, I want reliable, real-time updates for tasks, activities, comments, and notifications delivered via Socket.IO with proper room management and reconnection logic.

#### Acceptance Criteria

1. THE System SHALL use Socket.IO for all real-time updates with JWT authentication required for socket connections
2. WHEN a user connects, THE System SHALL join rooms: user:{userId}, org:{orgId}, dept:{deptId}
3. WHEN a task is created/updated/deleted, THE System SHALL emit events to org and dept rooms (and task:{taskId} for updates/deletes)
4. WHEN a TaskActivity is added, THE System SHALL emit task:activity:added to task room
5. WHEN a TaskComment is added, THE System SHALL emit task:comment:added to task room
6. WHEN a notification is created, THE System SHALL emit notification to recipient's user:{userId} room
7. WHEN a user status changes, THE System SHALL emit user:status:changed to org room
8. WHEN the frontend receives Socket.IO events, THE System SHALL route events to RTK Query cache invalidation and update Redux state via socketService
9. WHEN a Socket.IO connection is lost, THE System SHALL automatically reconnect with exponential backoff and show connection status indicator when disconnected
10. WHEN a user logs out, THE System SHALL close socket connection and leave all rooms

### Requirement 52: File Upload Flow and Storage

**User Story:** As a user, I want to upload files securely, with client-side validation and direct Cloudinary upload, so that attachments are reliable and performant.

#### Acceptance Criteria

1. WHEN a user selects files, THE System SHALL use react-dropzone for file selection
2. WHEN a file is selected, THE System SHALL validate file size (<=10MB) and file extension against canonical allowlist
3. WHEN validation passes, THE System SHALL upload file directly to Cloudinary using appropriate resource type (image, video, or raw)
4. WHEN Cloudinary returns URL (with version segment), THE System SHALL send URL and metadata to POST /api/attachments
5. WHEN creating Attachment, THE System SHALL create record with exact parent (Task/TaskActivity/TaskComment) and enforce scoping
6. WHEN displaying Attachments, THE System SHALL use URLs for preview/download without additional Cloudinary transformation at MVP
7. THE System SHALL NOT support Attachments for Material

### Requirement 53: Error Handling and Feedback (Detailed)

**User Story:** As a user, I want consistent, clear error feedback with appropriate HTTP status codes and frontend handling.

#### Acceptance Criteria

1. THE System SHALL return errors using canonical error shape with codes: 401 (UNAUTHENTICATED_ERROR), 403 (UNAUTHORIZED_ERROR), 404 (NOT_FOUND_ERROR), 400 (VALIDATION_ERROR), 409 (CONFLICT_ERROR), 429 (RATE_LIMITED_ERROR), 500 (INTERNAL_ERROR)
2. WHEN a 401 error occurs, THE System SHALL attempt token refresh; if refresh fails, logout
3. WHEN a 403 error occurs, THE System SHALL show toast only, NOT logout, NOT render a Forbidden page
4. WHEN a 4xx/5xx error occurs, THE System SHALL show error message and retry button where applicable
5. THE System SHALL use root-level ErrorBoundary, route-level RouteError, and component-level fallback UI
6. THE System SHALL use react-toastify for all toasts with auto-dismiss after 5 seconds
7. WHEN loading, THE System SHALL use skeleton screens, MuiDataGrid loading prop, and circular spinners

### Requirement 54: Performance and Optimization (Detailed)

**User Story:** As a user, I expect fast page loads and smooth interactions, even on slower networks.

#### Acceptance Criteria

1. THE System SHALL lazy-load all page components with React.lazy
2. THE System SHALL dynamically import heavy components (charts, data grids)
3. THE System SHALL wrap expensive components with React.memo, handlers with useCallback, computed values with useMemo
4. THE System SHALL use RTK Query caching with appropriate tag invalidation; cache tags SHALL be invalidated on Socket.IO events
5. THE System SHALL debounce search inputs (300ms minimum) using refs/memos to avoid re-renders
6. THE System SHALL use pagination for all lists (default 20 per page); virtual scrolling SHALL be considered for very long lists
7. THE System SHALL optimize images; Cloudinary transformations SHALL be used where appropriate
8. THE System SHALL ensure initial page load <3 seconds on 3G; Core Web Vitals SHALL be optimized

### Requirement 55: Security Requirements (Detailed)

**User Story:** As a security officer, I want robust authentication, token rotation, rate limiting, and data sanitization to protect the system.

#### Acceptance Criteria

1. THE System SHALL use identical JWT secrets for HTTP and Socket.IO
2. THE System SHALL set access token expiry to 15 minutes and refresh token expiry to 7 days with refresh token rotation on each refresh
3. THE System SHALL store tokens in HttpOnly, Secure, SameSite=Strict cookies
4. THE System SHALL enable CSRF protection
5. THE System SHALL hash passwords with bcrypt using >=12 salt rounds
6. THE System SHALL apply rate limiting to all endpoints using express-rate-limit
7. THE System SHALL enable CORS with credentials for cookie-based auth
8. THE System SHALL include Cloudinary CDN in Helmet CSP
9. THE System SHALL sanitize all inputs with express-mongo-sanitize
10. THE System SHALL set select:false for sensitive fields

### Requirement 56: Responsive Behavior and Breakpoints (Detailed)

**User Story:** As a user, I expect the UI to adapt seamlessly across all device sizes according to the canonical breakpoints.

#### Acceptance Criteria

1. THE System SHALL apply breakpoints as per CAN-001: xs 0-599, sm 600-899, md 900-1199, lg 1200-1535, xl 1536+
2. WHEN viewing on xs/sm screens, THE System SHALL display sidebar as hidden/temporary drawer
3. WHEN viewing on md+ screens, THE System SHALL display sidebar as permanent
4. WHEN viewing on xs screens, THE System SHALL display bottom navigation; on sm+ SHALL hide it
5. WHEN viewing MuiDataGrid on xs/sm, THE System SHALL hide less important columns and provide column visibility controls
6. THE System SHALL ensure touch targets on mobile are minimum 44×44px
7. THE System SHALL test all pages on xs, sm, md, lg, xl viewports

### Requirement 57: Accessibility and Micro-Interactions (Detailed)

**User Story:** As a user with disabilities, I want a fully keyboard-navigable, screen-reader-friendly interface with visible focus and sufficient contrast.

#### Acceptance Criteria

1. THE System SHALL support full keyboard navigation: Tab, Shift+Tab, Enter, Escape, Arrow keys
2. THE System SHALL display visible focus indicators (outline or ring) for all interactive elements
3. THE System SHALL provide ARIA labels, roles, states for dynamic content; screen-reader text for icon-only buttons
4. THE System SHALL provide alt text for all images
5. THE System SHALL ensure color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
6. THE System SHALL provide skip links for keyboard users
7. THE System SHALL trap focus in modals and return focus on close
8. THE System SHALL associate form fields with labels using htmlFor
9. THE System SHALL implement micro-interactions: button hover opacity, card hover elevation increase, page transition fade, notifications slide-in with progress bar

### Requirement 58: Form Validation (Detailed)

**User Story:** As a user, I want immediate, consistent validation feedback on forms.

#### Acceptance Criteria

1. THE System SHALL match frontend validation with backend validator rules exactly (field patterns, lengths, required, date ranges, etc.)
2. THE System SHALL perform validation in real-time (on blur or change) and on submit
3. WHEN validation fails, THE System SHALL display error messages below the field with field highlighted
4. THE System SHALL use react-hook-form with Controller for all forms
5. THE System SHALL NOT use watch() for performance reasons
6. THE System SHALL use @mui/x-date-pickers with dayjs adapter (internal use only; user-facing formatting uses Intl)

### Requirement 59: Loading and Error Feedback (Detailed)

**User Story:** As a user, I want clear visual feedback during loading and informative error states.

#### Acceptance Criteria

1. WHEN data is being fetched, THE System SHALL display skeleton screens matching expected layout
2. WHEN MuiDataGrid is loading, THE System SHALL support the loading prop
3. WHEN no data is found, THE System SHALL display empty state with appropriate message and action button (e.g., "No tasks found. Create Task")
4. WHEN API errors occur, THE System SHALL display toast with error message and "Retry" button for recoverable errors
5. WHEN 404 occurs, THE System SHALL display 404 page with "Go Back" or "Home" button

### Requirement 60: Authorization and Access Control (Detailed)

**User Story:** As a developer, I need detailed SHALL statements for authorization checks in the UI and API.

#### Acceptance Criteria

1. THE System SHALL enforce authorization checks on all protected pages based on the matrix
2. THE System SHALL conditionally render or disable buttons for create, edit, delete, restore based on user permissions
3. THE System SHALL limit Platform SuperAdmin cross-org read access to operations explicitly allowed in the matrix
4. THE System SHALL apply ownership checks (createdBy, assignees, watchers, uploadedBy, etc.) for "own" permissions
5. THE System SHALL enforce department scope (ownDept) for department-level resources

### Requirement 61: Layout and Navigation (Detailed)

**User Story:** As a user, I want a consistent, predictable layout across the application.

#### Acceptance Criteria

1. THE System SHALL implement PublicLayout with fixed header containing logo, nav links (desktop), mobile menu drawer, and CTA buttons
2. THE System SHALL implement DashboardLayout with header containing page title, search, theme toggle, notifications, user avatar; sidebar with navigation sections and department selector (HOD only)
3. WHEN viewing on xs/sm, THE System SHALL display sidebar as temporary drawer
4. WHEN viewing on md+, THE System SHALL display sidebar as permanent
5. THE System SHALL implement bottom navigation exactly as defined in CAN-002 and hide on sm+
6. THE System SHALL ensure content area has proper spacing, overflow handling, and responsive padding

### Requirement 62: Multi-Tenant Rules (Detailed)

**User Story:** As a system administrator, I want clear, enforceable rules distinguishing platform and customer organizations.

#### Acceptance Criteria

1. THE System SHALL create platform organization (isPlatformOrg:true) ONLY via backend seeding; it SHALL be immutable (cannot be deleted)
2. THE System SHALL create customer organization (isPlatformOrg:false) ONLY via frontend 4-step registration wizard; no standalone API endpoint
3. THE System SHALL set isPlatformOrgUser:false for all non-platform users and completely isolate them to their own organization
4. THE System SHALL allow Platform SuperAdmin cross-org access ONLY where authorization matrix explicitly allows (read-only by default)
5. WHEN running npm run seed, THE System SHALL create platform organization, platform department, and Platform SuperAdmin user with isHod:true

### Requirement 63: Settings Page (Enhanced)

**User Story:** As a user, I want to manage my profile, account security, notification preferences, and appearance settings.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard/settings, THE System SHALL display tabs: Profile, Account, Notifications, Appearance
2. WHEN a user views Profile tab, THE System SHALL display fields for editing personal info (first name, last name, position, phone), profile picture, skills (chip input), profile completeness card
3. WHEN a user views Account tab, THE System SHALL display fields for changing email (with uniqueness validation), changing password (current password, new password, confirm, strength indicator)
4. WHEN a user views Notifications tab, THE System SHALL display email and in-app event toggles, browser notification permission request
5. WHEN a user views Appearance tab, THE System SHALL display theme (light/dark/system), language, date/time format, timezone
6. WHEN a user updates settings, THE System SHALL persist via PUT /api/users/:userId/preferences and PUT /api/users/:userId/security

### Requirement 64: Phase Boundary Runtime and Database Verification

**User Story:** As a delivery lead, I want enforceable phase-boundary verification gates, so that each implementation phase is closed only after runtime stability and persistence integrity are proven.

#### Acceptance Criteria

1. AT every phase boundary, THE System SHALL require a backend startup verification by executing `cd backend && npm run dev` and recording evidence of successful startup.
2. AT every phase boundary, THE System SHALL require a frontend startup verification by executing `cd client && npm run dev` and recording evidence of successful startup.
3. AT every phase boundary, THE System SHALL require confirmation that no runtime errors were observed in backend logs and browser console for the phase scope.
4. FOR CRUD and restore operations validated within a phase, THE System SHALL require same-database verification steps: capture pre-state, execute operation, and verify persisted post-state reflects the expected change.
5. FOR restore validations, THE System SHALL require verification that deletion-state fields (`isDeleted`, `deletedAt`, `deletedBy`) are reverted correctly in persisted records.
6. THE System SHALL treat unmet runtime or same-database verification checks as a failed phase exit gate.
