# Product Requirements Document (PRD) - Multi-Tenant SaaS MERN Task Manager

Version: 1.0
Date: 2026-02-05
Audience: You are responsible for implementation and validation.

This PRD is the single source of truth for the product requirements.

## 1. Executive Summary and Product Vision

The product is an enterprise-grade, multi-tenant task management system for organizations with hierarchical structures. It enables:

- Organization and department management.
- Role-based user management (SuperAdmin, Admin, Manager, User).
- Three task types with distinct workflows: ProjectTask, AssignedTask, RoutineTask.
- Real-time collaboration via Socket.IO (tasks, activities, comments, notifications).
- Materials and vendor tracking for tasks.
- Rich dashboard analytics and advanced filtering.
- Secure, scalable, and accessible UI across devices.

Architecture overview:

- Backend: Node.js + Express REST API with MongoDB/Mongoose.
- Frontend: React 19 + Redux Toolkit (RTK Query) + Material UI v7.
- Real-time: Socket.IO.
- Authentication: JWT with refresh token rotation (HttpOnly cookies).
- Authorization: RBAC via a canonical authorization matrix.

## 1.1 System Overview and Architecture

System overview:

- Multi-tenant SaaS task manager with hierarchical org -> department -> user structure.
- Three task types with distinct workflows: ProjectTask, AssignedTask, RoutineTask.
- Real-time collaboration with activities, comments, mentions, notifications.
- Materials and vendors management linked to tasks.
- Dashboard analytics with charts, KPIs, and quick actions.

Layered backend architecture:
Request
-> Routes (endpoint definitions)
-> Authentication middleware (JWT verification)
-> Validation middleware (express-validator)
-> Authorization middleware (RBAC checks)
-> Controllers (business logic)
-> Services (external services)
-> Models (data access)
-> MongoDB

Frontend structure:

- Components grouped by domain: auth, columns, common, layout, task, user, department, vendor, material, attachment, notification, dashboard.
- Pages: Home, Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound.
- State management: Redux store and feature slices using RTK Query.
- Hooks: useAuth, useSocket, useAuthorization, useTimezone, useResponsive.
- Services: socket service.
- Utilities: constants, validators, authorization helper, date utils.
- Theme: primitives and customizations.

Key technologies:

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Nodemailer, bcrypt, Winston.
- Frontend: React 19, Redux Toolkit, RTK Query, Redux Persist, Material UI v7, React Hook Form, Socket.IO client, Axios.

Pinned tech stack (runtime + libraries):

Backend (Node.js, ESM modules):

- Package metadata: `name=backend`, `version=1.0.0`, `type=module`, `main=server.js`, `license=ISC`, `author=""`, `description=""`, `keywords=[]`.
- Scripts:
  - `npm run start`: `node server.js`
  - `npm run dev`: `nodemon server.js`
  - `npm run server`: `nodemon server.js`
  - `npm run seed`: `node mock/seed.js`
  - `npm run wipe`: `node mock/wipe.js`
  - `npm run test`: `echo "Error: no test specified" && exit 1`
- Dependencies (exact `package.json` versions):

  | Package                | Version     |
  | ---------------------- | ----------- |
  | bcrypt                 | `^6.0.0`    |
  | compression            | `^1.8.1`    |
  | cookie                 | `^1.1.1`    |
  | cookie-parser          | `^1.4.7`    |
  | cors                   | `^2.8.5`    |
  | dayjs                  | `^1.11.18`  |
  | dotenv                 | `^17.2.3`   |
  | express                | `^4.21.2`   |
  | express-async-handler  | `^1.2.0`    |
  | express-mongo-sanitize | `^2.2.0`    |
  | express-rate-limit     | `^8.1.0`    |
  | express-validator      | `^7.2.1`    |
  | helmet                 | `^8.1.0`    |
  | jsonwebtoken           | `^9.0.2`    |
  | mongoose               | `^8.19.1`   |
  | mongoose-paginate-v2   | `^1.9.1`    |
  | nodemailer             | `^7.0.9`    |
  | socket.io              | `^4.8.1`    |
  | validator              | `^13.15.15` |
  | winston                | `^3.18.3`   |

- Dev dependencies (exact `package.json` versions):

  | Package | Version   |
  | ------- | --------- |
  | morgan  | `^1.10.1` |
  | nodemon | `^3.1.10` |

Frontend (React, Vite, ESM modules):

- Package metadata: `name=client`, `version=0.0.0`, `private=true`, `type=module`.
- Scripts:
  - `npm run dev`: `vite`
  - `npm run build`: `vite build`
  - `npm run preview`: `vite preview`
  - `npm run lint`: `eslint .`
- Dependencies (exact `package.json` versions):

  | Package                    | Version          |
  | -------------------------- | ---------------- |
  | @emotion/react             | `^11.14.0`       |
  | @emotion/styled            | `^11.14.1`       |
  | @fontsource/inter          | `^5.2.8`         |
  | @mui/icons-material        | `^7.3.7`         |
  | @mui/lab                   | `^7.0.1-beta.21` |
  | @mui/material              | `^7.3.7`         |
  | @mui/x-charts              | `^8.27.0`        |
  | @mui/x-data-grid           | `^8.27.0`        |
  | @mui/x-date-pickers        | `^8.27.0`        |
  | @reduxjs/toolkit           | `^2.11.2`        |
  | axios                      | `^1.13.4`        |
  | dayjs                      | `^1.11.19`       |
  | dotenv                     | `^17.2.3`        |
  | jspdf                      | `^4.1.0`         |
  | jspdf-autotable            | `^5.0.7`         |
  | react                      | `^19.2.0`        |
  | react-dom                  | `^19.2.0`        |
  | react-dropzone             | `^14.4.0`        |
  | react-error-boundary       | `^6.1.0`         |
  | react-hook-form            | `^7.71.1`        |
  | react-photo-album          | `^3.4.0`         |
  | react-redux                | `^9.2.0`         |
  | react-router               | `^7.13.0`        |
  | react-toastify             | `^11.0.5`        |
  | redux-persist              | `^6.0.0`         |
  | socket.io-client           | `^4.8.3`         |
  | yet-another-react-lightbox | `^3.28.0`        |

- Dev dependencies (exact `package.json` versions):

  | Package                     | Version   |
  | --------------------------- | --------- |
  | @eslint/js                  | `^9.39.1` |
  | @types/react                | `^19.2.5` |
  | @types/react-dom            | `^19.2.3` |
  | @vitejs/plugin-react-swc    | `^4.2.2`  |
  | eslint                      | `^9.39.1` |
  | eslint-plugin-react-hooks   | `^7.0.1`  |
  | eslint-plugin-react-refresh | `^0.4.24` |
  | globals                     | `^16.5.0` |
  | vite                        | `^7.2.4`  |

Design patterns:

- Discriminator pattern for task polymorphism.
- Cascade operations with transactions.
- Polymorphic references for comments and attachments.
- Repository and service layers for business logic.
- Container/presentational components and custom hooks.
- HOCs and render props where needed.
- Context API for theme and auth.

Database schema design:

- Collections: Organizations, Departments, Users, Tasks (ProjectTask, AssignedTask, RoutineTask), TaskActivities, TaskComments, Materials, Vendors, Notifications, Attachments.
- Indexes: compound unique indexes for multi-tenancy, TTL index for notification expiration, text indexes for search, optional geospatial indexes for location features.
- Relationships:
  - One-to-many: Organization -> Departments, Department -> Users.
  - Embedded: RoutineTask.materials, TaskActivity.materials.
  - References: AssignedTask.assignees, Task.watchers.
  - Polymorphic: Comments -> parent (Task/Activity/Comment), Attachments -> parent.
  - Discriminator: Task -> ProjectTask/RoutineTask/AssignedTask.

## 1.2 Glossary

- System: the multi-tenant task manager web application.
- User: authenticated user with role SuperAdmin, Admin, Manager, or User.
- Platform_SuperAdmin: SuperAdmin with `isPlatformOrgUser=true`, can access customer organizations per authorization matrix.
- Customer_SuperAdmin: SuperAdmin with `isPlatformOrgUser=false`, can access own organization only.
- HOD: head of department, isHod true, can switch departments.
- Resource: data entity such as Task, Vendor, Material, User, Department.
- List_Page: paginated, filterable, sortable list page.
- Detail_Page: page showing details of a single resource.
- DashboardLayout: main authenticated layout with header, sidebar, content area.
- Bottom_Navigation: mobile-only nav bar with centered FAB.
- FAB: floating action button.
- Soft_Delete: mark resource deleted via isDeleted without DB removal.
- Authorization_Matrix: role-based permission system defining operations.
- RTK_Query: Redux Toolkit Query for data fetching/caching.
- MUI: Material UI React component library.
- Theme_Token: design tokens from the MUI theme.
- Responsive_Breakpoint: screen size breakpoint (xs, sm, md, lg, xl).

## 1.3 Platform vs Customer Organizations

### Platform Organization

**Purpose**: System administration and cross-organization management

**Characteristics**:

- **Identifier**: `isPlatformOrg: true`
- **Users**: All users have `isPlatformOrgUser: true`
- **User Roles**: SuperAdmin, Admin, Manager, User
- **Protection**: CANNOT be deleted (immutable)
- **Permissions**: Platform SuperAdmin can access all customer organizations (based on the authorization matrix)
- **Cross-Organization Access**: Platform SuperAdmin can perform operation on customer organizations (based on the authorization matrix)

**Creation Process**:
Platform organizations are created during **backend setup via database seeding**:

1. **Database Seeding**: Run `npm run seed` in the backend directory
2. **Automatic Creation**: Seed script creates the platform organization with:
   - `isPlatformOrg: true`
   - Platform department (the first user department)
   - Platform SuperAdmin user with `isPlatformOrgUser: true`, `role: SuperAdmin` and `isHod: true`
3. **Immutable**: Once created, the platform organization cannot be deleted
4. **Purpose**: Provides system-level administration capabilities

### Customer Organization

**Purpose**: Tenant organizations for business operations

**Characteristics**:

- **Identifier**: `isPlatformOrg: false`
- **Users**: All users have `isPlatformOrgUser: false`
- **User Roles**: SuperAdmin, Admin, Manager, User
- **Protection**: SuperAdmin can make operation within own Organization or department within Organization (based on the authorization matrix)
- **Permissions**: Users limited to own organization only or department within organization (based on the authorization matrix)
- **Isolation**: Complete data isolation from other customer organizations

**Creation Process**:
Customer organizations are created via **frontend onboarding/registration workflow**:

1. **Organization Registration** (Step 1):

   - User provides organization details (name, email, phone, address, industry, size, with other optional fields)
   - System creates organization with `isPlatformOrg: false`
   - Organization is created but requires the user department and the user it self (Step 2 and Step 3)

2. **Department Creation** (Step 2):

   - User provides department details (name, description)
   - System creates the first department within the organization
   - Department is created but manager is not yet assigned

3. **User Registration** (Step 3):

   - User provides personal details (firstName, lastName, position, email, password, with other optional fields)
   - System creates the first user with:
     - `role: SuperAdmin` (becomes organization SuperAdmin)
     - `isHod: true` (becomes Head of Department)
     - `isPlatformOrgUser: false` (customer user)
   - User is assigned as department manager
   - User is set as organization creator (`createdBy`)

4. **Review and Submit** (Step 4):

   - Review and submit the form from the frontend to backend
   - On the backend, the organization, department and user will be created in a sequence

5. **Circular Dependency Resolution**:

   - Organization → Department → User → (back to) Department (as manager) → Organization (as creator)
   - Schema allows `manager` and `createdBy` to be optional during initial creation
   - After user creation, department manager and organization creator are updated

6. **Result**:
   - First user becomes both:
     - **SuperAdmin** can make operation on own organization or department within Organization (based on the authorization matrix)
     - **Head of Department** for their department (department manager, isHod:true)
   - The user organization and department are ready for use
   - User can now setup the departments and users for a given department within organization

### Key Differences

#### Platform Organization

**Creation**: Backend seeding
**Flag**: `isPlatformOrg: true`
**Users**: `isPlatformOrgUser: true`
**Deletion**: based on the authorization matrix
**Access Scope**: crossOrg and based on the authorization matrix
**Purpose**: System administration
**First User**: Platform SuperAdmin + HOD

#### Customer Organization

**Creation**: Frontend registration (org -> dept -> user -> review & submit)
**Flag**: `isPlatformOrg: false`
**Users**: `isPlatformOrgUser: false`
**Deletion**: based on the authorization matrix
**Access Scope**: ownOrg and based on the authorization matrix
**Purpose**: Business operations
**First User**: Organization SuperAdmin + HOD

## 2. Goals and Non-Goals

Goals:

- Enforce strict multi-tenant data isolation at organization and department levels.
- Provide complete CRUD + soft-delete + restore for all resources.
- Support real-time collaboration and notifications.
- Deliver highly usable, accessible, and responsive UI for mobile/tablet/desktop.
- Ensure backend and frontend validation alignment with a single source of truth.
- Ensure security best practices: JWT rotation, bcrypt hashing, rate limiting, CSP.

Explicit exclusions and constraints:

- No hard deletes (soft delete only).
- No direct organization creation endpoint; organization creation happens only via onboarding/registration flow or backend seeding (platform org).
- No frontend usage of dayjs for user-facing formatting; use native Intl formatting (dayjs may exist only for internal computations and date-picker adapters).
- No test frameworks (Jest, Mocha, Chai, Supertest, Vitest, Cypress are forbidden).
- No React Hook Form watch() usage.
- No deprecated MUI syntax (item prop, renderTags).

## 3. Personas

### 3.1 Platform SuperAdmin (Sarah)

Background: System administrator overseeing the entire platform and all customer organizations.
Goals:

- Monitor all organizations.
- Manage platform-level configurations.
- Access customer organizations for support (read-only by default).
- Ensure platform security and data integrity.
  Permissions: Full access to platform organization, cross-org read access where allowed by the authorization matrix.

### 3.2 Organization SuperAdmin (Michael)

Background: IT director responsible for managing organization setup.
Goals:

- Create departments and users.
- Assign department managers.
- Configure org-wide settings.
- Monitor cross-department activities.
  Permissions: Full access within own organization; cannot delete the organization.

### 3.3 Department Manager / HOD (Jennifer)

Background: Engineering department lead.
Goals:

- Create and assign tasks.
- Track project progress and routine maintenance.
- Manage department resources (materials/vendors).
  Permissions: Department-scoped resource management with cross-department read where allowed.

### 3.4 Team Member / User (David)

Background: Individual contributor.
Goals:

- View and complete assigned tasks.
- Add activities and comments.
- Collaborate with team members.
  Permissions: Own-resource management and department read access as defined by authorization matrix.

## 4. User Journeys (Narrative, End-to-End)

### Journey 1: Organization Setup (Michael)

Step 1 - Registration and onboarding (4-step wizard):

- Step 1 Organization Details:
  - Name: "TechCorp"
  - Email: "info@techcorp.com"
  - Phone: "+251912345678" or "0912345678"
  - Address: "123 Tech Street, Addis Ababa, Ethiopia"
  - Industry: Technology (from fixed list)
  - Size: Small, Medium, or Large
  - Description: optional
- Step 2 Department Setup:
  - Department name: "Engineering"
  - Description: "Software development and infrastructure"
- Step 3 User Registration:
  - First name, last name, position, email, password
- Step 4 Review and Submit:
  - Review all details and submit

System behavior:

- Creates Organization with:
  - isPlatformOrg: false
  - isVerified: false (until initial verification completes)
- Creates Department linked to the organization.
- Creates the initial SuperAdmin User with:
  - role: SuperAdmin
  - isHod: true
  - isPlatformOrgUser: false
  - isVerified: false (until initial verification completes)
  - joinedAt: now (not future)
  - employeeId auto-generated (example "0001")
- Updates Department.manager to the created user.
- Updates Organization.createdBy to the created user.
- Generates email verification token + expiry for the initial SuperAdmin user.
- Sends an email verification message to the initial SuperAdmin email address.
- Does NOT issue access/refresh tokens until verification succeeds (CAN-008).
- UI transitions to a verification-pending state and blocks access to protected routes until verification completes.
- After successful verification:
  - Backend sets Organization.isVerified=true and User.isVerified=true.
  - Backend clears verification token fields.
  - Backend sends a welcome email exactly once (idempotent).
  - User proceeds to Login to obtain access/refresh tokens and enter the dashboard.

Step 2 - Create additional departments:

- Create department with name, description, optional manager.
- Real-time update to organization users.

Step 3 - Create additional users:

- Create user with role, department, optional isHod (if role SuperAdmin/Admin).
- Auto-generate employeeId (example "0002").
- System generates a temporary strong password (never displayed in UI) and hashes it with bcrypt (>=12 rounds).
- System generates a one-time password setup/reset token + expiry and sends the user a welcome email containing the password setup link.
- Users created by an organization SuperAdmin are auto-verified (isVerified=true) (CAN-008).
- Create notification to creator.
- Update department manager if isHod is true.
- Welcome email sent via Nodemailer using Gmail SMTP.

Step 4 - Manage department managers:

- Update department manager to a SuperAdmin/Admin user with isHod true.
- Send notification to new manager.

### Journey 2: Project Task Creation (Jennifer)

Steps:

- Create ProjectTask with title, description, priority, tags, vendor, start and due dates.
- Watchers include the creator by default; any active user within the task's organization+department scope can be added/removed as a watcher.
- Upload attachments (max 10MB each).
- System sets status to TODO, assigns organization and department automatically.
- Creates TaskActivity: "Task created".
- Creates notification linked to the task (example: title "New project task created", message uses task title).
- Optional email alerts with task details.
- Emits Socket.IO events: task:created, notification.

### Journey 3: Routine Task Creation

- Create RoutineTask with title, description, priority, date.
- Materials are embedded directly in the task (no activities).
- No TaskActivity allowed for RoutineTask.
- On completion, status changes to COMPLETED for that date.

### Journey 4: Assigned Task Workflow

- Create AssignedTask with assignees, start and due dates.
- Sends notifications and email reminders.
- Send due date reminder notification 1 hour before deadline.
- Assignees can update status, add activities, and complete the task.

### Journey 5: Real-Time Collaboration

- Users see real-time updates for task changes, comments, activities.
- Rooms: user:{userId}, org:{orgId}, dept:{deptId}, task:{taskId}.
- Events: task:created, task:updated, task:deleted, task:activity:added, task:comment:added, notification, user:status:changed.

### Journey 6: Notification System

Notification payload fields:

- title (max 200)
- message (1-500)
- entity + entityModel (optional)
- organization + department (required)
- isRead (default false)
- expiresAt (default now + 30 days)

Delivery:

- In-app: bell icon badge, dropdown, mark as read, auto-expire.
- Email: sent for important events with templates.
- Real-time push via Socket.IO and browser notifications (if permitted), delivered to user rooms including watchers and mentioned users' active sessions.

### Journey 7: Dashboard and Analytics

- Metrics: My Tasks, Department Tasks, Overdue, Completed This Week.
- Charts: status distribution pie, priority breakdown bar, timeline line chart.
- Recent activities feed (real-time).
- Upcoming deadlines table (`MuiDataGrid`) (next 7 days).
- Team performance (Manager/Admin only).

### Journey 8: Advanced Filtering and Search

- Filters: status, priority, type, date range, assignment, department, tags.
- Search across title and description with debounce and min 3 characters.
- Persist filters in URL.
- Pagination (20 per page default).

### Journey 9: Material and Vendor Management

Materials:

- Create with name, unit, category, optional price.
- Used in TaskActivity for Project/Assigned tasks.
- Used directly in RoutineTask.
  Vendors:
- Create with name, email, phone, optional address, optional rating.
- Linked to ProjectTasks only.
- Track vendor performance.
- Materials and vendors cannot be deleted (soft-deleted) when associated with other data (CAN-015); the API must return 409 CONFLICT_ERROR with a deterministic, user-friendly message.

### Journey 10: Authorization and Security

Examples:

- Platform SuperAdmin: cross-org read where allowed, cannot delete platform org.
- Organization SuperAdmin: full org control but cannot delete org.
- Admin: department control, cross-department read in org.
- Manager/User: department-scoped and ownership-based access.

## 4.1 Detailed Feature Narratives

### Task Activity Timeline

What gets logged:

- Task creation
- Status changes
- Priority changes
- Field updates (description, dates, etc)
- Materials added/removed
- Comments added
- Attachments added
- Task completion

User experience:

- Timeline displayed on task details page.
- Chronological order (newest first).
- User avatars and names.
- Relative timestamps (for example "2 hours ago").
- Expandable details for complex changes.
- Filter/search activities.
- Materials shown with quantities.
- Attachments shown with preview.

Technical details:

- TaskActivity can only be created for ProjectTask and AssignedTask.
- TaskActivity is not allowed for RoutineTask.
- Although schema supports parentModel values TaskActivity and TaskComment, business rules only allow parentModel = Task (ProjectTask or AssignedTask) for creation in the current product scope.
- Materials are embedded subdocuments with quantities.
- Max 20 materials per activity.
- Max 20 attachments per activity.
- Tasks use Mongoose discriminators for polymorphic task types.
- Virtual populate for activities and comments.
- Pre-save hooks validate dueDate > startDate.
- Post-save hooks trigger notifications and activity logging.
  Activity structure example:

```
{
  parent: ObjectId,
  parentModel: "Task (ProjectTask, AssignedTask)",
  createdBy: ObjectId,
  activity: "Status changed from TODO to IN_PROGRESS",
  materials: [
    { material: ObjectId, quantity: 3 }
  ],
  attachments: [ObjectId],
  organization: ObjectId,
  department: ObjectId
}
```

### Task Comments and Mentions

Features:

- Comment on tasks, activities, and other comments.
- @mention users to notify them (max 20 mentions per comment).
- Reply to specific comments (threading, max depth 5).
- Edit own comments.
- Delete own comments.
- Attach files to comments.
- Polymorphic parent support.

Example flow:

1. User posts comment with @mention.
2. System parses @username, resolves user, and creates TaskComment.
3. Notification is created for mentioned user.
4. Mentioned user replies, creating nested TaskComment with depth +1.
5. Mentioned user sees notification and navigates to task; comment is highlighted.

Technical implementation:

- TaskComment supports parent types: Task, TaskActivity, TaskComment.
- Mentions parsed from @username patterns.
- Mentioned users must belong to same organization.
- Max depth enforced at 5.

### File Attachments

Features:

- Upload multiple files.
- Supported types: Image, Document, Video, Audio, Other.
- File size limit: 10MB per file.
- Allowed extensions (canonical allowlist): .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3 (CAN-027).
- Preview images inline and enable downloads.
- Polymorphic parent support.

Storage:

- Files stored in Cloudinary.
- Metadata stored in MongoDB.
- Use secure signed URLs for access.

Upload flow:

1. User selects file (drag-and-drop or picker).
2. Frontend validates file type and size.
3. Frontend uploads directly to Cloudinary.
4. Cloudinary returns URL.
5. Frontend sends fileUrl to backend.
6. Backend creates Attachment record.

### Real-Time Updates via Socket.IO

Events:

- task:created, task:updated, task:deleted
- task:activity:added
- task:comment:added
- notification
- user:status:changed

Room structure:

- user:{userId}
- org:{orgId}
- dept:{deptId}
- task:{taskId}

Connection flow:

1. User logs in.
2. Frontend establishes Socket.IO connection.
3. Sends authentication token.
4. Backend verifies token.
5. User joins rooms based on organization and department.
6. Connection maintained throughout session.
7. On logout, connection closed and rooms left.

Additional behavior:

- JWT authentication required for socket connections.
- Automatic reconnection on disconnect.
- Frontend listeners update Redux state.
- Use optimistic updates where appropriate.
- useSocket hook and socketService must route events into RTK Query cache updates.

## 4.2 Real-World Usage Scenarios

Scenario 1: Hotel Housekeeping Management
Context: Hotel uses system for housekeeping tasks.

- Organization: "Grand Hotel"
- Departments: Housekeeping, Maintenance, Front Desk
- Users: Housekeeping Manager (Admin), Housekeepers (Users)
- Routine task example:
  - "Room 101 Daily Cleaning"
  - Date: 2024-01-20
  - Priority: MEDIUM
  - Materials: Cleaning supplies, Linens
- Project task example:
  - "Renovate Presidential Suite"
  - Vendor: "Interior Design Co"
  - Start date: 2024-01-21
  - Due date: 2024-02-20
  - Materials tracked via TaskActivity (Furniture, Fixtures)
  - Watchers: Manager, Front Desk Manager
- Assigned task example:
  - "Inspect Room 205 for damages"
  - Assignee: Housekeeper B
  - Start: 2024-01-20 10:00
  - Due: 2024-01-20 17:00
  - Priority: HIGH
    Benefits:
- Real-time task updates
- Material tracking for inventory
- Vendor management for renovations
- Activity logging for accountability
- Cross-department visibility

Scenario 2: Software Development Team
Context: Tech company uses system for project management.

- Organization: "TechCorp"
- Departments: Engineering, QA, DevOps
- Users: Engineering Manager (Admin), Developers (Users), QA Engineers (Users)
- Project task example:
  - "Build Payment Gateway Integration"
  - Vendor: "Payment Processor Inc"
  - Start date: 2024-01-15
  - Due date: 2024-02-15
  - Watchers: Manager, QA Lead
  - Activities track progress updates
- Assigned task example:
  - "Code Review for PR #234"
  - Assignees: Senior Developer, QA Engineer
  - Start: 2024-01-16 09:00
  - Due: 2024-01-17 17:00
  - Priority: HIGH
  - Comments for feedback
- Routine task example:
  - "Weekly Security Scan"
  - Date: 2024-01-22
  - Priority: HIGH
  - Materials: Security tools, Credentials
    Benefits:
- Task dependencies tracking
- Code review workflow
- Vendor integration management
- Cross-team collaboration
- Routine tasks created per date

Scenario 3: Healthcare Facility
Context: Clinic uses system for patient care coordination.

- Organization: "City Clinic"
- Departments: Nursing, Pharmacy, Administration
- Users: Head Nurse (Admin), Nurses (Users), Pharmacists (Users)
- Routine task example:
  - "Morning Medication Round"
  - Date: 2024-01-20
  - Priority: URGENT
  - Materials: Medications, Patient charts
- Assigned task example:
  - "Patient discharge paperwork for Room 5"
  - Assignees: Nurse, Pharmacist
  - Start: 2024-01-20 10:00
  - Due: 2024-01-20 14:00
  - Priority: HIGH
  - Comments for coordination
- Project task example:
  - "Upgrade Medical Equipment"
  - Vendor: "Medical Supplies Co"
  - Start: 2024-01-20
  - Due: 2024-02-10
  - Watchers: Head Nurse, Administrator
    Benefits:
- Patient care coordination
- Medication tracking
- Equipment management
- Cross-department communication
- Compliance documentation

Scenario 4: Restaurant Chain
Context: Restaurant chain uses system for operations.

- Organization: "Tasty Bites"
- Departments: Kitchen, Service, Management
- Users: Restaurant Manager (Admin), Chefs (Users), Servers (Users)
- Routine task example:
  - "Daily Inventory Check"
  - Date: 2024-01-20
  - Priority: HIGH
  - Materials: Inventory sheets, Supplies
- Assigned task example:
  - "Prepare special menu for event"
  - Assignees: Chef A, Chef B
  - Start: 2024-01-20 09:00
  - Due: 2024-01-25 17:00
  - Priority: URGENT
  - Comments for menu planning
- Project task example:
  - "Kitchen Renovation"
  - Vendor: "Commercial Kitchen Co"
  - Start: 2024-01-21
  - Due: 2024-02-28
  - Materials tracked via TaskActivity (Equipment, Fixtures)
  - Watchers: Manager, Owner
    Benefits:
- Inventory management
- Event coordination
- Vendor management for supplies
- Staff task assignment
- Real-time updates

## 4.3 Advanced Filtering and Search

Filter options:

- Status (TODO, IN_PROGRESS, COMPLETED, PENDING) with counts.
- Priority (LOW, MEDIUM, HIGH, URGENT) with counts.
- Task type (Project, Routine, Assigned) single selection.
- Date range filters (created date, due date) with presets: Today, This Week, This Month, Custom.
- Assignment filter: Assigned to me, Created by me, Watching, All department tasks, Unassigned.
- Department filter for Managers/Admins (multi-select) requires cross-department read permission.
- Tags filter (multi-select) with AND/OR toggle.

Search:

- Full-text search across title and description.
- Debounced input.
- Minimum 3 characters before search triggers.

Sorting:

- Due date, priority, created date, title.

Filter UX:

- Active filter chips displayed with remove icons.
- Clear All removes all filters at once.
- Filter state persisted in URL for bookmarking.

Backend query behavior:

- Query params support ranges (e.g., dueDate[gte], dueDate[lte]).
- Dynamic query construction based on selected filters.
  Example request:

```
GET /api/tasks?priority=HIGH&status=IN_PROGRESS&dueDate[gte]=2024-01-15&dueDate[lte]=2024-01-21&assignee=userId
```

Example backend query:

```
const query = {
  priority: "HIGH",
  status: "IN_PROGRESS",
  dueDate: { $gte: startOfWeek, $lte: endOfWeek },
  assignees: userId
};
```

## 4.4 Dashboard Analytics Implementation Details

- Aggregation pipelines calculate metrics and widget payloads for:
  - Organization KPIs (tasks/users, active/completed/overdue, online/offline/admin counts where applicable).
  - Department performance cards (completion rates and trend deltas).
  - Task status distribution (donut/pie) and priority breakdown (bar).
  - Timeline trends (created vs completed over time).
  - Recent activity feed and upcoming deadlines.
  - Projects overview (ProjectTask rollups: active/delayed/upcoming).
  - Materials usage + inventory summary (stock level, low stock count, usage rate).
  - Vendor performance summary (on-time delivery, active contracts, average rating).
- All dashboard aggregations MUST support filtering by:
  - date range (required), and
  - departmentId (optional; only for roles permitted to view other departments), and
  - status/priority/taskType (optional; represented as filter chips).
- Charts rendered with **MUI X Charts** (`@mui/x-charts`) and MUST use theme tokens (no hardcoded chart palettes).
- Data MUST be cached using RTK Query for performance.
- Refresh button triggers manual data reload (cache bust/refetch).
- Clicking a status slice applies that status filter and navigates to Tasks with the same filter applied.
- Clicking a priority bar applies that priority filter and navigates to Tasks with the same filter applied.
- Export button MUST export the currently filtered dashboard snapshot:
  - PDF export uses `jspdf` + `jspdf-autotable` (client-side).
  - Export includes: applied filters summary, export timestamp, and the widget tables used for deadlines/projects/materials/vendors.

## 4.5 Notification UX Details

- Bell icon badge updates in real time.
- Bell icon pulses briefly when new notification arrives.
- Clicking notification navigates to related entity.
- Notification marked as read when opened.
- Badge count decreases when notifications are read.

## 5. Canonical Decisions & Reconciliations (Conflict Ledger)

This section reconciles inconsistencies between inputs into a single canonical spec. Each item includes the conflicting interpretations (paraphrased), the canonical decision, and the impact.

### CAN-001 Breakpoints

- **Conflict**: Some sources use `xs<600/sm<960/md>=960` thresholds; others use `xs 0–599, sm 600–899, md 900–1199, lg 1200–1535, xl 1536+`.
- **Canonical decision**: Use **xs 0–599, sm 600–899, md 900–1199, lg 1200–1535, xl 1536+** everywhere.
- **Impact**: All “mobile/tablet/desktop” rules map to these breakpoints; any prior 960/1280/1920 references are remapped to `md/lg/xl`.

### CAN-002 Bottom Navigation (items and visibility)

- **Conflict**:
  - Some sources specify bottom navigation for `<600` only, others for `<900` or `<960`.
  - Some sources specify items `Dashboard, Tasks, Users, More`, others `Dashboard, Tasks, Users, Profile`.
- **Canonical decision**:
  - Bottom navigation is **visible on xs only** (`width < 600`) and **hidden on sm+**.
  - Bottom navigation contains **exactly 4 items**: **Dashboard, Tasks, Users, Profile** with a **centered FAB**.
  - The **Profile** item opens a menu that includes Profile actions and additional navigation (Departments, Materials, Vendors) to satisfy the “More” requirement without adding a fifth nav item.
- **Impact**: Mobile UX is consistent and supports the full IA using a 4-item bottom nav; tablet and desktop rely on the sidebar and header menus.

### CAN-003 Comment Thread Depth

- **Conflict**: Max nested comment depth varies (e.g., 3 vs 5).
- **Canonical decision**: **Max depth is 5** (depth `0–5`) across TaskComment threads.
- **Impact**: Schema constraints, validators, UI rendering, and pagination must enforce depth ≤ 5.

### CAN-004 Task Filters (union)

- **Conflict**: Different sources list different filter sets.
- **Canonical decision**: Use the **union** of all filters: status, priority, type, created date range, due date range, department, assignment, tags, deleted toggle, and any resource-specific filters (e.g., vendor rating, material category).
- **Impact**: Backend list endpoints must support all canonical filters; UI must expose them via dialog/drawer and active chips.

### CAN-005 Authorization Source of Truth

- **Conflict**: Role summaries sometimes conflict with matrix-level rules.
- **Canonical decision**: The **authorization matrix is the single source of truth**; summaries are descriptive only.
- **Impact**: Backend authorization middleware and frontend UI gating must evaluate permissions strictly via matrix rules.

### CAN-006 Phone Number Format

- **Conflict**: Some sources allow `0XXXXXXXXX` for local numbers; requirement mandates `09XXXXXXXX` only.
- **Canonical decision**: Phone numbers MUST match **`+251XXXXXXXXX`** or **`0XXXXXXXXX`**.
  - Canonical regex: `^(\+251\d{9}|0\d{9})$`
- **Impact**: Update validation rules for Organization/User/Vendor; update UI placeholders and examples to Ethiopian format only.

### CAN-007 Registration “Terms Acceptance” Checkbox

- **Conflict**: Some sources include a required Terms checkbox in registration Step 4; updated requirements remove it.
- **Canonical decision**: **No Terms acceptance checkbox exists** in the product.
- **Impact**: Remove the field from UI specs, validation, and submission gating; ensure no backend expects it.

### CAN-008 Email Verification & Welcome Emails

- **Conflict**: Some sources omit verification; updated requirements mandate verification only for initial customer-org registration.
- **Canonical decision**:
  - **Email verification is required only for the initial registration of a customer organization**.
  - After successful verification, send a **welcome email exactly once** (idempotent) via Nodemailer.
  - **Users created by a customer organization’s SuperAdmin are auto-verified**, and a **welcome email is sent** when a new user is created within a department.
- **Impact**: Add verification UX and API endpoints; add `isVerified` semantics to the first registered user (and optionally organization) and enforce onboarding completion.

### CAN-009 Department Selector Location

- **Conflict**: Some sources place the department selector in the sidebar (often “HOD only”); others place it on the Department Details page header.
- **Canonical decision**: The **department selector/switcher is in the Sidebar** (HOD only), not on the Department Details page.
- **Impact**:
  - Sidebar includes the department selector for `isHod=true` users; non-HOD users see read-only department context.
  - Department Details header does **not** include a department selector/switcher.

### CAN-010 Sidebar Navigation Label

- **Conflict**: “My Tasks” vs “Tasks” label in navigation.
- **Canonical decision**: Sidebar navigation label is **“Tasks”**.
- **Impact**: Any “My Tasks” wording is limited to analytics/metrics context only, not navigation.

### CAN-011 User Details Tabs

- **Conflict**: User detail tab sets vary.
- **Canonical decision**: User Details page tabs are **Overview, Tasks, Activity, Performance**.
- **Impact**: UI routes, data requirements, and API endpoints must support these tabs.

### CAN-012 403 (Forbidden) Frontend Handling

- **Conflict**: Some sources specify a dedicated “Forbidden” page; updated requirements mandate toast-only.
- **Canonical decision**: **All 403 errors on the frontend are displayed via toast notifications only** (no dedicated 403 page).
- **Impact**: Route guards and API error handling must show toast and keep/redirect the user appropriately without rendering a Forbidden page.

### CAN-013 Task Status/Priority Display Mapping

- **Conflict**: UI labels vary (“Open”, “In Review”, “Critical”) vs schema enums (`TODO`, `PENDING`, `URGENT`).
- **Canonical decision**:
  - API enums:
    - Status: `TODO | IN_PROGRESS | PENDING | COMPLETED`
    - Priority: `LOW | MEDIUM | HIGH | URGENT`
  - UI display labels:
    - `TODO` → “To Do” (may appear as “Open” in some UI references; canonical label is “To Do”)
    - `IN_PROGRESS` → “In Progress”
    - `PENDING` → “In Review”
    - `COMPLETED` → “Completed”
    - `URGENT` → “Critical”
- **Impact**: Frontend must map display strings to canonical enums; backend stores only canonical enums.

### CAN-014 Date/Time Formatting vs `dayjs`

- **Conflict**: Some rules say “frontend must never use dayjs” while the stack includes `dayjs` (e.g., for MUI date pickers).
- **Canonical decision**:
  - Frontend MUST use **`Intl.DateTimeFormat`** for all user-facing formatting.
  - `dayjs` MAY exist only for internal date computations and MUI date picker adapter usage; it MUST NOT be used for formatting UI strings.
- **Impact**: Enforce formatting consistency while allowing required date-picker dependencies.

### CAN-015 Resource Deletion When Associated

- **Conflict**: Soft delete is generally allowed, but updated requirements prohibit deleting associated resources.
- **Canonical decision**: A resource (e.g., Material, Vendor) **cannot be deleted (soft-deleted) if it is associated with other data**.
  - Association checks MUST include soft-deleted documents using `.withDeleted()` to avoid breaking restore flows.
  - If deletion is blocked, the canonical alternative is to set `status=INACTIVE`.
- **Impact**: Delete controllers must run association checks (including deleted parents) and return `409 CONFLICT_ERROR` with a clear reason when blocked.

### CAN-016 Immutable Fields for Admin/Manager/User

- **Conflict**: Some flows imply editing user metadata freely; updated requirements restrict edits.
- **Canonical decision**: For Admin/Manager/User roles (platform or customer org), the following fields are immutable: `department`, `role`, `employeeId`, `joinedAt`, `isHod`.
- **Impact**: Backend rejects such updates (403/409 as appropriate); frontend disables/hides these controls.

### CAN-017 Mobile Dialog Behavior (≤ 600px)

- **Conflict**: Dialog sizing varies; updated requirements mandate full-height dialogs on mobile.
- **Canonical decision**: Reusable dialogs on screens `width <= 600px` must be full-height (`100vh`) and use the required MUI props and canonical `sx` block (defined in Engineering Constraints).
- **Impact**: All dialog components must follow a single reusable pattern for mobile.

### CAN-018 Department Details Tabs (Top-Level vs Activity)

- **Conflict**:
  - Some sources describe Department Details with **4 top-level tabs**: Overview, Users, Tasks, Activity.
  - Updated requirements state each department has its own dashboard on the Department Details page with **3 top-level tabs**: **Overview**, **Users**, **Tasks**.
- **Canonical decision**:
  - Department Details has **exactly 3 top-level tabs**: **Overview**, **Members**, **Tasks**.
  - The “Activity” experience still exists but is implemented as a **secondary sub-tab inside the Tasks tab** labeled **“All Activity”** (this satisfies the `dept_details_activity_tab_screen` reference while keeping the top-level IA at 3 tabs).
- **Impact**:
  - UI: no standalone top-level “Activity” tab.
  - API: `GET /api/departments/:departmentId/activity` powers the Tasks → All Activity sub-tab and MUST support filtering by activity type (e.g., tasks vs comments vs files).
  - Routing: the canonical Department Details route remains stable; sub-tabs are client-side state (query string or nested routes are allowed but must be consistent across devices).

### CAN-019 Material Inventory, SKU, and Restock

- **Conflict**:
  - Some sources treat Materials as simple catalog items (name/unit/price only).
  - Provided UI reference images include **SKU**, **Active/Inactive status**, **Restock** actions, and dashboard widgets that require inventory/low-stock aggregates.
- **Canonical decision**:
  - Material is a **department-scoped inventory item** with:
    - `sku` (required, unique per department, human-readable),
    - `status` (`ACTIVE|INACTIVE`),
    - `inventory.stockOnHand` (numeric, min 0),
    - `inventory.lowStockThreshold` (numeric, min 0; determines “Low stock”),
    - `inventory.lastRestockedAt` (Date, optional).
  - Material usage is recorded only through Task usage (RoutineTask materials and TaskActivity materials). Inventory stock MUST be decremented atomically (in the same DB session) when usage is recorded, and MUST be incremented atomically when restocked.
  - Restocking is a dedicated write operation (`POST /api/materials/:materialId/restock`) that increases `inventory.stockOnHand` and updates `inventory.lastRestockedAt`.
- **Impact**:
  - Data model expands (Material).
  - New API route for restock.
  - Dashboard and Material Details screens can compute stock health, low-stock count, usage rate, and cost aggregates.

### CAN-020 Vendor Extended Fields (Website/Location/Partner) and Status

- **Conflict**:
  - Some sources define Vendors with only name/email/phone/address/rating.
  - Provided UI reference images show **website**, **location**, **“Verified Partner”** badge, **Contact Vendor** action, and status filtering.
- **Canonical decision**:
  - Vendor is an **organization-scoped** resource with:
    - contact fields: `email`, `phone`, optional `website`, optional `location`, optional `address`,
    - `status` (`ACTIVE|INACTIVE`) used to prevent selecting inactive vendors for new ProjectTasks without deleting,
    - optional `description`,
    - optional `isVerifiedPartner` boolean (badge),
    - optional `rating` (1–5, 0.5 increments) and derived `ratingCount`.
- **Impact**:
  - Data model expands (Vendor).
  - Vendor list filters expand (status, rating range, verified partner).
  - Vendor Details requires aggregates: active projects, avg duration, on-time delivery, and total spend (derived).

### CAN-021 Attachments on Materials

- **Conflict**: Some sources show Material detail pages including attachments, but the schema and UI references do not include Material-scoped attachments.
- **Canonical decision**: Attachments are **not** supported for `Material`. Material Details focuses on usage history and inventory; file storage is supported only for Task, TaskActivity, and TaskComment.
- **Impact**: Attachment `parentModel` enum MUST NOT include `Material`; Material Detail UI MUST NOT show an attachments section.

### CAN-022 Department Status (Active/Inactive)

- **Conflict**: Some sources model Departments as “always active unless deleted”, while provided UI reference images include Status filtering and a need to prevent new work in a department without deleting it.
- **Canonical decision**: Department MUST have `status` enum `ACTIVE | INACTIVE`.
  - `INACTIVE` departments are still readable (subject to authorization) but MUST block creation of new Users/Tasks/Materials under that department (409 CONFLICT_ERROR).
- **Impact**: Update Department data model, validators, list filters, and UI filter dialog.

### CAN-023 “Grid View” vs “List View” Terminology (MuiDataGrid vs Cards)

- **Conflict**:
  - Some sources/screens use “grid view” to mean a **card layout** and “list view” to mean a **table**.
  - Engineering standards for this project require “grid view” to mean the **MUI X DataGrid** (a tabular grid), and “list view” to mean a **card list** layout.
- **Canonical decision**:
  - **Grid view** = `MuiDataGrid` (reusable wrapper around MUI X DataGrid).
  - **List view** = MUI Cards rendered in a responsive MUI `Grid` layout (MUI v7 `size` prop), not CSS grid.
  - The reusable components MUST live under `client/src/components/reusable/*`:
    - `MuiDataGrid` (wrapper) and `MuiDataGridToolbar` (shared toolbar).
  - Per-resource column definitions MUST live under `client/src/components/columns/*` and be passed into `MuiDataGrid`.
  - UI reference image filenames remain unchanged; implementers MUST follow the view definitions above and the per-screen mapping in Section 10 (do not infer view meaning from the file suffix `*_grid_view_screen` / `*_list_view_screen`).
- **Impact**:
  - All Section 10 “Grid view” statements refer to `MuiDataGrid`.
  - All Section 10 “List view” statements refer to card lists laid out with MUI `Grid`.
  - Tablet/mobile “hide columns” behavior applies to `MuiDataGrid` (Grid view).

### CAN-024 Dashboard Header Logo Placement

- **Conflict**: Some sources say the protected header shows the logo; UI reference images and layout specs show the logo in the sidebar only.
- **Canonical decision**: The **DashboardLayout header does not include the product logo**. The logo appears **only in the sidebar header** (desktop and mobile drawer).
- **Impact**: Header left section is menu toggle (xs/sm) + page title; logo is part of sidebar header only.

### CAN-025 Public Header Auth CTAs

- **Conflict**: Public header CTA labels vary (Login/Get Started vs Log In/Sign Up).
- **Canonical decision**: PublicLayout header uses **“Log In”** (outlined) and **“Sign Up”** (contained).
- **Impact**: Update PublicLayout header specs and landing page nav to match the reference images.

### CAN-026 Department Description Max Length

- **Conflict**: Department create dialog helper text shows “max 200 characters” while schema sets max 500.
- **Canonical decision**: Department description max length is **500** characters (schema-backed).
- **Impact**: UI helper text and validation messages MUST reflect max 500.

### CAN-027 Attachment File URL Pattern and Extension Allowlist

- **Conflict**:
  - Schema/legacy PRD use a Cloudinary URL pattern limited to `image/upload`.
  - FileType enum + requirements + UI references indicate attachments include documents/audio/video (PDF/DOCX/MP4/MP3), and the upload helper text lists SVG/PDF/DOCX.
- **Canonical decision**:
  - Attachment URLs MUST accept Cloudinary resource types `image`, `video`, and `raw` and include a version segment (`/v{number}/`).
  - Allowed extensions (canonical allowlist): .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3.
- **Impact**:
  - Update Attachment `fileUrl` regex to allow `image|video|raw` with version segment.
  - Frontend validation and upload dropzone must enforce the allowlist; UI helper text may list common types but must not contradict the canonical allowlist.

## 6. Functional Requirements (System SHALL Statements)

The system SHALL satisfy the following functional requirements.

### 6.1 Layout and Navigation

1. When a user accesses any protected page, the system shall display the DashboardLayout with Header, Sidebar, and main content area.
2. On xs and sm screens (width < 900), the system shall display a temporary drawer sidebar that opens on menu button click.
3. On md and larger screens (width >= 900), the system shall display a permanent sidebar that is always visible.
4. When a user clicks the menu icon on mobile, the system shall toggle the sidebar drawer open/closed.
5. When a user navigates to a different page on mobile, the system shall automatically close the sidebar drawer.
6. On xs screens (width < 600), the system shall display a bottom navigation bar with 4 navigation items and a centered FAB.
7. On sm and larger screens, the system shall hide the bottom navigation bar.
8. The Header shall display the page title, organization switcher (Platform SuperAdmin only), notification bell, theme toggle, search, and user menu (logo is in the sidebar header per CAN-024).
9. The Sidebar shall display navigation menu items, version number, and organization/department context; if `isHod=true`, the sidebar shall include a department selector (CAN-009).
10. The main content area shall have proper spacing, overflow handling, and responsive padding.

### 6.2 Bottom Navigation (Mobile)

11. On xs screens, the system shall display a bottom navigation bar fixed at the bottom of the screen.
12. The bottom navigation bar shall contain exactly 4 navigation items: Dashboard, Tasks, Users, Profile.
13. The bottom navigation bar shall have a centered FAB positioned absolutely in the middle.
14. The FAB shall display an Add icon and use the primary theme color.
15. When a user clicks a bottom navigation item, the system shall navigate to the corresponding page.
16. When a user clicks the FAB, the system shall open a dialog or menu for creating new items.
17. When a user clicks the Profile navigation item, the system shall open a menu with additional navigation options (Departments, Materials, Vendors) and profile actions.
18. The active navigation item shall be highlighted with the primary color.
19. The bottom navigation bar shall have a minimum height of 56px with proper touch targets (44x44px minimum).
20. On sm and larger screens, the bottom navigation bar shall be hidden completely.

### 6.3 Tasks List

21. When a user navigates to /dashboard/tasks, the system shall display a list of tasks with pagination and tabs: **All Tasks**, **Assigned to Me**, **Completed**.
22. The system shall support both List view (cards) and Grid view (`MuiDataGrid`) for tasks, showing title, status, priority, assignees, due date, and action buttons; the header shall include a view toggle (grid/list) and Grid view shall include row-selection checkboxes.
23. When a user types in the search field, the system shall filter tasks by title or description in real-time with debounce.
24. When a user clicks the filter button, the system shall display a collapsible filter panel with status, priority, date range, department, task type, assignment, tags, and deleted toggle filters.
25. When a user applies filters, the system shall update the task list to show only matching tasks.
26. When a user clicks the "Create Task" button, the system shall open a dialog for creating a new task.
27. When a user clicks a task row or card, the system shall navigate to the task detail page.
28. When a user clicks the edit button on a task, the system shall open a dialog for editing the task.
29. When a user clicks the delete button on a task, the system shall show a confirmation dialog and soft delete the task on confirmation.
30. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted tasks from the list.
31. When a deleted task is displayed, the system shall show a "Restore" button instead of a "Delete" button.
32. When a user clicks the "Restore" button, the system shall restore the soft-deleted task.
33. The system shall display loading skeletons while fetching tasks.
34. When no tasks are found, the system shall display an empty state with a message and "Create Task" button.
35. When an API error occurs, the system shall display an error message with a retry button.

### 6.4 Task Details

36. When a user navigates to /dashboard/tasks/:taskId, the system shall display the task detail page.
37. The system shall display task overview section with title, description, status, priority, type, dates, assignees, watchers, and tags.
38. When the task is a ProjectTask, the system shall display vendor information and milestones.
39. When the task is a RoutineTask, the system shall display recurrence information and schedule.
40. When the task is an AssignedTask, the system shall display assignment information and completion status.
41. The system shall display a related activities section with a timeline of task activities.
42. The system shall display a comments section with threaded comments (max depth 5).
43. The system shall display an attachments section with file previews and download links.
44. When a user clicks the "Edit" button, the system shall open a dialog for editing the task.
45. When a user clicks the "Delete" button, the system shall show a confirmation dialog and soft delete the task on confirmation.
46. When the task is deleted, the system shall show a "Restore" button instead of a "Delete" button.
47. When a user clicks the "Back" button, the system shall navigate back to the tasks list page.
48. The system shall display loading skeletons while fetching task details.
49. When the task is not found, the system shall display a 404 error message.
50. When an API error occurs, the system shall display an error message with a retry button.

### 6.5 Vendors List and Detail

51. When a user navigates to /dashboard/vendors, the system shall display a list of vendors with pagination.
52. The system shall display vendors as Grid view (`MuiDataGrid`) rows with vendor name, contact info (email + phone), rating, projects (active/total), optional partner badge, and action buttons (View/Edit/Delete/Restore).
53. When a user types in the search field, the system shall filter vendors by name, email, or phone in real-time.
54. When a user clicks the filter button, the system shall display a collapsible filter panel with status, rating, and deleted toggle filters.
55. When a user applies filters, the system shall update the vendor list to show only matching vendors.
56. When a user clicks the "Create Vendor" button, the system shall open a dialog for creating a new vendor.
57. When a user clicks a vendor row or card, the system shall navigate to the vendor detail page.
58. When a user clicks the edit button on a vendor, the system shall open a dialog for editing the vendor.
59. When a user clicks the delete button on a vendor, the system shall show a confirmation dialog; on confirmation, the backend shall validate the vendor is not associated with any ProjectTasks (including soft-deleted) (CAN-015). If associated, the API shall return 409 CONFLICT_ERROR and the UI shall show the error; otherwise the vendor shall be soft-deleted.
60. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted vendors from the list.
61. When a deleted vendor is displayed, the system shall show a "Restore" button instead of a "Delete" button.
62. When a user clicks the "Restore" button, the system shall restore the soft-deleted vendor.
63. The system shall display loading skeletons while fetching vendors.
64. When no vendors are found, the system shall display an empty state with a message and "Create Vendor" button.
65. When an API error occurs, the system shall display an error message with a retry button.
66. When a user navigates to /dashboard/vendors/:vendorId, the system shall display the vendor detail page.
67. The system shall display vendor overview section with name, rating, verified partner badge (if applicable), contact info (email/phone/website/location), address (optional), status, and description (optional).
68. The system shall display a related projects section with a list of ProjectTasks assigned to this vendor.
69. The system shall display a performance metrics section with total projects, active/in-progress projects, completed projects, on-time delivery rate, average project duration, and total spend (derived from project material usage costs).
70. When a user clicks the "Edit" button, the system shall open a dialog for editing the vendor; when a user clicks "Contact Vendor", the system shall open a dialog to compose an email and send it via the backend email service (role-gated).
71. When a user clicks the "Delete" button, the system shall show a confirmation dialog; on confirmation, the backend shall validate the vendor is not associated with any ProjectTasks (including soft-deleted) (CAN-015). If associated, the API shall return 409 CONFLICT_ERROR and the UI shall show the error; otherwise the vendor shall be soft-deleted.
72. When the vendor is deleted, the system shall show a "Restore" button instead of a "Delete" button.
73. When a user clicks the "Back" button, the system shall navigate back to the vendors list page.
74. The system shall display loading skeletons while fetching vendor details.
75. When the vendor is not found, the system shall display a 404 error message.
76. When an API error occurs, the system shall display an error message with a retry button.

### 6.6 Materials List and Detail

77. When a user navigates to /dashboard/materials, the system shall display a list of materials with pagination.
78. The system shall display materials as Grid view (`MuiDataGrid`) rows with name + SKU, category, unit, unit price, created by, and action buttons; inventory stock and low-stock indicators must be available as optional columns and in the detail view (CAN-019).
79. When a user types in the search field, the system shall filter materials by name or category in real-time.
80. When a user clicks the filter button, the system shall display a collapsible filter panel with category, status, low-stock toggle, date range, and deleted toggle filters.
81. When a user applies filters, the system shall update the material list to show only matching materials.
82. When a user clicks the "Create Material" button, the system shall open a dialog for creating a new material.
83. When a user clicks a material row or card, the system shall navigate to the material detail page.
84. When a user clicks the edit button on a material, the system shall open a dialog for editing the material.
85. When a user clicks the delete button on a material, the system shall show a confirmation dialog; on confirmation, the backend shall validate the material is not associated with any RoutineTask.materials or TaskActivity.materials (including soft-deleted) (CAN-015). If associated, the API shall return 409 CONFLICT_ERROR; otherwise the material shall be soft-deleted.
86. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted materials from the list.
87. When a deleted material is displayed, the system shall show a "Restore" button instead of a "Delete" button.
88. When a user clicks the "Restore" button, the system shall restore the soft-deleted material.
89. The system shall display loading skeletons while fetching materials.
90. When no materials are found, the system shall display an empty state with a message and "Create Material" button.
91. When an API error occurs, the system shall display an error message with a retry button.
92. When a user navigates to /dashboard/materials/:materialId, the system shall display the material detail page.
93. The system shall display material overview section with name, status, SKU, category, unit, unit price, inventory stock and low-stock state, created by, and created date.
94. The system shall display a related activities section with a list of TaskActivities that used this material.
95. The system shall display a usage statistics section with total quantity used, usage count, associated tasks count, and usage rate; inventory stock must be included and shown as “Stock Level”.
96. When a user clicks the "Edit" button, the system shall open a dialog for editing the material; when a user clicks "Restock", the system shall open a dialog to add quantity and update inventory stock (CAN-019).
97. When a user clicks the "Delete" button, the system shall show a confirmation dialog; on confirmation, the backend shall validate the material is not associated with any RoutineTask.materials or TaskActivity.materials (including soft-deleted) (CAN-015). If associated, the API shall return 409 CONFLICT_ERROR and the UI shall show the error; otherwise the material shall be soft-deleted.
98. When the material is deleted, the system shall show a "Restore" button instead of a "Delete" button.
99. When a user clicks the "Back" button, the system shall navigate back to the materials list page.
100.  The system shall display loading skeletons while fetching material details.
101.  When the material is not found, the system shall display a 404 error message.
102.  When an API error occurs, the system shall display an error message with a retry button.

### 6.7 Users List and Detail

103. When a user navigates to /dashboard/users, the system shall display a list of users with pagination.
104. The system shall support both List view (cards) and Grid view (`MuiDataGrid`) for users, showing name, email, role, department, status, and action buttons.
105. When a user types in the search field, the system shall filter users by name, email, or employee ID in real-time.
106. When a user clicks the filter button, the system shall display a collapsible filter panel with role, department, status, and deleted toggle filters.
107. When a user applies filters, the system shall update the user list to show only matching users.
108. When a user clicks the "Create User" button, the system shall open a dialog for creating a new user; on successful creation, the system shall auto-verify the new user (CAN-008) and send a welcome email containing a one-time password setup link.
109. When a user clicks a user row or card, the system shall navigate to the user detail page.
110. When a user clicks the edit button on a user, the system shall open a dialog for editing the user; for target users with role Admin/Manager/User (platform or customer org), the fields department, role, employeeId, joinedAt, and isHod must be read-only in the UI and rejected by the API with 409 CONFLICT_ERROR if attempted (CAN-016).
111. When a user clicks the delete button on a user, the system shall show a confirmation dialog and soft delete the user on confirmation.
112. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted users from the list.
113. When a deleted user is displayed, the system shall show a "Restore" button instead of a "Delete" button.
114. When a user clicks the "Restore" button, the system shall restore the soft-deleted user.
115. The system shall display loading skeletons while fetching users.
116. When no users are found, the system shall display an empty state with a message and "Create User" button.
117. When an API error occurs, the system shall display an error message with a retry button.
118. When a user navigates to /dashboard/users/:userId, the system shall display the user detail page.
119. The system shall display user overview section with profile picture, name, email, phone, employee ID, role, department, position, and status.
120. The system shall display a skills section with skill names and proficiency percentages.
121. The system shall display an assigned tasks section with a list of tasks assigned to this user.
122. The system shall display a created tasks section with a list of tasks created by this user.
123. The system shall display an activity timeline section with recent activities by this user.
124. When a user clicks the "Edit" button, the system shall open a dialog for editing the user.
125. When a user clicks the "Delete" button, the system shall show a confirmation dialog and soft delete the user on confirmation.
126. When the user is deleted, the system shall show a "Restore" button instead of a "Delete" button.
127. When a user clicks the "Back" button, the system shall navigate back to the users list page.
128. The system shall display loading skeletons while fetching user details.
129. When the user is not found, the system shall display a 404 error message.
130. When an API error occurs, the system shall display an error message with a retry button.

### 6.8 Departments List and Detail

131. When a user navigates to /dashboard/departments, the system shall display a list of departments with pagination.
132. The system shall support both List view (cards) and Grid view (`MuiDataGrid`) for departments, showing name, description, HOD, member count, and action buttons.
133. When a user types in the search field, the system shall filter departments by name or description in real-time.
134. When a user clicks the filter button, the system shall display a collapsible filter panel with Department Name search, status, manager/HOD, member count range, date added range, organization (platform only), and include deleted toggle filters.
135. When a user applies filters, the system shall update the department list to show only matching departments.
136. When a user clicks the "Create Department" button, the system shall open a dialog for creating a new department.
137. When a user clicks a department row or card, the system shall navigate to the department detail page.
138. When a user clicks the edit button on a department, the system shall open a dialog for editing the department.
139. When a user clicks the delete button on a department, the system shall show a confirmation dialog and soft delete the department on confirmation.
140. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted departments from the list.
141. When a deleted department is displayed, the system shall show a "Restore" button instead of a "Delete" button.
142. When a user clicks the "Restore" button, the system shall restore the soft-deleted department.
143. The system shall display loading skeletons while fetching departments.
144. When no departments are found, the system shall display an empty state with a message and "Create Department" button.
145. When an API error occurs, the system shall display an error message with a retry button.
146. When a user navigates to /dashboard/departments/:departmentId, the system shall display the department detail page.
147. The system shall display a department header section with name, description, manager/HOD, organization, creation date, and summary stats (total users, total tasks, active tasks).
148. The system shall display a department selector in the sidebar (HOD only) for roles permitted to view other departments in the same organization, enabling navigation between departments.
149. The system shall display department details top-level tabs: Overview, Members, Tasks (CAN-018). The Tasks tab shall include sub-tabs for All Activity, Tasks, Comments, and Files.
150. The system shall display department dashboard analytics in the Overview tab, show department-scoped users in the Members tab, and show department-scoped tasks plus the activity feed sub-tabs within the Tasks tab.
151. When a user clicks the "Edit" button, the system shall open a dialog for editing the department.
152. When a user clicks the "Delete" button, the system shall show a confirmation dialog and soft delete the department on confirmation.
153. When the department is deleted, the system shall show a "Restore" button instead of a "Delete" button.
154. When a user clicks the "Back" button, the system shall navigate back to the departments list page.
155. The system shall display loading skeletons while fetching department details.
156. When the department is not found, the system shall display a 404 error message.
157. When an API error occurs, the system shall display an error message with a retry button.

### 6.9 Dashboard

158. When a user navigates to /dashboard, the system shall display the dashboard overview page.
159. The system shall display a welcome message with the user's name and current date.
160. The system shall display statistics cards showing total tasks, pending tasks, completed tasks, and team members.
161. The system shall display a tasks by status chart (pie chart).
162. The system shall display a tasks by priority chart (bar chart).
163. The system shall display a tasks timeline chart (line chart).
164. The system shall display a recent activity section with latest task activities, comments, and updates.
165. The system shall display a quick actions section with buttons for creating tasks, users, and viewing reports.
166. The system shall display an upcoming deadlines section with tasks due in the next 7 days.
167. The system shall display a team performance section with top performers and completion rates.
168. The system shall update statistics and charts in real-time when data changes.
169. The system shall display loading skeletons while fetching dashboard data.
170. When an API error occurs, the system shall display an error message with a retry button.
171. The system shall adapt the layout for mobile, tablet, and desktop screen sizes.
172. When a user clicks a statistic card, the system shall navigate to the corresponding filtered list page.

### 6.10 Authorization and Access Control

173. The system shall enforce authorization checks on all protected pages based on the authorization matrix.
174. When a user lacks permission to view a page, the system shall display a toast notification only (403) and redirect the user to the nearest safe page (e.g., previous route or dashboard) without rendering a dedicated Forbidden page.
175. When a user lacks permission to perform an action, the system shall hide or disable the corresponding UI element.
176. The system shall show the "Create" button only to users with create permission for the resource.
177. The system shall show the "Edit" button only to users with update permission for the resource.
178. The system shall show the "Delete" button only to users with delete permission for the resource.
179. The system shall show the "Restore" button only to users with restore permission for the resource.
180. When a Platform SuperAdmin views any page, the system shall allow cross-organization access for read operations where allowed by the matrix.
181. When a Customer SuperAdmin views any page, the system shall restrict access to their own organization only.
182. When an Admin views any page, the system shall restrict access to their own department and allow read access to other departments in the same organization.
183. When a Manager views any page, the system shall restrict access to their own resources and department.
184. When a User views any page, the system shall restrict access to their own resources only.
185. The system shall check ownership for "own" permissions using ownership fields (createdBy, assignees, watchers, recipients, uploadedBy).
186. The system shall check department scope for "ownDept" permissions.
187. The system shall check organization scope for "crossDept" and "crossOrg" permissions.

### 6.11 Real-Time Updates

188. When a task is created by another user, the system shall automatically add it to the tasks list without requiring a page refresh.
189. When a task is updated by another user, the system shall automatically update the task in the list and detail pages.
190. When a task is deleted by another user, the system shall automatically remove it from the list or mark it as deleted.
191. When a comment is added to a task, the system shall automatically display it in the comments section.
192. When a notification is created, the system shall automatically update the notification bell badge count.
193. The system shall use Socket.IO for real-time updates.
194. The system shall invalidate RTK Query cache tags when real-time updates are received.
195. The system shall display a toast notification when a real-time update affects the current page.
196. The system shall handle socket connection errors gracefully and attempt to reconnect.
197. The system shall display a connection status indicator when the socket is disconnected.

### 6.12 Responsive Behavior

198. When the screen width is xs (0-599), the system shall display a single-column layout with stacked elements.
199. When the screen width is sm (600-899), the system shall display a two-column layout where appropriate.
200. When the screen width is md (900-1199), the system shall display a two- or three-column layout where appropriate.
201. When the screen width is lg (1200-1535), the system shall display a three- or four-column layout where appropriate.
202. When the screen width is xl (1536+), the system shall display an optimal layout with max-width constraints.
203. The system shall use responsive font sizes that scale appropriately for each breakpoint.
204. The system shall use responsive spacing that adjusts for each breakpoint.
205. The system shall hide the sidebar on xs and sm, showing a temporary drawer instead.
206. The system shall show the bottom navigation on xs only, hiding it on sm+.
207. The system shall adjust `MuiDataGrid` columns for mobile, hiding less important columns.
208. The system shall use touch-friendly button sizes (minimum 44x44px) on mobile.
209. The system shall support touch gestures (swipe, tap, long press) on mobile.
210. The system shall optimize images and assets for mobile devices.
211. The system shall use responsive breakpoints from the MUI theme (xs, sm, md, lg, xl).
212. The system shall test all pages on mobile, tablet, and desktop screen sizes.
213. The system shall ensure all interactive elements are accessible via keyboard and touch.

### 6.13 Loading and Error Feedback

214. When data is being fetched, the system shall display loading skeletons that match the expected content layout.
215. When a list is loading, the system shall display skeleton rows or cards.
216. When a detail page is loading, the system shall display skeleton sections.
217. When a form is submitting, the system shall disable the submit button and show a loading indicator.
218. When an API error occurs, the system shall display an error message with the error details.
219. When a network error occurs, the system shall display a "Network Error" message with a retry button.
220. When a 404 error occurs, the system shall display a "Not Found" message with a back button.
221. When a 403 error occurs, the system shall display a toast notification only and MUST NOT render a dedicated Forbidden page.
222. When a 401 error occurs, the system shall automatically logout the user and redirect to login.
223. The system shall use the MuiLoading component for loading indicators.
224. The system shall use the ErrorDisplay component for error messages.
225. The system shall use the ApiErrorDisplay component for API error messages.
226. The system shall use the MuiEmptyState component for empty states.
227. The system shall provide a retry button for recoverable errors.
228. The system shall log errors to the console for debugging purposes.

### 6.14 Form Validation

229. When a user enters data in a form field, the system shall validate the input in real-time.
230. When a user submits a form with invalid data, the system shall prevent submission and display error messages.
231. The system shall display field-level error messages below each invalid field.
232. The system shall highlight invalid fields with error color and border.
233. The system shall use the same validation rules as the backend validators.
234. The system shall validate email format using the email pattern from constants.
235. The system shall validate phone format using the phone pattern from constants.
236. The system shall validate string length using min/max length from constants.
237. The system shall validate required fields before allowing submission.
238. The system shall validate date ranges (start date before end date).
239. The system shall validate number ranges (min/max values).
240. The system shall validate array lengths (min/max items).
241. The system shall use react-hook-form for form state management.
242. The system shall use the Controller component for complex form fields.
243. The system shall clear error messages when the user corrects the input.

### 6.15 Accessibility

244. The system shall provide keyboard navigation for all interactive elements.
245. The system shall support Tab key for moving forward through interactive elements.
246. The system shall support Shift+Tab for moving backward through interactive elements.
247. The system shall support Enter key for activating buttons and links.
248. The system shall support Escape key for closing dialogs and menus.
249. The system shall support Arrow keys for navigating lists and menus.
250. The system shall provide visible focus indicators for all interactive elements.
251. The system shall provide ARIA labels for all interactive elements.
252. The system shall provide ARIA roles for semantic elements (navigation, main, button, etc.).
253. The system shall provide ARIA states for dynamic elements (aria-expanded, aria-selected, aria-checked).
254. The system shall provide descriptive alt text for all images.
255. The system shall provide screen reader text for icon-only buttons.
256. The system shall ensure color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
257. The system shall provide skip links for keyboard users to skip navigation.
258. The system shall announce dynamic content changes to screen readers using ARIA live regions.

### 6.16 Performance

259. The system shall lazy load all page components to reduce initial bundle size.
260. The system shall use React.memo for expensive components to prevent unnecessary re-renders.
261. The system shall use useCallback for event handlers to prevent function recreation.
262. The system shall use useMemo for expensive computations to cache results.
263. The system shall use RTK Query caching to avoid redundant API calls.
264. The system shall invalidate cache tags when data changes to ensure fresh data.
265. The system shall use pagination to limit the number of items loaded at once.
266. The system shall use virtual scrolling for long lists when needed.
267. The system shall optimize images using appropriate formats and sizes.
268. The system shall use tree-shakable MUI imports to reduce bundle size.
269. The system shall minimize the number of re-renders by using proper state management.
270. The system shall debounce search input to reduce API calls.
271. The system shall use loading skeletons to improve perceived performance.
272. The system shall measure and optimize Core Web Vitals (LCP, FID, CLS).
273. The system shall ensure the initial page load is under 3 seconds on 3G networks.

## 7. Data Models and Validation Rules

All models use soft delete: isDeleted (default false), deletedAt (null when not deleted), deletedBy (null when not deleted). All dates are stored in UTC. Sensitive fields must be select:false (password, refreshToken, refreshTokenExpiry, passwordResetToken, passwordResetExpiry, and any other sensitive fields).

### 7.1 Organization

Fields and validation:

- name: required (message "Organization name is required"), 2-100, pattern /^[a-zA-Z0-9\\s\\-&.,'()]+$/
- description: optional, max 1000
- email: required (message "Organization email is required"), max 100, pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
- isVerified: required, boolean
  - Platform organization: default true (seeded).
  - Customer organization: default false until initial registration verification completes (CAN-008).
- verifiedAt: optional Date (set when onboarding verification succeeds)
- phone: required (message "Organization phone is required"), min 10, max 15, pattern /^(\\+251\\d{9}|0\\d{9})$/
- address: required (message "Organization address is required"), min 5, max 500
- industry: required (message "Industry is required"), enum:
  Technology, Healthcare, Finance, Education, Retail, Manufacturing, Construction, Hospitality, Transportation, Real Estate, Agriculture, Energy, Telecommunications, Media, Entertainment, Legal, Consulting, Insurance, Automotive, Aerospace, Pharmaceutical, Food & Beverage, Government, Non-Profit
- size: required (message "Organization size is required"), enum: Small, Medium, Large
- logo.url: optional, pattern /^https:\\/\\/res\\.cloudinary\\.com\\/.+$/
- logo.publicId: optional, max 255
- createdBy: ref User
- isPlatformOrg: default false

### 7.2 Department

- name: required (message "Department name is required"), 2-100, pattern /^[a-zA-Z0-9\\s\\-&.,'()]+$/
- description: required (message "Department description is required"), max 500
- status: required, enum `ACTIVE | INACTIVE`, default `ACTIVE`
  - `INACTIVE` departments:
    - MUST be excluded from department selector dropdowns by default (unless `includeInactive=true` is explicitly used by SuperAdmin for auditing).
    - MUST NOT allow creation of new users/tasks/materials in that department (409 CONFLICT_ERROR with message "Department is inactive").
- organization: required (message "Organization is required"), ref Organization
- manager: optional ref User
- createdBy: ref User

### 7.3 User

- firstName: required (message "First name is required"), 2-50, pattern /^[a-zA-Z\\s\\-']+$/
- lastName: required (message "Last name is required"), 2-50, pattern /^[a-zA-Z\\s\\-']+$/
- position: required (message "Position is required"), 2-100, pattern /^[a-zA-Z\\s\\-']+$/
- email: required (message "Email is required"), max 100, pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
- isVerified: required, boolean
  - For the initial customer organization registration user: default false until email verification completes (CAN-008).
  - For users created by an organization SuperAdmin: auto-verified (default true) (CAN-008).
- status: required, enum `ACTIVE | INACTIVE`, default `ACTIVE`
  - `INACTIVE` users:
    - MUST be denied login and refresh (403 UNAUTHORIZED_ERROR with message "Account is inactive").
    - MUST be excluded from assignee/watchers pickers by default (unless an explicit `includeInactive=true` query param is used by admins for auditing).
- password: required (message "Password is required"), 8-128, select:false
- role: required (message "Role is required"), enum SuperAdmin, Admin, Manager, User; default User
- organization: required (message "Organization is required"), ref Organization
- department: required (message "Department is required"), ref Department
- isPlatformOrgUser: default false
- isHod: default false
- profilePicture.url: optional, pattern /^https:\\/\\/res\\.cloudinary\\.com\\/.+$/
- profilePicture.publicId: optional, max 255
- skills: max 10 entries, each:
  - skill: max 50
  - percentage: 0-100
- employeeId: optional, pattern /^(?!0000)\\d{4}$/
- phone: optional, min 10, max 15, pattern /^(\\+251\\d{9}|0\\d{9})$/
- dateOfBirth: must not be future
- joinedAt: required (message "Joined date is required"), must not be future
- refreshToken: select:false
- refreshTokenExpiry: select:false
- passwordResetToken: select:false
- passwordResetExpiry: select:false
- emailVerificationToken: select:false (present only for initial onboarding verification flow)
- emailVerificationExpiry: select:false (present only for initial onboarding verification flow)
- emailVerifiedAt: optional Date (set when verification succeeds)
- welcomeEmailSentAt: optional Date (used to enforce “send welcome email once” idempotency)
- preferences: required object (defaulted at user creation), shape:
  - notifications:
    - browserEnabled: boolean (default false; requires browser permission)
    - emailEnabled: boolean (default true)
    - inAppEnabled: boolean (default true)
    - emailEvents (default all true):
      - task: boolean (created/updated/completed/overdue)
      - activity: boolean (TaskActivity created/updated)
      - comment: boolean (TaskComment created/updated/reply)
      - mention: boolean (mentions)
      - user: boolean (user created/updated)
      - material: boolean (material created/updated)
      - vendor: boolean (vendor created/updated)
    - inAppEvents (default all true): same keys as emailEvents
  - appearance:
    - themeMode: enum `LIGHT | DARK | SYSTEM` (default `SYSTEM`)
    - language: string (BCP-47, default `en`)
    - dateFormat: enum `MDY | DMY | YMD` (default `MDY`)
    - timeFormat: enum `12H | 24H` (default `12H`)
    - timezone: string (IANA TZ, optional; default `UTC`; used only for display; storage remains UTC)
- security: required object (defaulted at user creation), shape:
  - twoFactorEnabled: boolean (default false)
- lastLogin: default null

### 7.4 Task (Base)

- title: required (message "Project task title is required"), 3-200
- description: required (message "Task description is required"), 10-5000
- status: required (message "Task status is required"), enum TODO, IN_PROGRESS, COMPLETED, PENDING; default TODO
- priority: required (message "Task priority is required"), enum LOW, MEDIUM, HIGH, URGENT; default MEDIUM
- organization: required (message "Organization is required"), ref Organization
- department: required (message "Department is required"), ref Department
- createdBy: required (message "Created by user is required"), ref User
- attachments: ref Attachment
- watchers: ref User, unique
- tags: max 5, each max 50, lowercase, unique case-insensitive

### 7.5 ProjectTask

- vendor: required (message "Vendor is required for project tasks"), ref Vendor
- startDate: required (message "Start date is required for project tasks")
- dueDate: required (message "Due date is required for project tasks"), must be after startDate

### 7.6 AssignedTask

- assignees: required (message "At least one assignee is required"), ref User, min 1, max 50, unique
- startDate: required (message "Start date is required for assigned tasks")
- dueDate: required (message "Due date is required for assigned tasks"), must be after startDate
- assignees must belong to the same organization as the task

### 7.7 RoutineTask

- date: required (message "Date is required for routine tasks") (specific date for routine task)
- materials: max 20, each:
  - material: required (message "Material reference is required when adding materials"), ref Material
  - quantity: required (message "Material quantity is required when adding materials"), min 0
  - validation: unique materials, all quantities > 0
  - inventory rule (CAN-019): recording RoutineTask materials MUST update Material inventory in the same DB session:
    - for each material, decrement `inventory.stockOnHand` by `quantity`
    - if any material would go below 0, the API MUST reject with 409 CONFLICT_ERROR ("Insufficient stock") and include the offending material ids/sku in the error details

### 7.8 TaskActivity

- activity: required (message "Activity description is required"), 2-1000
- parent: required (message "Parent reference is required"), refPath parentModel
- parentModel: required (message "Parent model is required"), enum:
  - Task (ProjectTask, AssignedTask)
  - TaskActivity
  - TaskComment
- createdBy: required (message "Created by user is required"), ref User
- organization: required (message "Organization is required"), ref Organization
- department: required (message "Department is required"), ref Department
- materials: max 20, each:
  - material: required (message "Material reference is required when adding materials"), ref Material
  - quantity: required (message "Material quantity is required when adding materials"), min 0
  - validation: unique materials, all quantities > 0
  - materials must belong to the same organization and department as the activity
  - inventory rule (CAN-019): recording TaskActivity materials MUST decrement Material inventory in the same DB session using the same rules as RoutineTask materials
- attachments: ref Attachment, max 20

### 7.9 TaskComment

- comment: required (message "Comment content is required"), 2-2000
- parent: required (message "Parent reference is required"), refPath parentModel
- parentModel: required (message "Parent model is required"), enum:
  - Task (ProjectTask, AssignedTask, RoutineTask)
  - TaskActivity
  - TaskComment
- mentions: ref User, max 20
- createdBy: required (message "Created by user is required"), ref User
- department: required (message "Department is required"), ref Department
- organization: required (message "Organization is required"), ref Organization
- depth: min 0, max 5, default 0
- attachments: ref Attachment

### 7.10 Material

- name: required (message "Material name is required"), 2-200
- name must be unique per department (case-insensitive)
- sku: required (message "SKU is required"), 2-30, pattern `/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/`
  - sku must be stored uppercase
  - sku must be unique per department (case-insensitive)
- status: required, enum `ACTIVE | INACTIVE`, default `ACTIVE`
- description: optional, max 1000
- unit: required (message "Unit is required"), 1-50
- category: required (message "Category is required"), enum Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other; default Other
- price (unitPrice): min 0, default 0
- inventory: required object (defaulted at create), shape:
  - stockOnHand: number, min 0, default 0
  - lowStockThreshold: number, min 0, default 0
  - lastRestockedAt: optional Date
- organization: required (message "Organization is required"), ref Organization
- department: required (message "Department is required"), ref Department
- createdBy: required (message "Created by user is required"), ref User

### 7.11 Vendor

- name: required (message "Vendor name is required"), 2-200
- name must be unique per organization
- email: required (message "Vendor email is required"), max 100, pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
- email must be unique per organization
- phone: required (message "Vendor phone is required"), min 10, max 15, pattern /^(\\+251\\d{9}|0\\d{9})$/
- phone must be unique per organization
- website: optional, max 255 (must be a valid URL when present)
- location: optional, max 200 (e.g., "Addis Ababa, Ethiopia")
- organization: required (message "Organization is required"), ref Organization
- vendor is organization-scoped only (no department scoping)
- createdBy: required (message "Created by user is required"), ref User
- status: required, enum `ACTIVE | INACTIVE`, default `ACTIVE`
- isVerifiedPartner: required boolean, default false
- rating: min 1, max 5, default null
- ratingCount: derived integer (count of rated completed ProjectTasks) (not stored unless required for performance)
- address: optional, max 500
- description: optional, max 1000

### 7.12 Attachment

- filename: required (message "File name is required"), 1-255
- fileUrl: required (message "File URL is required"), pattern /^https:\\/\\/res\\.cloudinary\\.com\\/[a-zA-Z0-9_-]+\\/(image|video|raw)\\/upload\\/v\\d+\\/.+$/ (CAN-027)
- fileType: required (message "File type is required"), enum Image, Video, Document, Audio, Other
- fileSize: required (message "File size is required"), min 0, max 10485760 (10MB)
- parent: required (message "Parent reference is required")
- parentModel: required (message "Parent model is required"), enum:
  - Task (ProjectTask, AssignedTask, RoutineTask)
  - TaskActivity
  - TaskComment
- uploadedBy: required (message "Uploaded by user is required"), ref User
- department: required (message "Department is required"), ref Department
- organization: required (message "Organization is required"), ref Organization

### 7.13 Notification

- title: required (message "Notification title is required"), max 200
- message: required (message "Notification message is required"), 1-500
- entity: optional, refPath entityModel, default null
- entityModel: optional, default null, enum:
  Task (ProjectTask, AssignedTask, RoutineTask), TaskActivity, TaskComment, User, Organization, Department, Material, Vendor
- organization: required (message "Organization is required"), ref Organization
- department: required (message "Department is required"), ref Department
- isRead: default false
- expiresAt: default Date.now + 30 days

### 7.14 Validation Rules and Scoping

- Validators must execute via .run(req) and validate with validationResult(req).
- For create operations, existence checks must use withDeleted() to prevent restore conflicts.
- For restore operations, existence checks must use withDeleted().
- All params-based validators must check existence.
- Department and vendor validators must be scoped by req.user.organization.\_id.
- User, task (all types), material, task activity, task comment, attachment, and notification validators must be scoped by req.user.organization.\_id and req.user.department.\_id.
- Validation failures must assert field name, error message, and failure reason (missing, invalid, not found, conflict, unauthorized scope).

### 7.15 TTL Expiry Periods

- Organization: Never (manual only)
- Department: 365 days (1 year)
- User: 365 days (1 year)
- Task: 180 days (6 months)
- TaskActivity: 90 days (3 months)
- TaskComment: 180 days (6 months)
- Material: 90 days (3 months)
- Vendor: 90 days (3 months)
- Notification: 30 days (1 month)
- Attachment: 30 days (1 month)

TTL table:
| Model | TTL Period | Auto-Delete After |
| ------------ | ---------- | ------------------ |
| Organization | Never | null (manual only) |
| Department | 365 days | 1 year |
| User | 365 days | 1 year |
| Task | 180 days | 6 months |
| TaskActivity | 90 days | 3 months |
| TaskComment | 180 days | 6 months |
| Material | 90 days | 3 months |
| Vendor | 90 days | 3 months |
| Notification | 30 days | 1 month |
| Attachment | 30 days | 1 month |

## 8. Authorization and Access Control

### 8.1 Authorization Rule

- Each operation on a resource is defined as an array of rules.
- Authorization is granted if ANY rule passes.

Rule fields:

- roles: string[]
- requires: string[] (optional) boolean predicates on user/system context
- scope: string (optional) spatial relationship between user and target
- ownership: string[] (optional) relationship between user and target
- resourceType: string (optional) resource subtype

Evaluation order:

1. Role match
2. Requires predicates
3. Scope evaluation
4. Ownership evaluation
   If ANY rule passes, allow; otherwise deny.

Authorization flow:

1. Request reaches authorization middleware.
2. Extract user info from JWT (role, organization, department).
3. Check authorization matrix for permission.
4. Verify resource scope (organization, department).
5. Check ownership if required.
6. Allow or deny request.

### 8.2 Scope Vocabulary

- self: resource is the user itself
- ownOrg: target.organization == req.user.organization.\_id
- crossOrg: target.organization != req.user.organization.\_id
- ownOrg.ownDept: same organization and same department
- ownOrg.crossDept: same organization but different department
- any: no spatial restriction

Notes:

- Organization uses only ownOrg, crossOrg, self
- Vendor is org-level only
- Task/User/etc are dual-scoped resources

### 8.3 Ownership Vocabulary

- self
- createdBy
- uploadedBy
- assignees
- watchers
- mentioned
- manager
- isHod

### 8.4 Canonical Authorization Matrix (FINAL)

```json
{
  "__comment": "Single source of truth for authorization. Allow if ANY rule passes.",
  "Organization": {
    "read": [
      {
        "description": "SuperAdmins from platform organization can read any organization",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read their own organization",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg"
      }
    ],
    "update": [
      {
        "description": "Platform SuperAdmins can update organizations in other organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "crossOrg"
      },
      {
        "description": "Platform SuperAdmins can update their own platform organization",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "ownOrg"
      },
      {
        "description": "Non-platform SuperAdmins can update their own organization",
        "roles": ["SuperAdmin"],
        "requires": ["!isPlatformOrgUser"],
        "scope": "ownOrg"
      }
    ],
    "delete": [
      {
        "description": "Platform SuperAdmins can delete organizations in other organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "crossOrg"
      }
    ]
  },
  "Department": {
    "create": [
      {
        "description": "SuperAdmins can create departments in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins and Admins can read departments across organizations",
        "roles": ["SuperAdmin", "Admin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "crossOrg"
      },
      {
        "description": "SuperAdmins and Admins can read departments in their own organization",
        "roles": ["SuperAdmin", "Admin"],
        "scope": "ownOrg"
      },
      {
        "description": "Managers and Users can only read departments in their own department",
        "roles": ["Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "SuperAdmins can update departments in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      },
      {
        "description": "Admins can update departments in their own department",
        "roles": ["Admin"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete departments in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      }
    ]
  },
  "User": {
    "create": [
      {
        "description": "SuperAdmins can create users in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any user across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "SuperAdmins and Admins can read users in their own organization",
        "roles": ["SuperAdmin", "Admin"],
        "scope": "ownOrg"
      },
      {
        "description": "Managers and Users can only read users in their own department",
        "roles": ["Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "All users can update their own user profile",
        "roles": ["User", "Manager", "Admin", "SuperAdmin"],
        "ownership": ["self"]
      },
      {
        "description": "SuperAdmins and Admins can update any user in their own organization",
        "roles": ["SuperAdmin", "Admin"],
        "scope": "ownOrg"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete users in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      }
    ]
  },
  "Task": {
    "create": [
      {
        "description": "SuperAdmins and Admins can create ProjectTasks in their own department",
        "roles": ["SuperAdmin", "Admin"],
        "resourceType": "ProjectTask",
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "SuperAdmins, Admins, and Managers can create AssignedTasks in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager"],
        "resourceType": "AssignedTask",
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "All roles can create RoutineTasks in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "resourceType": "RoutineTask",
        "scope": "ownOrg.ownDept"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any task across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read tasks in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Users can read tasks where they are assignees or watchers",
        "roles": ["User"],
        "ownership": ["assignees", "watchers"]
      }
    ],
    "update": [
      {
        "description": "SuperAdmins and Admins can update ProjectTasks they created in their own department",
        "roles": ["SuperAdmin", "Admin"],
        "resourceType": "ProjectTask",
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "All roles can update AssignedTasks they created or are assigned to in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "resourceType": "AssignedTask",
        "ownership": ["createdBy", "assignees"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "All roles can update RoutineTasks they created in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "resourceType": "RoutineTask",
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Users can update tasks they are assigned to in their own department",
        "roles": ["User"],
        "ownership": ["assignees"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete tasks in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins can delete ProjectTasks they created in their own department",
        "roles": ["Admin"],
        "resourceType": "ProjectTask",
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins can delete AssignedTasks they created in their own department",
        "roles": ["Admin"],
        "resourceType": "AssignedTask",
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Managers and Users can delete AssignedTasks they are assigned to in their own department",
        "roles": ["Manager", "User"],
        "resourceType": "AssignedTask",
        "ownership": ["assignees"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins, Managers, and Users can delete RoutineTasks they created in their own department",
        "roles": ["Admin", "Manager", "User"],
        "resourceType": "RoutineTask",
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ]
  },
  "TaskActivity": {
    "create": [
      {
        "description": "All roles can create TaskActivity in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any TaskActivity across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read TaskActivity in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "SuperAdmins, Admins, and Managers can update TaskActivity they created in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete TaskActivity in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins and Managers can delete TaskActivity they created in their own department",
        "roles": ["Admin", "Manager"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ]
  },
  "TaskComment": {
    "create": [
      {
        "description": "All roles can create TaskComment in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any TaskComment across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read TaskComment in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "All roles can update TaskComment they created in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete TaskComment in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins, Managers, and Users can delete TaskComment they created in their own department",
        "roles": ["Admin", "Manager", "User"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ]
  },
  "Material": {
    "create": [
      {
        "description": "SuperAdmins, Admins, and Managers can create Materials in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any Material across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read Materials in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "SuperAdmins, Admins, and Managers can update Materials they created in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete Materials in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins and Managers can delete Materials they created in their own department",
        "roles": ["Admin", "Manager"],
        "ownership": ["createdBy"],
        "scope": "ownOrg.ownDept"
      }
    ]
  },
  "Vendor": {
    "create": [
      {
        "description": "Non-platform SuperAdmins and Admins can create Vendors in their own organization",
        "roles": ["SuperAdmin", "Admin"],
        "requires": ["!isPlatformOrgUser"],
        "scope": "ownOrg"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any vendor across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read vendors in their own organization",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg"
      }
    ],
    "update": [
      {
        "description": "SuperAdmins and Admins can update Vendors they created in their own organization",
        "roles": ["SuperAdmin", "Admin"],
        "ownership": ["createdBy"],
        "scope": "ownOrg"
      },
      {
        "description": "Managers can update Vendors they created in their own organization",
        "roles": ["Manager"],
        "ownership": ["createdBy"],
        "scope": "ownOrg"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete Vendors in their own organization",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg"
      },
      {
        "description": "Admins can delete Vendors they created in their own organization",
        "roles": ["Admin"],
        "ownership": ["createdBy"],
        "scope": "ownOrg"
      }
    ]
  },
  "Attachment": {
    "create": [
      {
        "description": "All roles can create Attachments in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "read": [
      {
        "description": "Platform SuperAdmins can read any Attachment across all organizations",
        "roles": ["SuperAdmin"],
        "requires": ["isPlatformOrgUser"],
        "scope": "any"
      },
      {
        "description": "All roles can read Attachments in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete Attachments in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      },
      {
        "description": "Admins, Managers, and Users can delete Attachments they uploaded in their own department",
        "roles": ["Admin", "Manager", "User"],
        "ownership": ["uploadedBy"],
        "scope": "ownOrg.ownDept"
      }
    ]
  },
  "Notification": {
    "read": [
      {
        "description": "All roles can read notifications in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "update": [
      {
        "description": "All roles can update notifications (e.g., mark as read) in their own department",
        "roles": ["SuperAdmin", "Admin", "Manager", "User"],
        "scope": "ownOrg.ownDept"
      }
    ],
    "delete": [
      {
        "description": "SuperAdmins can delete notifications in their own department",
        "roles": ["SuperAdmin"],
        "scope": "ownOrg.ownDept"
      }
    ]
  }
}
```

### 8.5 Role Scenarios and Permissions

Scenario 1: Platform SuperAdmin

- Can read all organizations and resources where matrix allows scope any.
- Can update or delete organizations only as allowed by Organization update/delete rules.
- Cannot delete platform organization.

Scenario 2: Organization SuperAdmin

- Full control within own organization.
- Can create/edit/delete departments and users in own org.
- Can manage vendors (org-level) and materials (dept-level).
- Cannot delete own organization.
- Cannot access other organizations.

Scenario 3: Department Admin

- Can read/update users in own organization; cannot delete users by default.
- Can create ProjectTasks in own department.
- Can update/delete tasks in own department based on task subtype and ownership.
- Can create/update/delete materials in own department based on ownership.
- Can create/update/delete vendors in own organization based on ownership.
- Can read other departments within same organization.
- Cannot access other organizations.

Scenario 4: Manager

- Can read tasks in own department.
- Can create AssignedTasks and RoutineTasks in own department.
- Can update AssignedTasks where assignee or creator.
- Can delete AssignedTasks where assignee; can delete RoutineTasks created by self.
- Can read users and materials in own department.
- Cannot create ProjectTasks.
- Cannot delete users or departments.

Scenario 5: User

- Can read all department tasks.
- Can read users and materials in own department.
- Can update own profile.
- Can create RoutineTasks in own department.
- Can update AssignedTasks where assignee.
- Can delete AssignedTasks where assignee and RoutineTasks created by self.
- Cannot create ProjectTasks or AssignedTasks.
- Cannot create/delete organizations, departments, users, materials, or vendors.

## 9. Multi-Tenant Rules (Platform vs Customer Organizations)

### Platform Organization

- isPlatformOrg: true
- All users are isPlatformOrgUser: true.
- Created during backend seeding.
- Platform organization cannot be deleted.
- Platform SuperAdmin can access customer organizations per authorization matrix.
- Seeding creates platform organization, platform department, and platform SuperAdmin user with isHod true.
- Seeding command: npm run seed.

### Customer Organization

- isPlatformOrg: false
- All users are isPlatformOrgUser: false.
- Created via onboarding/registration wizard (organization -> department -> user -> review/submit).
- First user: role SuperAdmin, isHod true, assigned as department manager, createdBy on organization.
- Organization creation has no standalone API route; it is only created through onboarding or seeding.
- Circular dependency resolution: organization, department, and user are created in sequence; manager and createdBy may be optional during initial create, then updated after user creation.
- User must be SuperAdmin or Admin to be assigned as HOD.
- Organization is created first but is not fully usable until department and first user are created.

### Multi-Tenant Isolation Rules

- Non-platform users cannot access other organizations.
- All operations must be scoped by organization and, where applicable, department.
- Department-level resources require organization + department scope.
- Vendor is org-level only.
- Platform organization is immutable and cannot be deleted.

Key differences summary:

- Platform org: created by seeding, isPlatformOrg true, users isPlatformOrgUser true, cross-org access per matrix, first user is Platform SuperAdmin + HOD.
- Customer org: created by onboarding, isPlatformOrg false, users isPlatformOrgUser false, access limited to own org, first user is Organization SuperAdmin + HOD.

## 10. UI/UX Requirements

Mandatory UI reference images and theming rules:

- **UI reference images are real assets**: Every screen reference name in Section 10 maps 1:1 to a PNG image under `docs/ui/*` using the naming convention: `docs/ui/<screen_reference_name>.png`.
- **What to reference from images**: Use the images for **visible UI structure and elements** only (layout regions, component types, control placement, table columns, dialogs, labels, and empty states).
- **What NOT to reference from images**: Do **not** derive colors, typography, shadows, spacing tokens, or any “theme” decisions from the images.
- **Theme source of truth**: All styling must use the existing MUI theme setup under `client/src/theme/*` and theme tokens (examples: `bgcolor: "background.default"`, `bgcolor: "background.paper"`, `color: "text.primary"`, borders using `divider`). Never hardcode colors to match screenshots.
- **Responsiveness**: The provided UI reference images represent the **desktop version** and do not define tablet/mobile layouts. Tablet and mobile behavior is specified in this PRD and must be implemented by the AI agent/developer (do not infer responsive rules from the images).

### 10.1 Layout Definitions

#### PublicLayout

Reference UI image (desktop; `docs/ui/<screen_reference_name>.png`): `public_layout_screen`.

Header:

- Position: fixed at top
- Height: 64px
- Background: background.paper with backdrop-filter blur(8px)
- Border-bottom: 1px solid divider
- Z-index: 1100
- Padding: 0 24px (desktop), 0 16px (mobile)
- Display: flex, justify-content space-between, align-items center

Left section:

- Container: flex, align-items center, gap 12px
- Logo icon: SvgIcon, 32x32, primary.main (checkmark inside circle)
- Logo text: "TaskManager", Typography h6, text.primary, font-weight 600

Center section (desktop):

- Primary nav links: Features, How It Works, Pricing, Contact (inline links; hidden on mobile and shown in the mobile drawer).

Right section:

- Container: flex, align-items center, gap 16px
- Theme toggle button (Brightness4Icon/Brightness7Icon)
- Log In button (outlined, primary)
- Sign Up button (contained, primary)
- Mobile menu icon (MenuIcon), visible only on mobile, opens drawer

Mobile menu drawer:

- Anchor right, width 280px
- Background background.paper
- Content: close button, navigation links, Log In button, Sign Up button

Content wrapper:

- Min-height: calc(100vh - 64px)
- Background: background.default

#### DashboardLayout

Reference UI images (`docs/ui/<screen_reference_name>.png`): `desktop-dashboard-layout` (desktop) and `mobile-dashboard-layout` (mobile layout reference only).

Header:

- Position fixed at top
- Height 64px
- Background background.paper
- Border-bottom 1px solid divider
- Z-index 1200
- Padding 0 16px
- Display flex, justify-content space-between, align-items center

Left section:

- Menu toggle icon (MenuIcon) on xs/sm only
- Page title: Typography h6, text.primary

Right section:

- Search button (SearchIcon)
- Theme toggle (Brightness4Icon/Brightness7Icon)
- Notifications (NotificationsIcon with badge)
- Organization switcher (Platform SuperAdmin only)
- User avatar (36px), clickable

User menu dropdown:

- Menu items: Profile (PersonIcon), Settings (SettingsIcon), Logout (LogoutIcon)

Notifications dropdown:

- Width 360px
- Header "Notifications" with "Mark all as read"
- List of notifications: icon, title, message, timestamp

Sidebar (desktop):

- Drawer permanent, width 240px
- Background background.paper, border-right 1px solid divider

Sidebar header:

- Height 64px, padding 16px
- Logo and organization name (Typography subtitle2, text.secondary)

Department selector (CAN-009):

- Sidebar includes a **department selector** for `isHod=true` users.
  - Desktop: compact selector under the org header (TextField select or org card with dropdown caret).
  - Mobile: selector appears inside the temporary drawer.
- Non-HOD users see read-only department context.

Navigation sections:

- WORKSPACE: Dashboard, Tasks, Users
- MANAGE: Departments, Materials, Vendors
- Section labels use Typography caption with text.secondary.

Navigation item styling:

- ListItemButton with padding and border-radius
- Hover: background action.hover
- Active: background action.selected with left border 3px primary.main

Sidebar footer:

- Padding 16px, border-top 1px solid divider
- Version number text

Mobile sidebar:

- Drawer temporary with same content as desktop sidebar

Content wrapper:

- Margin-left 240px on desktop, 0 on mobile
- Margin-top 64px
- Padding 24px desktop, 16px mobile
- Min-height calc(100vh - 64px)
- Background background.default

Bottom navigation (xs only):

- Fixed bottom, height >= 56px
- Items: Dashboard, Tasks, Users, Profile
- Centered FAB positioned absolutely with AddIcon, color primary.main
- Active item highlighted with primary color
- FAB opens create menu
- Hidden on sm+

### 10.1.5 Provided UI Reference Screens (Required Index)

The following **screen reference names** are mandatory. Each name corresponds to a real UI image asset at `docs/ui/<screen_reference_name>.png`. These images are the authoritative reference for **desktop UI structure and elements** only (not theme). Theme/styling must come from the existing MUI theme setup under `client/src/theme/*` using theme tokens (e.g., `background.default`, `background.paper`, `text.primary`, `divider`). The reference images represent the desktop version and do not define tablet/mobile layouts; this PRD explicitly defines tablet (`sm`) and mobile (`xs`) behavior for each screen below, and it must be implemented by the AI agent/developer.

Layout references:

- `public_layout_screen`
- `desktop-dashboard-layout`
- `mobile-dashboard-layout`

Public:

- `landing-page`
- `login_screen_screen`
- `registration_step_1_screen`
- `registration_step_2_screen`
- `registration_step_3_screen`
- `registration_step_4_screen`
- `forgot_password_screen`
- `resend_verification_screen`
- `reset_link_sent_success_screen`
- `reset_password_error_state_screen`
- `reset_password_screen`
- `verification_error_state_screen`
- `verification_loading_state_screen`
- `verification_success_state_screen`.

Dashboard:

- `desktop_dashboard_overview_screen`

Departments:

- `departments_grid_view_screen`
- `departments_list_view_screen`
- `departments_filter_dialog_screen`
- `create_update_department_dialog_screen`
- `dept_details_overview_tab_screen`
- `dept_details_users_tab_screen`
- `dept_details_tasks_tab_screen`
- `dept_details_activity_tab_screen`

Users:

- `users_grid_view_screen`
- `users_list_view_screen`
- `users_filter_dialog_screen`
- `create_update_user_dialog_screen`
- `user_details_overview_screen`
- `user_details_tasks_screen`
- `user_details_activity_screen`
- `user_details_performance_screen`

Tasks:

- `tasks_grid_view_screen`
- `tasks_list_view_screen`
- `tasks_filter_dialog_screen`
- `create_update_task_dialog_screen`
- `task_details_overview_screen`
- `task_details_activities_screen`
- `task_details_comments_screen`
- `task_details_attachments_screen`

Materials:

- `materials_list_view_screen`
- `material_details_screen`

Vendors:

- `vendors_list_view_screen`
- `vendor_details_screen`

Settings:

- `settings_profile_tab_screen`
- `settings_account_tab_screen`

### 10.1.6 View Modes for Resource Lists (Grid vs List)

This PRD uses the following **canonical** view-mode terminology across all resource list pages (Departments, Users, Tasks, and any other list that offers multiple view modes):

- **Grid view (tabular)**:
  - MUST be implemented using `MuiDataGrid`, a reusable wrapper around MUI X DataGrid.
  - `MuiDataGrid` MUST live under `client/src/components/reusable/*` and MUST be used instead of importing DataGrid directly in feature pages.
  - Columns MUST be defined per resource under `client/src/components/columns/*` and passed to `MuiDataGrid` (do not inline columns inside pages).
  - `MuiDataGrid` MUST use a reusable `MuiDataGridToolbar` (also under `client/src/components/reusable/*`) for common actions (search, filter, export, column visibility, density) as required by each screen.
- **List view (cards)**:
  - MUST render MUI Cards (wrapped per the project’s “Mui\* reusable component” convention where applicable).
  - Card layout MUST be implemented using MUI `Grid` (MUI v7 API), not CSS grid.
  - MUI `Grid` MUST use a tree-shakable import and the v7 `size` prop:
    - Import: `import Grid from '@mui/material/Grid'`
    - Items: `<Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 3 }}>…</Grid>` (exact values vary by screen; see each screen’s responsive rules).

Tablet/mobile rule for “table” statements:

- Any responsive requirement that mentions **hiding columns**, **reducing columns**, **column visibility**, or **table density** refers to **Grid view (`MuiDataGrid`)**.
- List view responsiveness is expressed via MUI `Grid` `size` values (cards reflow), not by “hiding columns” rules.

### 10.2 Public Screens

#### Landing Page

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `landing-page`, `public_layout_screen`.

Layout: PublicLayout

- Hero section: centered, min-height calc(100vh - 64px), gradient background from background.default to alpha(primary.main, 0.05).
- Headline: "Streamline Your Team's Workflow" (Typography h1).
- Subheadline: "The all-in-one task management platform..." (Typography h5).
- Announcement pill: "V2.0 IS NOW LIVE" above the headline.
- CTA buttons: "Start Free Trial" (contained) and "Watch Demo" (outlined).
- Trust row: avatar cluster + text "Trusted by 10,000+ teams".
- Features section: background background.paper, title "Key Features", subtitle, 6 feature cards grid (3 desktop, 2 tablet, 1 mobile).
- Features subtitle: "Everything you need to manage your organization efficiently, all in one place."
- Feature cards (titles): Task Management, Real-time Collaboration, Department Organization, Progress Tracking, Vendor Management, Detailed Analytics.
- How It Works section: background background.default, title "How It Works", stepper with 4 steps (horizontal desktop, vertical mobile).
- How It Works steps: Create Organization, Set up Departments, Assign Tasks, Track Progress.
- CTA section: "Ready to boost your productivity?" with buttons "Get Started Now" (contained) and "Contact Sales" (outlined).
- Footer: background alpha(grey[900], 0.05) light or alpha(grey[800], 0.5) dark, logo, copyright, quick links, social icons.
- Footer columns: Product (Features, Integrations, Pricing, Changelog, Docs), Company (About Us, Careers, Blog, Contact, Partners), Legal (Privacy Policy, Terms of Service, Cookie Policy, Security).
- Footer status: "System Operational" indicator.

Responsive behavior:

- Desktop (md+): 3-column feature grid; header nav links visible; stepper horizontal.
- Tablet (sm): 2-column feature grid; header uses tighter spacing; stepper remains horizontal.
- Mobile (xs): 1-column feature grid; mobile header drawer; stepper vertical; CTA buttons stack vertically.

#### Register (4-Step Wizard)

Wizard container:

- Min-height: calc(100vh - 64px)
- Padding and centered layout
- Background: background.default
  Stepper:
- Steps: Organization, Department, Account, Review
- Active step highlighted with primary.main

Step 1 Organization Details:

- Paper elevation with padding
- Title: "Organization Details" (Typography h4)
- Subtitle: "Tell us about your organization" (Typography body1, text.secondary)
- Fields: Organization Name, Organization Email, Phone (Ethiopian format), Address, Industry (enum), Size (Small/Medium/Large), Description (optional).
- Validation: 2-100 name, 2-100 size, 5-500 address, description max 1000.
- Navigation: Next button (contained, primary, ArrowForwardIcon).

Step 2 Department Setup:

- Title: "Department Setup" (Typography h4)
- Subtitle: "Create your first department" (Typography body1, text.secondary)
- Fields: Department Name (2-100), Description (max 500).
- Description is required.
- Navigation: Back button (outlined, ArrowBackIcon), Next button.

Step 3 Account Creation:

- Title: "Create Your Account" (Typography h4)
- Subtitle: "Set up your admin account" (Typography body1, text.secondary)
- Fields: First Name (2-50), Last Name (2-50), Position (2-100), Email, Password (min 8), Confirm Password.
- Confirm Password must match Password.
- Password strength indicator.
- Navigation: Back button, Next button.

Step 4 Review & Submit:

- Title: "Review Your Information" (Typography h4)
- Subtitle: "Please verify all details before submitting" (Typography body1, text.secondary)
- Summary accordions for organization, department, account.
- Accordions icons: BusinessIcon, GroupsIcon, PersonIcon.
- Submit button with loading state.
- Submit button: contained, primary, CheckCircleIcon.
- No terms acceptance checkbox exists (CAN-007).
- On submit (customer organization onboarding only):
  - Backend creates the Organization + first Department + first User (Organization SuperAdmin) in an **unverified** state.
  - Backend sends an **email verification** message (Nodemailer) to the initial SuperAdmin user email.
  - UI shows a verification state: "Check your email to verify your account" with actions: Resend verification email, Change email (optional), Back to login.
  - User cannot access protected routes until verification completes.
- On successful verification:
  - Backend marks the initial SuperAdmin user as verified and activates the organization onboarding.
  - Backend sends a **welcome email exactly once** (idempotent).
  - UI shows success state: check icon, "Account Verified Successfully", auto redirect to Login after 3 seconds.

#### Login

- Container: min-height calc(100vh - 64px), centered.
- Form card: Paper elevation, max width 450, padding, background background.paper.
- Logo section: icon 48x48, primary.main; title "Welcome Back"; subtitle "Sign in to your account".
- Email field, password field with toggle, remember me checkbox, forgot password link.
- Email field uses EmailIcon; password field uses LockIcon.
- Submit button "Sign In".
- Divider with "OR"; register link.
- Error alert on invalid credentials with message "Invalid email or password".

#### Forgot Password

- Back button: text button with ArrowBackIcon, "Back to Login".
- Title: "Forgot Password?"
- Subtitle: "Enter your email address and we'll send you a link..."
- Email input, submit "Send Reset Link".
- Email field uses EmailIcon.
- Success state: "Check Your Email".
- Success icon: MarkEmailReadIcon.

#### Reset Password

- Title: "Reset Password"
- Subtitle: "Enter your new password below."
- New password, confirm password, strength indicator.
- New password and confirm use LockIcon.
- Success state: "Password Reset Successful".
- Success icon: CheckCircleIcon.
- Invalid token state: "Invalid or Expired Link".
- Invalid token icon: ErrorIcon.

### 10.3 Protected Screens

#### Dashboard

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `desktop_dashboard_overview_screen`, `desktop-dashboard-layout`, `mobile-dashboard-layout`.

- Page header: title, welcome message with first name, date range picker, **Filter** button, **Export** button, refresh button.
- Refresh button uses RefreshIcon.
- Active filter chips row (below header): shows applied filters (date range is always present) and a "Clear All" action.
- KPI cards are role-aware:
  - **Org-wide roles** (Platform SuperAdmin and Customer SuperAdmin/Admin per authorization matrix) see:
    - **Organization Tasks**: total + breakdown (active, completed, overdue) and delta vs previous period.
    - **Organization Users**: total + breakdown (online, offline, admins) and delta vs previous period.
  - **Department/personal roles** (Manager/User) see:
    - My Tasks, Department Tasks, Overdue, Completed This Week.
    - My Tasks includes tasks where the user is creator, assignee, or watcher.
- Metrics card icons: AssignmentIcon (My Tasks), GroupsIcon (Department Tasks), WarningIcon (Overdue), CheckCircleIcon (Completed This Week).
- Department Performance section (org-wide roles): cards per department with completion % and status (e.g., On Track/At Risk/Excellent/Stable). Clicking a department navigates to Department Details (Overview).
- Charts: status distribution (pie), priority breakdown (bar).
- Tasks timeline chart shows creation and completion trends over time.
- Status distribution includes TODO, IN_PROGRESS, COMPLETED, PENDING.
- Priority breakdown includes URGENT, HIGH, MEDIUM, LOW.
- Recent activity feed (real-time).
- Recent activity shows last 10 items with user avatar, description, timestamp.
- Upcoming deadlines table (next 7 days).
- Upcoming deadlines columns: Task Title, Assignee, Due Date, Priority, Status, Actions.
- Upcoming deadlines sorted by due date, pagination 10 per page.
- Projects Overview widget (org-wide roles): ProjectTask rollups for Active/Delayed/Upcoming + completion rate.
- Materials Usage widget (org-wide roles): stock health summary, low stock count, and a "Manage Inventory" shortcut to Materials.
- Vendor Performance widget (org-wide roles): on-time delivery %, active contracts count, and average rating, with a shortcut to Vendors.
- Team performance (Manager/Admin only).
- Team performance metrics: active tasks count, completed tasks this week, average completion time, workload indicator (Low/Medium/High).
- Mobile FAB (create task menu).

Responsive behavior:

- Desktop (md+): sidebar permanent; charts render side-by-side where possible; `MuiDataGrid` tables show full columns.
- Tablet (sm): sidebar becomes temporary drawer; charts stack; `MuiDataGrid` tables hide lower-priority columns.
- Mobile (xs): bottom navigation visible; primary actions accessible via FAB; KPI cards stack 1-column; `MuiDataGrid` tables collapse to minimal columns.

Data dependencies:

- `GET /api/dashboard/overview` returns a single payload that powers all dashboard widgets and is filterable by:
  - `from`, `to` (required ISO dates)
  - `departmentId` (optional; only for roles permitted to view other departments)
  - `status`, `priority`, `taskType` (optional)
- Response MUST include:
  - `filters`: applied filter chips and available filter options (departments, statuses, priorities, task types).
  - `kpis`: org tasks/users KPIs and/or my/dept KPIs based on role.
  - `departmentPerformance`: department cards data (org-wide roles).
  - `charts`: statusDistribution, priorityBreakdown, timelineTrends.
  - `recentActivity`: last 10 items (already mapped to the canonical activity feed format).
  - `upcomingDeadlines`: next 7 days, paginated.
  - `projectsOverview`, `materialsUsage`, `vendorPerformance` widgets (org-wide roles).
  - `teamPerformance` aggregates (Manager/Admin only).

#### Departments

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `departments_grid_view_screen`, `departments_list_view_screen`, `departments_filter_dialog_screen`, `create_update_department_dialog_screen`.

- Header: Title, subtitle, search, view toggle, create button (SuperAdmin only).
- Filter bar with chips and clear all.
- Filter dialog (`departments_filter_dialog_screen`):
  - Department Name (text input with search icon; placeholder "e.g. Marketing"; maps to `search`)
  - Status (dropdown; All Statuses, Active, Inactive; maps to `status`)
  - Head of Department (user autocomplete; placeholder "Search users..."; maps to `managerId`)
  - Member Count (min/max number inputs; maps to `memberCountMin`, `memberCountMax`)
  - Date Added (start/end date pickers; maps to `createdFrom`, `createdTo`)
  - Organization (Platform SuperAdmin only; maps to `organizationId`)
  - Include deleted (checkbox; maps to `includeDeleted`) — may be placed in an "advanced" area below the main fields
  - Actions: Clear all, Apply Filters
- Grid view (tabular): `MuiDataGrid` (reusable) with department columns from `client/src/components/columns/*` and `MuiDataGridToolbar`.
  - Desktop columns (default): Name (icon + dept ID), Description, Manager, Users (avatar stack), Tasks (count pill + status), Created Date, Actions.
- List view (cards): department cards laid out with MUI `Grid` (v7 `size` prop) showing icon avatar, name + short description, manager avatar/name, team avatar stack with “+N”, tasks progress bar with active count, and a 3-dot actions menu.
- Reference-image mapping for these view modes:
  - List view (cards) structure is shown in `departments_grid_view_screen`.
  - Grid view (`MuiDataGrid`) structure is shown in `departments_list_view_screen`.
- Empty state with icon and message.
- Create/Edit dialog (create_update_department_dialog_screen):
  - Title: "Create New Department" / "Edit Department"
  - Fields: Department Name (required), Description (required, max 500; helper text "Keep it short and descriptive (max 500 characters)."), Assign Manager (optional user search)
  - Actions: Cancel, Create Department / Save

Responsive behavior:

- Desktop (md+): default view toggle available; list view shows 3 columns; grid view (`MuiDataGrid`) shows full columns.
- Tablet (sm): list view shows 2 columns; grid view (`MuiDataGrid`) hides low-priority columns (e.g., Created Date) and reduces padding/density.
- Mobile (xs): default to grid view (`MuiDataGrid`) with minimal columns; list view is 1 column; filters open as full-height dialog; create action available via FAB or header button (role-gated).

Data dependencies:

- `GET /api/departments` supports pagination, search, filters (including deleted toggle) and returns department summaries:
  - manager summary (id, name, avatar)
  - memberCount
  - taskCount (total) and activeTaskCount
  - status (ACTIVE/INACTIVE)
  - createdAt
- `POST /api/departments`, `PUT /api/departments/:departmentId`, `DELETE /api/departments/:departmentId`, `PATCH /api/departments/:departmentId/restore`

#### Department Details

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `dept_details_overview_tab_screen`, `dept_details_users_tab_screen`, `dept_details_tasks_tab_screen`, `dept_details_activity_tab_screen`.

- Breadcrumbs: Dashboard > Departments > Department Name.
- Header card: department icon + name, managed-by label, total users, active tasks, and an **Edit Department** action (role-gated). Some screens include a primary **Add New Task** button on the header card.
- Department selector (CAN-009):
  - Location: **Sidebar only** (HOD-only). The Department Details header has no selector.
  - Behavior: selecting a department from the sidebar navigates to its details route and refreshes all tabs’ data within that department scope.
- Tabs (CAN-018): **Overview**, **Members**, **Tasks**.
- Overview: KPI cards (Tasks in Progress, Overdue Tasks with “Action Needed”, Team Velocity, Efficiency), Weekly Task Completion chart (with timeframe selector), Active Members list (View All + Manage Members), and Recent Activity table with a “View All Tasks” link.
- Members tab: search input (placeholder “Search users by name, email or role…”), Filter + Sort buttons, Add User button (role-gated), `MuiDataGrid` columns Name, Position, Role, Email, Joined Date, Actions.
- Tasks tab:
  - Summary cards: Total Tasks, Overdue, Completed.
  - Controls: search tasks, Status dropdown, Priority dropdown, and New Task button.
  - Table columns: Task Name, Assignee, Due Date, Priority, Status, plus row-selection checkboxes and Actions menu.
  - Activity sub-tabs (desktop/tablet as Tabs, mobile as scrollable Tabs):
    - **All Activity** (`dept_details_activity_tab_screen`): chronological department feed aggregating Task, TaskActivity, TaskComment, and Attachment events.
    - **Tasks** (`dept_details_tasks_tab_screen`): the department-scoped task list/table.
    - **Comments**: filter the same feed to TaskComment events only.
    - **Files**: filter the same feed to Attachment events only.
    - Activity view includes a timeline search input and a filter icon; entries are grouped by Today/Yesterday.

Responsive behavior:

- Desktop (md+): sidebar selector visible to HOD users; tabs are horizontal; overview shows multi-column charts where possible.
- Tablet (sm): sidebar selector is available in the temporary drawer; tabs are scrollable; overview content stacks.
- Mobile (xs): header stacks; selector lives in the drawer; tabs scroll horizontally; tab content is single-column; user/task `MuiDataGrid` views use reduced columns (hide low-priority columns).

Data dependencies:

- Header and permissions: `GET /api/departments/:departmentId`
- Department dashboard aggregates: `GET /api/departments/:departmentId/dashboard`
- Members tab: `GET /api/users?departmentId=<id>`
- Tasks tab: `GET /api/tasks?departmentId=<id>`
- Tasks tab activity feed: `GET /api/departments/:departmentId/activity` (paginated chronological feed)
  - Supports optional `entityModel=Task|TaskActivity|TaskComment|Attachment` filtering for All Activity / Comments / Files views.

#### Users

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `users_grid_view_screen`, `users_list_view_screen`, `users_filter_dialog_screen`, `create_update_user_dialog_screen`.

- Header: Title, subtitle, search, view toggle, create button (SuperAdmin only).
- Filters: Department (multi-select), Role (SuperAdmin/Admin/Manager/User), Joined At date range, Include deleted toggle; Status filter is available via DataGrid toolbar/column filters.
- Grid view (tabular): `MuiDataGrid` (reusable) with user columns from `client/src/components/columns/*` and `MuiDataGridToolbar`.
  - Desktop columns (default): User (avatar + name + email), Position, Role, Department, Joined Date, Status, Actions (Last Login is optional/hidden by default).
- List view (cards): user cards with avatar (64px), name, position, role badge, department, email; presence indicator dot shows online/offline.
- Reference-image mapping for these view modes:
  - List view (cards) structure is shown in `users_grid_view_screen`.
  - Grid view (`MuiDataGrid`) structure is shown in `users_list_view_screen`.
- Role badge colors: SuperAdmin error.main, Admin warning.main, Manager info.main, User success.main.
- Create/Edit dialog (create_update_user_dialog_screen):
  - Title: "Create New User" / "Edit User"
  - Section 1: Personal Info — First Name, Last Name, Email Address, Phone Number
  - Section 2: Role & Department — Department (select), Role (select), Head of Department checkbox
  - Section 3: Profile Details — Skills (chip input, “type and press enter”), Profile Picture (upload/change)
  - Actions: Cancel, Create User / Save

Responsive behavior:

- Desktop (md+): list view shows 3 columns; grid view (`MuiDataGrid`) shows most columns; filters render as dialog/panel.
- Tablet (sm): list view shows 2 columns; grid view (`MuiDataGrid`) hides low-priority columns (e.g., Last Login) and may reduce density; filter dialog uses `maxWidth="sm"`.
- Mobile (xs): default to grid view (`MuiDataGrid`) with minimal columns; list view is 1 column; filter dialog uses full-height mobile dialog rules; create/edit dialog is full-height (100vh).

Data dependencies:

- `GET /api/users` supports pagination, search, filters (role, department, status, joinedAt date range, deleted toggle)
- `POST /api/users` creates user (auto-verified) and triggers welcome email + password setup link
- `PUT /api/users/:userId` updates user (subject to immutability rules for Admin/Manager/User targets)
- `DELETE /api/users/:userId`, `PATCH /api/users/:userId/restore`

#### User Details

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `user_details_overview_screen`, `user_details_tasks_screen`, `user_details_activity_screen`, `user_details_performance_screen`.

- Profile header: large avatar (96px), name, position, role badge, department, contact info, joined date.
- Tabs: Overview, Tasks, Activity, Performance.
- Overview: personal info card (full name, email, phone, role), task stats (total/completed/pending review), skills with proficiency bars, recent activity list.
- Tasks: sub-tabs **Assigned**, **Created**, **Watching**; search input and Filter button; table columns Task Name, Status, Priority, Due Date, Actions.
- Activity: timeline with filter dropdown (“All Activity”), entries for comments/completions/uploads/status changes/added to workspace, and “View older activity”.
- Performance: KPI cards (Completion Rate, Avg Task Time, Tasks Completed), monthly throughput chart, efficiency vs team radar, recent performance reviews list.

Responsive behavior:

- Desktop (md+): tabs horizontal; overview shows multi-column cards (stats + skills + recent activity).
- Tablet (sm): tabs scrollable; overview content stacks into 1-2 columns depending on space.
- Mobile (xs): header stacks; actions move to overflow menu; tab content is single-column; lists use minimal columns and ellipsis truncation.

Data dependencies:

- Profile: `GET /api/users/:userId`
- Tasks tab (server-filtered): `GET /api/tasks?assigneeId=<userId>` and `GET /api/tasks?createdById=<userId>` and `GET /api/tasks?watcherId=<userId>`
- Activity tab: `GET /api/users/:userId/activity` (chronological feed, paginated)
- Performance tab: `GET /api/users/:userId/performance` (aggregates for completion rate, avg task time, throughput, and comparison to dept averages)

#### User Profile & Settings

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `settings_profile_tab_screen`, `settings_account_tab_screen`.

- Tabs: Profile, Account, Notifications, Appearance.
- Profile: profile picture card with edit action; personal info form (first name, last name, email, phone) with Edit button; profile completeness card with checklist; Skills & Expertise chip input with Add button; Save Changes + Cancel actions.
- Account: Change Your Email card with Save Changes; Password & Security card with Current Password, New Password, Confirm New Password, minimum 8 characters helper text, Update Password button.
- Notifications: email and in-app preferences, browser notification toggle.
- Appearance: theme (light/dark/system), language, date/time format.

Responsive behavior:

- Desktop (md+): tabs horizontal; profile uses side-by-side cards where space allows.
- Tablet (sm): tabs scrollable; forms stack; actions remain visible.
- Mobile (xs): tabs scrollable; each card becomes full-width; dialogs (e.g., image picker) use full-height mobile dialog rules.

Data dependencies:

- Profile update: `PUT /api/users/:userId` (self-update only; immutability rules still apply)
- Password change: `POST /api/auth/change-password` (currentPassword, newPassword, confirmNewPassword)
- Notification/appearance preferences: `PUT /api/users/:userId/preferences`
- Two-factor: stored preference via `PUT /api/users/:userId/security` (2FA enable/disable); enforcement may be phased, but persistence must exist

#### Tasks

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `tasks_grid_view_screen`, `tasks_list_view_screen`, `tasks_filter_dialog_screen`, `create_update_task_dialog_screen`.

- Header: Title, subtitle, search, filter button, create task button.
- Header includes view toggle icons (grid/list) and task tabs: **All Tasks**, **Assigned to Me**, **Completed**.
- Filter dialog (`tasks_filter_dialog_screen`):
  - Status: To Do, In Progress, In Review, Completed (checkboxes)
  - Task Type: Project, Assigned, Routine (radio group)
  - Priority: Critical, High, Medium, Low (chips; Critical maps to URGENT)
  - Date Range: Start Date, End Date
  - Tags: chip input
  - Advanced (optional): Department, Assignment (assignee/creator), Include deleted
  - Actions: Clear all, Cancel, Apply
- Active filter chips with remove icons and Clear All.
- Grid view (tabular): `MuiDataGrid` (reusable) with task columns from `client/src/components/columns/*` and `MuiDataGridToolbar`.
  - Desktop columns (default): Title, Type, Status, Priority, Assignees, Due Date, Actions (Department is optional/hidden by default).
  - Includes row-selection checkboxes, pagination text (e.g., “Showing 1 to 5 of 45 results”), and Previous/Next controls.
- List view (cards): task cards with priority indicator (colored left border), type icon badge, title, description, status badge, assignees avatar stack, comment count, due date, tags, actions menu; laid out with MUI `Grid` (v7 `size` prop).
- Reference-image mapping for these view modes:
  - List view (cards) structure is shown in `tasks_grid_view_screen`.
  - Grid view (`MuiDataGrid`) structure is shown in `tasks_list_view_screen`.
- Create task dialog (create_update_task_dialog_screen; dynamic by type):
  - Title: "Create New Task" / "Edit Task" with short subtitle.
  - Common fields:
    - Task Title (required)
    - Description (rich text editor with toolbar: bold, italic, list, link, image)
    - Assign To (assignee picker; for ProjectTask this may be read-only or hidden)
    - Priority chips: Urgent, High, Med, Low
    - Date fields: Date, Start Date, Due Date (only relevant fields are enabled/required by task type)
    - Task Type segmented control: Project, Assigned, Routine
    - Tags (chip input)
    - Attachments (dropzone)
  - Actions: Cancel, Create Task / Save
  - Watchers rules (if watcher selector is exposed):
    - Any active user within the task’s organization+department scope can be selected as a watcher.
    - The creator is always auto-included as a watcher.
    - The department manager/HOD may be auto-included as a watcher (configurable; default: enabled).
  - Project Task: Vendor, Start Date, Due Date.
    - Vendor picker excludes `status=INACTIVE` vendors by default.
  - Assigned Task: Assignees, Start Date, Due Date.
    - Assignee picker excludes `status=INACTIVE` users by default.
  - Routine Task: Date, Materials.
    - Materials picker is searchable and shows: Name, SKU, Unit, Stock On Hand.
    - Materials picker excludes `status=INACTIVE` materials by default.
    - For each selected material, quantity is required (>0).
    - On submit, the backend MUST enforce the inventory rule (CAN-019) and reject with 409 if insufficient stock.
    - UI MUST display a per-material cost preview: `quantity × unitPrice`, and a total cost preview.

Responsive behavior:

- Desktop (md+): filter opens as modal dialog; list view shows 3 columns; grid view (`MuiDataGrid`) shows full columns (department optional/hidden by default).
- Tablet (sm): filter uses full-height dialog; list view shows 2 columns; grid view (`MuiDataGrid`) hides low-priority columns and uses ellipsis where needed.
- Mobile (xs): default to grid view (`MuiDataGrid`) with minimal columns; list view is 1 column; filter dialog uses full-height mobile dialog rules; create task entry is available via FAB + menu.

Data dependencies:

- `GET /api/tasks` supports pagination, search, union filters (CAN-004), and returns task summary cards/rows.
  - Tabs map to filters: All Tasks = no extra filter, Assigned to Me = `assigneeId=<currentUserId>`, Completed = `status=COMPLETED`.
- `POST /api/tasks`, `PUT /api/tasks/:taskId`, `DELETE /api/tasks/:taskId`, `PATCH /api/tasks/:taskId/restore`
- `GET /api/vendors` is required for ProjectTask vendor selection.
- `GET /api/users` is required for watcher/assignee selection (scoped).
- `GET /api/materials` is required for RoutineTask materials selection and TaskActivity materials selection (scoped).

#### Task Details

Reference UI images (desktop; `docs/ui/<screen_reference_name>.png`): `task_details_overview_screen`, `task_details_activities_screen`, `task_details_comments_screen`, `task_details_attachments_screen`.

- Breadcrumb: Dashboard > Tasks > Task Title.
- Header card: title with chips for Type, Status, and Priority; actions **Share** and **Edit Task**; assignee avatar stack with add action.
- Details panel (right column): Assignee, Start Date, Due Date, Completion progress bar with percent + “days left”.
- Status History card: recent status changes and “View Full History”.
- Tabs: Overview, Activities, Comments, Files.
- Overview:
  - Description block (supports rich text and bulleted requirements).
  - Tags chips.
  - Required Materials table with “Add Item” action.
- Activities:
  - Activity Log with search input and “Add Note” button.
  - Entries include comments, status changes, file uploads, assignments, and task creation.
  - “Load older activities” link at bottom.
- Comments:
  - Rich text composer with toolbar (bold, italic, list, link), @mention and attachment icons.
  - Comment list with Reply actions and Like counts.
- Files:
  - Upload dropzone with helper text: “SVG, PNG, JPG or GIF (max 800×400px). PDF and DOCX documents supported.”
  - File cards show preview/icon, filename, file size, and upload time.

Responsive behavior:

- Desktop (md+): tabs horizontal; overview and side panels may render in 2 columns; attachments grid shows multiple columns.
- Tablet (sm): header stacks partially; tabs scroll; attachments grid reduces columns.
- Mobile (xs): header stacks; primary actions move to overflow menu; tabs scroll; attachments grid becomes 1 column; dialogs use full-height rules.

Data dependencies:

- Task: `GET /api/tasks/:taskId`
- Activities: `GET /api/tasks/:taskId/activities` / `POST /api/tasks/:taskId/activities`
- Comments: `GET /api/tasks/:taskId/comments` / `POST /api/tasks/:taskId/comments`
- Attachments: `POST /api/attachments` (or attachment creation embedded in parent routes) and parent-scoped list via task detail payload

#### Materials

Reference UI image (desktop; `docs/ui/<screen_reference_name>.png`): `materials_list_view_screen`.

- Header: Title, subtitle, search (placeholder: "Search by name, SKU, or tag..."), category filter dropdown (default "All Categories"), "More Filters" button, create button "Add Material" (Manager/Admin/SuperAdmin).
- `MuiDataGrid` supports row selection for bulk export and includes:
  - Columns (desktop default): Name (with SKU sub-label), Category (chip), Unit, Unit Price, Created By, Actions.
  - Actions column uses icon buttons: View, Edit, Delete/Restore (role-gated).
  - Optional columns (may be hidden by default): Stock On Hand, Low Stock, Created Date, Usage Count.
- Pagination 10 rows, multi-column sorting, checkbox selection for bulk export.
- Category colors:
  - Electrical primary.main
  - Mechanical secondary.main
  - Plumbing info.main
  - Hardware success.main
  - Cleaning warning.main
  - Textiles error.main
  - Consumables grey[500]
  - Construction orange[400]
  - Other grey[400]
- Create/Edit dialog:
  - Name (required)
  - SKU (required)
  - Unit (required)
  - Category (required)
  - Unit Price (optional)
  - Initial Stock On Hand (optional; default 0)
  - Low Stock Threshold (optional; default 0)
  - Status (Active/Inactive; default Active)

Responsive behavior:

- Desktop (md+): `MuiDataGrid` shows full columns; filters inline.
- Tablet (sm): `MuiDataGrid` hides low-priority columns; filter opens as dialog.
- Mobile (xs): `MuiDataGrid` shows minimal columns; create/edit dialog uses full-height mobile dialog rules; text truncates with ellipsis.

Data dependencies:

- `GET /api/materials` supports pagination, search, filters (category/status/lowStock/date range/includeDeleted), and sorting.
- `POST /api/materials`, `PUT /api/materials/:materialId`, `DELETE /api/materials/:materialId`, `PATCH /api/materials/:materialId/restore`
- `POST /api/materials/:materialId/restock` increases stockOnHand (CAN-019).

#### Material Details

Reference UI image (desktop; `docs/ui/<screen_reference_name>.png`): `material_details_screen`.

- Header card: category icon, material name, status chip, SKU, unit, unit price, and header actions: Edit and Restock (role-gated).
- KPI cards: Total Usage (quantity), Associated Tasks, Usage Rate.
- Usage History table:
  - Search input (filters by task name) and filter icon.
  - Columns: Task Name, Task Type, Date Used, Quantity, Task Status, Cost (Quantity × Unit Price at time of usage).
  - Default: show 5 most recent records with pagination ("Showing 5 most recent records").
- Associated tasks list/table remains available (may reuse usage history grouping).

Responsive behavior:

- Desktop (md+): header and stats render side-by-side; associated list shows full columns.
- Tablet (sm): content stacks; list hides low-priority columns.
- Mobile (xs): content stacks; associated list uses minimal columns; long names truncate with ellipsis.

Data dependencies:

- `GET /api/materials/:materialId` returns:
  - material core fields (name, sku, status, unit, category, unitPrice, inventory, createdBy/createdAt)
  - usage aggregates (usageCount, totalQuantityUsed, associatedTasksCount, usageRate, totalCost)
  - usage history (paginated) OR provides an explicit `GET /api/materials/:materialId/usage` endpoint for the table
- `POST /api/materials/:materialId/restock` updates inventory.

#### Vendors

Reference UI image (desktop; `docs/ui/<screen_reference_name>.png`): `vendors_list_view_screen`.

- Header: Title, subtitle, search (placeholder: "Search by name, email or phone..."), rating filter dropdown, filter icon ("More Filters"), create button "Add Vendor" (Admin/SuperAdmin).
- `MuiDataGrid` columns (desktop default): Vendor Name (with ID), Contact Info (email + phone), Rating (stars), Projects (active count pill + total), Actions.
  - Optional columns (may be hidden by default): Status, Verified Partner, Website, Location/Address, Created By.
- Pagination 10 rows, multi-column sorting.
- Rating display: read-only, precision 0.5, size small.
- Create/Edit dialog:
  - Name (required)
  - Email (required)
  - Phone (required; Ethiopian format)
  - Website (optional)
  - Location (optional)
  - Address (optional)
  - Status (Active/Inactive; default Active)
  - Verified Partner (SuperAdmin only)
  - Rating (optional, 0.5 increments) and Description (optional)

Responsive behavior:

- Desktop (md+): `MuiDataGrid` shows full columns; rating filter inline.
- Tablet (sm): `MuiDataGrid` hides low-priority columns; filter uses dialog.
- Mobile (xs): `MuiDataGrid` shows minimal columns; create/edit dialog uses full-height mobile dialog rules; text truncates with ellipsis.

Data dependencies:

- `GET /api/vendors` supports pagination, search, filters (status/rating range/verifiedPartner/includeDeleted), and sorting.
- `POST /api/vendors`, `PUT /api/vendors/:vendorId`, `DELETE /api/vendors/:vendorId`, `PATCH /api/vendors/:vendorId/restore`

#### Vendor Details

Reference UI image (desktop; `docs/ui/<screen_reference_name>.png`): `vendor_details_screen`.

- Header card:
  - icon, name, rating stars (+ rating count where available), verified partner badge (if applicable).
  - contact info row: email, phone, website, location (plus optional address).
  - actions: Edit (role-gated) and Contact Vendor (role-gated).
- Performance metrics (cards):
  - Active Projects (count + capacity utilization)
  - Avg. Duration (days + target + trend pill)
  - Total Spend (this fiscal quarter + trend pill)
- Projects list:
  - Search input and filter icon.
  - Columns: Project Name, Start Date, Due Date, Status, Actions.

Responsive behavior:

- Desktop (md+): header and metrics render in multi-column layout; projects list shows full columns.
- Tablet (sm): content stacks; projects list hides low-priority columns.
- Mobile (xs): content stacks; projects list uses minimal columns and ellipsis; actions move to overflow menu.

Data dependencies:

- `GET /api/vendors/:vendorId` returns vendor overview + aggregates required for metrics and badges.
- Projects list may be derived via `GET /api/tasks?type=ProjectTask&vendorId=<vendorId>` (paginated)
- `POST /api/vendors/:vendorId/contact` sends an email via Nodemailer (used by the in-app "Contact Vendor" dialog).

### 10.4 UI Coverage Traceability Requirements (Normative)

The UI coverage specification is incorporated as normative implementation detail for the screens in Section 23.2.

Frontend requirement IDs are mandatory traceability anchors:

- FR-UI-001: Public shell + landing composition and auth CTAs (CAN-025).
- FR-UI-002: Dashboard layout behavior desktop/mobile including sidebar/header/nav constraints (CAN-001, CAN-002, CAN-024).
- FR-UI-003: Dashboard overview widgets and analytics integration.
- FR-UI-004: Department listing/filter/dialog/detail tabs, status, and description constraints (CAN-018, CAN-022, CAN-026).
- FR-UI-005: User listing/filter/dialog/detail tabs and immutable-field behavior (CAN-011, CAN-016).
- FR-UI-006: Task listing/filter/dialog/detail tabs and status/priority mapping (CAN-003, CAN-004, CAN-013).
- FR-UI-007: Materials list/detail including inventory and restock semantics (CAN-019, CAN-021).
- FR-UI-008: Vendors list/detail with extended fields and delete constraints (CAN-015, CAN-020).
- FR-UI-009: Settings profile/account tab UX and account-management flows.
- FR-UI-010: Responsive tablet/mobile behavior for all covered screens (CAN-001, CAN-017).
- FR-UI-011: Grid/List conventions (`MuiDataGrid` vs cards + toolbar) (CAN-023).
- FR-UI-012: Data dependency compliance between screens and Section 18 contracts.

Per-screen implementation checkpoints are required:

- Each screen MUST have route coverage, clear component ownership, and data hooks with loading/error/success states.
- Each screen MUST map to at least one FR-UI requirement ID and preserve that mapping in implementation/docs.
- For protected routes, data dependencies must be satisfied using Section 18 endpoints only; no undocumented endpoint contracts are allowed.

## 11. Responsive Behavior and Breakpoints

Canonical breakpoints:

- xs: 0-599
- sm: 600-899
- md: 900-1199
- lg: 1200-1535
- xl: 1536+

Layout adaptation:

- xs: single column, stacked elements, bottom nav visible.
- sm: two columns where appropriate, bottom nav hidden.
- md: two or three columns, permanent sidebar visible, bottom nav hidden.
- lg/xl: three or more columns with max width constraints.

Additional responsive rules:

- Sidebar hidden on xs/sm; drawer used instead.
- `MuiDataGrid` hides less important columns on small screens.
- Touch targets minimum 44x44 on mobile.
- Support swipe, tap, long press on mobile.
- Optimize images/assets for mobile.

## 12. Accessibility and Micro-Interactions

Accessibility:

- Full keyboard navigation (Tab, Shift+Tab, Enter, Escape, Arrow keys).
- Visible focus indicators.
- ARIA labels, roles, states for dynamic elements.
- Alt text for images.
- Screen reader text for icon-only buttons.
- WCAG AA contrast (4.5:1 normal, 3:1 large).
- Skip links for navigation.
- ARIA live regions for dynamic updates.
- Focus must be trapped in modals and returned to the trigger on close.
- Form fields must have labels for screen readers.

Micro-interactions:

- Button hover: background opacity change, 150ms ease-in-out.
- Card hover: elevation increase, subtle scale (1.01), 200ms.
- Page transitions: fade-in, 300ms.
- Loading: skeleton screens, shimmer, circular progress.
- Notifications: slide in from right, auto-dismiss after 5s, progress bar indicator.

## 13. Real-Time Updates and Notifications

### Real-Time Requirements

- Socket.IO used for all real-time updates.
- Events: task:created, task:updated, task:deleted, task:activity:added, task:comment:added, notification, user:status:changed.
- Rooms: user:{userId}, org:{orgId}, dept:{deptId}, task:{taskId}.
- Task updates and notifications must be delivered to watchers and assignees via their user rooms; watcher-facing updates must appear without refresh.
- Reconnect on disconnect with status indicator.
- Invalidate RTK Query cache tags on real-time events.
- Toast notifications when updates affect current page.
  Example server emissions:

```
io.to(`task:${taskId}`).emit(\"task:updated\", updatedTask);
io.to(`user:${userId}`).emit(\"notification\", notification);
```

Example client listeners:

```
socket.on(\"task:updated\", (task) => {
  dispatch(updateTask(task));
});
socket.on(\"notification\", (notification) => {
  dispatch(addNotification(notification));
});
```

### Notifications

Notification model fields:

- title, message, entity, entityModel, organization, department, isRead, expiresAt.

Delivery:

- In-app: bell icon badge; dropdown shows recent (last 10), mark read, mark all read.
- Email: sent for important events; user preferences control which events trigger emails.
- Real-time: Socket.IO and optional browser notifications.
- Auto-expire after 30 days via expiresAt.
- Sound/visual alerts for urgent notifications.
  Common notification events (no type field):
- Task created/updated/completed/overdue (entityModel Task).
- Activity added (entityModel TaskActivity).
- Comment/mention/reply (entityModel TaskComment).
- User created/updated (entityModel User).
- Material created/updated (entityModel Material).
- Vendor created/updated (entityModel Vendor).

## 14. File Upload Flow and Storage

Flow:

1. Client selects file via react-dropzone.
2. Client uploads directly to Cloudinary.
3. Client receives Cloudinary URL.
4. Client sends URL and metadata to backend.
5. Backend stores URL and metadata in Attachment records.

Rules:

- Max file size 10MB.
- Allowed extensions (canonical allowlist): .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3 (CAN-027).
- File types: Image, Document, Video, Audio, Other.
- Cloudinary resource types:
  - Image extensions upload as `image/upload`.
  - Video extensions upload as `video/upload`.
  - Documents/archives/other upload as `raw/upload`.
- Attachments can be linked to: Task, TaskActivity, and TaskComment (CAN-021).

## 15. Error Handling and Feedback

Backend error codes:

- 401 UNAUTHENTICATED_ERROR
- 403 UNAUTHORIZED_ERROR
- 404 NOT_FOUND_ERROR
- 400 VALIDATION_ERROR
- 409 CONFLICT_ERROR
- 429 RATE_LIMITED_ERROR
- 500 INTERNAL_ERROR
  All 401 errors are unauthenticated; all 403 errors are unauthorized.

Frontend error handling:

- Root-level error page for unhandled errors.
- Route-level RouteError page for routing errors.
- Component-level fallback UI.
- 401: attempt refresh, if refresh fails then logout.
- 403: show error toast; do not logout.
- 4xx/5xx: show error message and retry where applicable.
- Root-level errors handled by ErrorBoundary component.
- Route errors handled by RouteError component.
- 404 pages include a back button.
- 403 errors are displayed via toast notifications only (no dedicated 403 page).

Required UI components:

- MuiLoading for loading indicators.
- ErrorDisplay for general errors.
- ApiErrorDisplay for API errors.
- MuiEmptyState for empty states.

## 16. Performance and Optimization

- Lazy load all page components.
- Use React.memo for expensive components (Card components must use React.memo).
- Use useCallback for event handlers.
- Use useMemo for computed values.
- RTK Query caching with invalidation on mutations and real-time events.
- Pagination by default; virtual scrolling if needed.
- Debounce search input.
- Optimize images and assets.
- Tree-shakable MUI imports only.
- Ensure initial load < 3 seconds on 3G.
- Optimize Core Web Vitals (LCP, FID, CLS).

## 17. Security Requirements

- JWT secrets must be identical for HTTP and Socket.IO.
- Access token expiry 15 minutes; refresh token expiry 7 days.
- Refresh token rotation on refresh.
- Tokens stored in HttpOnly cookies.
- CSRF protection enabled.
- Password hashing with bcrypt and >=12 salt rounds.
- Password strength validation enforced.
- Password change available in user profile settings.
- Password reset via email.
- Sensitive fields must be select:false.
- Rate limiting on all API routes.
- CORS must enable credentials for cookie-based auth.
- Helmet CSP must include Cloudinary CDN.
- All dates stored in UTC.
- API responses use ISO 8601 UTC strings.
- Organization data isolation enforced at query level.
- Department scoping enforced where applicable.
- Activity logging for all changes.
- Input validation and sanitization on all requests.
- Request validation uses express-validator.

Authentication flow:

1. User submits credentials.
2. Validator middleware validates credentials.
3. Backend generates access token (15 min) and refresh token (7 days).
4. Tokens stored in HttpOnly cookies.
5. Frontend includes cookies in all requests.
6. Backend verifies access token on each request.
7. If access token expired, frontend requests refresh.
8. Backend validates refresh token and issues new access token.
9. If refresh token expired, user must login again.
10. JWT payload includes user role, organization, and department identifiers.

## 18. API Contract

Authentication:

- POST /api/auth/register
- POST /api/auth/verify-email (customer org onboarding only; verifies initial SuperAdmin email and activates the organization)
- POST /api/auth/resend-verification (customer org onboarding only; rate-limited)
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password

Users:

- GET /api/users
- POST /api/users
- GET /api/users/:userId
- GET /api/users/:userId/activity
- GET /api/users/:userId/performance
- PUT /api/users/:userId
- PUT /api/users/:userId/preferences
- PUT /api/users/:userId/security
- DELETE /api/users/:userId
- PATCH /api/users/:userId/restore

Departments:

- GET /api/departments
- POST /api/departments
- GET /api/departments/:departmentId
- GET /api/departments/:departmentId/activity
- PUT /api/departments/:departmentId
- DELETE /api/departments/:departmentId
- PATCH /api/departments/:departmentId/restore

Tasks:

- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:taskId
- PUT /api/tasks/:taskId
- DELETE /api/tasks/:taskId
- PATCH /api/tasks/:taskId/restore

Task Activities:

- GET /api/tasks/:taskId/activities
- POST /api/tasks/:taskId/activities
- GET /api/tasks/:taskId/activities/:activityId
- PUT /api/tasks/:taskId/activities/:activityId
- DELETE /api/tasks/:taskId/activities/:activityId
- PATCH /api/tasks/:taskId/activities/:activityId/restore

Task Comments:

- GET /api/tasks/:taskId/comments
- POST /api/tasks/:taskId/comments
- GET /api/tasks/:taskId/comments/:commentId
- PUT /api/tasks/:taskId/comments/:commentId
- DELETE /api/tasks/:taskId/comments/:commentId
- PATCH /api/tasks/:taskId/comments/:commentId/restore

Materials:

- GET /api/materials
- POST /api/materials
- GET /api/materials/:materialId
- GET /api/materials/:materialId/usage
- PUT /api/materials/:materialId
- POST /api/materials/:materialId/restock
- DELETE /api/materials/:materialId
- PATCH /api/materials/:materialId/restore

Vendors:

- GET /api/vendors
- POST /api/vendors
- GET /api/vendors/:vendorId
- PUT /api/vendors/:vendorId
- POST /api/vendors/:vendorId/contact
- DELETE /api/vendors/:vendorId
- PATCH /api/vendors/:vendorId/restore

Notifications:

- GET /api/notifications
- PATCH /api/notifications/:notificationId/read
- PATCH /api/notifications/mark-all-read
- DELETE /api/notifications/:notificationId (optional)

Dashboard:

- GET /api/dashboard/overview (counts and KPI aggregates such as open tasks, overdue tasks, active users, pending approvals; also returns chart-ready data)
- GET /api/departments/:departmentId/dashboard (department-level dashboard analytics for Department Details "Overview" tab)

Attachments:

- POST /api/attachments
- DELETE /api/attachments/:attachmentId
- PATCH /api/attachments/:attachmentId/restore

Response formats:
Success:

```
{
  "success": true,
  "<resourceName>": "<payload>",
  "message": "Operation successful"
}
```

Error:

```
{
  "success": false,
  "message": "Error message",
  "error": {
    "type": "VALIDATION_ERROR",
    "statusCode": 400
  },
  "details": [
    {
      "field": "fieldName",
      "message": "Human readable message"
    }
  ]
}
```

Paginated:

```
{
  "success": true,
  "pagination": {
    "totalDocs": 100,
    "limit": 20,
    "page": 1,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "<resourceName>": "<payload>"
}
```

### 18.1 List Query Conventions (Canonical)

All list endpoints MUST support:

- `page` (1-based integer, default 1)
- `limit` (integer, default 20 unless the screen specifies otherwise)
- `sortBy` (string, default per-resource)
- `sortOrder` (`asc` | `desc`, default `desc`)
- `search` (string; debounced on client)
- `includeDeleted` (boolean, default false)

Multi-select filters MUST be passed as **comma-separated values** in a single query parameter key (do not repeat keys). Examples:

- `departmentId=dep1,dep2`
- `role=Admin,Manager`
- `status=ACTIVE,INACTIVE`
- `tags=frontend,urgent`

Platform SuperAdmin tenancy scoping (list endpoints):

- Platform SuperAdmin MAY pass `organizationId=<orgId>` to scope list results to a single customer organization.
- Non-platform users MUST NOT pass `organizationId`; if provided, backend MUST return 400 VALIDATION_ERROR.

Resource-specific filters are passed as additional query parameters (CAN-004). Examples:

- Users: `role`, `departmentId`, `status`
- Departments: `status`, `managerId`, `memberCountMin`, `memberCountMax`, `createdFrom`, `createdTo`
- Tasks: `status`, `priority`, `type`, `departmentId`, `assigneeId`, `createdById`, `watcherId`, `vendorId`, `materialId`, `startFrom`, `startTo`, `dueFrom`, `dueTo`, `tags`
- Vendors: `status`, `ratingMin`, `ratingMax`, `verifiedPartner`
- Materials: `category`, `status`, `sku`, `lowStockOnly`, `createdFrom`, `createdTo`, and `departmentId` (only for roles with cross-department read permission)

All list responses MUST use the Paginated shape shown above.

### 18.2 Authentication Endpoints (Canonical Contracts)

#### POST `/api/auth/register`

Purpose:

- Customer organization onboarding only.
- Creates Organization + first Department + first SuperAdmin user in an unverified state (CAN-008).
- Sends verification email to the initial SuperAdmin email.

Request body:

```
{
  "organization": {
    "name": "TechCorp",
    "email": "info@techcorp.com",
    "phone": "+251912345678",
    "address": "123 Tech Street, Addis Ababa, Ethiopia",
    "industry": "Technology",
    "size": "Small",
    "description": "Optional"
  },
  "department": {
    "name": "Engineering",
    "description": "Software development and infrastructure"
  },
  "user": {
    "firstName": "Michael",
    "lastName": "Scott",
    "position": "IT Director",
    "email": "michael@techcorp.com",
    "password": "********",
    "confirmPassword": "********"
  }
}
```

Response body (no auth cookies set until verified):

```
{
  "success": true,
  "message": "Verification email sent. Please verify to activate your organization.",
  "verificationRequired": true,
  "email": "michael@techcorp.com"
}
```

Errors:

- 400 VALIDATION_ERROR
- 409 CONFLICT_ERROR (duplicate org email/user email, or other uniqueness conflicts)
- 429 RATE_LIMITED_ERROR

#### POST `/api/auth/verify-email`

Request body:

```
{ "token": "<verificationToken>" }
```

Response body:

```
{
  "success": true,
  "message": "Account verified successfully."
}
```

Side effects:

- Set `Organization.isVerified=true`, set `Organization.verifiedAt`.
- Set initial `User.isVerified=true`, set `User.emailVerifiedAt`.
- Clear verification token fields.
- Send welcome email exactly once (idempotent) and set `User.welcomeEmailSentAt` when sent.

#### POST `/api/auth/resend-verification`

Request body:

```
{ "email": "michael@techcorp.com" }
```

Response body:

```
{
  "success": true,
  "message": "Verification email resent."
}
```

#### POST `/api/auth/login`

Request body:

```
{ "email": "michael@techcorp.com", "password": "********" }
```

Response body (auth cookies set):

```
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "<userId>",
    "firstName": "Michael",
    "lastName": "Scott",
    "role": "SuperAdmin",
    "isHod": true,
    "isPlatformOrgUser": false,
    "organization": { "_id": "<orgId>", "name": "TechCorp", "isPlatformOrg": false },
    "department": { "_id": "<deptId>", "name": "Engineering" }
  }
}
```

Rules:

- Login MUST be rejected with 403 UNAUTHORIZED_ERROR if `User.isVerified=false` for the initial onboarding user (until verified).
- Login MUST be rejected with 403 UNAUTHORIZED_ERROR if `User.status=INACTIVE`.

#### POST `/api/auth/refresh`

- Uses refresh token cookie; returns a success response and rotates tokens as required.

#### POST `/api/auth/logout`

- Clears auth cookies; returns success.

#### POST `/api/auth/forgot-password`

Request body:

```
{ "email": "michael@techcorp.com" }
```

Response body:

```
{ "success": true, "message": "If the email exists, a reset link was sent." }
```

#### POST `/api/auth/reset-password`

Request body:

```
{ "token": "<resetToken>", "password": "********", "confirmPassword": "********" }
```

#### POST `/api/auth/change-password`

Request body:

```
{ "currentPassword": "********", "newPassword": "********", "confirmNewPassword": "********" }
```

### 18.3 Users Endpoints (Canonical Contracts)

#### GET `/api/users`

Purpose:

- Users list/grid page.
- Department Details → Members tab (department-scoped).
- User pickers (watchers/assignees/mentions) (scoped and typically `status=ACTIVE`).

Query params:

- canonical list params (page/limit/sortBy/sortOrder/search/includeDeleted)
- platform-only filter:
  - `organizationId` (string; optional but strongly recommended for Platform SuperAdmin to avoid cross-org full scans)
- filters:
  - `departmentId` (comma-separated department ids; ignored/forbidden if caller cannot read cross-department users)
  - `role` (comma-separated roles)
  - `status` (comma-separated `ACTIVE,INACTIVE`)
  - `joinedFrom`, `joinedTo` (ISO dates)
  - `employeeId` (exact match)
  - `includeInactive` (boolean; default `true` for user-management lists; default `false` for pickers)

Response item fields (User summary):

- `_id`, `firstName`, `lastName`, derived `fullName`
- `email`, optional `phone`
- `position`
- `role`, `status`, `isHod`
- `employeeId`, `joinedAt`, `lastLogin`
- `profilePictureUrl` (or null)
- `department`: `{ _id, name }`
- `organization`: `{ _id, name }` (included for Platform SuperAdmin only)
- `isDeleted`, `createdAt`

#### POST `/api/users`

Purpose:

- Create a new user within the caller’s organization (SuperAdmin only per authorization matrix).

Request body (validated; creator does **not** set the user’s password in UI):

```
{
  "firstName": "Jennifer",
  "lastName": "Wong",
  "position": "Engineering Lead",
  "email": "jennifer.wong@techcorp.com",
  "phone": "+251912345678",
  "role": "Admin",
  "departmentId": "<deptId>",
  "isHod": true,
  "dateOfBirth": "1996-02-15",
  "joinedAt": "2026-02-05",
  "employeeId": "0002",
  "skills": [{ "skill": "Agile Methodology", "percentage": 90 }],
  "profilePicture": { "url": "https://res.cloudinary.com/<cloud>/image/upload/<path>", "publicId": "<publicId>" }
}
```

Rules / side effects:

- Sets `User.isVerified=true` by default for created users (CAN-008).
- If the selected department is `INACTIVE`, backend MUST reject with 409 CONFLICT_ERROR ("Department is inactive").
- If `joinedAt` is omitted, backend sets `joinedAt=now` (must not be future).
- If `employeeId` is omitted, backend auto-generates a 4-digit id (pattern enforced).
- Backend generates a temporary strong password (never returned) and hashes it with bcrypt (>=12 rounds).
- Backend generates a one-time password setup/reset token + expiry and sends a welcome email containing the setup link.
- Backend MUST set `User.welcomeEmailSentAt` only after successfully sending the welcome email (idempotent once-per-user).

#### GET `/api/users/:userId`

Purpose:

- User Details page → Overview tab needs core profile + aggregates.
- Settings page (for current user) uses the same endpoint.

Response body MUST include:

- `user` (core profile):
  - `_id`, `firstName`, `lastName`, `position`, `email`, `phone`
  - `role`, `status`, `isVerified`, `isHod`, `isPlatformOrgUser`
  - `employeeId`, `joinedAt`, `dateOfBirth`
  - `profilePicture`, `skills`
  - `department`: `{ _id, name }`
  - `organization`: `{ _id, name, isPlatformOrg }`
  - `lastLogin`, `createdAt`, `updatedAt`, `isDeleted`
- `overviewAggregates` (for Overview tab):
  - `tasks`: `{ total, created, assigned, watching, completed, overdue, pendingReview }`
  - `recentActivity` (array of 0–10 ActivityFeedItem objects; see Activity endpoint)

#### PUT `/api/users/:userId`

Purpose:

- Update user profile fields (self-update) and admin-managed fields (SuperAdmin/Admin update).

Editable fields (canonical):

- `firstName`, `lastName`, `position`, `phone`, `dateOfBirth`
- `profilePicture`, `skills`
- `status` (activate/deactivate; Admin/SuperAdmin only)
- `email` (allowed; uniqueness enforced; no email verification required beyond initial org onboarding per CAN-008)
- `departmentId`, `role`, `employeeId`, `joinedAt`, `isHod` (only if target role is SuperAdmin; see immutability rule)

Immutability rule (CAN-016):

- For target users whose current `role` is **Admin, Manager, or User**, the following fields are immutable and MUST return `409 CONFLICT_ERROR` if attempted: `departmentId`, `role`, `employeeId`, `joinedAt`, `isHod`.

#### PUT `/api/users/:userId/preferences`

Purpose:

- Update notification + appearance preferences (Settings tabs).

Request body:

```
{
  "preferences": {
    "notifications": { "emailEnabled": true, "inAppEnabled": true, "emailEvents": { "task": true } },
    "appearance": { "themeMode": "SYSTEM", "timeFormat": "12H", "timezone": "UTC" }
  }
}
```

Rules:

- Self-only.

#### PUT `/api/users/:userId/security`

Purpose:

- Update security settings such as `twoFactorEnabled`.

Request body:

```
{ "security": { "twoFactorEnabled": false } }
```

Rules:

- Self-only.

#### DELETE `/api/users/:userId` and PATCH `/api/users/:userId/restore`

- Delete is soft-delete with cascade rules as defined in Engineering Constraints.
- Restore uses `.withDeleted()` existence checks and restores cascaded resources in a safe order.

#### GET `/api/users/:userId/activity`

Purpose:

- Power User Details → Activity tab.

Query params:

- canonical list params
- optional filters: `entityModel`, `from`, `to`

Response item shape (ActivityFeedItem):

```
{
  "_id": "<eventId>",
  "eventType": "TASK_COMMENT_CREATED",
  "message": "Jennifer Wong commented on Fix Login Bug",
  "entityModel": "TaskComment",
  "entity": { "_id": "<entityId>", "label": "Fix Login Bug" },
  "actor": { "_id": "<userId>", "firstName": "Jennifer", "lastName": "Wong", "profilePictureUrl": "<url>" },
  "createdAt": "2026-02-05T12:34:56.000Z",
  "meta": { "taskId": "<taskId>", "departmentId": "<deptId>" }
}
```

#### GET `/api/users/:userId/performance`

Purpose:

- Power User Details → Performance tab with KPI cards + chart-ready series.

Query params:

- `range` enum `LAST_7_DAYS | LAST_30_DAYS | LAST_6_MONTHS | THIS_QUARTER` (default `LAST_6_MONTHS`)

Response body MUST include:

- `kpis`:
  - `completionRate` (0–1)
  - `completionRateDelta` (0–1, vs previous period)
  - `avgTaskTimeMinutes`
  - `avgTaskTimeDeltaMinutes` (vs dept average)
  - `tasksCompletedTotal`
  - `tasksCompletedInRange`
- `throughputSeries`: chart-ready `{ labels: string[], values: number[] }`
- `efficiencyRadar`: `{ dimensions: string[], user: number[], teamAvg: number[] }`
- `recentPerformanceReviews` (array; MVP may return empty):
  - `{ title, ratingLabel, comment, reviewedBy: { _id, firstName, lastName }, reviewedAt }`

### 18.4 Departments Endpoints (Canonical Contracts)

#### GET `/api/departments`

Purpose:

- Departments list/grid page.
- Department selector options (for `isHod=true` users permitted to switch departments).

Query params:

- canonical list params
- platform-only filter:
  - `organizationId` (string; optional but strongly recommended for Platform SuperAdmin)
- filters:
  - `status` (comma-separated `ACTIVE,INACTIVE`)
  - `managerId` (user id)
  - `memberCountMin`, `memberCountMax` (integers)
  - `createdFrom`, `createdTo` (ISO dates)

Response item fields (Department summary):

- `_id`, `name`, `description`, `status`, `createdAt`
- `manager`: `{ _id, firstName, lastName, email, profilePictureUrl }` (or null)
- derived aggregates:
  - `memberCount`
  - `taskCount`
  - `activeTaskCount`

#### POST `/api/departments`

Request body:

```
{
  "name": "Engineering",
  "description": "Software development and infrastructure",
  "status": "ACTIVE",
  "managerId": "<userId>"
}
```

Rules:

- `managerId` is optional and, if provided, MUST reference a user in the same organization.

#### GET `/api/departments/:departmentId`

Returns Department detail for Department Details header and routing decisions:

- `department` core fields: `_id`, `name`, `description`, `status`, `createdAt`
- `manager` summary (or null)
- header aggregates:
  - `totalUsers`
  - `totalTasks`
  - `activeTasks`

#### PUT `/api/departments/:departmentId`

Updates:

- `name`, `description`, `status`, `managerId`

Rules:

- If `status` is set to `INACTIVE`, backend MUST enforce “no new creates” for users/tasks/materials in that department (409 on create).

#### DELETE `/api/departments/:departmentId` and PATCH `/api/departments/:departmentId/restore`

- Soft delete with cascade rules as defined in Engineering Constraints.
- Restore uses `.withDeleted()` and restores cascaded resources in correct order.

#### GET `/api/departments/:departmentId/dashboard`

Returns chart-ready analytics and KPI aggregates for Department Details "Overview" tab.

Response body MUST include:

- `kpis`: `{ tasksInProgress, overdueTasks, totalTasks, completedTasks, totalUsers, activeUsers }`
- `weeklyCompletionSeries`: chart-ready series for the “Weekly Task Completion” widget
- `teamVelocity`: numeric + delta vs prior period (if available)
- `efficiency`: numeric + delta vs prior period (if available)
- `activeMembers`: list of top N active users with `{ _id, fullName, position, profilePictureUrl, tasksCount }`
- `recentTasks`: last N task summaries

#### GET `/api/departments/:departmentId/activity`

Returns the department activity feed (Department Details → Tasks tab → All Activity / Comments / Files sub-tabs), paginated.

Query params:

- canonical list params
- optional:
  - `entityModel` enum `Task | TaskActivity | TaskComment | Attachment`
  - `from`, `to` ISO dates

Response items use the same ActivityFeedItem shape defined in `GET /api/users/:userId/activity` with:

- `meta.departmentId` always present
- `meta.tabHints` optional (e.g., `{ defaultTab: "FILES" }` for attachment events)

### 18.5 Tasks Endpoints (Canonical Contracts)

#### GET `/api/tasks`

Purpose:

- Tasks list/grid pages.
- Department Details → Tasks tab (department-scoped).
- User Details → Tasks tab (assigned/created/watching sub-tabs).

Query params:

- canonical list params
- platform-only filter:
  - `organizationId` (string; optional but strongly recommended for Platform SuperAdmin)
- filters:
  - `type` (comma-separated `ProjectTask,AssignedTask,RoutineTask`)
  - `status` (comma-separated `TODO,IN_PROGRESS,PENDING,COMPLETED`)
  - `priority` (comma-separated `LOW,MEDIUM,HIGH,URGENT`)
  - `departmentId` (only for roles allowed cross-department task reads; otherwise forced to own dept)
  - `assigneeId`, `createdById`, `watcherId` (user id; supports “Assigned to me” etc)
  - `vendorId` (ProjectTask only)
  - `materialId` (RoutineTask + TaskActivity materials usage filter)
  - `startFrom`, `startTo`, `dueFrom`, `dueTo` (ISO dates)
  - `tags` (comma-separated tag strings; exact match on normalized lowercase tags)

Response item fields (Task summary):

- `_id`, `type`, `title`
- `status`, `priority`, `tags`
- `department`: `{ _id, name }`
- `createdBy`: `{ _id, firstName, lastName, profilePictureUrl }`
- type-specific summaries:
  - ProjectTask: `vendor`: `{ _id, name, status }`, `startDate`, `dueDate`
  - AssignedTask: `assignees`: `{ _id, firstName, lastName, profilePictureUrl }[]`, `startDate`, `dueDate`
  - RoutineTask: `date`
- derived counts: `activitiesCount`, `commentsCount`, `attachmentsCount`
- `isDeleted`, `createdAt`, `updatedAt`

#### POST `/api/tasks`

Creates a task of one of the three task types.

Request body (validated):

```
{
  "type": "ProjectTask",
  "title": "Implement User Authentication System",
  "description": "Build JWT-based authentication system...",
  "priority": "HIGH",
  "tags": ["security", "authentication"],
  "watchers": ["<userId>"],
  "vendorId": "<vendorId>",
  "startDate": "2026-02-05",
  "dueDate": "2026-02-12"
}
```

AssignedTask example:

```
{
  "type": "AssignedTask",
  "title": "Fix Login Bug",
  "description": "Investigate session timeout and apply fix.",
  "priority": "URGENT",
  "tags": ["bug", "auth"],
  "assigneeIds": ["<userId1>", "<userId2>"],
  "startDate": "2026-02-05",
  "dueDate": "2026-02-06"
}
```

RoutineTask example:

```
{
  "type": "RoutineTask",
  "title": "Daily Site Inspection",
  "description": "Perform daily safety inspection and record findings.",
  "priority": "MEDIUM",
  "tags": ["ops"],
  "date": "2026-02-05",
  "materials": [{ "materialId": "<materialId>", "quantity": 5 }]
}
```

Rules / side effects:

- Organization and department are derived from `req.user` (caller cannot set).
- If `req.user.department` is `INACTIVE`, backend MUST reject with 409 CONFLICT_ERROR ("Department is inactive").
- Creator MUST be added to watchers by default.
- Validations:
  - watchers/assignees/mentions MUST be ACTIVE and in the same org+dept scope.
  - ProjectTask requires `vendorId` and vendor status must be ACTIVE.
  - AssignedTask requires `assigneeIds` (1–50) and assignees must be ACTIVE.
  - RoutineTask requires `date` and may include `materials` with inventory rules (CAN-019).
- Creates an initial TaskActivity “Task created” for ProjectTask and AssignedTask.
- Emits Socket.IO events and creates notifications as defined in Real-Time + Notifications requirements.

#### GET `/api/tasks/:taskId`

Returns:

- `task` core fields + discriminators (full detail)
- `overviewAggregates` for Overview tab:
  - `timeline`: status/priority changes (server-provided or derived from activities)
  - `attachments`: attachment summaries where `parentModel=Task` (non-paginated; max 20)
  - `materials`: RoutineTask materials summary (if RoutineTask)
  - `assignees`/`vendor`/`watchers` expanded summaries as applicable

#### PUT `/api/tasks/:taskId`

Updates task core fields.

Rules:

- Type cannot change after creation.
- RoutineTask:
  - materials updates MUST adjust inventory by delta in the same DB session (CAN-019).
  - TaskActivity creation is not allowed.
- Status/priority changes MUST generate TaskActivity entries for auditability.

#### DELETE `/api/tasks/:taskId` and PATCH `/api/tasks/:taskId/restore`

- Soft delete; cascades to activities/comments/attachments/notifications per Engineering Constraints.
- Restore uses `.withDeleted()` checks and restores cascaded resources in safe order.
- Inventory correction (CAN-019):
  - If the deleted/restored task is a RoutineTask with `materials[]`, delete MUST increment each referenced Material’s `inventory.stockOnHand` by the used quantities (revert usage) and restore MUST decrement again.
  - If restore would cause any `inventory.stockOnHand` to go below 0, restore MUST fail with 409 CONFLICT_ERROR ("Insufficient stock to restore") and keep the task deleted.
  - If the task has TaskActivities with materials, the cascade delete/restore of those activities MUST apply the same revert/re-apply behavior for their material usage.

#### Task Activities (within a task)

GET `/api/tasks/:taskId/activities`

- Returns paginated TaskActivity items (default: those whose `parentModel=Task` and `parent=<taskId>`).
- Each item includes: `activity`, `createdBy`, `createdAt`, `materials` (with cost metadata), `attachments` summaries, `isDeleted`.

POST `/api/tasks/:taskId/activities`

Request body:

```
{
  "activity": "Added API spec draft",
  "parentModel": "Task",
  "parentId": "<taskId>",
  "materials": [{ "materialId": "<materialId>", "quantity": 5 }]
}
```

Rules:

- Reject with 409 CONFLICT_ERROR if the task is RoutineTask.
- Material usage MUST decrement inventory in the same DB session (CAN-019).

GET `/api/tasks/:taskId/activities/:activityId`

- Returns a single TaskActivity detail (same fields as the list item + full `attachments` list).

PUT `/api/tasks/:taskId/activities/:activityId`

- Updates `activity` text and optional `materials[]` for the activity.
- Inventory rule (CAN-019):
  - If `materials[]` is updated, backend MUST compute per-material quantity deltas and adjust `inventory.stockOnHand` in the same DB session.
  - If any delta would cause stock to go below 0, return 409 CONFLICT_ERROR ("Insufficient stock") and do not modify the activity.

DELETE `/api/tasks/:taskId/activities/:activityId` and PATCH `/api/tasks/:taskId/activities/:activityId/restore`

- Soft delete / restore the activity.
- Inventory rule (CAN-019):
  - On delete, revert usage by incrementing `inventory.stockOnHand` for each material used by that activity.
  - On restore, re-apply usage by decrementing `inventory.stockOnHand`; if insufficient, restore MUST fail with 409 and keep the activity deleted.

#### Task Comments (within a task)

GET `/api/tasks/:taskId/comments`

- Defaults to root comments (those whose `parentModel=Task` and `parent=<taskId>`).
- Supports `parentModel` + `parentId` to fetch replies (lazy-load threads).
- Returns paginated TaskComment items; each item includes `depth` (0–5), `mentions` summaries, and `attachments` summaries.

POST `/api/tasks/:taskId/comments`

Request body:

```
{
  "comment": "Please review this section @michael",
  "parentModel": "Task",
  "parentId": "<taskId>"
}
```

Rules / side effects:

- Mention detection:
  - Backend extracts `@` mentions and resolves them to user ids within scope.
  - Adds resolved ids to `mentions[]`.
  - Creates notifications for mentioned users (entityModel=TaskComment).
- Depth rule:
  - Replies increment `depth` and MUST be rejected if the resulting depth would exceed 5.

GET `/api/tasks/:taskId/comments/:commentId`

- Returns a single TaskComment detail (same fields as list item + full `attachments` list).

PUT `/api/tasks/:taskId/comments/:commentId`

- Updates only the `comment` text (and attachments may be added/removed via Attachment endpoints).
- Mention detection MUST be re-run on update:
  - Mentions removed from the text MUST be removed from `mentions[]`.
  - Newly added mentions MUST be added to `mentions[]` and generate notifications (idempotent per comment+user).

DELETE `/api/tasks/:taskId/comments/:commentId` and PATCH `/api/tasks/:taskId/comments/:commentId/restore`

- Soft delete / restore the comment.
- Deletion MUST cascade to child comments recursively (Engineering Constraints).
- Restore MUST restore the comment thread in a safe order (parents before children).

### 18.6 Materials Endpoints (Canonical Contracts)

#### GET `/api/materials`

Query params:

- canonical list params (page/limit/sortBy/sortOrder/search/includeDeleted)
- platform-only filter: `organizationId` (string; optional but strongly recommended for Platform SuperAdmin)
- filters: `category`, `status`, `sku`, `lowStockOnly`, `createdFrom`, `createdTo`
- optional: `departmentId` (only for roles permitted to view other departments; otherwise ignored/forbidden)

Response payload item fields (Material summary):

- `_id`, `name`, `sku`, `status`, `category`, `unit`, `price` (unitPrice)
- `inventory`: `{ stockOnHand, lowStockThreshold }` + derived `isLowStock`
- `createdBy`: `{ _id, firstName, lastName, profilePictureUrl }`
- `department`: `{ _id, name }`
- `createdAt`
- derived aggregates: `usageCount`, `associatedTasksCount` (optional but recommended for list views)

#### POST `/api/materials`

Request body (validated):

```
{
  "name": "Steel Beam Type-A",
  "sku": "MT-ST-0045",
  "status": "ACTIVE",
  "category": "Construction",
  "unit": "Linear Foot (ft)",
  "price": 42.5,
  "description": "Optional",
  "inventory": { "stockOnHand": 0, "lowStockThreshold": 0 }
}
```

Rules:

- Material is department-scoped; `organization` and `department` are derived from `req.user`.
- If `req.user.department` is `INACTIVE`, backend MUST reject with 409 CONFLICT_ERROR ("Department is inactive").

Response:

- `201` with created Material (detail shape).

#### GET `/api/materials/:materialId`

Returns Material detail + aggregates used by Material Details:

- material core fields
- `usageAggregates`: `{ usageCount, totalQuantityUsed, associatedTasksCount, usageRate, totalCost }`
- `usageHistory`: paginated table rows OR omit and require `GET /api/materials/:materialId/usage`

#### GET `/api/materials/:materialId/usage`

Returns paginated usage history rows derived from RoutineTask materials and TaskActivity materials:

- `task`: `{ _id, title, type, status }`
- `dateUsed` (ISO date)
- `quantity`
- `unit` (denormalized from material at time of usage, optional)
- `unitPrice` (denormalized from material at time of usage)
- `cost` (computed)
- `source`: `RoutineTask | TaskActivity`

#### PUT `/api/materials/:materialId`

- Updates editable fields (name/sku/status/category/unit/price/description/lowStockThreshold).
- Must reject `sku` conflicts within department (409).

#### POST `/api/materials/:materialId/restock`

Request body:

```
{ "quantity": 50, "note": "Initial stocking" }
```

Behavior:

- Must run in a DB session (CAN-019).
- Increments `inventory.stockOnHand` by `quantity` and updates `inventory.lastRestockedAt`.

#### DELETE `/api/materials/:materialId` and PATCH `/api/materials/:materialId/restore`

- Delete is soft-delete and is blocked by association rules (CAN-015).
- Restore restores soft-deleted material.

### 18.7 Vendors Endpoints (Canonical Contracts)

#### GET `/api/vendors`

Query params:

- canonical list params
- platform-only filter: `organizationId` (string; optional but strongly recommended for Platform SuperAdmin)
- filters: `status`, `ratingMin`, `ratingMax`, `verifiedPartner`, `createdFrom`, `createdTo`

Response payload item fields (Vendor summary):

- `_id`, `name`, `status`, `isVerifiedPartner`, `rating`, derived `ratingCount`
- `email`, `phone`, optional `website`, optional `location`
- derived aggregates: `{ totalProjectsCount, activeProjectsCount, completedProjectsCount }`
- `createdBy`: `{ _id, firstName, lastName, profilePictureUrl }`
- `createdAt`

#### POST `/api/vendors`

Request body:

```
{
  "name": "TechSupply Inc.",
  "email": "contact@techsupply.example",
  "phone": "+251912345678",
  "website": "https://techsupply.example",
  "location": "Addis Ababa, Ethiopia",
  "address": "Optional",
  "status": "ACTIVE",
  "isVerifiedPartner": false,
  "rating": 4.5,
  "description": "Optional"
}
```

#### GET `/api/vendors/:vendorId`

Returns Vendor detail + aggregates used by Vendor Details:

- vendor core fields
- `metrics`: `{ totalProjects, activeProjects, inProgressProjects, completedProjects, onTimeDeliveryRate, avgProjectDurationDays, totalSpend }`

#### PUT `/api/vendors/:vendorId`

- Updates editable fields (name/email/phone/website/location/address/status/isVerifiedPartner/rating/description).

#### DELETE `/api/vendors/:vendorId` and PATCH `/api/vendors/:vendorId/restore`

- Delete is soft-delete and is blocked by association rules (CAN-015).
- Restore restores soft-deleted vendor.

#### POST `/api/vendors/:vendorId/contact`

Request body:

```
{
  "subject": "Request for quotation",
  "message": "Hello, please provide a quote for...",
  "ccMe": true
}
```

Behavior:

- Sends email via Nodemailer to the vendor email address.
- No persistent contact log is stored in MongoDB for MVP; server request logging (Winston) is sufficient.

### 18.8 Notifications Endpoints (Canonical Contracts)

- `GET /api/notifications` returns paginated notifications for the current user; supports `isRead`, `entityModel`, and date range filters.
- `PATCH /api/notifications/:notificationId/read` marks a single notification as read.
- `PATCH /api/notifications/mark-all-read` marks all current-user notifications as read.
- `DELETE /api/notifications/:notificationId` soft-deletes a notification (optional; only if required by UI).

### 18.9 Dashboard Endpoints (Canonical Contracts)

- `GET /api/dashboard/overview` returns the organization dashboard payload described in the Dashboard screen spec (filterable by date range and optional departmentId where permitted).
- `GET /api/departments/:departmentId/dashboard` returns department-level analytics for Department Details "Overview".
- `GET /api/departments/:departmentId/activity` returns the department activity feed for Tasks → All Activity and supports `entityModel` filtering.

### 18.10 Materials & Vendors Deletion Rules (Canonical)

- `DELETE /api/materials/:materialId` MUST return 409 CONFLICT_ERROR if the material is associated with any data via RoutineTask.materials or TaskActivity.materials (including soft-deleted parents via `.withDeleted()`) (CAN-015).
- `DELETE /api/vendors/:vendorId` MUST return 409 CONFLICT_ERROR if the vendor is associated with any ProjectTasks (including soft-deleted parents via `.withDeleted()`) (CAN-015).

### 18.11 Attachments Endpoints (Canonical Contracts)

Attachments are created after direct-to-Cloudinary upload.

#### POST `/api/attachments`

Creates an Attachment record linked to a parent entity.

Request body:

```
{
  "filename": "Requirements_Spec.pdf",
  "fileUrl": "https://res.cloudinary.com/<cloudName>/raw/upload/v123456/<path>",
  "fileType": "Document",
  "fileSize": 145000,
  "parent": "<parentId>",
  "parentModel": "Task"
}
```

Allowed `parentModel` values (canonical):

- `Task` (ProjectTask/AssignedTask/RoutineTask)
- `TaskActivity`
- `TaskComment`

Rules:

- Parent scoping MUST be enforced:
  - For Task/TaskActivity/TaskComment, parent MUST belong to `req.user.organization._id` and `req.user.department._id` unless the resource is org-level by definition.
- `fileUrl` MUST match the Cloudinary pattern in the Data Model.
- Creation is a write operation and MUST use sessions (CAN-013/ENG rules).

Response:

- `201` with the created attachment summary.

#### DELETE `/api/attachments/:attachmentId`

- Soft-deletes an Attachment record.
- Must validate association and scoping via parent lookup.
- Must use sessions and the soft-delete plugin methods (no hard delete).

#### PATCH `/api/attachments/:attachmentId/restore`

- Restores a soft-deleted Attachment record.
- Must use `.withDeleted()` during existence checks and restore.

## 19. Testing and QA Requirements

Testing is mandatory and strictly controlled.

- Only plain JavaScript test scripts that execute real application code.
- No testing frameworks or libraries.
- Tests must be runnable with node <script>.
- Tests must use real Mongoose models and the real database.
- No mocking of business logic, models, services, or authorization rules.
- Tests must simulate real backend behavior as exercised via Postman.
- Tests must not be written for UI, styling, framework internals, or third-party libraries.
- Tests must fail loudly using throw, process.exit(1), or explicit assertions.
- Tests must directly execute validators, controllers, and database logic.

Validator testing:

- Execute validators using .run(req).
- Assert with validationResult(req).
- Validate required fields, formats, existence, uniqueness.
- Existence checks for create and restore must use withDeleted().
- Params-based validators must assert existence.
- Department/vendor validators must be scoped by organization.
- All other validators must be scoped by organization and department.
- Validation failures must assert field name, message, and reason.

Controller testing:

- Controllers invoked directly as functions.
- req.user must be fully constructed as the actor with:
  - role
  - organization
  - organization.isDeleted
  - organization.isPlatformOrg
  - department
  - department.isDeleted
  - isPlatformOrgUser
  - isHod
  - isDeleted
- Controllers must not read from req.body/params/query.
- Controllers must consume req.validated only (body, params, query via matchedData).
- Mock res must implement status(code) and json(payload).
- Authorization, ownership, and scoping must be explicitly asserted.
- Controllers must use session for all write operations.
- Tests must populate req.validated exactly as the application does after validation middleware.

Required validated input shape:

```
req.validated = {
  body: matchedData(req, { locations: ["body"] }),
  params: matchedData(req, { locations: ["params"] }),
  query: matchedData(req, { locations: ["query"] })
};
```

Database verification:

- Verify create/update/delete side effects.
- Verify soft-delete flags and timestamps.
- Verify multi-tenant isolation.
- Verify ownership changes.
- Verify same-organization access succeeds and cross-organization access fails.
- Verify platform organization behavior is enforced.
- Verify ownership fields such as createdBy, assignees, watchers, mentions, uploadedBy.

Delete/restore testing:

- Ensure resource exists before delete.
- Authorization checks verified.
- Soft delete only.
- Cascade delete behavior tested.
- Restore uses withDeleted, verifies parent existence and correct order.
- Cascade delete must respect MongoDB transactions.

Test organization:

- Scripts named by resource and action (for example: task create script, task delete script).
- Each script runs independently.
- Test data must be cleaned or clearly identifiable.
- Tests must never alter platform organization integrity.

Testing scope:

- Tests must be written for validators, controllers, authorization logic, multi-tenant isolation, soft delete, restore, and cascade behavior.
- Tests must not be written for UI, styling, framework internals, or third-party libraries.

### 19.1 Canonical Test Case Corpus (Normative, Exhaustive)

In addition to the testing constraints above, the complete canonical test catalog is incorporated here as a **normative and mandatory** requirement set.

- Every test case ID and assertion in the canonical test catalog is REQUIRED and must be preserved (including validation, authorization, scoping, soft delete/restore, transaction/session, API response shape, and rate-limit/security behaviors).
- Canonical ID format is mandatory: `<RESOURCE>-<CATEGORY>-<ROUTE/OP>-###` (example: `TASK-VAL-POST-014`).
- Canonical error classes/codes are mandatory across API and UI handling: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED_ERROR`, `403 UNAUTHORIZED_ERROR`, `404 NOT_FOUND_ERROR`, `409 CONFLICT_ERROR`, `429 RATE_LIMITED_ERROR`, `500 INTERNAL_ERROR` (legacy alias `500 SERVER_ERROR` may be accepted only for backward compatibility).
- Shared test assumptions are mandatory: seeded Platform organization (`isPlatformOrg=true`), seeded Customer organization (`isPlatformOrg=false`), ACTIVE/INACTIVE departments, and users spanning all roles.
- Scope vocabulary is mandatory and must map consistently in validators/controllers/UI gating: `self`, `ownOrg`, `crossOrg`, `ownOrg.ownDept`, `ownOrg.crossDept`, `any`.
- Ownership vocabulary is mandatory and must map consistently in authorization logic: `self`, `createdBy`, `uploadedBy`, `assignees`, `watchers`, `mentioned`, `manager`, `isHod`.
- Registration, auth lifecycle, CRUD, restore, and list-query test cases in the canonical test catalog supersede any weaker or less specific wording elsewhere in this PRD.
- Any new endpoint/feature added after this PRD revision MUST introduce matching test-case entries using the same format and rigor before the feature is considered done.

## 20. Engineering Constraints and Implementation Rules

Critical rules:

1. Never skip reading existing files before making changes.
2. Never hard delete resources; use soft delete plugin methods only.
3. Never hardcode values; always import from the shared constants module.
4. Never use watch() in React Hook Form.
5. Never use deprecated MUI v5/v6 syntax (item prop, renderTags).
6. Never use non-tree-shakable MUI imports.
7. Never allow 401 errors to avoid logout if refresh token failed.
8. Never allow 403 errors to logout users.
9. Never skip organization/department scoping on operations.
10. Never allow non-platform users to access other organizations.
11. Never delete the platform organization.
12. Never create organization via a standalone organization API route.
13. Never use native Mongoose delete methods (remove, deleteOne, deleteMany).
14. Never use CMD/PowerShell commands; use Git Bash/WSL compatible commands.

Execution mindset:

- Every validation and correction must be addressed with no shortcuts.
- All changes must be documented in backend documentation.
- Production readiness and best practices must be considered at all times.
- Act as a senior engineer, team lead, architect, and validator.
- Do not limit yourself to requirements; think production readiness.
- Always search the existing codebase for issues before correcting.
- Always reference available docs, utils, middlewares, constants, models, controllers, routes, services.

Constants management:

- Backend constants module is the single source of truth.
- Frontend constants must match backend exactly.
- Use enums such as TASK_STATUS, TASK_PRIORITY, USER_ROLES, and related constants.

MUI import rule:

- Use tree-shakable imports (example: import Button from '@mui/material/Button').

MUI version rule:

- All MUI v7 components must follow v7 syntax and deprecation guidelines.

Soft delete rules:

- isDeleted flag, deletedAt timestamp, deletedBy reference.
- Use withDeleted() query helper to include deleted docs.
- Methods: softDelete, restore, softDeleteById, restoreById, cascadeDelete, cascadeRestore, validateDeletion, validateRestoration.
- UI: show Restore button when isDeleted, hide Delete button, include deleted toggle in filters.

Authorization rules:

- Use authorization matrix for permission checks.
- Frontend must use useAuthorization hook.
- Frontend must use authorizationHelper to interpret authorization claims.
- Hide/disable actions based on role and scope.
- Platform SuperAdmin: cross-org read only unless matrix allows more.
- Customer users: own organization only.

Backend controller rules (MANDATORY):

- All controllers MUST use `express-async-handler` and the exact export pattern:

```
export const <ControllerName> = asyncHandler(async (req, res, next) => {});
```

- All controllers MUST treat `req.user` as the **only** source of actor/context (role, org, department, flags).
- All controllers MUST treat `req.validated.body`, `req.validated.params`, and `req.validated.query` as the **only** source of request data (never `req.body`, `req.params`, `req.query`).
- All write controllers (create/update/delete/restore/attach/detach/status change) MUST:
  - Start a MongoDB session and transaction.
  - Wrap the full transaction in `try { ... } catch { ... } finally { ... }`.
  - Always `commitTransaction()` on success, `abortTransaction()` on failure, and `endSession()` in `finally`.
- Any write operation that calls model helpers (soft-delete plugin methods, cascades, validateDeletion/validateRestoration) MUST pass the same session through the entire call tree.

Session support in models (MANDATORY):

- The soft-delete plugin itself, and all schema hooks, schema methods, and schema statics, MUST support an optional session and MUST execute their DB operations using that session when provided.
- Any validator/controller that queries for existence/uniqueness MUST support a session when invoked inside a transaction (to avoid inconsistent reads).

JSDoc (STRICT):

- All backend and frontend modules MUST use strict JSDoc with TypeScript-compatible types (even though the repo is not TypeScript-based).
- JSDoc must be decision-complete: every exported function documents input types, return types, and thrown errors.

Timezone management:

- Backend stores UTC, uses dayjs with UTC plugin.
- Frontend uses native Intl.DateTimeFormat for all formatting.
- API responses use ISO 8601 UTC.
- Frontend must not use dayjs for user-facing formatting; dayjs may be used only for internal computations and as the date-picker adapter.

Frontend code quality:

- No hardcoded styling values; use theme tokens.
- Use theme.palette, theme.typography, theme.spacing for styling values.
- Use MUI styled() for custom styling.
- Responsive design via theme breakpoints.
- MUI Grid uses size prop (no item prop).
- MUI Autocomplete uses slots API (no renderTags).
- React Hook Form Controller for complex fields.
- Controlled fields use value + onChange.
- Wrap MUI components with Mui prefix.
- All tabular “Grid view” UIs MUST use `MuiDataGrid` from `client/src/components/reusable/*` with per-resource columns from `client/src/components/columns/*` and the shared `MuiDataGridToolbar`.
- All card-based “List view” UIs MUST use MUI `Grid` with tree-shakable import (`import Grid from '@mui/material/Grid'`) and the v7 `size` prop.
- React.memo for Card components.
- useCallback for handlers, useMemo for computed values.

Validation alignment:

- Frontend validation must match backend validators exactly.
- Use same patterns and limits from constants.

API integration:

- Use RTK Query endpoints.
- Invalidate cache tags on mutations.
- Loading states via skeletons/spinners.
- 401 behavior: refresh token, then logout if still 401.
- 403 behavior: show toast, no logout.

Frontend canonical constraints (MANDATORY):

- Search debouncing MUST NOT cause component re-renders:
  - Debounce timers and debounced callbacks MUST be stored in refs/memos, not in React state.
  - Typing in search inputs must not cause extra re-renders beyond the input itself; list queries update only on the debounced commit.
- All Redux slices / RTK Query endpoints MUST normalize both:
  - Successful responses (`transformResponse`)
  - Error responses (`transformErrorResponse`)
- All page containers MUST follow the same rendering pipeline:
  1. Trigger data fetch (RTK Query)
  2. Render loading state (skeletons for lists; `loading` prop for `MuiDataGrid`)
  3. On error: render `RouteError`
  4. On success: render data
- A global error component MUST handle client-side errors:
  - Hardcoding error types is forbidden; derive the type from the error object itself.
  - All 403 errors MUST be shown using toast notifications only.
- All reusable dialog components on mobile (`width <= 600px`) MUST cover full viewport height (`100vh`) and MUST use:
  - `disableEnforceFocus`
  - `disableRestoreFocus`
  - `aria-labelledby="dialog-title"`
  - `aria-describedby="dialog-description"`
  - `maxWidth="sm"`
  - `sx={{ "& .MuiDialog-paper": { bgcolor: "background.default", backgroundImage: "none", borderRadius: isMobile ? 0 : 2 } }}`
- All MUI components that accept a `size` prop MUST use `size="small"`.
- Any component using `React.forwardRef` MUST set `displayName`, and MUST NOT use PropTypes (and vice versa).
- All page wrappers MUST respect layout container constraints:
  - Public routes: `RootLayout` -> `PublicLayout` -> `Outlet` (page container)
  - Protected routes: `RootLayout` -> `DashboardLayout` -> `Outlet` (page container)
- Any overflowing text MUST end with an ellipsis (`...`) in all list cells, cards, headers, and detail sections.

File upload:

- React-dropzone -> Cloudinary -> backend stores URL.

Cascade delete operations:

- Organization cascade: Departments, Users, Tasks, Materials, Vendors, Notifications, Activities, Comments, Attachments per defined rules.
- Department cascade: Users, Tasks, Materials, TaskActivities, TaskComments, Attachments, Notifications.
- User cascade: Tasks (createdBy), TaskActivities, TaskComments, Materials, Vendors, Attachments, remove from watchers/assignees/mentions/notifications.
- Task cascade: TaskActivities, TaskComments, Attachments, Notifications.
- TaskActivity cascade: TaskComments, Attachments, Notifications.
- TaskComment cascade: Child comments (recursive), Attachments, Notifications.
- Material cascade: remove from RoutineTask materials, TaskActivity materials.
- Vendor cascade: ProjectTasks vendor set to null or cascade based on business logic.

Cascade delete details:

- Organization soft delete cascades to Departments, Users, Tasks, Materials, Vendors, Notifications, TaskActivities, TaskComments, Attachments.
- Department cascade includes:
  - Users (cascade) and remove user from Task watchers, AssignedTask assignees, TaskComment mentions, Notification entity user.
  - Tasks (cascade), Materials (soft delete), TaskActivities (cascade), TaskComments (cascade), Attachments (soft delete), Notifications (soft delete).
- Organization cascade additionally includes:
  - Department-level tasks and org-level tasks (cascade).
  - Direct org users (cascade).
  - Direct org materials (soft delete).
  - Vendors (soft delete).
  - Direct org notifications (soft delete).
- User cascade includes:
  - Tasks where createdBy = User (cascade).
  - TaskActivities where createdBy = User (cascade).
  - TaskComments where createdBy = User (cascade).
  - Materials createdBy = User (soft delete).
  - Vendors createdBy = User (soft delete).
  - Attachments uploadedBy = User (soft delete).
  - Remove user from Task watchers, AssignedTask assignees, TaskComment mentions, Notification entity user.
- Task cascade applies to ProjectTask, AssignedTask, RoutineTask:
  - TaskActivities where parent = Task (cascade).
  - TaskComments where parent = Task (cascade).
  - Attachments where parent = Task (soft delete).
  - Notifications where entity = Task (soft delete).
- TaskActivity cascade:
  - TaskComments where parent = TaskActivity (cascade).
  - Attachments where parent = TaskActivity (soft delete).
  - Notifications where entity = TaskActivity (soft delete).
- TaskComment cascade:
  - Child comments where parent = TaskComment (recursive cascade).
  - Attachments where parent = TaskComment (soft delete).
  - Notifications where entity = TaskComment (soft delete).
- Material cascade:
  - Remove from RoutineTask materials array.
  - Remove from TaskActivity materials array.
- Vendor cascade:
  - ProjectTasks where vendor = Vendor set vendor to null or cascade depending on business logic.

### 20.1 Development Rules Consolidation (Normative)

This PRD fully incorporates the development rules as mandatory engineering policy.

- Security policy is mandatory: JWT secret parity between HTTP and Socket.IO, bcrypt >=12 rounds, `select:false` on sensitive fields, UTC storage, rate limiting on all API routes, credentialed CORS, and Helmet CSP with Cloudinary allowances.
- Testing policy is mandatory: plain JavaScript scripts only, no test frameworks, real database/model execution, no business-logic mocking, explicit validator/controller assertions, and strict multi-tenant + authorization coverage.
- Test execution policy is mandatory: scripts are organized by resource/action naming (for example `test/<resource>/<action>.test.js`), executable independently, and must preserve platform-organization integrity.
- Frontend behavior policy is mandatory: 401 refresh-then-logout on refresh failure, 403 toast-only without logout, tree-shakable MUI imports, no deprecated syntax, and controlled form patterns (`Controller`, `value`, `onChange`).
- Data lifecycle policy is mandatory: soft delete only, withDeleted-aware existence checks for create/restore, cascade delete/restore methods, and TTL expiry behavior exactly as defined in Section 7.15.
- Execution mindset policy is mandatory: no shortcuts, production-readiness thinking, and explicit reuse of shared docs/utilities/middlewares/constants/models/controllers/routes/services.

### 20.2 Development Rules (Verbatim Canonical Copy)

# Development Rules

## Critical Rules (STRICTLY ENFORCED)

1. **NEVER** skip reading existing files before making changes
2. **NEVER** hard delete any resource - use soft delete plugin methods only
3. **NEVER** hardcode values - always import from `utils/constants.js`
4. **NEVER** use `watch()` method in React Hook Form
5. **NEVER** use deprecated MUI v5/v6 syntax (item prop, renderTags)
6. **NEVER** use non-tree-shakable MUI imports - always use tree-shakable imports (e.g., `import Button from '@mui/material/Button'`)
7. **NEVER** allow 401 errors to NOT logout user on frontend if refresh token failed
8. **NEVER** allow 403 errors to logout user on frontend (403 = forbidden, not unauthenticated)
9. **NEVER** skip organization/department scoping on operations
10. **NEVER** allow non-platform users to access other organizations
11. **NEVER** delete platform organization
12. **NEVER** create organization via API route (doesn't exist)
13. **NEVER** use native Mongoose delete methods (remove, deleteOne, deleteMany)
14. **NEVER** use CMD/PowerShell commands - use Git Bash/WSL compatible commands

## Security Rules

1. JWT secrets MUST be same for HTTP and Socket.IO
2. Passwords MUST use bcrypt with ≥12 salt rounds
3. Sensitive fields MUST have `select: false`
4. All dates MUST be stored in UTC timezone
5. Rate limiting MUST be applied to all API routes
6. CORS MUST enable credentials for cookie-based auth
7. Helmet CSP MUST include Cloudinary CDN
8. All 403 errors = unauthorized, all 401 errors = unauthenticated
9. Frontend 401 → refresh token on frontend → 401 → logout user
10. Frontend 403 errors MUST NOT logout user instead toast message

## Testing Rules

**CRITICAL: TESTING IS REQUIRED AND STRICTLY CONTROLLED**

Testing MUST be performed **only** using **plain JavaScript test scripts** that directly execute real application code.
NO testing frameworks or testing libraries are allowed (e.g., Jest, Mocha, Chai, Supertest, Vitest, Cypress).

Testing MUST simulate real backend behavior exactly as exercised via Postman, but driven programmatically.

### General Principles

1. Tests MUST directly execute validators, controllers, and database logic.
2. Tests MUST use real Mongoose models and the existing application database.
3. Tests MUST NOT mock business logic, models, services, or authorization rules.
4. Tests MUST fail loudly using `throw`, `process.exit(1)`, or explicit assertion checks.
5. Tests MUST be executable using `node <script>.js`.
6. Tests MUST strictly respect multi-tenant isolation, authorization, and soft-delete rules.

### Validator Testing Rules

1. All validators MUST be executed independently of Express using `.run(req)`.
2. Validation results MUST be asserted using `validationResult(req)`.
3. Validators MUST test and enforce:
   - Required fields
   - Field formats and data types
   - **Existence checks** for referenced resources
   - **Uniqueness checks** where applicable
4. For **create operations**, existence checks MUST be performed using `.withDeleted()` to prevent restore conflicts.
5. For **restore operations**, existence checks MUST explicitly use `.withDeleted()`.
6. For **all params-based validators**, existence checks MUST be performed and asserted.
7. Department and vendor validators MUST ALWAYS be scoped with:
   - `req.user.organization._id`
8. User, task (all three task types), material, task activity, task comment, attachment, and notification validators MUST ALWAYS be scoped with:
   - `req.user.organization._id`
   - `req.user.department._id`
9. Validation failures MUST assert:
   - Field name
   - Error message
   - Failure reason (missing, invalid, not found, conflict, unauthorized scope)

### Controller Testing Rules (all write operations must use session)

1. Controllers MUST be invoked directly as plain functions.
2. Tests MUST manually construct `req.user` as the **actor**, including:
   - `role`
   - `organization`
   - `organization.isDeleted`
   - `organization.isPlatformOrg`
   - `department`
   - `department.isDeleted`
   - `isPlatformOrgUser`
   - `isHod`
   - `isDeleted`
3. Controllers MUST NOT read input data from `req.body`, `req.params`, or `req.query`.
4. Controllers MUST ONLY consume validated input from:

   ```js
   req.validated = {
     body: matchedData(req, { locations: ["body"] }),
     params: matchedData(req, { locations: ["params"] }),
     query: matchedData(req, { locations: ["query"] }),
   };
   ```

5. Tests MUST populate `req.validated` exactly as the application does after validation middleware.
6. Tests MUST use a manually mocked `res` object implementing:

   - `status(code)`
   - `json(payload)`

7. Authorization, ownership, organization scoping, department scoping, and platform rules MUST be asserted explicitly.

### Database Verification Rules

1. Tests MUST verify database side effects explicitly:

   - Created resources exist
   - Updated resources reflect expected changes
   - Deleted resources follow soft-delete rules (`isDeleted`, `deletedAt`)

2. Multi-tenant rules MUST be validated:

   - Same-organization access succeeds
   - Cross-organization access fails
   - Platform organization behavior is enforced correctly

3. Ownership rules MUST be validated (createdBy, assignees, mentions, watchers, uploadedBy, etc).

### Deletion & Restore Testing Rules

1. Delete tests MUST verify:

   - Resource existence before deletion
   - Authorization and ownership checks
   - Soft-delete behavior only (never hard delete)

2. Cascade delete behavior MUST be validated:

   - Child resources are affected correctly
   - MongoDB transactions are respected

3. Restore tests MUST verify:

   - Resource existence using `.withDeleted()`
   - Parent existence and correct restoration order
   - Tenant and department isolation rules

### Scope of Testing

Tests MUST be written for:

- Validators
- Controllers
- Authorization logic
- Multi-tenant isolation
- Soft delete, restore, and cascade behavior

Tests MUST NOT be written for:

- UI
- Styling
- Framework internals
- Third-party libraries

### Execution Rules

1. Tests MUST be organized by resource and action:

   - `test/task/createTask.test.js`
   - `test/task/deleteTask.test.js`

2. Each test script MUST be executable independently.
3. Tests MUST clean up created data when required or use clearly identifiable test records.
4. Tests MUST NEVER alter platform organization integrity or critical production data.

## Execution Mindset

1. Every validation and correction must be addressed with no shortcuts
2. All changes must be documented in backend/docs
3. Production readiness and best practices must be considered at all times
4. Act with senior software engineer, team lead, architect, and validator mindset
5. Don't limit yourself to requirements - think production readiness
6. Always search existing codebase for issues before correcting
7. Always reference available docs, utils, middlewares, constants, models, controllers, routes, services

## Constants Management

- Backend: `backend/utils/constants.js` is SINGLE SOURCE OF TRUTH
- Frontend: `client/src/utils/constants.js` MUST match backend exactly
- NEVER hardcode values - always import from constants
- Enums: TASK_STATUS, TASK_PRIORITY, USER_ROLES, etc.

## Soft Delete Rules

- All resources use `isDeleted` flag
- Show "Restore" button for deleted resources (isDeleted === true)
- Hide "Delete" button for deleted resources
- Include deleted toggle in filters
- `isDeleted` flag (default: false)
- `deletedAt` timestamp (null when not deleted)
- `deletedBy` user reference (null when not deleted)
- `withDeleted()` query helper to include deleted documents
- `softDelete(deletedBy, session)` instance method
- `restore(session)` instance method
- `softDeleteById(id, deletedBy, session)` static method
- `restoreById(id, session)` static method
- `cascadeDelete(id, deletedBy, session, options)` static method
- `cascadeRestore(id, session, options)` static method
- `validateDeletion(document, session)` static method
- `validateRestoration(document, session)` static method

## Authorization Rules

- Use authorization matrix for permission checks
- Frontend: Use `useAuthorization` hook
- Hide/disable actions based on user role and scope
- Platform SuperAdmin: cross-org read access only
- Customer users: own organization only
- Ownership fields

## Timezone Management

- Backend: Store all dates in UTC timezone
- Backend: Use dayjs with UTC plugin
- Frontend: Use native JavaScript Intl API for all date/time formatting
- Frontend: NEVER use dayjs - use Intl.DateTimeFormat
- API responses: ISO 8601 format with UTC timezone

## File Upload Flow

1. Client selects file (react-dropzone)
2. Client uploads directly to Cloudinary
3. Client receives Cloudinary URL
4. Client sends URL to backend
5. Backend stores URL in database

## Frontend Code Quality

- Components MUST NEVER use hardcoded styling values
- Theme values: `theme.palette`, `theme.typography`, `theme.spacing`
- Custom styling: Use MUI `styled()` API
- Responsive design: Use theme breakpoints
- All MUI imports MUST be tree-shakable
- React Hook Form: NEVER use `watch()` method
- Form fields: ALWAYS use value and onChange when controlled
- Complex form fields: Use Controller with control prop
- Grid component: NEVER use item prop, use `size` prop instead
- MUI Autocomplete: NEVER use deprecated renderTags
- Custom rendering: Use slots API
- MUI v7 components: Follow v7 syntax and deprecation guidelines

## Validation Alignment

- Frontend validation MUST match backend validators exactly
- Use same max lengths, patterns, required fields
- Import constants from `client/src/utils/constants.js`

## API Integration

- Use RTK Query endpoints from feature API slices
- Handle loading states with skeletons/spinners
- Invalidate cache tags on mutations
- 401 errors: logout user if refreshing a token failed
- 403 errors: show error toast (no logout)

## Component Patterns

- Use react-hook-form with Controller for all forms
- Wrap MUI components with Mui prefix (MuiTextField, MuiSelectAutocomplete, etc.)
- Apply React.memo for Card components
- Use useCallback for event handlers
- Use useMemo for computed values

## Cascade Delete Operations

### Organization Cascade

```
Organization (soft delete)
├── Departments (cascade)
│   ├── Users (cascade)
│   │   ├── Remove from:
│   │   │   ├── Task watchers
│   │   │   ├── AssignedTask assignees
│   │   │   ├── TaskComment mentions
│   │   │   └── Notification entity user
│   │   └── Tasks (createdBy) (cascade)
│   ├── Tasks (department) (cascade)
│   ├── Materials (soft delete)
│   ├── TaskActivities (cascade)
│   ├── TaskComments (cascade)
│   ├── Attachments (soft delete)
│   └── Notifications (soft delete)
├── Users (direct org users) (cascade)
├── Tasks (direct org tasks) (cascade)
├── Materials (direct org materials) (soft delete)
├── Vendors (soft delete)
└── Notifications (direct org notifications) (soft delete)
```

### Department Cascade

```
Department (soft delete)
├── Users (cascade)
│   └── Remove from:
│       ├── Task watchers
│       ├── AssignedTask assignees
│       ├── TaskComment mentions
│       └── Notification entity user
├── Tasks (cascade)
├── Materials (soft delete)
├── TaskActivities (cascade)
├── TaskComments (cascade)
├── Attachments (soft delete)
└── Notifications (soft delete)
```

### User Cascade

```
User (soft delete)
├── Tasks (where createdBy = User) (cascade)
├── TaskActivities (where createdBy = User) (cascade)
├── TaskComments (where createdBy = User) (cascade)
├── Materials (where createdBy = User) (soft delete)
├── Vendors (where createdBy = User) (soft delete)
├── Attachments (where uploadedBy = User) (soft delete)
└── Remove from:
    ├── Task watchers array
    ├── AssignedTask assignees array
    ├── TaskComment mentions array
    └── Notification entity user
```

### Task Cascade

```
Task (soft delete) [Applies to ProjectTask, AssignedTask, RoutineTask]
├── TaskActivities (where parent=Task) (cascade)
├── TaskComments (where parent=Task) (cascade)
├── Attachments (where parent=Task) (soft delete)
└── Notifications (where entity=Task) (soft delete)
```

### TaskActivity Cascade

```
TaskActivity (soft delete)
├── TaskComments (where parent=TaskActivity) (cascade)
├── Attachments (where parent=TaskActivity) (soft delete)
└── Notifications (where entity=TaskActivity) (soft delete)
```

### TaskComment Cascade

```
TaskComment (soft delete)
├── Child Comments (where parent=TaskComment) (recursive cascade)
├── Attachments (where parent=TaskComment) (soft delete)
└── Notifications (where entity=TaskComment) (soft delete)
```

#### Material Cascade

```
Material (soft delete)
└── Remove from:
    ├── RoutineTask materials array
    └── TaskActivity materials array
```

#### Vendor Cascade

```
Vendor (soft delete)
└── ProjectTasks (where vendor=Vendor) (set vendor to null or cascade depending on business logic)
```

## TTL Expiry Periods

| Model        | TTL Period | Auto-Delete After  |
| ------------ | ---------- | ------------------ |
| Organization | Never      | null (manual only) |
| Department   | 365 days   | 1 year             |
| User         | 365 days   | 1 year             |
| Task         | 180 days   | 6 months           |
| TaskActivity | 90 days    | 3 months           |
| TaskComment  | 180 days   | 6 months           |
| Material     | 90 days    | 3 months           |
| Vendor       | 90 days    | 3 months           |
| Notification | 30 days    | 1 month            |
| Attachment   | 30 days    | 1 month            |

---

## Error Handling

**Backend Error Codes:**

- 401 UNAUTHENTICATED_ERROR: Authentication failure (missing/invalid/expired token)
- 403 UNAUTHORIZED_ERROR: Authorization failure (insufficient permissions)
- 404 NOT_FOUND_ERROR: Resource not found
- 400 VALIDATION_ERROR: Input validation failure
- 409 CONFLICT_ERROR: Resource conflict
- 429 RATE_LIMITED_ERROR: Too many requests
- 500 INTERNAL_ERROR: Server error

**Frontend Error Handling:**

- Root-level: Catch all unhandled errors, display error page
- Route-level: Catch route-specific errors, display RouteError
- Component-level: Catch component errors, display fallback UI
- API errors: 401 → refresh token on frontend → 401 → logout user; 403 → show error toast (no logout); 4xx/5xx → show error message

## 21. Task Execution Protocol (Mandatory 7 Steps)

This protocol defines **seven mandatory steps** that MUST be followed when executing **each task**. No shortcuts. No exceptions.

### Step 1: Pre-Git Requirement (Before Task Execution)

**Purpose**: Ensure complete and accurate Git branch information to prevent issues during new branch creation and checkout.

**Actions**:

1. **Check Current State**:

   - Execute `git status` to check current branch, uncommitted changes, untracked files
   - Execute `git branch -vv` to display all local branches and tracking information
   - Execute `git fetch origin` to update remote tracking information

2. **Handle Uncommitted Changes**:

   - **IF uncommitted changes exist**:
     - Stay on current branch
     - Execute `git add .` to stage all changes
     - Execute `git commit -m "descriptive commit message"`
     - Execute `git push origin <current-branch>`
     - Execute `git checkout main` (or appropriate base branch)
     - Execute `git merge <feature-branch>`
     - Execute `git push origin main`
     - Execute `git branch -d <feature-branch>`
     - Execute `git push origin --delete <feature-branch>`
     - **Think twice before acting** - verify branch names and merge targets

3. **Synchronize Local with Remote**:

   - **IF local branch is behind remote**: Execute `git pull origin <branch>`
   - **IF merge conflicts detected**: HALT immediately, prompt user to resolve conflicts

4. **Create Feature Branch**:

   - Execute `git checkout -b <descriptive-branch-name>` (e.g., `feature/task-2-auth-state-management`)
   - Use clear, descriptive branch names matching task number and description

5. **Verify Clean State**:
   - Execute `git status` to confirm clean working directory
   - Confirm correct branch is checked out
   - Proceed to Step 2 only after verification

### Step 2: Comprehensive and Extremely Deep Codebase Analysis

**Purpose**: Capture every single detail of both `backend/*` and `client/*` to ensure absolute alignment with requirements, designs, specifications, and constraints.

**Critical Analysis Areas**:

Backend analysis (complete deep dive):

1. **Configuration Layer** (`backend/config/*`):

   - `allowedOrigins.js`, `authorizationMatrix.json`, `corsOptions.js`, `db.js`

2. **Error Handling** (`backend/errorHandler/*`):

   - `CustomError.js`, `ErrorController.js`

3. **Validation Layer** (`backend/middlewares/validators/*`):

   - ALL validator files: `authValidators.js`, `organizationValidators.js`, `departmentValidators.js`, `userValidators.js`, `taskValidators.js`, `taskActivityValidators.js`, `taskCommentValidators.js`, `materialValidators.js`, `vendorValidators.js`, `notificationValidators.js`, `validation.js`
   - Understand exact validation rules, field constraints, patterns, max lengths

4. **Middleware Layer** (`backend/middlewares/*`):

   - `authMiddleware.js`, `authorization.js`, `rateLimiter.js`

5. **Model Layer** (`backend/models/*`):

   - `plugins/softDelete.js`
   - ALL model files: `Organization.js`, `Department.js`, `User.js`, `Task.js`, `ProjectTask.js`, `AssignedTask.js`, `RoutineTask.js`, `TaskActivity.js`, `TaskComment.js`, `Material.js`, `Vendor.js`, `Notification.js`
   - Understand discriminator patterns, schema structures, indexes, virtuals, methods

6. **Route Layer** (`backend/routes/*`):

   - `authRoutes.js`, `organizationRoutes.js`, `departmentRoutes.js`, `userRoutes.js`, `taskRoutes.js`, `taskActivityRoutes.js`, `taskCommentRoutes.js`, `materialRoutes.js`, `vendorRoutes.js`, `notificationRoutes.js`, `index.js`
   - ALL route files and their endpoint definitions
   - HTTP methods, paths, middleware chains, controller mappings

7. **Service Layer** (`backend/services/*`):

   - `emailService.js`, `notificationService.js`

8. **Utility Layer** (`backend/utils/*`):

   - `constants.js` - **SINGLE SOURCE OF TRUTH**
   - `logger.js`, `helpers.js`, `generateTokens.js`, `authorizationMatrix.js`, `validateEnv.js`
   - `socket.js`, `socketEmitter.js`, `socketInstance.js`, `userStatus.js`

9. **Application Entry Points**:
   - `app.js`, `server.js`

Frontend analysis (complete deep dive):

10. **Redux State Management** (`client/src/redux/*`):

    - `app/store.js`, `features/*` - RTK Query base API, ALL feature slices and API endpoints

11. **Components** (`client/src/components/*`):

    - `reusable/*`, `common/*`, `common/ErrorBoundary.jsx`, `common/RouteError.jsx`, `columns/*`, `filter/*`, `layout/*`, `auth/*`, `department/*`, `user/*`, `task/*`, `taskActivity/*`, `taskComment/*`, `material/*`, `vendor/*`, `attachment/*`, `notification/*`, `dashboard/*`
    - Component patterns, prop structures, event handlers

12. **Pages** (`client/src/pages/*`):

    - Home (landing page), Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound

13. **Services** (`client/src/services/*`):

    - `socketService.js`, `socketEvents.js`

14. **Hooks** (`client/src/hooks/*`):

    - `useAuth.js`, `useSocket.js`, `useAuthorization.js`, `useTimezone.js`, `useResponsive.js`

15. **Utils** (`client/src/utils/*`):

    - `constants.js` - **MUST match backend exactly**
    - `dateUtils.js`, `authorizationHelper.js`, `validators.js`

16. **Theme System**:

    - `client/src/theme/customizations/*`, `client/src/theme/AppTheme.jsx`, `client/src/theme/themePrimitives.js`

17. **Package Dependencies**:
    - Validate installed packages and versions

**Analysis Outcome**:

- Complete understanding of existing patterns
- Exact knowledge of validation rules
- Full awareness of authorization constraints
- Deep comprehension of data models and relationships
- Absolute clarity on UI/UX specifications

**Proceed to Step 3 only after completing this comprehensive analysis.**

### Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)

**Purpose**: Understand all previously implemented tasks to ensure consistency, avoid duplication, and maintain architectural patterns.

**Actions**:

1. **Identify Previous Tasks**:

   - Identify all tasks marked as completed (checked boxes)
   - For current task N, analyze tasks 1 through N-1

2. **Analyze Each Previous Task**:

   - **Files Created**: List all files created in each task
   - **Patterns Used**: Identify architectural patterns, naming conventions, code structures
   - **Dependencies**: Understand inter-task dependencies and shared utilities
   - **Validation Rules**: Note validation patterns and error handling approaches
   - **State Management**: Review Redux slice patterns, API endpoint structures
   - **Component Patterns**: Analyze component composition, prop patterns, event handling
   - **Styling Approaches**: Review MUI customization patterns, theme usage

3. **Consistency Verification**:

   - Ensure new task follows established patterns
   - Verify naming conventions match previous tasks
   - Confirm validation approaches are consistent
   - Check that constants are imported (never hardcoded)
   - Validate timezone handling matches established patterns
   - Ensure soft delete patterns are followed

4. **Gap Analysis**:
   - Identify any missing utilities needed for current task
   - Determine if new patterns are required
   - Plan for backward compatibility if changes needed

**Proceed to Step 4 only after completing this analysis.**

### Step 4: Task Execution Without Deviation

**Purpose**: Implement the task with absolute adherence to requirements, designs, specifications, and constraints.

Mandatory compliance documents (Code Compliance):

1. `backend/routes/*` - Exact endpoint paths and HTTP methods
2. `backend/middlewares/validators/*` - Exact validation rules and constraints
3. `backend/models/*` - Exact schema structures and field definitions
4. `backend/utils/constants.js` - Use constants, NEVER hardcode values
5. `client/src/utils/constants.js` - Must match backend constants EXACTLY
6. `client/src/utils/*` - Utilize available helpers and utils
7. `client/src/components/*` - Utilize available components and patterns
8. `client/src/hooks/*` - Utilize available hooks and patterns
9. `client/src/redux/*` - Utilize available Redux patterns and structures
10. `client/src/services/*` - Utilize available services and patterns
11. `client/src/theme/*` - Utilize available theme patterns and structures

Implementation rules:

1. **Validation Alignment**: Frontend validation MUST match backend validators exactly
2. **Soft Delete Compliance**: Show "Restore" for deleted, hide "Delete" for deleted, include deleted toggle
3. **Authorization Checks**: Use `useAuthorization` hook, hide/disable based on role and scope
4. **API Integration**: Use RTK Query endpoints, handle loading states, invalidate cache tags
5. **Component Patterns**: Use react-hook-form with Controller, wrap MUI with Mui prefix, React.memo for Cards
6. **Styling Consistency**: Use theme customizations, responsive design, MUI Grid v7 syntax (size prop)
7. **Testing Readiness**: Write clean, testable code, avoid side effects in render

Implementation verification checklist:

- [ ] UI specifications match established patterns
- [ ] All files created/modified match established patterns
- [ ] All validation rules match backend exactly
- [ ] All dates use timezone conversion functions
- [ ] All soft delete rules are followed
- [ ] All authorization checks are implemented
- [ ] All constants are imported (none hardcoded)
- [ ] All API endpoints use RTK Query
- [ ] All forms use react-hook-form with Controller
- [ ] All MUI components use Mui prefix wrappers
- [ ] All styling uses theme customizations
- [ ] Code follows established patterns from previous tasks

**Proceed to Step 5 only after completing implementation and verification.**

### Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)

**Purpose**: Validate backend correctness before user review by executing real validators, controllers, and database logic using plain JavaScript scripts.

**Scope**:

- This step MUST be performed ONLY if the task includes backend changes.
- For frontend-only tasks, this step MUST be explicitly skipped.

**Actions**:

1. Execute validator logic directly using `.run(req)` and assert results with `validationResult(req)`.
2. Test all existence, uniqueness, scoping, soft-delete, and restore validation rules.
3. Invoke controllers directly as plain functions using fully constructed `req.user` and `req.validated`.
4. Assert authorization, ownership, organization isolation, and department isolation.
5. Verify database side effects explicitly (create, update, soft delete, restore, cascade).
6. **IF any test fails**: HALT, fix implementation, re-run tests.

**Proceed to Step 6 only after backend tests pass or are explicitly skipped.**

### Step 6: User Review and Feedback Integration

**Purpose**: Request user review of the implementation and apply any required updates or changes.

**Actions**:

1. **Present Implementation**:

   - Summarize what was implemented
   - List all files created/modified
   - Highlight key features and functionality
   - Note any deviations or decisions made (if any)

2. **Request Review**:

   - Ask user to review the implementation
   - Request feedback on functionality, design, code quality
   - Inquire about any changes or improvements needed

3. **Handle Feedback**:

   - **IF user requests changes**: Document, implement, re-request review, repeat until satisfied
   - **IF user approves**: Confirm explicit approval, move to Step 7

4. **Verification Before Proceeding**:
   - Ensure user has explicitly stated approval
   - Confirm no additional changes are needed
   - Get clear go-ahead for Git operations

**Do NOT proceed to Step 7 without explicit user approval.**

### Step 7: Post-Git Requirement (After Task Completion)

**Purpose**: Add, commit, push implementation, checkout, merge, and synchronize between local and remote repositories. Delete related branches after detailed verification.

**Actions**:

1. **Verify Current State**:

   - Execute `git status` to check current branch, all modified/created files, no unintended changes
   - Execute `git branch -vv` to display branch tracking information
   - Execute `git fetch origin` to update remote tracking information

2. **Stage and Commit Changes**:

   - Review all changes: `git diff`
   - Stage all changes: `git add .`
   - Verify staged changes: `git status`
   - Commit: `git commit -m "feat: [Task N] Descriptive task title and summary"`
   - Use conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, etc.

3. **Push Feature Branch**:

   - Push to remote: `git push origin <feature-branch>`
   - Verify push success
   - Confirm remote branch exists: `git branch -r`

4. **Checkout Base Branch**:

   - Checkout main: `git checkout main` (or appropriate base branch)
   - Verify clean state: `git status`
   - Pull latest changes: `git pull origin main`

5. **Merge Feature Branch**:

   - **CRITICAL: Think twice before merging**
   - Verify correct base branch: `git branch`
   - Merge: `git merge <feature-branch>`
   - **IF merge conflicts**: HALT immediately, prompt user to resolve conflicts
   - **IF merge successful**: Verify merged changes: `git log --oneline -5`

6. **Push Merged Changes**:

   - Push to remote: `git push origin main`
   - Verify push success
   - Confirm remote is updated: `git log origin/main --oneline -5`

7. **Delete Feature Branch (Local and Remote)**:

   - **CRITICAL: Verify merge success before deleting**
   - Confirm fully merged: `git branch --merged`
   - Delete local: `git branch -d <feature-branch>`
   - Delete remote: `git push origin --delete <feature-branch>`
   - Verify deletion: `git branch -a`

8. **Final Synchronization Verification**:

   - Execute `git status` - clean working directory
   - Execute `git branch -vv` - main branch in sync with origin
   - Execute `git log --oneline -5` - recent commit visible
   - Confirm local and remote synchronized

9. **Cleanup Verification**:
   - Verify no orphaned branches: `git branch -a`
   - Verify no uncommitted changes: `git status`
   - Verify correct branch: `git branch` (should be on main)

**Protocol Enforcement**:

- This protocol is mandatory for every task.
- No shortcuts allowed.
- No exceptions permitted.
- All seven steps must be completed in order.
- Each step must be verified before proceeding to next.
- User approval required before Step 7.
- Failure to follow this protocol will result in inconsistent implementations, Git conflicts, validation mismatches, timezone handling errors, soft delete rule violations, and authorization bypass vulnerabilities.
- Success ensures clean Git history, consistent code quality, exact alignment with specifications, maintainable codebase, predictable behavior, and secure implementation.

## 22. Phased Delivery Plan (Backend -> Frontend)

Global phase execution rules (MANDATORY):

- Starting from Phase 1, run backend and frontend concurrently at all times to surface integration issues early:
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd client && npm run dev`
- At any phase (including sub-tasks), identify and address required integration updates/corrections to any previously developed components before marking work complete.

### Phase 0: Deep Project Understanding

- Review full file map for backend and frontend.

### Phase 1: Core Foundations (Backend Only)

Backend:

- Shared constants, env validation, logging, helpers, token utilities.
- Database config, CORS config, allowed origins.
- Error handling skeletons.
- Soft delete plugin.
- Core models: Organization, Department, User.
- Minimal app bootstrap and health check.

Prepares for Phase 2: Auth depends on core models and utilities.

### Phase 2: Authentication and Basic Security (Backend then Frontend)

Backend:

- Auth validators and controllers (register, login, refresh, logout, forgot, reset).
- Auth middleware and authorization skeleton.
- Email service skeleton (email sending may be stubbed for development).
- Authorization matrix utility can be minimal at this phase but must export the structure needed by the frontend for role mapping.
  Frontend:
- RTK base API for auth endpoints.
- Auth UI (login, register, forgot, reset).
- useAuth hook and validators.
- Frontend constants mirror backend.

Prepares for Phase 3: authenticated environment and shared constants.

### Phase 3: Cross-Cutting Services and Middleware (Backend Only)

Backend:

- Authorization matrix utilities and socket utilities.
- Rate limiter and validation middleware.
- Notification service, expand email service.
- Authorization matrix configuration must exist in canonical form (may be partially populated but structure must be present and usable).

Prepares for Phase 4: resource controllers and realtime hooks.

### Phase 4: Organization-Level CRUD (Backend -> Frontend)

Backend:

- Validators, controllers, routes for organization, department, user.
- User management includes role assignment and profile update flows.
- Authorization checks and ownership rules.
- Soft delete and restore operations.
  Frontend:
- Departments and Users pages and components.
- RTK slices for organization and user.
- useAuthorization integration.
- Timezone hook for display; if a timezone field is introduced it defaults to the user level (user-centric). Organization-level timezone is optional.

Prepares for Phase 5: task assignment workflows and ownership logic.

### Phase 5: Task Domain (Backend -> Frontend)

Backend:

- Task models (Task, ProjectTask, AssignedTask, RoutineTask).
- TaskActivity and TaskComment models.
- Validators and controllers for tasks, activities, comments.
- Task routes.
- Realtime hooks and notifications.
  Frontend:
- Tasks page, task details, activity and comment components.
- RTK task endpoints.
- Socket integration for updates.

Prepares for Phase 6: materials, vendors, and notifications.

### Phase 6: Materials, Vendors, Notifications (Backend -> Frontend)

Backend:

- Material, Vendor, Notification models.
- Validators, controllers, routes.
- Notification pipeline with Socket.IO.
  Frontend:
- Materials and Vendors pages.
- Notification UI and RTK slices.
- Socket wiring for notifications.

Prepares for Phase 7: dashboard and final authorization.

### Phase 7: Dashboard and Authorization Finalization (Backend -> Frontend)

Backend:

- Dashboard aggregation endpoints.
- Finalize authorization matrix.
- Performance and pagination rules, including consistent pagination, filtering, and sorting query params across resources.
- Socket and presence polish.
  Frontend:
- Dashboard page and components.
- Final authorization UI gating.
- Layout and responsiveness polish.
- Charts must use default theme colors unless explicitly requested; avoid hardcoded chart palettes.

Prepares for Phase 8: integration and handoff artifacts.

### Phase 8: Integration, Polish, Handoff

Backend:

- Restore flows and withDeleted semantics.
- Machine-readable API contract documentation (OpenAPI or JSON Schema).
- Logging and debug endpoints, including admin-only endpoints to inspect socket status and queued notifications.
- Final security sweep.
  Frontend:
- Cache tuning, error boundaries.
- Accessibility and performance polish.
- Final constants synchronization.

Integration rules:

- Backend must be ready before frontend work in each phase.
- Authorization matrix and middleware must exist before controllers.
- Socket primitives require user and notification readiness.
- Frontend feature work starts only after backend API for that feature is validated by a small test client.
- File-level dependency discipline: shared utils and constants must exist before dependent controllers and frontend modules.
- Authorization/ownership order: models -> authorization matrix -> validators -> controllers -> frontend.
- Socket primitives should be implemented only after User model and notification service are ready.

Minimal checklist per phase:

- Backend: exact filenames to implement, API contract (paths, methods, request/response), tests/stubs, socket event signatures.
- Frontend: RTK endpoints to add, pages and components to implement, hooks to wire, acceptance tests (login + one resource CRUD + real-time event).

### 22.1 Synchronous Development (Verbatim Canonical Copy)

# Synchronous Dev Plan

This document provides:

1. A deep analysis of the attached structure, responsibilities, and dependencies.
2. A phase-by-phase synchronous development plan that always flows Backend → Frontend within a phase, and ensures that anything required by Phase N is completed in Phase N−1 (within each side and across BE/FE).

No setup instructions are included—only development sequencing and deliverables.

---

## 1 Structure, Responsibilities, Dependencies

### Backend

- Configuration Layer (`backend/config/*`)

  - `allowedOrigins.js`, `corsOptions.js` feed CORS setup (consumed by `app.js`).
  - `authorizationMatrix.json` holds role → permission mappings; used by `utils/authorizationMatrix.js` and `middlewares/authorization.js`.
  - `db.js` creates the database connection. Used by `server.js`.

- Error Handling (`backend/errorHandler/*`)

  - `CustomError.js`: central app error class. Used throughout routes, middleware, services.
  - `ErrorController.js`: central error responder; mounted in `app.js`.

- Validation Layer (`backend/middlewares/validators/*`)

  - `validation.js`: generic validator wrapper; used by specific validators.
  - Feature validators for auth, organization, department, user, task, taskActivity, taskComment, material, vendor, notification.
  - Validators depend on business constants and shapes; should not depend on models directly but may assume model-level invariants.

- Middleware Layer (`backend/middlewares/*`)

  - `authMiddleware.js`: verifies JWT, loads User context; depends on `utils/generateTokens.js`, `models/User.js`, `utils/constants.js`.
  - `authorization.js`: enforces authorization rules per route; depends on `config/authorizationMatrix.json` and `utils/authorizationMatrix.js`.
  - `rateLimiter.js`: generic rate limiting; used by `app.js`.
  - `validation.js`: integrates validator with request lifecycle.

- Model Layer (`backend/models/*`)

  - `plugins/softDelete.js`: applied by many models; needs to exist before models.
  - Models: `Organization.js`, `Department.js`, `User.js`, `Task.js`, `ProjectTask.js`, `AssignedTask.js`, `RoutineTask.js`, `TaskActivity.js`, `TaskComment.js`, `Material.js`, `Vendor.js`, `Notification.js`, `Attachment.js`
  - Important dependencies: Many models reference Organization, Department, and User. TaskActivity and TaskComment reference Task and User. Notification references User (and possibly Task). Therefore Organization, Department, and User must come first.

- Route Layer (`backend/routes/*`)

  - Route files per resource: `authRoutes.js`, `organizationRoutes.js`, `departmentRoutes.js`, `userRoutes.js`, `taskRoutes.js`, `taskActivityRoutes.js`, `taskCommentRoutes.js`, `materialRoutes.js`, `vendorRoutes.js`, `notificationRoutes.js`.
  - They depend on: validators, middleware (auth + authorization + validation), models, and sometimes services.
  - Note: There’s no explicit “controllers” folder in the doc; route handlers will act as controllers or be co-located controller functions inside route modules.

- Service Layer (`backend/services/*`)

  - `emailService.js`: used for auth flows (forgot/reset password, invitations), and possibly notifications.
  - `notificationService.js`: used by task/comment events and direct notification endpoints.

- Utility Layer (`backend/utils/*`)

  - `constants.js` (Single Source of Truth, SSOT): enumerations like roles, permissions, task states, validation sizes, regexes; must mirror frontend constants exactly.
  - `logger.js`: shared logging.
  - `helpers.js`: general utilities (ID parsing, pagination builders, etc.).
  - `generateTokens.js`: JWT generation/rotation; used by `authMiddleware.js` and auth route handlers.
  - `authorizationMatrix.js`: programmatic helper around `authorizationMatrix.json` to resolve permissions.
  - `validateEnv.js`: runtime checks used by `server.js` / `config/db.js`.
  - Sockets: `socket.js`, `socketEmitter.js`, `socketInstance.js`, `userStatus.js`—depend on verified user context and often on models (User, Notification). These should come after Auth & User are ready.

- Application Entrypoints
  - `app.js`: wires middleware, routes, error handling.
  - `server.js`: bootstraps app and sockets; consumes `config/db.js`, mounts `utils/socket*`.

Dependency summary (backend):

- Earliest: utils (constants, logger, helpers, validateEnv), error handling, config (CORS), rate limiter.
- Then: softDelete plugin → core models (Organization, Department, User) → auth utils (generateTokens) → auth middleware/authorization matrix → auth routes + email service.
- Then: resource models and routes (Org/Dept/User management) → task models and task routes → task activity and comments → materials and vendors → notifications service/routes → sockets.

### Frontend

- Redux State Management (`client/src/redux/*`)

  - `app/store.js`: configures RTK Query base API and slices.
  - `features/*`: per-resource slices + RTK Query endpoints; depend on backend endpoints and constants.

- Components (`client/src/components/*`)

  - `reusable/*`, `common/*` incl. `ErrorBoundary.jsx`, `RouteError.jsx`, layouts, columns, filters, and domain components (auth, department, user, task, taskActivity, taskComment, material, vendor, attachment, notification, dashboard).
  - Columns and filters depend on feature data shapes and constants.

- Pages (`client/src/pages/*`)

  - Home, Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound.
  - Each page depends on associated slices/endpoints, helpers, layout, and components.

- Services (`client/src/services/*`)

  - `socketService.js`, `socketEvents.js`: require backend sockets to be defined before integration.

- Hooks (`client/src/hooks/*`)

  - `useAuth.js`, `useSocket.js`, `useAuthorization.js`, `useTimezone.js`, `useResponsive.js`.
  - `useAuthorization` depends on FE `constants.js` and the same role/permission model as backend.

- Utils (`client/src/utils/*`)
  - `constants.js` (must match backend/constants.js exactly).
  - `dateUtils.js`, `authorizationHelper.js`, `validators.js`.

Dependency summary (frontend):

- Earliest: FE `constants.js`, `authorizationHelper.js`, `validators.js`, routing/shell layout, `ErrorBoundary`.
- Then: configure RTK Base API; auth feature endpoints & pages (once BE auth is ready).
- Then: per-resource features/pages in the same order as backend becomes available.
- Then: sockets (notifications, user status) after BE sockets ready.
- Dashboard depends on aggregated endpoints or resource stats available from existing routes.

---

## 2) Synchronous Development Plan (Backend → Frontend per phase)

Conventions:

- Within each phase: Backend first, then Frontend.
- Route handlers act as controllers co-located in route modules (no separate controllers folder in the doc).
- “Contracts” lists essential request/response shapes or endpoint semantics needed by the frontend in that phase.
- Each phase’s deliverables ensure the next phase can proceed without backtracking.

### Phase 1 — Backend Foundations (Cross-cutting) → Frontend Foundations (Constants/Scaffolds)

Backend

- Implement `backend/utils/constants.js` (SSOT) with:
  - Roles (e.g., SUPER_ADMIN, ORG_ADMIN, MANAGER, STAFF), permission keys, task statuses, notification types, pagination defaults, date formats, validation constraints.
- Implement foundational utils:
  - `logger.js` (structured logs), `helpers.js` (pagination builder, safeObjectId, pick, omit, toLowerTrim, etc.), `validateEnv.js`.
  - `generateTokens.js` (access/refresh pair, rotation rules, expiry).
  - `authorizationMatrix.js` reading from `config/authorizationMatrix.json` to answer can(role, action, resource).
- Error handling:
  - `errorHandler/CustomError.js` and `errorHandler/ErrorController.js` integrated signature.
- Config for HTTP:
  - `config/allowedOrigins.js`, `config/corsOptions.js`.
- Middleware scaffolds:
  - `middlewares/validation.js`, `middlewares/rateLimiter.js` (global and sensitive endpoints variants).
- App wiring (no routes yet):
  - `app.js` wires CORS, JSON parser, rateLimiter, basic health endpoint, error handler.
  - `config/db.js` implemented. `server.js` boots app and DB (socket is not mounted yet).

Contracts

- N/A (no external endpoints consumed yet), but constants published and frozen.

Frontend

- Mirror `client/src/utils/constants.js` exactly from backend SSOT.
- Implement `client/src/utils/authorizationHelper.js` (role → capabilities mapping in sync with backend permissions).
- Implement `client/src/utils/validators.js` (shared schema helpers aligned with backend validators intent).
- Create app shell structure:
  - `components/common/ErrorBoundary.jsx`, `components/common/RouteError.jsx`, `components/layout/*` basic layout scaffolding.
- Prepare Redux base:
  - `redux/app/store.js` with RTK Query base API (baseQuery with JSON, placeholder headers, and error handling). Do not call backend yet.

Why now

- Constants and cross-cutting utilities are prerequisites for everything else; FE constants must be identical before building features.

---

### Phase 2 — Core Data Layer and Security Primitives (Models + Auth Middleware/RBAC) → FE auth primitives (no network)

Backend

- Implement Mongoose plugin: `models/plugins/softDelete.js` (adds deletedAt, overrides find/findOne to exclude by default; add withDeleted options).
- Implement core models in order:
  - `Organization.js` (tenant root), includes name, slug, owner (User ref later), settings, isActive, softDelete.
  - `Department.js` with org ref, name, code, softDelete, unique per org.
  - `User.js` with org ref, department ref (nullable), email (unique per org or global per SaaS policy), password hash, roles array, status, profile, tokens metadata (refresh token family, lastLoginAt), softDelete, indexes.
- RBAC scaffolds:
  - Populate `config/authorizationMatrix.json` with minimum viable rules for upcoming phases (auth, org, user).
  - Implement `middlewares/authorization.js` using `utils/authorizationMatrix.js`.
- Auth middleware:
  - `middlewares/authMiddleware.js` (verifies access token, loads user, ensures not soft-deleted, attaches orgId to req).
- Rate limit profiles for auth endpoints (login, register, reset requests).
- No business routes yet; only health.

Contracts

- Internal only (no FE yet), but ensures next auth phase has needed primitives.

Frontend

- Implement `hooks/useAuth.js` (local state only; token placeholders).
- Implement `hooks/useAuthorization.js` consuming FE constants and helper; no API use yet.
- Implement initial routing skeleton: Home, Login, Register, ForgotPassword, ResetPassword, Dashboard placeholders (no backend calls).

Why now

- Auth requires User/Organization model and RBAC to exist. Next phase will consume these.

---

### Phase 3 — Authentication Feature (Backend auth routes/services/validators) → Frontend Auth (pages, endpoints, guards)

Backend

- Validators: `middlewares/validators/authValidators.js` for:
  - register (email, password, org context if required), login, refresh, logout, forgotPassword, resetPassword.
- Services:
  - `services/emailService.js` with transactional methods for reset link delivery.
- Routes: `routes/authRoutes.js` with handlers:
  - POST /auth/register — optionally create org if SUPER_ADMIN; or invite flow (if implemented later). Return minimal user and tokens.
  - POST /auth/login — email/password within org context; return user, org, roles, tokens.
  - POST /auth/refresh — rotate refresh token; return new tokens.
  - POST /auth/logout — invalidate refresh token family.
  - POST /auth/forgot-password — send email.
  - POST /auth/reset-password — change password using token.
- Use `authMiddleware` only where appropriate (not for login/register), apply `rateLimiter` on sensitive endpoints.
- Wire into `app.js`.

Contracts

- Response shapes:
  - User core: { id, email, name, roles, org: { id, name }, department?: { id, name } }.
  - Tokens: { accessToken, refreshToken, expiresIn }.
- Error format: { message, code, details? } aligned with `CustomError`.

Frontend

- RTK Query `features/authApi` with endpoints:
  - register, login, refresh, logout, forgotPassword, resetPassword.
- Auth pages: `pages/Login`, `Register`, `ForgotPassword`, `ResetPassword` with forms using `client/src/utils/validators.js`.
- Token handling:
  - Base API attaches access token, handles 401 with refresh flow using `authApi.endpoints.refresh`.
  - Persist tokens securely (state-only or storage policy matching app design).
- Route protection:
  - Implement protected route wrapper using `useAuth`.
- Basic layout sign-in/out changes; update `Home` and `Dashboard` placeholders to reflect auth status.

Why now

- Frontend auth can only proceed after backend auth endpoints are stable.

---

### Phase 4 — Organization & Department Management (RBAC enforced) → FE Org/Dept pages

Backend

- Validators: `organizationValidators.js`, `departmentValidators.js`.
- Routes:
  - `organizationRoutes.js`:
    - GET /organizations/:id — ORG_ADMIN+; SUPER_ADMIN can access cross-tenant if policy allows.
    - PATCH /organizations/:id — update org settings.
    - (Optional) GET /organizations — SUPER_ADMIN only (listing all tenants).
  - `departmentRoutes.js`:
    - GET /departments — list by org.
    - POST /departments — create (ORG_ADMIN/MANAGER).
    - PATCH /departments/:id — update.
    - DELETE /departments/:id — soft delete.
- Enforce tenant scoping: all queries filter by req.user.orgId; SUPER_ADMIN bypass when allowed.
- Pagination & filtering via helpers (e.g., ?page, ?limit, ?q).

Contracts

- Department list resp: { data: Department[], page, limit, total }.
- Department entity: { id, name, code, orgId, createdAt, updatedAt }.

Frontend

- RTK Query `features/organizationApi` & `features/departmentApi`.
- Pages:
  - `pages/Departments` with list, create/update modals; use components: `components/department/*`, `components/columns/*`, `components/filter/*`.
- Update `useAuthorization` to guard buttons (create/edit/delete) based on role and FE constants.

Why now

- Departments are prerequisites for user management and task assignment.

---

### Phase 5 — User Management (within tenant) → FE Users page and role/department assignment

Backend

- Validators: `userValidators.js`.
- Routes: `userRoutes.js`
  - GET /users — list users in org with pagination, search by email/name.
  - POST /users — create/invite user (ORG_ADMIN/MANAGER; may trigger `emailService`).
  - GET /users/:id — details.
  - PATCH /users/:id — update profile, department, roles (RBAC enforced).
  - DELETE /users/:id — soft delete.
- Ensure role changes cannot escalate beyond caller’s permissions per `authorizationMatrix`.

Contracts

- User list resp, user entity shape consistent with auth responses.
- Invite flow response may include status=INVITED.

Frontend

- RTK Query `features/userApi` (list, get, create, update, delete).
- `pages/Users` with:
  - Table (columns module), filters, inline role/department editing gated by `useAuthorization`.
  - Common components in `components/user/*`.

Why now

- Users must exist and be manageable before task assignment.

---

### Phase 6 — Task Domain (Core Tasks) → FE Tasks (list/create/update/assign)

Backend

- Models: finalize/confirm `Task.js`, `ProjectTask.js`, `AssignedTask.js`, `RoutineTask.js`.
  - Multi-tenant fields: orgId mandatory; departmentId optional; assignees: [User].
  - Fields: title, description, type (PROJECT|ASSIGNED|ROUTINE), status (from constants), priority, dueAt, createdBy, updatedBy, tags, softDelete.
  - Indexes for orgId+status, orgId+assignees, text index on title/description (depending on constraints).
- Validators: `taskValidators.js` for create/update/list filters.
- Routes: `taskRoutes.js`
  - GET /tasks — filter by status, type, assignee, department, q (search), pagination.
  - POST /tasks — create; support assignment on create.
  - GET /tasks/:id — details (with minimal related counts).
  - PATCH /tasks/:id — update fields (including status transitions).
  - DELETE /tasks/:id — soft delete.
- Authorization: creation/update allowed to roles per matrix; reading based on role or membership (assignee/creator).
- Hooks to `notificationService` (stub) for future events, but do not send yet.

Contracts

- Task list resp pagination; Task entity includes computed flags (isOverdue).
- Status/Type enums reflected from SSOT constants.

Frontend

- RTK Query `features/taskApi` with list/get/create/update/delete.
- `pages/Tasks`:
  - Table with `components/columns/taskColumns`, filters (`components/filter/*`), create/edit modal.
  - Assignment UI (select users/departments).
- Common UI improvements: reusable form components (`components/reusable/*`).

Why now

- Core task management is the central use case; activities/comments will follow.

---

### Phase 7 — Task Activity & Comment (history, collaboration) → FE Activity/Comment UIs

Backend

- Models: `TaskActivity.js` (immutable events: status change, assignment change, edits), `TaskComment.js` (message, mentions, createdBy).
- Validators: `taskActivityValidators.js`, `taskCommentValidators.js`.
- Routes:
  - `taskActivityRoutes.js`:
    - GET /tasks/:taskId/activities — list activities.
    - (Activities are server-generated; no POST from client except admin-level migration/debug endpoints if needed.)
  - `taskCommentRoutes.js`:
    - GET /tasks/:taskId/comments — list.
    - POST /tasks/:taskId/comments — add comment.
    - DELETE /task-comments/:id — soft delete by author or admin.
- Ensure all actions are tenant-scoped and RBAC enforced.
- Generate activities in `taskRoutes.js` on state transitions or updates (e.g., create task → ACTIVITY_CREATED; status change → ACTIVITY_STATUS_CHANGED).

Contracts

- Comment entity: { id, taskId, text, mentions: [userId], createdBy, createdAt }.
- Activity entity: { id, taskId, type, payload, createdBy, createdAt }.

Frontend

- RTK Query `features/taskActivityApi` (GET) and `features/taskCommentApi` (GET/POST/DELETE).
- Components:
  - `components/taskActivity/*` timeline.
  - `components/taskComment/*` thread with composer, mention picker.
- Integrate into Task details sidebar/modal.

Why now

- Collaboration features sit on top of tasks; they rely on Tasks, Users, Departments.

---

### Phase 8 — Materials & Vendors (Inventory/Procurement) → FE Materials/Vendors

Backend

- Models already exist: `Material.js`, `Vendor.js` (ensure orgId, softDelete, indexes).
- Validators: `materialValidators.js`, `vendorValidators.js`.
- Routes:
  - `materialRoutes.js`:
    - GET /materials — list with filtering (category, q).
    - POST /materials — create.
    - PATCH /materials/:id — update.
    - DELETE /materials/:id — soft delete.
  - `vendorRoutes.js` similarly for vendors.
- RBAC rules from `authorizationMatrix.json` (e.g., MANAGER+ can manage, STAFF read-only).

Contracts

- Standard paginated lists and entities:
  - Material: { id, name, sku, unit, stockQty, vendorId?, orgId }.
  - Vendor: { id, name, contact, rating?, orgId }.

Frontend

- RTK Query `features/materialApi` and `features/vendorApi`.
- Pages:
  - `pages/Materials`, `pages/Vendors` with listings, filters, editors.
- Components: `components/material/*`, `components/vendor/*`, integrate with columns and reusable forms.

Why now

- These resources are independent of sockets/notifications; adds functional breadth.

---

### Phase 9 — Notifications (REST) → FE Notifications (list/read/mark)

Backend

- Model: `Notification.js` (orgId, userId, type, payload, readAt, createdAt).
- Validator: `notificationValidators.js`.
- Service: `notificationService.js` with createNotification(userId, type, payload), markAsRead, bulk operations.
- Routes: `notificationRoutes.js`
  - GET /notifications — for current user, filter read/unread.
  - PATCH /notifications/:id/read — mark single as read.
  - PATCH /notifications/read-all — mark all read.
- Integrate notification creation in task/comment flows (without sockets yet):
  - On task assignment, notify assignees.
  - On new comment, notify task assignees/participants (excluding author), respecting org scope.

Contracts

- Notification entity: { id, type, payload, readAt, createdAt }.
- List pagination for bell UI.

Frontend

- RTK Query `features/notificationApi`.
- Components: `components/notification/*` including bell dropdown, list page.
- Pages: integrate notifications into layout (badge count from unread).

Why now

- REST notifications enable UI without websockets; sockets will enhance later.

---

### Phase 10 — Realtime (Sockets: presence, live updates) → FE Socket integration

Backend

- Implement sockets:
  - `utils/socketInstance.js` to create and export the singleton Socket.IO server instance.
  - `utils/socket.js` to initialize namespaces/rooms: per-org room, per-user room.
  - `utils/userStatus.js` to track online users (map of userId → socketIds).
  - `utils/socketEmitter.js` to emit domain events (TASK_ASSIGNED, COMMENT_ADDED, NOTIFICATION_CREATED, USER_ONLINE, USER_OFFLINE).
- Authenticate socket connections (JWT in handshake), attach orgId and userId, reject unauthorized.
- Hook emitters in REST flows:
  - On new comment → emit to task participants.
  - On notification creation → emit to the user’s room.
  - On login/logout/disconnect → update presence status and emit USER_ONLINE/OFFLINE.

Contracts

- Socket events (to mirror `client/src/services/socketEvents.js`):
  - server → client: user:online, user:offline, notification:new, task:updated, comment:new.
  - client → server: user:ping (keep-alive), room:join (org), task:subscribe (optional).
- Naming should align with FE `socketEvents.js`.

Frontend

- Services:
  - `services/socketService.js` to connect with auth token, auto-reconnect, and room join by orgId.
  - `services/socketEvents.js` enumerates event names matching backend.
- Hook:
  - `hooks/useSocket.js` to expose socket and convenience subscriptions.
- UI:
  - Live notification badge updates.
  - Optional live updates in Tasks and Comments views (optimistic refresh or reconcile strategies).

Why now

- Sockets rely on auth and notification plumbing already in place.

---

### Phase 11 — Dashboard and Cross-Resource Aggregations → FE Dashboard

Backend

- Add aggregation endpoints within existing routes (no new folder needed):
  - `taskRoutes.js`: GET /tasks/stats — counts by status, overdue, assigned-to-me, by department.
  - `userRoutes.js`: GET /users/stats — active users per department/role.
  - `notificationRoutes.js`: GET /notifications/stats — unread count.
- Ensure org scoping and RBAC.

Contracts

- Stats payloads:
  - tasks: { byStatus: { OPEN: n, IN_PROGRESS: n, DONE: n }, overdue: n, myOpen: n }
  - users: { byRole: { ORG_ADMIN: n, MANAGER: n, STAFF: n }, byDepartment: [{ departmentId, count }] }
  - notifications: { unread: n }

Frontend

- RTK Query `features/dashboardApi` (or reuse existing APIs with .stats endpoints).
- `pages/Dashboard` with cards, charts (responsive), using `components/dashboard/*`.
- Add time-zone aware labels via `hooks/useTimezone.js`.

Why now

- Aggregations are dependent on prior resources.

---

### Phase 12 — Hardening Pass (RBAC matrix finalization, validation polish, rate limiting) → FE guard polish and UX

Backend

- RBAC:
  - Finalize `authorizationMatrix.json` to cover all routes consistently; add tests around `authorization.js`.
- Validation:
  - Tighten all validators to mirror FE validators; ensure consistent error messages/codes.
- Rate limiting:
  - Tailor profiles (auth, notifications mark-all, comments burst).
- Error handling:
  - Normalize error payloads; ensure `ErrorController.js` maps validation errors consistently.

Frontend

- `useAuthorization.js` and `authorizationHelper.js`: ensure guards match backend rules.
- Improve form-level validation sync with backend (shared constraints from constants).
- Refine lists with empty states, skeleton loaders, toast notifications.

Why now

- Hardening after main features are built ensures consistent UX and security.

---

### Phase 13 — Search, Filters, Columns Uniformity → FE table/filter standardization

Backend

- Ensure all list endpoints accept:
  - q (text), page, limit, sort, filters (status, type, departmentId, assigneeId).
- Index review for performance (orgId + common filters).

Frontend

- Centralize table column definitions per entity under `components/columns/*`.
- Centralize filter UI under `components/filter/*` with consistent patterns and URL-sync.
- Reusable table wrapper under `components/reusable/*`.

Why now

- Consistency and performance tuning across lists.

---

### Phase 14 — Notifications & Activity Integration with Sockets (Refinement) → FE Real-time UX Finalization

Backend

- Ensure all key actions fire socket and create notifications as per policy:
  - Task assignment/reassignment, status change, comment created/deleted, user role updated.
- Debounce or batch socket emits where needed.

Frontend

- Ensure `useSocket` subscriptions are wired in Tasks and Comments pages.
- Add toasts / inline badges for new updates; reconcile if the current view is active.

---

### Phase 15 — Final Multi-tenant Safeguards and Soft-Delete UX → FE Soft-delete visibility

Backend

- Verify every route enforces org scoping (no cross-tenant leakage).
- Soft delete consistently applied; add withDeleted admin queries only where permitted.
- Add cascade safe-guards (e.g., cannot delete department with active users unless policy defined).

Frontend

- Show “restored” states only to permitted roles (if restore endpoints exist).
- Visual cues for deactivated vendors/materials/users.

---

## Cross-Phase Notes (Ensuring N depends on N−1)

- Constants parity: Phase 1 aligns FE/BE constants; no feature proceeds before constants are mirrored.
- Models before routes: Core models (Org, Dept, User) in Phase 2 precede any auth or resource routes.
- Auth before anything needing user context: Auth endpoints (Phase 3) precede FE auth (Phase 3) and any protected resource development (Phase 4+).
- Departments before Users page (role/department assignment), Users before Tasks (assignees), Tasks before Comments/Activities, Comments before Notifications, Notifications REST before Sockets, Sockets before Live UI, Aggregations last.
- Authorization matrix created early and finalized during hardening to avoid rework.

---

## Deliverable Checklist by Phase (Quick Reference)

- P1: SSOT constants, logger/helpers, error/cors/rate-limit, app skeleton → FE constants/shell/store base.
- P2: softDelete, Org/Dept/User models, auth & authorization middleware → FE auth/authorization hooks (no network).
- P3: Auth validators/routes/services → FE auth pages/endpoints/guards.
- P4: Org/Dept validators/routes → FE Departments page.
- P5: User validators/routes → FE Users page.
- P6: Task models/validators/routes → FE Tasks page.
- P7: TaskActivity/TaskComment validators/routes → FE activity/comments UI.
- P8: Materials/Vendors validators/routes → FE Materials/Vendors pages.
- P9: Notification model/service/routes (REST) → FE Notifications UI.
- P10: Sockets utils/instance/emitter/presence → FE socket service/hook/live notifications.
- P11: Stats/aggregations → FE Dashboard.
- P12: RBAC/validation hardening → FE guard/UX polish.
- P13: Search/filter/columns standardization → FE tables uniformity.
- P14: Realtime refinement (events coverage) → FE real-time UX finishing.
- P15: Multi-tenant and soft-delete safeguards → FE soft-delete visibility.

This plan satisfies:

- Backend-first readiness per phase.
- Each side’s Phase N only requires dependencies that were completed by Phase N−1 for that side and the other side.
- Strict adherence to the provided project structure, without introducing new layers beyond what exists in the doc.

## 23. Acceptance Criteria and Traceability Checklist

This checklist is mandatory for “done”. All items MUST be true with no exceptions.

### 23.1 Canonical Decisions (CAN-\*) Implemented

- [ ] CAN-001 Breakpoints are used everywhere (xs/sm/md/lg/xl).
- [ ] CAN-002 Bottom navigation visibility and items are correct; Profile menu satisfies “More”.
- [ ] CAN-003 Comment thread depth max is 5 and is enforced by validators + UI.
- [ ] CAN-004 List filtering supports the union of all filters per resource.
- [ ] CAN-005 Authorization matrix is enforced as the single source of truth (backend + frontend).
- [ ] CAN-006 Phone regex `^(\+251\d{9}|0\d{9})$` enforced everywhere (backend + UI placeholders/examples).
- [ ] CAN-007 No Terms acceptance checkbox exists in registration.
- [ ] CAN-008 Email verification + welcome-email rules implemented exactly.
- [ ] CAN-009 Department selector is in the sidebar (HOD only); no selector in Department Details header.
- [ ] CAN-010 Sidebar uses label “Tasks” (not “My Tasks”).
- [ ] CAN-011 User Details tabs are Overview / Tasks / Activity / Performance.
- [ ] CAN-012 Frontend 403 is toast-only (no Forbidden page); 403 never logs out.
- [ ] CAN-013 Canonical status/priority enums + UI label mapping implemented.
- [ ] CAN-014 Frontend uses `Intl.DateTimeFormat` for formatting; `dayjs` not used for UI formatting.
- [ ] CAN-015 Materials/Vendors delete is blocked when associated (409).
- [ ] CAN-016 Immutable fields for Admin/Manager/User targets are enforced (UI + API).
- [ ] CAN-017 Mobile dialogs (`width <= 600px`) are 100vh and use required MUI props + sx.
- [ ] CAN-018 Department Details has 3 top-level tabs (Overview, Members, Tasks); Activity is Tasks sub-tab (“All Activity”).
- [ ] CAN-019 Material inventory, SKU, and restock are implemented and consistent across UI/API/model.
- [ ] CAN-020 Vendor extended fields (website/location/partner/status) and metrics are implemented.
- [ ] CAN-021 Attachments do NOT support `parentModel="Material"`; Material Details has no attachments section.
- [ ] CAN-022 Department status (ACTIVE/INACTIVE) is implemented and enforced.
- [ ] CAN-023 Grid view uses `MuiDataGrid`; List view uses cards laid out with MUI `Grid` (v7 `size` prop) and the `MuiDataGridToolbar` + per-resource columns pattern is enforced.
- [ ] CAN-024 Dashboard header does not show logo; logo is in sidebar header only.
- [ ] CAN-025 Public header CTA labels are “Log In” and “Sign Up”.
- [ ] CAN-026 Department description max length is 500 (helper text + validation).

- [ ] CAN-027 Attachment fileUrl regex supports `image|video|raw` with version segment and allowlist includes .svg/.jpg/.jpeg/.png/.gif/.pdf/.doc/.docx/.xls/.xlsx/.txt/.mp4/.mp3.

### 23.2 Required UI Screens Coverage (By Reference Name)

Each screen name below MUST appear in the implemented app, and MUST match the UI/UX specs in Section 10 including desktop/tablet/mobile behavior and required data dependencies:

- [ ] Desktop UI **structure and elements** match the reference images under `docs/ui/<screen_reference_name>.png` for each screen below (images are not a source of truth for theme).
- [ ] Theme/styling uses the existing MUI theme setup under `client/src/theme/*` and theme tokens; no screenshot-derived colors/typography.
- [ ] Tablet/mobile behavior matches Section 10 + Section 11; it is implemented by the AI agent/developer (not inferred from the desktop reference images).

- [ ] `public_layout_screen`
- [ ] `landing-page`

- [ ] `desktop-dashboard-layout`
- [ ] `mobile-dashboard-layout`
- [ ] `desktop_dashboard_overview_screen`
- [ ] `departments_filter_dialog_screen`
- [ ] `departments_grid_view_screen`
- [ ] `departments_list_view_screen`
- [ ] `create_update_department_dialog_screen`
- [ ] `dept_details_overview_tab_screen`
- [ ] `dept_details_users_tab_screen`
- [ ] `dept_details_tasks_tab_screen`
- [ ] `dept_details_activity_tab_screen`
- [ ] `users_filter_dialog_screen`
- [ ] `users_grid_view_screen`
- [ ] `users_list_view_screen`
- [ ] `create_update_user_dialog_screen`
- [ ] `user_details_overview_screen`
- [ ] `user_details_tasks_screen`
- [ ] `user_details_activity_screen`
- [ ] `user_details_performance_screen`
- [ ] `tasks_filter_dialog_screen`
- [ ] `tasks_grid_view_screen`
- [ ] `tasks_list_view_screen`
- [ ] `create_update_task_dialog_screen`
- [ ] `task_details_overview_screen`
- [ ] `task_details_activities_screen`
- [ ] `task_details_comments_screen`
- [ ] `task_details_attachments_screen`
- [ ] `materials_list_view_screen`
- [ ] `material_details_screen`
- [ ] `vendors_list_view_screen`
- [ ] `vendor_details_screen`
- [ ] `settings_profile_tab_screen`
- [ ] `settings_account_tab_screen`

### 23.3 API Coverage and Contract Compliance

- [ ] Every UI “Data dependencies” call in Section 10 has a corresponding endpoint defined in Section 18.
- [ ] All list endpoints implement Section 18.1 conventions (pagination/sort/search/includeDeleted + resource filters).
- [ ] `GET /api/dashboard/overview` returns all widgets required by the Dashboard screen spec and supports filters.
- [ ] `GET /api/departments/:departmentId/dashboard` returns department analytics for Overview.
- [ ] `GET /api/departments/:departmentId/activity` returns a chronological feed and supports `entityModel` filtering.
- [ ] Materials endpoints include restock and usage history (`POST /api/materials/:materialId/restock`, `GET /api/materials/:materialId/usage`).
- [ ] Attachments endpoints accept only Task/TaskActivity/TaskComment parents and enforce department/org scoping.
- [ ] Error responses use the canonical error shape and codes, and frontend handles them per Section 15.

### 23.4 Data Models and Validation

- [ ] All models in Section 7 are implemented exactly (fields, enums, defaults, regex, uniqueness, scoping).
- [ ] All write operations use DB sessions; schema plugin/hook/method/static support sessions.
- [ ] “No hard delete” rule enforced; soft-delete + restore + withDeleted behaviors implemented for all resources.
- [ ] “Cannot delete if associated” checks return deterministic 409 errors with actionable messages.

### 23.5 Engineering Constraints and Code Patterns

- [ ] All controllers use `express-async-handler` export pattern and only read actor/input from `req.user` + `req.validated.*`.
- [ ] All write controllers use `try/catch/finally` with session start/commit/abort/end.
- [ ] JSDoc is used strictly (TypeScript-compatible types).
- [ ] Constants are never hardcoded; backend constants are the single source of truth; frontend constants mirror exactly.
- [ ] Search debouncing does not cause component re-renders (refs/memos only).
- [ ] Redux slices/RTK Query transforms both success and error payloads.

### 23.6 Frontend UX and Error Handling

- [ ] Every page follows: fetch → loading skeleton/`MuiDataGrid` loading → (on error: RouteError; on success: render).
- [ ] Global error component handles all client-side errors; error type is derived from error object (no hardcoded types).
- [ ] 401 refresh flow logs out only when refresh fails; 403 never logs out and is toast-only.
- [ ] All dialog components obey the mobile 100vh rule and required props.
- [ ] All MUI `size` props use `size="small"`; tree-shakable imports only; no deprecated APIs.
- [ ] Any overflowing text uses ellipsis.

### 23.7 Process and Delivery

- [ ] Task Execution Protocol (7 steps) is followed for every task.
- [ ] Starting Phase 1, backend and frontend dev servers run concurrently to surface integration issues early.
- [ ] At every phase/sub-task, previously built components are updated for integration and correctness (no stale mismatches).

### 23.8 Exhaustive Source-Document Reconciliation Gate

- [ ] Development rules are reflected without contradiction in Sections 20-21 and enforced in implementation/test review.
- [ ] Functional/UI behaviors are fully represented in Sections 6, 10, 11, 15, and 18.
- [ ] Task-execution process constraints are represented in Section 21 and are followed per task.
- [ ] Schema field constraints (regex, enums, lengths, defaults, relations) are represented in Section 7 and Section 18 payload contracts.
- [ ] Project user-story flows and persona scenarios are represented in Sections 3-4 and Section 6 requirements.
- [ ] Backend/frontend synchronization rules are represented in Section 22 phase gates and integration rules.
- [ ] Legacy requirements not deprecated by canonical decisions are preserved in this PRD.
- [ ] Canonical test cases are fully incorporated by Section 19.1 and used as mandatory QA acceptance input.
- [ ] FR-UI mappings and per-screen checkpoints are fully represented in Sections 10.4 and 23.2/23.3.
- [ ] All `docs/ui/*.png` reference screens listed in Section 23.2 have matching implementation coverage and responsive behavior parity.
