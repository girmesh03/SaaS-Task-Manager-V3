# Product Overview

Enterprise-grade, multi-tenant SaaS task management system for organizations with hierarchical structures (org → department → user).

## Core Capabilities

- **Organization & Department Management**: Hierarchical structure with role-based access control (RBAC)
- **Three Task Types**: ProjectTask (vendors, watchers, activities), AssignedTask (assignees, deadlines), RoutineTask (embedded materials, no activities)
- **Real-Time Collaboration**: Socket.IO for tasks, activities, comments, notifications with automatic cache updates
- **Materials & Vendor Tracking**: Inventory management with stock tracking, restocking, and vendor performance
- **Dashboard Analytics**: KPIs, charts (pie, bar, line), activity feeds, upcoming deadlines
- **Advanced Filtering**: Union filters, search (min 3 chars, debounced), URL persistence, pagination (20/page default)
- **Secure Authentication**: JWT with refresh token rotation (HttpOnly cookies), bcrypt (>=12 rounds), rate limiting

## User Roles & Permissions

- **Platform SuperAdmin**: System administrator with cross-organization read access (based on authorization matrix)
- **Organization SuperAdmin**: Full control within own organization, cannot delete organization itself
- **Admin**: Department-level management with cross-department read access in own organization
- **Manager**: Department-scoped resource management, can read across departments where allowed
- **User**: Individual contributor with task execution permissions, department-scoped access

## Multi-Tenancy Model

### Platform Organization

- **Creation**: Backend seeding via `npm run seed`
- **Identifier**: `isPlatformOrg: true`, users have `isPlatformOrgUser: true`
- **Protection**: Cannot be deleted (immutable)
- **Access**: Platform SuperAdmin can access customer organizations per authorization matrix
- **Purpose**: System administration and cross-organization management

### Customer Organization

- **Creation**: Frontend 4-step registration workflow (org details → dept setup → user registration → review & submit)
- **Identifier**: `isPlatformOrg: false`, users have `isPlatformOrgUser: false`
- **Isolation**: Complete data isolation from other customer organizations
- **First User**: Becomes Organization SuperAdmin + Head of Department (HOD)
- **Verification**: Email verification required before login (CAN-008)
- **Purpose**: Tenant organizations for business operations

## Task Types

### ProjectTask

- Long-term projects with vendors, watchers, and activity tracking
- Required: vendor, startDate, dueDate (must be after startDate)
- Watchers: Creator included by default, any active user in same org+dept can be added/removed
- Activities: TaskActivity allowed for logging progress, materials, attachments

### AssignedTask

- Short-term assignments with specific assignees and deadlines
- Required: assignees (min 1, max 50), startDate, dueDate
- Assignees: Must be active users in same organization
- Activities: TaskActivity allowed for tracking progress
- Reminders: Due date notification sent 1 hour before deadline

### RoutineTask

- Recurring tasks with embedded materials (no activities)
- Required: date (specific date for routine task)
- Materials: Embedded directly in task (max 20), no TaskActivity allowed
- Stock: Material stock decremented atomically on task creation
- Completion: Status changes to COMPLETED for that date

## Key Features

### Data Management

- **Soft Delete Only**: All resources use `isDeleted` flag, no hard deletes
- **Cascade Operations**: Soft delete cascades to related resources (users, tasks, activities, comments, attachments, notifications)
- **Restore Capability**: Soft-deleted resources can be restored with cascaded resources in correct order
- **Multi-Tenant Isolation**: Strict data isolation at organization and department levels

### Real-Time Features

- **Socket.IO Rooms**: `user:{userId}`, `org:{orgId}`, `dept:{deptId}`, `task:{taskId}`
- **Events**: task:created, task:updated, task:deleted, task:activity:added, task:comment:added, notification, user:status:changed
- **Authentication**: JWT token required for socket connections
- **Auto-Reconnection**: Automatic reconnection with exponential backoff
- **Cache Integration**: Socket events route into RTK Query cache updates

### Notifications

- **In-App**: Bell icon badge, dropdown, mark as read, auto-expire (30 days TTL)
- **Email**: Sent for important events via Nodemailer (Gmail SMTP)
- **Real-Time Push**: Via Socket.IO to user rooms including watchers and mentioned users
- **Browser Notifications**: If permitted by user

### File Attachments

- **Storage**: Cloudinary with secure signed URLs
- **Size Limit**: 10MB per file
- **Allowed Extensions**: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3
- **Types**: Image, Document, Video, Audio, Other
- **Polymorphic**: Can attach to tasks, activities, comments
- **Preview**: Images shown inline, all files downloadable

### Comments & Mentions

- **Threading**: Reply to tasks, activities, and other comments (max depth 5)
- **Mentions**: @mention users to notify them (max 20 mentions per comment)
- **Attachments**: Files can be attached to comments
- **Edit/Delete**: Users can edit and delete own comments
- **Scope**: Mentioned users must belong to same organization

### Materials & Inventory

- **Inventory Tracking**: stockOnHand, reorderLevel, reorderQuantity, lastRestockedAt
- **Stock Management**: Atomic decrement on usage, atomic increment on restock
- **Restocking**: Dedicated `POST /api/materials/:materialId/restock` endpoint
- **Usage**: Recorded through RoutineTask materials and TaskActivity materials
- **Validation**: Rejects if stock would go below 0 (409 CONFLICT_ERROR)

### Vendors

- **Linked to**: ProjectTasks only
- **Performance Tracking**: Rating, contact info, address
- **Validation**: Cannot be soft-deleted when associated with active tasks (409 CONFLICT_ERROR)

### Advanced Filtering & Search

- **Filters**: status, priority, type, date range, assignment, department, tags
- **Search**: Title and description with debounce (min 3 characters)
- **Union Filters**: Multiple values per filter (e.g., status=TODO,IN_PROGRESS)
- **URL Persistence**: Filters persist in URL query params
- **Pagination**: 20 items per page default, customizable

### View Modes (List vs Grid)

**Important Terminology**:

- **Grid View** = MuiDataGrid (tabular data grid with columns, rows, sorting, filtering)
- **List View** = MUI Cards in responsive Grid layout (card-based layout)

**Resources with BOTH views** (toggle available):

- Tasks: List view (cards) + Grid view (MuiDataGrid with row selection)
- Users: List view (cards) + Grid view (MuiDataGrid)
- Departments: List view (cards) + Grid view (MuiDataGrid)

**Resources with ONLY Grid view** (no list view option):

- Materials: Grid view only (MuiDataGrid with optional inventory columns)
- Vendors: Grid view only (MuiDataGrid with contact info, rating, projects)

**Implementation Requirements**:

- MuiDataGrid wrapper must live in `client/src/components/reusable/`
- Column definitions must live in `client/src/components/columns/` per resource
- MuiDataGridToolbar must be reusable for common actions (search, filter, export, column visibility, density)
- Responsive: Hide less important columns on mobile/tablet

### Dashboard Analytics

- **KPIs**: My Tasks, Department Tasks, Overdue, Completed This Week
- **Charts**: Status distribution (pie), priority breakdown (bar), timeline (line)
- **Activity Feed**: Real-time chronological feed (newest first)
- **Upcoming Deadlines**: MuiDataGrid table (next 7 days)
- **Team Performance**: Manager/Admin only, comparison to department averages

### Responsive Design

- **Desktop**: Full sidebar, header, content area
- **Tablet**: Collapsible sidebar, responsive grids
- **Mobile**: Bottom navigation with centered FAB, single-column layout, stacked elements
- **Breakpoints**: xs (0-599), sm (600-899), md (900-1199), lg (1200-1535), xl (1536+)

### Security & Validation

- **JWT**: Access and refresh tokens with rotation, HttpOnly cookies
- **Password**: bcrypt hashing (>=12 rounds), 8-128 characters
- **Rate Limiting**: express-rate-limit on all endpoints
- **Input Sanitization**: express-mongo-sanitize for NoSQL injection prevention
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Validation**: express-validator with aligned frontend/backend rules
- **Phone Format**: Ethiopian format only: `+251XXXXXXXXX` or `0XXXXXXXXX`

### Email Workflows

- **Registration**: Verification email with token (expires after set time)
- **Welcome**: Sent once after verification (idempotent)
- **User Creation**: Welcome email with one-time password setup link
- **Password Reset**: Reset token email with expiry
- **Notifications**: Email alerts for important events

### User Management

- **Auto-Verification**: Users created by org SuperAdmin are auto-verified (isVerified=true)
- **Employee ID**: Auto-generated (pattern: `^(?!0000)\d{4}$`, e.g., "0001", "0002")
- **Status**: ACTIVE (can login) or INACTIVE (denied login/refresh with 403)
- **HOD**: Head of Department flag (isHod), can switch departments
- **Immutability**: Admin/Manager/User targets cannot change departmentId, role, employeeId, joinedAt, isHod (409 CONFLICT_ERROR)

### Department Management

- **Status**: ACTIVE or INACTIVE
- **Inactive Departments**: Excluded from dropdowns, cannot create new users/tasks/materials (409 CONFLICT_ERROR)
- **Manager**: Optional SuperAdmin/Admin user with isHod=true
- **Activity Feed**: Chronological feed with filtering by entityModel (Task, TaskActivity, TaskComment, Attachment)

## Real-World Use Cases

- **Hotel Housekeeping**: Room cleaning routines, renovation projects, maintenance tasks
- **Software Development**: Sprint tasks, code reviews, security scans
- **Healthcare**: Patient care coordination, medication rounds, equipment upgrades
- **Restaurant Operations**: Inventory checks, event preparation, kitchen renovations

## Constraints & Rules

- **No Hard Deletes**: Soft delete only across entire system
- **No Test Frameworks**: Jest, Mocha, Chai, Supertest, Vitest, Cypress forbidden
- **No React Hook Form watch()**: Avoid performance issues
- **No Deprecated MUI Syntax**: No `item` prop, no `renderTags`
- **Date Formatting**: Use native Intl API for user-facing dates (dayjs only for internal computations and date-picker adapters)
- **No Direct Org Creation**: Organizations created only via registration flow or backend seeding
- **No Terms Checkbox**: No terms acceptance checkbox in registration (CAN-007)

## Testing Approach

### Backend Testing (Mandatory)

Backend changes require testing using plain JavaScript scripts before user review.

**Testing Rules**:

- Only plain JavaScript test scripts (no frameworks)
- Tests must be runnable with `node <script>`
- Use real Mongoose models and real database
- No mocking of business logic, models, services, or authorization
- Tests must fail loudly using `throw` or `process.exit(1)`
- Directly execute validators, controllers, and database logic

**Testing Scope**:

- **Must test**: Validators, controllers, authorization logic, multi-tenant isolation, soft delete, restore, cascade behavior
- **Must NOT test**: UI, styling, framework internals, third-party libraries

**Validator Testing**:

- Execute using `.run(req)` and assert with `validationResult(req)`
- Test required fields, formats, existence, uniqueness
- Existence checks must use `withDeleted()` for create and restore
- Validate scoping (organization and department)

**Controller Testing**:

- Invoke controllers directly as functions
- Construct full `req.user` with role, organization, department, flags
- Use `req.validated` (not `req.body/params/query`)
- Mock `res` with `status(code)` and `json(payload)`
- Assert authorization, ownership, and scoping
- Use sessions for all write operations

**Database Verification**:

- Verify create/update/delete side effects
- Verify soft-delete flags and timestamps
- Verify multi-tenant isolation
- Verify ownership fields (createdBy, assignees, watchers, mentions)

**Delete/Restore Testing**:

- Verify resource exists before delete
- Test authorization checks
- Verify soft delete only (no hard deletes)
- Test cascade delete behavior with transactions
- Restore must use `withDeleted()` and verify parent existence

### Frontend Testing (Not Required)

No test frameworks allowed for frontend. Manual testing only.

**Manual Testing Focus**:

- Authentication and authorization flows
- Multi-tenancy isolation
- Real-time updates via Socket.IO
- Form validation alignment with backend
- Responsive design across breakpoints
- Accessibility compliance
