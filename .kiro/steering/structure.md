# Project Structure

## Root Layout

```
/
├── backend/           # Node.js Express API
├── client/            # React frontend
├── docs/              # Product documentation and UI mockups
├── .kiro/             # Kiro configuration
│   ├── specs/         # Feature specifications
│   └── steering/      # Project steering rules
└── README.md
```

## Backend Structure

```
backend/
├── server.js          # HTTP server entry point
├── app.js             # Express app configuration
├── package.json       # Dependencies and scripts
├── .env               # Environment variables
├── config/            # Configuration files (DB, JWT, email, etc.)
├── models/            # Mongoose schemas and models
│   └── plugins/       # Mongoose plugins
├── routes/            # Express route definitions
├── controllers/       # Business logic handlers
├── middlewares/       # Auth, validation, authorization
│   └── validators/    # express-validator rules
├── services/          # External services (email, socket, etc.)
├── utils/             # Helper functions
├── errorHandler/      # Error handling middleware
└── mock/              # Database seeding scripts
```

## Frontend Structure

```
client/
├── src/
│   ├── main.jsx                    # Application entry point
│   ├── components/                 # React components
│   │   ├── common/                 # Shared components
│   │   ├── layouts/                # Layout components
│   │   └── reusable/               # Reusable UI components
│   │       ├── MuiLoading.jsx
│   │       └── index.js
│   ├── pages/                      # Page components
│   │   ├── Home.jsx                # Landing page
│   │   └── NotFound.jsx            # 404 page
│   ├── router/                     # React Router configuration
│   │   └── routes.jsx              # Route definitions
│   ├── theme/                      # MUI theme configuration
│   │   ├── AppTheme.jsx            # Theme provider
│   │   ├── themePrimitives.js      # Design tokens
│   │   └── customizations/         # Component overrides
│   │       ├── charts.js
│   │       ├── dataDisplay.js
│   │       ├── dataGrid.js
│   │       ├── datePickers.js
│   │       ├── feedback.js
│   │       ├── inputs.js
│   │       ├── navigation.js
│   │       ├── surfaces.js
│   │       └── index.js
│   └── assets/                     # Static assets
│       └── notFound_404.svg
├── redux/                          # Redux store (to be moved to src/)
│   ├── app/                        # Store configuration
│   └── features/                   # Feature slices
├── services/                       # API services (to be moved to src/)
├── hooks/                          # Custom React hooks (to be moved to src/)
├── utils/                          # Utility functions (to be moved to src/)
├── public/                         # Public static files
│   ├── vite.svg
│   └── react.svg
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
├── eslint.config.js                # ESLint configuration
├── package.json                    # Dependencies and scripts
└── .env                            # Environment variables
```

## Documentation Structure

```
docs/
├── product-requirements-document-new.md  # Complete PRD (single source of truth)
├── prd-test-cases.md                     # Comprehensive test scenarios (15,280 lines)
│                                         # Covers: Auth, Org, Dept, User, Task,
│                                         # Material, Vendor, Attachment, Notification
│                                         # Test types: Validation, Authorization,
│                                         # Controller, Authentication, Socket
└── ui/                                   # UI mockups and screenshots (35 screens)
    ├── landing-page.png                  # Public landing page
    ├── public_layout_screen.png          # Public layout structure
    ├── desktop-dashboard-layout.png      # Desktop layout (header, sidebar, content)
    ├── mobile-dashboard-layout.png       # Mobile layout (bottom nav, FAB)
    ├── desktop_dashboard_overview_screen.png  # Dashboard with KPIs, charts, feed
    ├── tasks_list_view_screen.png        # Tasks list view (MUI Cards layout)
    ├── tasks_grid_view_screen.png        # Tasks grid view (MuiDataGrid table)
    ├── tasks_filter_dialog_screen.png    # Task filter dialog
    ├── create_update_task_dialog_screen.png  # Task create/update form
    ├── task_details_overview_screen.png  # Task detail overview tab
    ├── task_details_activities_screen.png # Task activities timeline
    ├── task_details_comments_screen.png  # Task comments with threading
    ├── task_details_attachments_screen.png # Task attachments gallery
    ├── users_list_view_screen.png        # Users list view (MUI Cards layout)
    ├── users_grid_view_screen.png        # Users grid view (MuiDataGrid table)
    ├── users_filter_dialog_screen.png    # User filter dialog
    ├── create_update_user_dialog_screen.png  # User create/update form
    ├── user_details_overview_screen.png  # User profile overview
    ├── user_details_tasks_screen.png     # User tasks tab
    ├── user_details_activity_screen.png  # User activity feed
    ├── user_details_performance_screen.png # User performance metrics
    ├── departments_list_view_screen.png  # Departments list view (MUI Cards layout)
    ├── departments_grid_view_screen.png  # Departments grid view (MuiDataGrid table)
    ├── departments_filter_dialog_screen.png # Department filter dialog
    ├── create_update_department_dialog_screen.png # Dept create/update form
    ├── dept_details_overview_tab_screen.png # Department overview
    ├── dept_details_users_tab_screen.png # Department users tab
    ├── dept_details_tasks_tab_screen.png # Department tasks tab
    ├── dept_details_activity_tab_screen.png # Department activity feed
    ├── materials_list_view_screen.png    # Materials grid view (MuiDataGrid table, NO cards)
    ├── material_details_screen.png       # Material detail with stock info
    ├── vendors_list_view_screen.png      # Vendors grid view (MuiDataGrid table, NO cards)
    ├── vendor_details_screen.png         # Vendor detail with rating
    ├── settings_profile_tab_screen.png   # User settings profile tab
    └── settings_account_tab_screen.png   # User settings account tab
```

## UI Screen Descriptions

### Public Pages

- **Landing Page**: Hero section, features, pricing, testimonials, CTA buttons
- **Public Layout**: Header with logo and navigation, footer with links

### Authentication

- **Login**: Email/password form, forgot password link, register link
- **Register**: 4-step wizard (org details → dept setup → user registration → review & submit)
- **Verify Email**: Verification pending state, resend verification button
- **Forgot Password**: Email input, submit button
- **Reset Password**: New password form with token validation

### Dashboard Layout

- **Desktop**: Header (logo, search, notifications bell, profile menu), Sidebar (navigation menu), Content area
- **Mobile**: Header (logo, menu icon, notifications, profile), Bottom navigation (5 items with centered FAB), Content area
- **Tablet**: Collapsible sidebar, responsive header

### Dashboard Overview

- **KPI Cards**: My Tasks, Department Tasks, Overdue, Completed This Week (clickable)
- **Charts**: Status distribution (pie), Priority breakdown (bar), Timeline (line)
- **Activity Feed**: Real-time chronological feed with avatars, timestamps, actions
- **Upcoming Deadlines**: MuiDataGrid table with next 7 days tasks
- **Team Performance**: Manager/Admin only, comparison charts

### Tasks

- **List View (Cards)**: Tabs (All Tasks, Assigned to Me, Completed), MUI Cards in responsive Grid layout with task summaries, status badges, priority indicators, search bar, filter button, create button, view toggle, pagination
- **Grid View (MuiDataGrid)**: Tabular grid with columns (title, status, priority, assignees, due date), row selection checkboxes, action buttons, search bar, filter button, create button, view toggle, pagination
- **Filter Dialog**: Status, priority, type, date range, assignment, department, tags (union filters)
- **Create/Update Dialog**: Type selector, title, description, priority, tags, vendor (ProjectTask), assignees (AssignedTask), date (RoutineTask), materials (RoutineTask), watchers, dates
- **Detail Overview**: Task header, status, priority, type, dates, vendor/assignees, watchers, description, tags
- **Activities Tab**: Timeline with user avatars, timestamps, materials, attachments, expandable details
- **Comments Tab**: Threaded comments (max depth 5), @mentions, reply, edit, delete, attachments
- **Attachments Tab**: Gallery view with previews, download buttons, lightbox for images

### Users

- **List View (Cards)**: MUI Cards in responsive Grid layout with avatars, names, positions, departments, skills, role badges, status indicators, search bar, filter button, create button, view toggle, pagination
- **Grid View (MuiDataGrid)**: Tabular grid with columns (name, email, role, department, status), action buttons, search bar, filter button, create button, view toggle, pagination
- **Filter Dialog**: Role, department, status, joined date range, employee ID, include inactive
- **Create/Update Dialog**: First name, last name, position, email, phone, role, department, isHod, employee ID, joined date, date of birth, skills, profile picture
- **Detail Overview**: Profile header with avatar, contact info, role, department, employee ID, joined date, skills chart
- **Tasks Tab**: Tabs (Created, Assigned, Watching), task list with filters
- **Activity Tab**: Chronological feed of user actions
- **Performance Tab**: KPIs (completion rate, avg task time, throughput), comparison to dept averages, charts

### Departments

- **List View (Cards)**: MUI Cards in responsive Grid layout with manager info, member count, task count, status badges, search bar, filter button, create button, view toggle, pagination
- **Grid View (MuiDataGrid)**: Tabular grid with columns (name, description, HOD, member count), action buttons, search bar, filter button, create button, view toggle, pagination
- **Filter Dialog**: Status, manager, member count range, created date range, include deleted
- **Create/Update Dialog**: Name, description, status, manager selector
- **Detail Overview**: Department header, manager, stats (total users, total tasks, active tasks), description
- **Users Tab**: User list filtered by department
- **Tasks Tab**: Task list filtered by department
- **Activity Tab**: Chronological feed with filtering by entity type (Task, TaskActivity, TaskComment, Attachment)

### Materials

- **Grid View Only (MuiDataGrid)**: Tabular grid with columns (name + SKU, category, unit, unit price, created by), optional columns (inventory stock, low-stock indicators), action buttons, search bar, filter button, create button, pagination. NO list view/cards option.
- **Filter Dialog**: Category, status, low-stock toggle, date range, include deleted
- **Detail**: Material header, category, unit, price, stock info (on hand, reorder level, reorder quantity, last restocked), restock button, usage history

### Vendors

- **Grid View Only (MuiDataGrid)**: Tabular grid with columns (vendor name, contact info - email + phone, rating, projects - active/total, optional partner badge), action buttons (View/Edit/Delete/Restore), search bar, filter button, create button, pagination. NO list view/cards option.
- **Filter Dialog**: Status, rating, include deleted
- **Detail**: Vendor header, contact info, address, rating, description, linked projects

### Settings

- **Profile Tab**: Personal info, profile picture, skills, preferences (theme, date format, time format, timezone)
- **Account Tab**: Email, phone, password change
- **Security Tab**: Two-factor authentication toggle

## Kiro Configuration

```
.kiro/
├── specs/                          # Feature specifications
│   └── multi-tenant-task-manager/
│       ├── requirements.md         # User stories and acceptance criteria
│       ├── design.md               # Technical design
│       └── tasks.md                # Implementation tasks
└── steering/                       # Project steering rules
    ├── product.md                  # Product overview
    ├── tech.md                     # Tech stack and commands
    └── structure.md                # This file
```

## Key Conventions

### File Naming

- **Backend**: camelCase for files (e.g., `userController.js`)
- **Frontend**: PascalCase for components (e.g., `TaskList.jsx`), camelCase for utilities
- **Models**: PascalCase singular (e.g., `User.js`, `Task.js`)
- **Routes**: Plural lowercase (e.g., `/api/users`, `/api/tasks`)

### Component Organization

- **Feature-based**: Group by domain (task, user, department) not by type
- **Index files**: Export all components from a feature folder
- **Colocation**: Keep related files together (component, styles, tests if applicable)

### Import Conventions

- **ES modules**: Use `import/export` syntax
- **Absolute imports**: Configure path aliases in Vite for cleaner imports
- **Named exports**: Prefer named exports over default exports for utilities

### State Management

- **RTK Query**: API calls and caching
- **Redux slices**: UI state and user preferences
- **Redux Persist**: Persist auth state and user preferences
- **Local state**: Component-specific state with useState/useReducer

### Styling

- **MUI theme**: Use theme tokens for colors, spacing, typography
- **Emotion**: CSS-in-JS with styled components
- **Responsive**: Use MUI breakpoints (xs, sm, md, lg, xl)
- **No inline styles**: Use sx prop or styled components

### API Conventions

- **REST endpoints**: `/api/v1/resource` (v1 may be omitted in current implementation)
- **HTTP methods**: GET (read), POST (create), PUT (update), DELETE (soft delete), PATCH (restore)
- **Response format**: `{ success, data, message, error }`
- **Error codes**: Standard HTTP status codes with custom error messages
  - 400: VALIDATION_ERROR
  - 401: UNAUTHENTICATED_ERROR
  - 403: UNAUTHORIZED_ERROR
  - 404: NOT_FOUND_ERROR
  - 409: CONFLICT_ERROR (duplicate, inactive dept, insufficient stock, immutability, in use)
  - 429: RATE_LIMITED_ERROR
  - 500: INTERNAL_ERROR
- **Pagination**: Query params `?page=1&limit=20` (default 20 per page)
- **Filtering**: Query params `?status=TODO&priority=HIGH`
  - Union filters: `?status=TODO,IN_PROGRESS` (multiple values comma-separated)
  - Date ranges: `?dueDate[gte]=2024-01-15&dueDate[lte]=2024-01-21`
- **Sorting**: Query param `?sort=-createdAt` (- for descending, + or no prefix for ascending)
- **Search**: Query param `?search=keyword` (min 3 chars, debounced)
- **Include deleted**: Query param `?includeDeleted=true` (SuperAdmin only)
- **Include inactive**: Query param `?includeInactive=true` (for auditing)

### Socket.IO Conventions

- **Rooms**: `user:{userId}`, `org:{orgId}`, `dept:{deptId}`, `task:{taskId}`
- **Events**: `task:created`, `task:updated`, `task:deleted`, `task:activity:added`, `task:comment:added`, `notification`, `user:status:changed`
- **Authentication**: JWT token sent on connection via `auth` object
- **Reconnection**: Automatic with exponential backoff
- **Error Handling**: Connection errors, authentication failures, room join failures
- **Cache Integration**: Events trigger RTK Query cache updates via socketService

## Routing Structure

### Public Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - 4-step registration wizard
- `/verify-email` - Email verification page
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page

### Protected Routes (DashboardLayout)

- `/dashboard` - Dashboard overview
- `/dashboard/tasks` - Tasks list/grid
- `/dashboard/tasks/:taskId` - Task details
- `/dashboard/users` - Users list/grid
- `/dashboard/users/:userId` - User details
- `/dashboard/departments` - Departments list/grid
- `/dashboard/departments/:departmentId` - Department details
- `/dashboard/materials` - Materials list
- `/dashboard/materials/:materialId` - Material details
- `/dashboard/vendors` - Vendors list
- `/dashboard/vendors/:vendorId` - Vendor details
- `/dashboard/settings` - User settings (profile, account, security)
- `/dashboard/notifications` - Notifications page (optional)

### Route Guards

- **Public routes**: Redirect to dashboard if authenticated
- **Protected routes**: Redirect to login if not authenticated
- **Role-based access**: Check authorization matrix for each route
- **Verification check**: Block unverified users from protected routes

## Feature Flags & Conditional Rendering

### Role-Based UI Elements

- **SuperAdmin only**: Organization management, cross-org access, platform settings
- **SuperAdmin/Admin**: User creation, department creation, advanced filters
- **Manager/Admin**: Team performance widgets, department analytics
- **All roles**: Own profile, own tasks, notifications

### Status-Based Rendering

- **INACTIVE users**: Excluded from assignee/watcher pickers (unless includeInactive=true)
- **INACTIVE departments**: Excluded from department selectors, show warning badge
- **Soft-deleted resources**: Hidden by default, show with includeDeleted=true (SuperAdmin only)

### Task Type-Specific Fields

- **ProjectTask**: Vendor selector, watchers, activities allowed
- **AssignedTask**: Assignees selector (min 1, max 50), activities allowed
- **RoutineTask**: Date picker, materials selector (max 20), no activities

### Responsive Breakpoints

- **xs (0-599)**: Mobile layout, bottom nav, single column, stacked elements
- **sm (600-899)**: Tablet layout, collapsible sidebar, 2-column grids
- **md (900-1199)**: Desktop layout, full sidebar, 3-column grids
- **lg (1200-1535)**: Large desktop, expanded content, 4-column grids
- **xl (1536+)**: Extra large desktop, maximum width, 4+ column grids

## Data Flow Patterns

### Authentication Flow

1. User submits login credentials
2. Backend validates and returns JWT tokens (access + refresh) in HttpOnly cookies
3. Frontend stores user info in Redux (persisted)
4. Socket.IO connection established with JWT token
5. User joins rooms based on org/dept
6. Protected routes accessible

### Task Creation Flow

1. User opens create task dialog
2. Selects task type (ProjectTask, AssignedTask, RoutineTask)
3. Form shows type-specific fields
4. Frontend validates input (real-time)
5. User submits form
6. Backend validates, creates task, creates TaskActivity "Task created"
7. Backend creates notification, sends email (if configured)
8. Backend emits Socket.IO events (task:created, notification)
9. Frontend receives events, updates RTK Query cache
10. Task appears in list without refresh

### Real-Time Update Flow

1. User A creates/updates a resource
2. Backend emits Socket.IO event to relevant rooms
3. User B (in same room) receives event via socketService
4. socketService routes event to RTK Query cache update
5. UI automatically re-renders with new data
6. Optimistic updates for better UX

### File Upload Flow

1. User selects file (drag-and-drop or picker)
2. Frontend validates file type and size
3. Frontend uploads directly to Cloudinary
4. Cloudinary returns secure URL and publicId
5. Frontend sends fileUrl + metadata to backend
6. Backend creates Attachment record
7. Attachment linked to parent (task, activity, comment)

### Notification Flow

1. Backend creates notification record
2. Backend emits Socket.IO event to user room
3. Frontend receives event, updates notification count badge
4. User clicks bell icon, sees notification dropdown
5. User clicks notification, navigates to related resource
6. Frontend marks notification as read (PATCH request)
7. Badge count decreases

## Performance Optimizations

### Code Splitting

- Lazy load all page components
- Lazy load heavy components (charts, data grids)
- Dynamic imports for dialogs and modals

### Caching Strategy

- RTK Query automatic caching with tags
- Redux Persist for auth state and preferences
- Socket.IO events trigger cache invalidation
- Optimistic updates for immediate feedback

### Bundle Optimization

- Tree shaking for unused code
- Code splitting by route
- Vendor chunk separation
- Asset optimization (images, fonts)

### Network Optimization

- Debounced search (300ms)
- Pagination (20 items per page)
- Infinite scroll for feeds
- Request deduplication via RTK Query

### Rendering Optimization

- React.memo for expensive components
- useMemo for expensive computations
- useCallback for stable function references
- Virtual scrolling for long lists (MuiDataGrid)

## Testing Strategy

### Backend Testing (Mandatory)

Backend testing is mandatory and strictly controlled using plain JavaScript scripts only.

**Testing Approach**:

- Only plain JavaScript test scripts that execute real application code
- No testing frameworks or libraries (Jest, Mocha, Chai, Supertest, Vitest, Cypress are forbidden)
- Tests must be runnable with `node <script>`
- Tests must use real Mongoose models and the real database
- No mocking of business logic, models, services, or authorization rules
- Tests must simulate real backend behavior as exercised via Postman
- Tests must fail loudly using `throw`, `process.exit(1)`, or explicit assertions

**Test Organization**:

```
backend/
└── tests/                      # Plain JavaScript test scripts
    ├── validators/             # Validator tests
    │   ├── auth-validators.test.js
    │   ├── user-validators.test.js
    │   ├── task-validators.test.js
    │   └── ...
    ├── controllers/            # Controller tests
    │   ├── auth-controller.test.js
    │   ├── user-controller.test.js
    │   ├── task-controller.test.js
    │   └── ...
    ├── authorization/          # Authorization logic tests
    │   ├── rbac.test.js
    │   └── multi-tenant.test.js
    └── utils/                  # Test utilities
        ├── test-helpers.js     # Mock req/res builders
        └── test-data.js        # Test data generators
```

**What to Test**:

- Validators (using `.run(req)` and `validationResult(req)`)
- Controllers (invoked directly as functions)
- Authorization logic (RBAC, ownership, scoping)
- Multi-tenant isolation (org and dept boundaries)
- Soft delete and restore behavior
- Cascade delete operations
- Database side effects (create, update, delete)

**What NOT to Test**:

- UI components, styling, or framework internals
- Third-party libraries (Express, Mongoose, Socket.IO)
- Frontend code (no test frameworks allowed)

### Frontend Testing (Not Required)

Frontend testing is not required due to the constraint against test frameworks.

**Manual Testing Checklist**:

- Authentication flows (register, login, logout, password reset)
- RBAC authorization (all roles, all resources, all operations)
- Multi-tenancy isolation (cross-org access denied)
- Real-time updates (Socket.IO events)
- Form validation (frontend + backend alignment)
- Responsive design (all breakpoints)
- Accessibility (keyboard nav, screen readers, ARIA)
- Error handling (all error codes, user-friendly messages)
- Performance (load times, bundle size, network requests)

### Test Data Requirements

- Platform organization with SuperAdmin
- Multiple customer organizations
- Multiple departments per org (ACTIVE and INACTIVE)
- Multiple users per role (ACTIVE and INACTIVE)
- All task types with various statuses
- Materials with low stock scenarios
- Vendors with ratings
- Soft-deleted resources for restore testing
- Ownership scenarios (createdBy, assignees, watchers, mentions)
- Accessibility (keyboard nav, screen readers, ARIA)
- Error handling (all error codes, user-friendly messages)
- Performance (load times, bundle size, network requests)

### Test Data Requirements

- Platform organization with SuperAdmin
- Multiple customer organizations
- Multiple departments per org (ACTIVE and INACTIVE)
- Multiple users per role (ACTIVE and INACTIVE)
- All task types with various statuses
- Materials with low stock scenarios
- Vendors with ratings
- Soft-deleted resources for restore testing
- Ownership scenarios (createdBy, assignees, watchers, mentions)
