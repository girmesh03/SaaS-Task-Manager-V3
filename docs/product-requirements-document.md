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

- Components grouped by domain: common, layout, task, user, department, vendor, material, attachment, notification, dashboard.
- Pages: Home, Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound.
- State management: Redux store and feature slices using RTK Query.
- Hooks: useAuth, useSocket, useAuthorization, useTimezone, useResponsive.
- Services: socket service.
- Utilities: constants, validators, authorization helper, date utils.
- Theme: primitives and customizations.

Key technologies:

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Nodemailer, bcrypt, Winston.
- Frontend: React 19, Redux Toolkit, RTK Query, Redux Persist, Material UI v7, React Hook Form, Socket.IO client, Axios.

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
- Platform_SuperAdmin: SuperAdmin with isPlatformUser true, can access customer organizations.
- Customer_SuperAdmin: SuperAdmin with isPlatformUser false, access own organization only.
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
- No frontend usage of dayjs; use native Intl formatting.
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

- Creates Organization with isPlatformOrg: false.
- Creates Department linked to the organization.
- Creates User:
  - role: SuperAdmin
  - isHod: true
  - isPlatformOrgUser: false
  - joinedAt: now (not future)
  - employeeId auto-generated (example "0001")
- Updates Department manager to the created user.
- Updates Organization createdBy to the created user.
- Generates JWT access token (15 minutes) and refresh token (7 days).
- Auto-login and redirect to dashboard.
- Frontend stores auth state in Redux (auth slice) after registration.

Step 2 - Create additional departments:

- Create department with name, description, optional manager.
- Real-time update to organization users.

Step 3 - Create additional users:

- Create user with role, department, optional isHod (if role SuperAdmin/Admin).
- Auto-generate employeeId (example "0002").
- Hash password with bcrypt (>=12 rounds).
- Send welcome email.
- Create notification to creator.
- Update department manager if isHod is true.
- Welcome email sent via Nodemailer using Gmail SMTP.

Step 4 - Manage department managers:

- Update department manager to a SuperAdmin/Admin user with isHod true.
- Send notification to new manager.

### Journey 2: Project Task Creation (Jennifer)

Steps:

- Create ProjectTask with title, description, priority, tags, vendor, start and due dates.
- Watchers include creator (HOD users only).
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
- Upcoming deadlines table (next 7 days).
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
- When deleting a material or vendor, referenced tasks/activities must be handled safely via validation or cleanup.

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
- Allowed extensions: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3.
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

- Aggregation pipelines calculate metrics (status distribution, priority counts).
- Charts rendered with Recharts or Chart.js.
- Data cached in Redux for performance.
- Refresh button triggers manual data reload.
- Clicking a status slice filters tasks by that status.
- Clicking a priority bar filters tasks by that priority.

## 4.5 Notification UX Details

- Bell icon badge updates in real time.
- Bell icon pulses briefly when new notification arrives.
- Clicking notification navigates to related entity.
- Notification marked as read when opened.
- Badge count decreases when notifications are read.

## 5. Conflict Resolution Decisions (Canonical)

These resolutions are final and are applied consistently across this PRD:

1. Breakpoints:
   - xs: 0-599
   - sm: 600-899
   - md: 900-1199
   - lg: 1200-1535
   - xl: 1536+
   - Any prior references to 960/1280/1920 thresholds are mapped to md/lg/xl using these canonical values.
2. Bottom navigation:
   - Visible on xs and sm only (screen width < 900).
   - Items: Dashboard, Tasks, Users, Profile.
   - The Profile item opens a menu that includes Profile plus additional navigation (Departments, Materials, Vendors) to satisfy the "More" menu requirement without adding a fifth item.
3. Comment thread depth:
   - Maximum depth is 5 levels (depth 0-5).
   - Any prior references to max depth 3 are superseded by this rule.
4. Task filters:
   - Union of all filters across sources: status, priority, type, date ranges, department, assignment, tags, deleted toggle.
5. Authorization:
   - The canonical authorization matrix defines all permissions; high-level role summaries are descriptive only.

## 6. Functional Requirements (System SHALL Statements)

The system SHALL satisfy the following functional requirements.

### 6.1 Layout and Navigation

1. When a user accesses any protected page, the system shall display the DashboardLayout with Header, Sidebar, and main content area.
2. On xs and sm screens (width < 900), the system shall display a temporary drawer sidebar that opens on menu button click.
3. On md and larger screens (width >= 900), the system shall display a permanent sidebar that is always visible.
4. When a user clicks the menu icon on mobile, the system shall toggle the sidebar drawer open/closed.
5. When a user navigates to a different page on mobile, the system shall automatically close the sidebar drawer.
6. On xs and sm screens, the system shall display a bottom navigation bar with 4 navigation items and a centered FAB.
7. On md and larger screens, the system shall hide the bottom navigation bar.
8. The Header shall display the logo, organization switcher (Platform SuperAdmin only), notification bell, theme toggle, search, and user menu.
9. The Sidebar shall display department selector (HOD only), navigation menu items, and version number.
10. The main content area shall have proper spacing, overflow handling, and responsive padding.

### 6.2 Bottom Navigation (Mobile)

11. On xs and sm screens, the system shall display a bottom navigation bar fixed at the bottom of the screen.
12. The bottom navigation bar shall contain exactly 4 navigation items: Dashboard, Tasks, Users, Profile.
13. The bottom navigation bar shall have a centered FAB positioned absolutely in the middle.
14. The FAB shall display an Add icon and use the primary theme color.
15. When a user clicks a bottom navigation item, the system shall navigate to the corresponding page.
16. When a user clicks the FAB, the system shall open a dialog or menu for creating new items.
17. When a user clicks the Profile navigation item, the system shall open a menu with additional navigation options (Departments, Materials, Vendors) and profile actions.
18. The active navigation item shall be highlighted with the primary color.
19. The bottom navigation bar shall have a minimum height of 56px with proper touch targets (44x44px minimum).
20. On md and larger screens, the bottom navigation bar shall be hidden completely.

### 6.3 Tasks List

21. When a user navigates to /dashboard/tasks, the system shall display a list of tasks with pagination.
22. The system shall display task cards or data grid rows with title, status, priority, assignees, due date, and action buttons.
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
52. The system shall display vendor cards or data grid rows with name, email, phone, status, rating, and action buttons.
53. When a user types in the search field, the system shall filter vendors by name, email, or phone in real-time.
54. When a user clicks the filter button, the system shall display a collapsible filter panel with status, rating, and deleted toggle filters.
55. When a user applies filters, the system shall update the vendor list to show only matching vendors.
56. When a user clicks the "Create Vendor" button, the system shall open a dialog for creating a new vendor.
57. When a user clicks a vendor row or card, the system shall navigate to the vendor detail page.
58. When a user clicks the edit button on a vendor, the system shall open a dialog for editing the vendor.
59. When a user clicks the delete button on a vendor, the system shall show a confirmation dialog and soft delete the vendor on confirmation.
60. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted vendors from the list.
61. When a deleted vendor is displayed, the system shall show a "Restore" button instead of a "Delete" button.
62. When a user clicks the "Restore" button, the system shall restore the soft-deleted vendor.
63. The system shall display loading skeletons while fetching vendors.
64. When no vendors are found, the system shall display an empty state with a message and "Create Vendor" button.
65. When an API error occurs, the system shall display an error message with a retry button.
66. When a user navigates to /dashboard/vendors/:vendorId, the system shall display the vendor detail page.
67. The system shall display vendor overview section with name, email, phone, address, status, rating, and description.
68. The system shall display a related projects section with a list of ProjectTasks assigned to this vendor.
69. The system shall display a performance metrics section with completion rate, average rating, and total projects.
70. When a user clicks the "Edit" button, the system shall open a dialog for editing the vendor.
71. When a user clicks the "Delete" button, the system shall show a confirmation dialog and soft delete the vendor on confirmation.
72. When the vendor is deleted, the system shall show a "Restore" button instead of a "Delete" button.
73. When a user clicks the "Back" button, the system shall navigate back to the vendors list page.
74. The system shall display loading skeletons while fetching vendor details.
75. When the vendor is not found, the system shall display a 404 error message.
76. When an API error occurs, the system shall display an error message with a retry button.

### 6.6 Materials List and Detail

77. When a user navigates to /dashboard/materials, the system shall display a list of materials with pagination.
78. The system shall display material cards or data grid rows with name, category, quantity, unit, uploaded by, and action buttons.
79. When a user types in the search field, the system shall filter materials by name or category in real-time.
80. When a user clicks the filter button, the system shall display a collapsible filter panel with category, date range, and deleted toggle filters.
81. When a user applies filters, the system shall update the material list to show only matching materials.
82. When a user clicks the "Create Material" button, the system shall open a dialog for creating a new material.
83. When a user clicks a material row or card, the system shall navigate to the material detail page.
84. When a user clicks the edit button on a material, the system shall open a dialog for editing the material.
85. When a user clicks the delete button on a material, the system shall show a confirmation dialog and soft delete the material on confirmation.
86. When a user toggles the "Show Deleted" filter, the system shall include or exclude deleted materials from the list.
87. When a deleted material is displayed, the system shall show a "Restore" button instead of a "Delete" button.
88. When a user clicks the "Restore" button, the system shall restore the soft-deleted material.
89. The system shall display loading skeletons while fetching materials.
90. When no materials are found, the system shall display an empty state with a message and "Create Material" button.
91. When an API error occurs, the system shall display an error message with a retry button.
92. When a user navigates to /dashboard/materials/:materialId, the system shall display the material detail page.
93. The system shall display material overview section with name, category, quantity, unit, uploaded by, upload date, and attachments.
94. The system shall display a related activities section with a list of TaskActivities that used this material.
95. The system shall display a usage statistics section with total quantity used and number of activities.
96. When a user clicks the "Edit" button, the system shall open a dialog for editing the material.
97. When a user clicks the "Delete" button, the system shall show a confirmation dialog and soft delete the material on confirmation.
98. When the material is deleted, the system shall show a "Restore" button instead of a "Delete" button.
99. When a user clicks the "Back" button, the system shall navigate back to the materials list page.
100.  The system shall display loading skeletons while fetching material details.
101.  When the material is not found, the system shall display a 404 error message.
102.  When an API error occurs, the system shall display an error message with a retry button.

### 6.7 Users List and Detail

103. When a user navigates to /dashboard/users, the system shall display a list of users with pagination.
104. The system shall display user cards or data grid rows with name, email, role, department, status, and action buttons.
105. When a user types in the search field, the system shall filter users by name, email, or employee ID in real-time.
106. When a user clicks the filter button, the system shall display a collapsible filter panel with role, department, status, and deleted toggle filters.
107. When a user applies filters, the system shall update the user list to show only matching users.
108. When a user clicks the "Create User" button, the system shall open a dialog for creating a new user.
109. When a user clicks a user row or card, the system shall navigate to the user detail page.
110. When a user clicks the edit button on a user, the system shall open a dialog for editing the user.
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
132. The system shall display department cards or data grid rows with name, description, HOD, member count, and action buttons.
133. When a user types in the search field, the system shall filter departments by name or description in real-time.
134. When a user clicks the filter button, the system shall display a collapsible filter panel with organization and deleted toggle filters.
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
147. The system shall display department overview section with name, description, HOD, organization, and creation date.
148. The system shall display a members section with a list of users in this department.
149. The system shall display a tasks section with a list of tasks assigned to this department.
150. The system shall display a statistics section with total members, active tasks, completed tasks, and pending tasks.
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
174. When a user lacks permission to view a page, the system shall display a 403 Forbidden error page.
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
206. The system shall show the bottom navigation on xs and sm, hiding it on md+.
207. The system shall adjust data grid columns for mobile, hiding less important columns.
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
221. When a 403 error occurs, the system shall display a "Forbidden" message with a back button.
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
- organization: required (message "Organization is required"), ref Organization
- manager: optional ref User
- createdBy: ref User

### 7.3 User

- firstName: required (message "First name is required"), 2-50, pattern /^[a-zA-Z\\s\\-']+$/
- lastName: required (message "Last name is required"), 2-50, pattern /^[a-zA-Z\\s\\-']+$/
- position: required (message "Position is required"), 2-100, pattern /^[a-zA-Z\\s\\-']+$/
- email: required (message "Email is required"), max 100, pattern /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
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
- name must be unique per department
- unit: required (message "Unit is required"), 1-50
- category: required (message "Category is required"), enum Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other; default Other
- price: min 0, default 0
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
- organization: required (message "Organization is required"), ref Organization
- vendor is organization-scoped only (no department scoping)
- createdBy: required (message "Created by user is required"), ref User
- rating: min 1, max 5, default null
- address: optional, max 500

### 7.12 Attachment

- filename: required (message "File name is required"), 1-255
- fileUrl: required (message "File URL is required"), pattern /^https:\\/\\/res\\.cloudinary\\.com\\/[a-zA-Z0-9_-]+\\/image\\/upload\\/v\\d+\\/[a-zA-Z0-9_-]+\\.[a-zA-Z]+$/
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

### 10.1 Layout Definitions

#### PublicLayout

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

Right section:

- Container: flex, align-items center, gap 16px
- Theme toggle button (Brightness4Icon/Brightness7Icon)
- Login button (outlined, primary)
- Get Started button (contained, primary)
- Mobile menu icon (MenuIcon), visible only on mobile, opens drawer

Mobile menu drawer:

- Anchor right, width 280px
- Background background.paper
- Content: close button, navigation links, login button, get started button

Content wrapper:

- Min-height: calc(100vh - 64px)
- Background: background.default

#### DashboardLayout

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

Department selector:

- TextField select, label "Department", full width (HOD only)
- HOD users can switch between departments using this selector.

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

Bottom navigation (xs + sm only):

- Fixed bottom, height >= 56px
- Items: Dashboard, Tasks, Users, Profile
- Centered FAB positioned absolutely with AddIcon, color primary.main
- Active item highlighted with primary color
- FAB opens create menu
- Hidden on md+

### 10.2 Public Screens

#### Landing Page

Layout: PublicLayout

- Hero section: centered, min-height calc(100vh - 64px), gradient background from background.default to alpha(primary.main, 0.05).
- Headline: "Streamline Your Team's Workflow" (Typography h1).
- Subheadline: "The all-in-one task management platform..." (Typography h5).
- CTA buttons: "Start Free Trial" (contained) and "Watch Demo" (outlined).
- Features section: background background.paper, title "Powerful Features", subtitle, 6 feature cards grid (3 desktop, 2 tablet, 1 mobile).
- Features subtitle: "Everything you need to manage tasks efficiently".
- How It Works section: background background.default, title "How It Works", stepper with 4 steps (horizontal desktop, vertical mobile).
- Footer: background alpha(grey[900], 0.05) light or alpha(grey[800], 0.5) dark, logo, copyright, quick links, social icons.

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
- Required Terms checkbox.
- Terms checkbox is required to submit.
- Submit button with loading state.
- Submit button: contained, primary, CheckCircleIcon.
- Success state: check icon, "Account Created Successfully", auto redirect after 3 seconds.

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

- Page header: title, welcome message with first name, date range picker, refresh button.
- Refresh button uses RefreshIcon.
- Metrics cards: My Tasks, Department Tasks, Overdue, Completed This Week.
- My Tasks includes tasks where the user is creator, assignee, or watcher.
- Metrics card icons: AssignmentIcon (My Tasks), GroupsIcon (Department Tasks), WarningIcon (Overdue), CheckCircleIcon (Completed This Week).
- Charts: status distribution (pie), priority breakdown (bar).
- Tasks timeline chart shows creation and completion trends over time.
- Status distribution includes TODO, IN_PROGRESS, COMPLETED, PENDING.
- Priority breakdown includes URGENT, HIGH, MEDIUM, LOW.
- Recent activity feed (real-time).
- Recent activity shows last 10 items with user avatar, description, timestamp.
- Upcoming deadlines table (next 7 days).
- Upcoming deadlines columns: Task Title, Assignee, Due Date, Priority, Status, Actions.
- Upcoming deadlines sorted by due date, pagination 10 per page.
- Team performance (Manager/Admin only).
- Team performance metrics: active tasks count, completed tasks this week, average completion time, workload indicator (Low/Medium/High).
- Mobile FAB (create task menu).

#### Departments

- Header: Title, subtitle, search, view toggle, create button (SuperAdmin only).
- Filter bar with chips and clear all.
- Grid view: cards with BusinessIcon avatar, name, description, manager, stats, created date, view button.
- List view: DataGrid with columns (Name, Description, Manager, Users Count, Tasks Count, Created Date, Actions), pagination 10 rows.
- Empty state with icon and message.
- Create/Edit dialog: Name, Description, Manager (optional).

#### Department Details

- Breadcrumbs: Dashboard > Departments > Department Name.
- Header card: BusinessIcon (48px), name, description, created date, manager card (avatar, name, email), stats (total users, total tasks, active tasks).
- Tabs: Overview, Users, Tasks, Activity.
- Overview: quick stats, recent tasks, performance chart, upcoming deadlines.
- Users tab: grid or DataGrid with Name, Position, Role, Email, Joined Date, Actions.
- Tasks tab: list filtered by department.
- Activity tab: timeline of department activities.

#### Users

- Header: Title, subtitle, search, view toggle, create button (SuperAdmin only).
- Filters: Department (multi-select), Role (SuperAdmin/Admin/Manager/User), Status (Active/Inactive).
- Grid view: user cards with avatar (64px), name, position, role badge, department, email, joined date.
- List view: DataGrid columns (User, Position, Role, Department, Joined Date, Last Login, Status, Actions).
- Role badge colors: SuperAdmin error.main, Admin warning.main, Manager info.main, User success.main.
- Create/Edit dialog: personal info, account info, additional info.

#### User Details

- Profile header: large avatar (96px), name, position, role badge, department, contact info, joined date.
- Tabs: Overview, Tasks, Activity, Performance.
- Overview: personal info, skills progress, recent activity, task stats.
- Tasks: assigned tasks, created tasks, watching tasks, filter by status.

#### User Profile & Settings

- Tabs: Profile, Account Settings, Notifications, Appearance.
- Profile: picture upload, personal info form, skills editor.
- Account settings: change password, two-factor toggle.
- Notifications: email and in-app preferences, browser notification toggle.
- Appearance: theme (light/dark/system), language, date/time format.

#### Tasks

- Header: Title, subtitle, search, filter button, create task button.
- Task type selector: Project Task (BusinessCenterIcon), Assigned Task (AssignmentIndIcon), Routine Task (RepeatIcon).
- Filter drawer: anchor right, width 320, status, priority, task type, date range, assignment, tags, deleted toggle.
- Active filter chips with remove icons and Clear All.
- Grid view: task cards with priority indicator (colored left border), type icon badge, title, description, status badge, assignees avatars, due date, tags, actions menu.
- List view: DataGrid columns (Title, Type, Status, Priority, Assignees, Due Date, Department, Actions).
- Create task dialog (dynamic by type):
  - Common fields: Title, Description, Priority, Tags, Attachments, Watchers.
  - Watchers are HOD users only and auto-include the creator.
  - Project Task: Vendor, Start Date, Due Date.
  - Assigned Task: Assignees, Start Date, Due Date.
  - Routine Task: Date, Materials.

#### Task Details

- Breadcrumb: Dashboard > Tasks > Task Title.
- Header card: title with priority indicator, status badge (clickable if permitted), type badge, actions (Edit, Delete, Complete, Watch/Unwatch).
- Info grid: created by, created date, department, due date with overdue warning, assignees (AssignedTask), vendor (ProjectTask), date (RoutineTask), watchers list.
- Tabs: Overview, Activities (Project/Assigned only), Comments, Attachments.
- Overview: description, tags, materials (RoutineTask), timeline of status changes.
- Activities: timeline newest first, each with user, text, timestamp, materials, attachments; add activity button; auto-scroll to new activity.
- Comments: input with @mention support, threaded max depth 5, reply/edit/delete, attachments; highlight mentioned comment when navigated from notification.
- Attachments: dropzone, grid of previews, filename, file size, uploaded by, download, delete.

#### Materials

- Header: Title, subtitle, search, category filter, create button (Manager/Admin/SuperAdmin).
- DataGrid columns: Name, Category, Unit, Price, Created By, Created Date, Usage Count, Actions.
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
- Create/Edit dialog: Name, Unit, Category, Price (optional).

#### Material Details

- Header card: category icon, name, category badge, unit, price, created by/date.
- Usage stats: total times used, total quantity used, associated tasks count.
- Associated tasks list: Task, Type, Date, Quantity Used.
- Attachments section shows uploaded files and download links.

#### Vendors

- Header: Title, subtitle, search, rating filter, create button (Admin/SuperAdmin).
- DataGrid columns: Name, Email, Phone, Rating, Address, Projects Count, Created By, Actions.
- Pagination 10 rows, multi-column sorting.
- Rating display: read-only, precision 0.5, size small.
- Create/Edit dialog: Name, Email, Phone, Address (optional), Rating (optional).

#### Vendor Details

- Header card: icon, name, rating stars, contact info, address.
- Performance metrics: total projects, completed projects, in-progress projects, completion rate, average rating, average project duration.
- Projects list: ProjectTask list with status, start date, due date, department.

## 11. Responsive Behavior and Breakpoints

Canonical breakpoints:

- xs: 0-599
- sm: 600-899
- md: 900-1199
- lg: 1200-1535
- xl: 1536+

Layout adaptation:

- xs: single column, stacked elements, bottom nav visible.
- sm: two columns where appropriate, bottom nav visible.
- md: two or three columns, permanent sidebar visible, bottom nav hidden.
- lg/xl: three or more columns with max width constraints.

Additional responsive rules:

- Sidebar hidden on xs/sm; drawer used instead.
- Data grids hide less important columns on small screens.
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
- Allowed extensions: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3.
- File types: Image, Document, Video, Audio, Other.
- Attachments can be linked to Task, TaskActivity, or TaskComment only.

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
- 404 and 403 pages include a back button.

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
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

Users:

- GET /api/users
- POST /api/users
- GET /api/users/:userId
- PUT /api/users/:userId
- DELETE /api/users/:userId
- PATCH /api/users/:userId/restore

Departments:

- GET /api/departments
- POST /api/departments
- GET /api/departments/:departmentId
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
- PUT /api/materials/:materialId
- DELETE /api/materials/:materialId
- PATCH /api/materials/:materialId/restore

Vendors:

- GET /api/vendors
- POST /api/vendors
- GET /api/vendors/:vendorId
- PUT /api/vendors/:vendorId
- DELETE /api/vendors/:vendorId
- PATCH /api/vendors/:vendorId/restore

Notifications:

- GET /api/notifications
- PUT /api/notifications/:notificationId/read
- DELETE /api/notifications/:notificationId

Dashboard:

- GET /api/dashboard/overview (counts and KPI aggregates such as open tasks, overdue tasks, active users, pending approvals; also returns chart-ready data)

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
  "error": {},
  "details": []
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

Timezone management:

- Backend stores UTC, uses dayjs with UTC plugin.
- Frontend uses native Intl.DateTimeFormat for all formatting.
- API responses use ISO 8601 UTC.
- Frontend must never use dayjs.

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

## 21. Execution Protocol (Mandatory 7 Steps)

Step 1: Pre-Git Requirement

- Run git status
- Run git branch -vv
- Run git fetch origin
- If uncommitted changes:
  - Stay on current branch
  - git add .
  - git commit -m "descriptive commit message"
  - git push origin <current-branch>
  - git checkout main
  - git merge <feature-branch>
  - git push origin main
  - git branch -d <feature-branch>
  - git push origin --delete <feature-branch>
  - Think twice before acting; verify branch names and merge targets
- If local branch behind: git pull origin <branch>
- If merge conflicts: HALT immediately and prompt user to resolve conflicts
- Create feature branch: git checkout -b <descriptive-branch-name> (example: feature/task-2-auth-state-management)
- Use clear, descriptive branch names matching task number and description
- Verify clean state: git status and confirm correct branch
- Proceed to Step 2 only after verification

Step 2: Comprehensive Codebase Analysis
Backend analysis:

- Configuration: allowed origins, authorization matrix, CORS options, DB config.
- Error handling: custom error class, error controller.
- Validators: auth, organization, department, user, task, task activity, task comment, material, vendor, notification, validation middleware.
- Middlewares: auth, authorization, rate limiter.
- Models: Organization, Department, User, Task, ProjectTask, AssignedTask, RoutineTask, TaskActivity, TaskComment, Material, Vendor, Notification, Attachment, soft delete plugin.
- Routes: auth, organization, department, user, task, task activity, task comment, material, vendor, notification, plus a route registry/aggregator.
- Services: email, notification.
- Utils: constants module, logging utility, helper utilities, token generation, authorization matrix utility, environment validation, socket instance/emitter, user status tracking.
- App entry points: application bootstrap and server entry point.

Frontend analysis:

- Redux store and feature slices with RTK Query endpoints.
- Components: reusable, common, error boundary, route error, layout, auth, department, user, task, task activity, task comment, material, vendor, attachment, notification, dashboard.
- Pages: Home, Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound.
- Services: socket service and event definitions.
- Hooks: useAuth, useSocket, useAuthorization, useTimezone, useResponsive.
- Utils: constants (must match backend), date utils, authorization helper, validators.
- Theme: customizations and theme primitives.
- Dependencies: validate installed packages and versions.

Step 3: Analyze Previously Implemented Tasks (N-1)

- Identify completed tasks.
- List files created and patterns used.
- Verify naming conventions, validation, state management, and styling patterns.
- Ensure constants usage, timezone handling, soft delete compliance.
- Identify gaps and dependencies.

Step 4: Task Execution Without Deviation

- Implement strictly according to requirements, designs, and constraints.
- Mandatory compliance areas:
  - Backend: routes and HTTP methods; validators and field constraints; models and schema structures; shared constants module.
  - Frontend: shared constants mirroring backend; utilities; components; hooks; redux state and RTK Query endpoints; services; theme system and customizations.
- Implementation rules:
  - Validation alignment with backend validators.
  - Soft delete compliance (restore flows, deleted toggle, show Restore, hide Delete for deleted).
  - Authorization checks using useAuthorization and UI gating.
  - API integration via RTK Query with cache invalidation and loading states.
  - Component patterns: react-hook-form Controller, Mui prefix wrappers, React.memo for Card components, useCallback/useMemo.
  - Styling consistency: theme tokens, responsive breakpoints, MUI v7 Grid size prop.
  - Testing readiness: clean, testable code, avoid side effects in render.
- Implementation verification checklist:
  - UI specifications match established patterns.
  - Files created/modified follow established patterns.
  - Validation rules match backend exactly.
  - All dates use timezone conversion functions.
  - Soft delete rules are followed.
  - Authorization checks are implemented.
  - Constants are imported (none hardcoded).
  - API endpoints use RTK Query.
  - All forms use react-hook-form Controller.
  - MUI components use Mui prefix wrappers.
  - Styling uses theme customizations.
  - Code follows established patterns from previous tasks.

Step 5: Backend Testing (backend changes only)

- Execute validators and controllers directly in scripts.
- Assert authorization, ownership, and scoping.
- Verify DB side effects.
- Halt on failures and fix.

Step 6: User Review

- Summarize implementation, list files changed, note decisions.
- Request explicit approval.
- Apply feedback until approved.
- Ensure user explicitly approves before proceeding to post-git steps.
- Get clear go-ahead for git operations.

Step 7: Post-Git Requirement

- Verify current state: git status, git branch -vv, git fetch origin
- Review changes: git diff
- Stage and commit: git add ., git status, git commit -m "feat: [Task N] Descriptive task title and summary"
- Push feature branch: git push origin <feature-branch>
- Confirm remote branch exists: git branch -r
- Checkout base branch: git checkout main, git pull origin main
- Think twice before merging; verify correct base branch
- Merge: git merge <feature-branch> (HALT immediately on conflicts)
- Verify merge: git log --oneline -5
- Push merged changes: git push origin main
- Confirm remote updated: git log origin/main --oneline -5
- Verify fully merged: git branch --merged
- Delete feature branch locally and remotely: git branch -d <feature-branch>, git push origin --delete <feature-branch>
- Final sync verification: git status, git branch -vv, git log --oneline -5
- Cleanup verification: git branch -a, git status, git branch

Protocol enforcement:

- No shortcuts; no exceptions; all seven steps must be completed in order.
- Each step must be verified before proceeding.
- User approval required before post-git step.
- Failure to follow results in inconsistent implementations, git conflicts, validation mismatches, timezone errors, soft delete violations, and authorization bypass risks.
- Success ensures clean git history, consistent quality, exact alignment, maintainability, predictable behavior, and secure implementation.

## 22. Phased Delivery Plan (Backend -> Frontend)

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

## 23. Acceptance Criteria and Traceability Checklist

- All requirements in sections 6-22 are implemented without omissions.
- All validation rules and regex patterns are enforced.
- All authorization rules follow the canonical matrix.
- Multi-tenant isolation is enforced (org + dept scope).
- Soft delete and restore work for all resources and cascades.
- Real-time updates function for tasks, activities, comments, and notifications.
- UI screens and layouts match specified requirements.
- Breakpoints, bottom nav, and comment depth follow canonical decisions.
- Security requirements (JWT, bcrypt, rate limiting, CSP, CORS) are implemented.
- Testing uses plain JS scripts and meets strict validator/controller rules.
- Error handling and feedback components are consistent.
- No deprecated MUI APIs or non-tree-shakable imports.
- No hardcoded constants; single source of truth used across backend and frontend.
