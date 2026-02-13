# Technology Stack

## Backend

### Runtime & Framework

- **Node.js** with ES modules (`type: "module"`)
- **Express.js** 4.21.2 - REST API framework
- **MongoDB** with Mongoose 8.19.1 - Database and ODM

### Authentication & Security

- **JWT** (jsonwebtoken 9.0.2) - Access/refresh token rotation with HttpOnly cookies
- **bcrypt** 6.0.0 - Password hashing (>=12 rounds)
- **helmet** 8.1.0 - Security headers
- **express-rate-limit** 8.1.0 - Rate limiting
- **express-mongo-sanitize** 2.2.0 - NoSQL injection prevention
- **cors** 2.8.5 - Cross-origin resource sharing

### Validation & Middleware

- **express-validator** 7.2.1 - Request validation
- **express-async-handler** 1.2.0 - Async error handling
- **cookie-parser** 1.4.7 - Cookie parsing

### Real-Time & Communication

- **Socket.IO** 4.8.1 - WebSocket connections for real-time updates
- **Nodemailer** 7.0.9 - Email notifications via Gmail SMTP

### Utilities

- **dayjs** 1.11.18 - Date manipulation (internal use only)
- **validator** 13.15.15 - String validation
- **winston** 3.18.3 - Logging
- **compression** 1.8.1 - Response compression
- **mongoose-paginate-v2** 1.9.1 - Pagination

### Development

- **nodemon** 3.1.10 - Auto-restart on file changes
- **morgan** 1.10.1 - HTTP request logging
- **dotenv** 17.2.3 - Environment variables

## Frontend

### Core Framework

- **React** 19.2.0 with React DOM 19.2.0
- **Vite** 7.2.4 - Build tool and dev server
- **@vitejs/plugin-react-swc** 4.2.2 - Fast refresh with SWC

### State Management

- **Redux Toolkit** 2.11.2 - State management
- **RTK Query** - Data fetching and caching (included in Redux Toolkit)
- **react-redux** 9.2.0 - React bindings
- **redux-persist** 6.0.0 - State persistence

### UI Framework

- **Material UI (MUI)** 7.3.7 - Component library
- **@mui/icons-material** 7.3.7 - Icons
- **@mui/lab** 7.0.1-beta.21 - Experimental components
- **@mui/x-data-grid** 8.27.0 - Data tables
- **@mui/x-charts** 8.27.0 - Charts and visualizations
- **@mui/x-date-pickers** 8.27.0 - Date/time pickers
- **@emotion/react** 11.14.0 - CSS-in-JS
- **@emotion/styled** 11.14.1 - Styled components

### Routing & Forms

- **react-router** 7.13.0 - Client-side routing
- **react-hook-form** 7.71.1 - Form management (no watch() usage)

### HTTP & Real-Time

- **axios** 1.13.4 - HTTP client
- **socket.io-client** 4.8.3 - WebSocket client

### File Handling

- **react-dropzone** 14.4.0 - File upload
- **Cloudinary** - File storage (external service)

### UI Enhancements

- **react-toastify** 11.0.5 - Toast notifications
- **react-error-boundary** 6.1.0 - Error boundaries
- **react-photo-album** 3.4.0 - Photo gallery
- **yet-another-react-lightbox** 3.28.0 - Image lightbox

### PDF Generation

- **jspdf** 4.1.0 - PDF creation
- **jspdf-autotable** 5.0.7 - PDF tables

### Utilities

- **dayjs** 1.11.19 - Date adapter for MUI pickers (internal use only)
- **@fontsource/inter** 5.2.8 - Inter font family

### Development

- **ESLint** 9.39.1 - Linting
- **eslint-plugin-react-hooks** 7.0.1 - React hooks linting
- **eslint-plugin-react-refresh** 0.4.24 - Fast refresh linting

## Common Commands

### Backend

```bash
cd backend

# Development
npm run dev          # Start with nodemon (auto-restart)
npm start            # Production start

# Database
npm run seed         # Seed platform organization and initial data
npm run wipe         # Clear all database data

```

### Frontend

```bash
cd client

# Development
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## Architecture Patterns

### Backend

- **Layered architecture**: Routes → Middleware (Auth/Validation/Authorization) → Controllers → Services → Models
- **Discriminator pattern**: Task polymorphism (ProjectTask, AssignedTask, RoutineTask)
- **Cascade operations**: Transactions for multi-document updates
- **Polymorphic references**: Comments and attachments support multiple parent types
- **Soft delete**: `isDeleted` flag instead of hard deletes

### Frontend

- **Container/Presentational**: Separate logic from UI components
- **Custom hooks**: useAuth, useSocket, useAuthorization, useTimezone, useResponsive
- **Feature-based structure**: Components grouped by domain
- **RTK Query**: Automatic cache management and optimistic updates
- **Socket integration**: Real-time updates via socketService routing to RTK Query cache

## Database

### Schema Design

- **Collections**: Organizations, Departments, Users, Tasks, TaskActivities, TaskComments, Materials, Vendors, Notifications, Attachments
- **Indexes**: Compound unique for multi-tenancy, TTL for notifications, text for search
- **Relationships**: One-to-many, embedded subdocuments, polymorphic references

## Constraints & Rules

- **No test frameworks**: Jest, Mocha, Chai, Supertest, Vitest, Cypress are forbidden
- **No React Hook Form watch()**: Avoid performance issues
- **No deprecated MUI syntax**: No `item` prop, no `renderTags`
- **Date formatting**: Use native Intl API for user-facing dates (dayjs only for internal computations and date-picker adapters)
- **File extensions allowlist**: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3
- **File size limit**: 10MB per file
- **Soft delete only**: No hard deletes in the system
- **Phone format**: Ethiopian format only: `+251XXXXXXXXX` or `0XXXXXXXXX` (regex: `^(\+251\d{9}|0\d{9})$`)
- **No terms checkbox**: No terms acceptance checkbox in registration (CAN-007)
- **Email verification**: Required for initial customer org registration before login (CAN-008)
- **View terminology**: "Grid view" = MuiDataGrid (tabular), "List view" = MUI Cards layout (CAN-023)
  - Tasks, Users, Departments: Support BOTH views with toggle
  - Materials, Vendors: Grid view ONLY (no list view option)
  - MuiDataGrid wrapper must be reusable component in `client/src/components/reusable/`
  - Column definitions must be in `client/src/components/columns/` per resource

## Testing Requirements

### Testing Philosophy

Testing is mandatory and strictly controlled for backend code only.

- **Only plain JavaScript test scripts** that execute real application code
- **No testing frameworks or libraries** (Jest, Mocha, Chai, Supertest, Vitest, Cypress are forbidden)
- Tests must be runnable with `node <script>`
- Tests must use real Mongoose models and the real database
- **No mocking** of business logic, models, services, or authorization rules
- Tests must simulate real backend behavior as exercised via Postman
- Tests must **not** be written for UI, styling, framework internals, or third-party libraries
- Tests must fail loudly using `throw`, `process.exit(1)`, or explicit assertions
- Tests must directly execute validators, controllers, and database logic

### Validator Testing

- Execute validators using `.run(req)`
- Assert with `validationResult(req)`
- Validate required fields, formats, existence, uniqueness
- Existence checks for create and restore must use `withDeleted()`
- Params-based validators must assert existence
- Department/vendor validators must be scoped by organization
- All other validators must be scoped by organization and department
- Validation failures must assert field name, message, and reason

### Controller Testing

- Controllers invoked directly as functions
- `req.user` must be fully constructed as the actor with:
  - role, organization, organization.isDeleted, organization.isPlatformOrg
  - department, department.isDeleted
  - isPlatformOrgUser, isHod, isDeleted
- Controllers must not read from `req.body/params/query`
- Controllers must consume `req.validated` only (body, params, query via matchedData)
- Mock `res` must implement `status(code)` and `json(payload)`
- Authorization, ownership, and scoping must be explicitly asserted
- Controllers must use session for all write operations
- Tests must populate `req.validated` exactly as the application does after validation middleware

### Required Validated Input Shape

```javascript
req.validated = {
  body: matchedData(req, { locations: ["body"] }),
  params: matchedData(req, { locations: ["params"] }),
  query: matchedData(req, { locations: ["query"] }),
};
```

### Database Verification

- Verify create/update/delete side effects
- Verify soft-delete flags and timestamps
- Verify multi-tenant isolation
- Verify ownership changes
- Verify same-organization access succeeds and cross-organization access fails
- Verify platform organization behavior is enforced
- Verify ownership fields such as createdBy, assignees, watchers, mentions, uploadedBy

### Delete/Restore Testing

- Ensure resource exists before delete
- Authorization checks verified
- Soft delete only
- Cascade delete behavior tested
- Restore uses `withDeleted()`, verifies parent existence and correct order
- Cascade delete must respect MongoDB transactions

### Test Organization

- Scripts named by resource and action (e.g., `task-create.test.js`, `task-delete.test.js`)
- Each script runs independently
- Test data must be cleaned or clearly identifiable
- Tests must never alter platform organization integrity

### Testing Scope

- **Tests MUST be written for**: validators, controllers, authorization logic, multi-tenant isolation, soft delete, restore, and cascade behavior
- **Tests MUST NOT be written for**: UI, styling, framework internals, or third-party libraries
- **Frontend testing**: Not required (no test frameworks allowed)
- **Backend testing**: Mandatory for all backend changes before user review

## Validation Patterns

### Common Patterns

- **Name fields**: `/^[a-zA-Z0-9\s\-&.,'()]+$/` (org, dept names)
- **Person names**: `/^[a-zA-Z\s\-']+$/` (firstName, lastName, position)
- **Email**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (max 100 chars)
- **Phone**: `/^(\+251\d{9}|0\d{9})$/` (Ethiopian format, min 10, max 15)
- **Employee ID**: `/^(?!0000)\d{4}$/` (4 digits, not 0000)
- **Cloudinary URL**: `/^https:\/\/res\.cloudinary\.com\/.+$/`

### Field Length Constraints

- **Organization name**: 2-100 chars
- **Department name**: 2-100 chars
- **Department description**: max 500 chars (not 200 as some UI text suggests)
- **User firstName/lastName**: 2-50 chars
- **User position**: 2-100 chars
- **Task title**: 3-200 chars
- **Task description**: 10-5000 chars
- **Task tags**: max 5 tags, each max 50 chars, lowercase, unique case-insensitive
- **Comment**: 2-2000 chars
- **Activity description**: 2-1000 chars
- **Material name**: 2-200 chars
- **Vendor name**: 2-200 chars
- **Notification title**: max 200 chars
- **Notification message**: 1-500 chars

### Enums

- **Organization industry**: Technology, Healthcare, Finance, Education, Retail, Manufacturing, Construction, Hospitality, Transportation, Real Estate, Agriculture, Energy, Telecommunications, Media, Entertainment, Legal, Consulting, Insurance, Automotive, Aerospace, Pharmaceutical, Food & Beverage, Government, Non-Profit
- **Organization size**: Small, Medium, Large
- **User role**: SuperAdmin, Admin, Manager, User
- **User status**: ACTIVE, INACTIVE
- **Department status**: ACTIVE, INACTIVE
- **Task status**: TODO, IN_PROGRESS, COMPLETED, PENDING
- **Task priority**: LOW, MEDIUM, HIGH, URGENT
- **Task type**: ProjectTask, AssignedTask, RoutineTask
- **Material category**: Raw Material, Consumable, Equipment, Tool, Supply, Other
- **Material unit**: kg, g, L, mL, pcs, box, pack, roll, sheet, Other
- **Attachment type**: Image, Document, Video, Audio, Other

## API Endpoints

### Authentication

- `POST /api/auth/register` - 4-step customer org registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and clear cookies
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

### Organizations

- `GET /api/organizations` - List organizations (Platform SuperAdmin only)
- `GET /api/organizations/:organizationId` - Get organization details
- `PUT /api/organizations/:organizationId` - Update organization
- `DELETE /api/organizations/:organizationId` - Soft delete organization
- `PATCH /api/organizations/:organizationId/restore` - Restore organization

### Departments

- `GET /api/departments` - List departments (paginated, filtered, sorted)
- `POST /api/departments` - Create department
- `GET /api/departments/:departmentId` - Get department details
- `GET /api/departments/:departmentId/dashboard` - Department dashboard aggregates
- `GET /api/departments/:departmentId/activity` - Department activity feed
- `PUT /api/departments/:departmentId` - Update department
- `DELETE /api/departments/:departmentId` - Soft delete department
- `PATCH /api/departments/:departmentId/restore` - Restore department

### Users

- `GET /api/users` - List users (paginated, filtered, sorted)
- `POST /api/users` - Create user (auto-verified, sends welcome email)
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/:userId/activity` - User activity feed
- `GET /api/users/:userId/performance` - User performance metrics
- `PUT /api/users/:userId` - Update user (immutability rules apply)
- `PUT /api/users/:userId/preferences` - Update user preferences
- `PUT /api/users/:userId/security` - Update security settings (2FA)
- `DELETE /api/users/:userId` - Soft delete user
- `PATCH /api/users/:userId/restore` - Restore user

### Tasks

- `GET /api/tasks` - List tasks (paginated, filtered, sorted, union filters)
- `POST /api/tasks` - Create task (type-specific validation)
- `GET /api/tasks/:taskId` - Get task details
- `GET /api/tasks/:taskId/activities` - Get task activities
- `POST /api/tasks/:taskId/activities` - Add task activity
- `GET /api/tasks/:taskId/comments` - Get task comments
- `POST /api/tasks/:taskId/comments` - Add task comment
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Soft delete task
- `PATCH /api/tasks/:taskId/restore` - Restore task

### Materials

- `GET /api/materials` - List materials (paginated, filtered, sorted)
- `POST /api/materials` - Create material
- `GET /api/materials/:materialId` - Get material details
- `POST /api/materials/:materialId/restock` - Restock material (atomic increment)
- `PUT /api/materials/:materialId` - Update material
- `DELETE /api/materials/:materialId` - Soft delete material (409 if in use)
- `PATCH /api/materials/:materialId/restore` - Restore material

### Vendors

- `GET /api/vendors` - List vendors (paginated, filtered, sorted)
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:vendorId` - Get vendor details
- `PUT /api/vendors/:vendorId` - Update vendor
- `DELETE /api/vendors/:vendorId` - Soft delete vendor (409 if in use)
- `PATCH /api/vendors/:vendorId/restore` - Restore vendor

### Attachments

- `POST /api/attachments` - Create attachment (after Cloudinary upload)
- `GET /api/attachments/:attachmentId` - Get attachment details
- `DELETE /api/attachments/:attachmentId` - Soft delete attachment

### Notifications

- `GET /api/notifications` - List user notifications (paginated)
- `PATCH /api/notifications/:notificationId/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete notification

### Dashboard

- `GET /api/dashboard/overview` - Dashboard overview (KPIs, charts, filters by date range and departmentId)

## Error Codes & Messages

### HTTP Status Codes

- **400 VALIDATION_ERROR**: Invalid input, missing required fields, format errors
- **401 UNAUTHENTICATED_ERROR**: Missing/invalid/expired token
- **403 UNAUTHORIZED_ERROR**: Insufficient permissions, inactive user, unverified user
- **404 NOT_FOUND_ERROR**: Resource not found
- **409 CONFLICT_ERROR**: Duplicate email, inactive department, insufficient stock, immutability violation, resource in use
- **429 RATE_LIMITED_ERROR**: Too many requests
- **500 INTERNAL_ERROR**: Server error

### Response Format

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error": {
    "code": string,
    "details": object
  }
}
```

## Socket.IO Events

### Client → Server

- `authenticate` - Send JWT token on connection
- `join:task` - Join task room
- `leave:task` - Leave task room

### Server → Client

- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task soft deleted
- `task:activity:added` - Activity added to task
- `task:comment:added` - Comment added to task
- `notification` - New notification
- `user:status:changed` - User status changed (ACTIVE/INACTIVE)

### Room Structure

- `user:{userId}` - User-specific room
- `org:{orgId}` - Organization-wide room
- `dept:{deptId}` - Department-wide room
- `task:{taskId}` - Task-specific room
