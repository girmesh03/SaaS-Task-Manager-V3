# Design Document: Multi-Tenant Task Manager

## Overview

This design document specifies the technical architecture for an enterprise-grade, multi-tenant SaaS task management system built with the MERN stack (MongoDB, Express, React, Node.js). The system supports hierarchical organizational structures (Organization → Department → User) with strict data isolation, role-based access control (RBAC), three distinct task types (ProjectTask, AssignedTask, RoutineTask), real-time collaboration via Socket.IO, and comprehensive materials and vendor tracking.

### System Architecture

The system follows a layered architecture pattern:

**Backend (Node.js + Express + MongoDB)**:

- Routes → Authentication Middleware → Validation Middleware → Authorization Middleware → Controllers → Services → Models → Database

**Frontend (React + Redux Toolkit + Material UI)**:

- Components (feature-based) → Redux Store (RTK Query + Slices) → Services (API + Socket.IO) → Backend API

**Real-Time Layer (Socket.IO)**:

- Bidirectional event-driven communication with room-based broadcasting and JWT authentication

### Technology Stack

**Backend**:

- Runtime: Node.js with ES modules
- Framework: Express.js 4.21.2
- Database: MongoDB with Mongoose 8.19.1
- Authentication: JWT (jsonwebtoken 9.0.2) with refresh token rotation, HttpOnly cookies
- Security: bcrypt 6.0.0 (>=12 rounds), helmet 8.1.0, express-rate-limit 8.1.0, express-mongo-sanitize 2.2.0
- Validation: express-validator 7.2.1
- Real-Time: Socket.IO 4.8.1
- Email: Nodemailer 7.0.9 (Gmail SMTP)
- Logging: Winston 3.18.3

**Frontend**:

- Framework: React 19.2.0 with React DOM 19.2.0
- Build Tool: Vite 7.2.4 with @vitejs/plugin-react-swc 4.2.2
- State Management: Redux Toolkit 2.11.2, RTK Query, react-redux 9.2.0, redux-persist 6.0.0
- UI Library: Material UI 7.3.7 with @mui/icons-material, @mui/x-data-grid, @mui/x-charts, @mui/x-date-pickers
- Routing: react-router 7.13.0
- Forms: react-hook-form 7.71.1 (no watch() usage)
- HTTP Client: axios 1.13.4
- Real-Time: socket.io-client 4.8.3
- File Upload: react-dropzone 14.4.0, Cloudinary (external service)
- Notifications: react-toastify 11.0.5

## Architecture

### Backend Layered Architecture

The backend follows a strict layered architecture with clear separation of concerns:

```
HTTP Request
    ↓
Routes (endpoint definitions)
    ↓
Authentication Middleware (JWT verification)
    ↓
Validation Middleware (express-validator schemas)
    ↓
Authorization Middleware (RBAC checks via authorization matrix)
    ↓
Controllers (business logic, orchestration)
    ↓
Services (external services: email, socket, file storage)
    ↓
Models (Mongoose schemas, data access)
    ↓
MongoDB (data persistence)
```

**Layer Responsibilities**:

1. **Routes**: Define HTTP endpoints, apply middleware chain, map to controllers
2. **Authentication Middleware**: Verify JWT tokens, extract user context, handle token expiration
3. **Validation Middleware**: Validate request body/params/query using express-validator, sanitize inputs
4. **Authorization Middleware**: Check RBAC permissions using authorization matrix, enforce multi-tenant isolation
5. **Controllers**: Orchestrate business logic, call services, handle transactions, format responses
6. **Services**: Interact with external systems (Nodemailer, Socket.IO, Cloudinary)
7. **Models**: Define Mongoose schemas, implement virtuals/hooks, handle database operations

### Frontend Architecture

The frontend follows a feature-based component structure with Redux Toolkit for state management:

```
src/
├── components/          # Feature-based components
│   ├── common/          # Shared UI components (ErrorBoundary, LoadingSkeleton, EmptyState, ConfirmDialog)
│   ├── layouts/         # Layout wrappers (DashboardLayout, PublicLayout)
│   ├── reusable/        # Reusable MUI wrappers (MuiDataGrid, MuiLoading)
│   ├── columns/         # DataGrid column definitions per resource
│   ├── task/            # Task-related components
│   ├── user/            # User management components
│   ├── department/      # Department components
│   ├── material/        # Material components
│   ├── vendor/          # Vendor components
│   ├── attachment/      # File attachment components
│   ├── notification/    # Notification components
│   └── dashboard/       # Dashboard widgets
├── pages/               # Route pages
├── store/               # Redux store configuration
│   ├── index.js         # Store setup with redux-persist
│   └── slices/          # Feature slices (authSlice, taskSlice, etc.)
├── services/            # API and Socket.IO services
│   ├── api.js           # RTK Query API setup with all endpoints
│   └── socketService.js # Socket.IO client with event handlers
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── router/              # Routing configuration
└── theme/               # MUI theme configuration
```

**State Management Strategy**:

- **RTK Query**: API calls, caching, optimistic updates
- **Redux Slices**: UI state (filters, modals, preferences)
- **Redux Persist**: Persist auth state and user preferences
- **Socket.IO Integration**: Events route to RTK Query cache updates via socketService

### Multi-Tenant Data Isolation

The system implements strict multi-tenant data isolation at two levels:

**Organization-Level Isolation**:

- All resources (except platform organization) are scoped to a single organization
- Non-platform users can only access resources within their own organization
- Platform SuperAdmins can access customer organizations based on authorization matrix

**Department-Level Isolation**:

- Resources like Tasks, Materials, Users are scoped to both organization AND department
- Managers and Users can only access resources within their own department
- Admins can access resources across departments within their organization

**Implementation Pattern**:

```javascript
// Organization-level query
const query = {
  organization: req.user.organization,
  isDeleted: false,
};

// Department-level query
const query = {
  organization: req.user.organization,
  department: req.user.department,
  isDeleted: false,
};

// Cross-org access (Platform SuperAdmin only)
if (req.user.isPlatformOrgUser && req.user.role === "SuperAdmin") {
  // Allow cross-org access per authorization matrix
  delete query.organization;
}
```

## Data Models

### Organization Schema

```javascript
{
  name: String (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/, required),
  email: String (valid email, max 100 chars, unique, required),
  phone: String (pattern: /^(\+251\d{9}|0\d{9})$/, required),
  address: String (5-500 chars, required),
  industry: String (enum, required),
  size: String (enum: Small|Medium|Large, required),
  description: String (max 1000 chars, optional),
  logo: {
    url: String (Cloudinary URL pattern, optional),
    publicId: String (max 255 chars, optional)
  },
  isPlatformOrg: Boolean (default: false, immutable),
  isVerified: Boolean (default: false),
  verifiedAt: Date (optional),
  createdBy: ObjectId (ref: User, optional initially),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ email: 1 }` unique
- `{ isPlatformOrg: 1 }`
- `{ isDeleted: 1 }`

**Virtuals**:

- `departments`: Virtual populate to Department collection
- `users`: Virtual populate to User collection

**Hooks**:

- Pre-save: Validate email uniqueness
- Post-save: Emit socket event for organization updates
- Pre-delete: Prevent deletion if isPlatformOrg=true

### Department Schema

```javascript
{
  name: String (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/, required),
  description: String (max 500 chars, required),
  status: String (enum: ACTIVE|INACTIVE, default: ACTIVE),
  manager: ObjectId (ref: User, optional),
  organization: ObjectId (ref: Organization, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ organization: 1, name: 1 }` unique (case-insensitive)
- `{ organization: 1, status: 1 }`
- `{ organization: 1, isDeleted: 1 }`
- `{ manager: 1 }`

**Virtuals**:

- `users`: Virtual populate to User collection
- `tasks`: Virtual populate to Task collection
- `materials`: Virtual populate to Material collection
- `memberCount`: Count of active users in department
- `taskCount`: Count of tasks in department
- `activeTaskCount`: Count of non-completed tasks

**Hooks**:

- Post-save: Emit socket event for department updates
- Pre-delete (soft): Cascade soft-delete to users, tasks, materials, activities, comments, attachments, notifications

### User Schema

```javascript
{
  firstName: String (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/, required),
  lastName: String (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/, required),
  position: String (2-100 chars, pattern: /^[a-zA-Z\s\-']+$/, required),
  email: String (valid email, max 100 chars, required),
  password: String (bcrypt hash, required),
  phone: String (pattern: /^(\+251\d{9}|0\d{9})$/, optional),
  role: String (enum: SuperAdmin|Admin|Manager|User, required),
  status: String (enum: ACTIVE|INACTIVE, default: ACTIVE),
  department: ObjectId (ref: Department, required, immutable for Admin/Manager/User),
  organization: ObjectId (ref: Organization, required),
  isHod: Boolean (default: false, immutable for Admin/Manager/User),
  employeeId: String (pattern: /^(?!0000)\d{4}$/, unique per org, auto-generated, immutable),
  joinedAt: Date (required, not future, immutable for Admin/Manager/User),
  dateOfBirth: Date (optional, not future),
  skills: [{
    skill: String (max 50 chars),
    percentage: Number (0-100)
  }] (max 10 items),
  profilePicture: {
    url: String (Cloudinary URL pattern, optional),
    publicId: String (max 255 chars, optional)
  },
  preferences: {
    themeMode: String (enum: light|dark|system, default: system),
    dateFormat: String (enum: MM/DD/YYYY|DD/MM/YYYY|YYYY-MM-DD, default: MM/DD/YYYY),
    timeFormat: String (enum: 12h|24h, default: 12h),
    timezone: String (default: Africa/Addis_Ababa)
  },
  security: {
    twoFactorEnabled: Boolean (default: false)
  },
  isPlatformOrgUser: Boolean (default: false, immutable),
  isVerified: Boolean (default: false),
  emailVerifiedAt: Date (optional),
  verificationToken: String (optional),
  verificationTokenExpiry: Date (optional),
  passwordResetToken: String (optional),
  passwordResetExpiry: Date (optional),
  createdBy: ObjectId (ref: User, optional),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ organization: 1, email: 1 }` unique
- `{ organization: 1, employeeId: 1 }` unique
- `{ organization: 1, department: 1, status: 1 }`
- `{ organization: 1, role: 1 }`
- `{ verificationToken: 1 }` sparse
- `{ passwordResetToken: 1 }` sparse
- `{ isDeleted: 1 }`

**Virtuals**:

- `fullName`: Computed from firstName + lastName
- `createdTasks`: Virtual populate to Task collection (createdBy)
- `assignedTasks`: Virtual populate to Task collection (assignees)
- `watchingTasks`: Virtual populate to Task collection (watchers)

**Hooks**:

- Pre-save: Hash password if modified, auto-generate employeeId if not provided
- Post-save: Emit socket event for user updates
- Pre-delete (soft): Cascade soft-delete to tasks, activities, comments, attachments, notifications, remove from watchers/assignees/mentions

**Immutability Rules (CAN-016)**:

- For Admin/Manager/User targets: department, role, employeeId, joinedAt, isHod are immutable
- Attempts to modify these fields return 409 CONFLICT_ERROR
- SuperAdmin targets have no immutability restrictions

### Task Schema (Base with Discriminators)

**Base Task Schema**:

```javascript
{
  type: String (enum: ProjectTask|AssignedTask|RoutineTask, required, immutable),
  title: String (3-200 chars, required),
  description: String (10-5000 chars, required),
  status: String (enum: TODO|IN_PROGRESS|COMPLETED|PENDING, required),
  priority: String (enum: LOW|MEDIUM|HIGH|URGENT, required),
  tags: [String] (max 5, each max 50 chars, lowercase, unique case-insensitive),
  watchers: [ObjectId] (ref: User, active users in same org+dept),
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**ProjectTask Discriminator** (extends Base Task):

```javascript
{
  vendor: ObjectId (ref: Vendor, required, active vendor in same org),
  startDate: Date (required),
  dueDate: Date (required, must be after startDate)
}
```

**AssignedTask Discriminator** (extends Base Task):

```javascript
{
  assignees: [ObjectId] (ref: User, min 1, max 50, active users in same org),
  startDate: Date (required),
  dueDate: Date (required, must be after startDate)
}
```

**RoutineTask Discriminator** (extends Base Task):

```javascript
{
  date: Date (required, specific date for routine task),
  materials: [{
    material: ObjectId (ref: Material, required),
    quantity: Number (min 1, required)
  }] (max 20 items, unique by materialId, embedded subdocuments)
}
```

**Indexes**:

- `{ organization: 1, department: 1, status: 1 }`
- `{ organization: 1, department: 1, type: 1 }`
- `{ organization: 1, department: 1, priority: 1 }`
- `{ organization: 1, department: 1, createdBy: 1 }`
- `{ organization: 1, department: 1, dueDate: 1 }` (ProjectTask, AssignedTask)
- `{ organization: 1, department: 1, date: 1 }` (RoutineTask)
- `{ assignees: 1 }` (AssignedTask)
- `{ watchers: 1 }` (ProjectTask)
- `{ vendor: 1 }` (ProjectTask)
- `{ isDeleted: 1 }`
- Text index: `{ title: 'text', description: 'text' }`

**Virtuals**:

- `activities`: Virtual populate to TaskActivity collection (ProjectTask, AssignedTask only)
- `comments`: Virtual populate to TaskComment collection
- `attachments`: Virtual populate to Attachment collection

**Hooks**:

- Pre-save: Validate dueDate > startDate, normalize tags to lowercase, validate watchers/assignees are active
- Post-save: Create initial TaskActivity "Task created" (ProjectTask, AssignedTask only), emit socket events, create notifications
- Pre-delete (soft): Cascade soft-delete to activities, comments, attachments, notifications; for RoutineTask, restore material stock

**Business Rules**:

- TaskActivity creation is ONLY allowed for ProjectTask and AssignedTask
- TaskActivity creation is FORBIDDEN for RoutineTask (returns 409 CONFLICT_ERROR)
- RoutineTask materials are embedded directly in the task document
- Material stock is decremented atomically on RoutineTask creation
- Material stock is restored on RoutineTask soft-delete

### TaskActivity Schema

```javascript
{
  parent: ObjectId (required, polymorphic ref),
  parentModel: String (enum: Task|TaskActivity|TaskComment, required),
  activity: String (2-1000 chars, required),
  materials: [{
    material: ObjectId (ref: Material, required),
    quantity: Number (min 1, required)
  }] (max 20 items, unique by materialId, embedded subdocuments),
  attachments: [ObjectId] (ref: Attachment, max 20),
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ parent: 1, parentModel: 1 }`
- `{ organization: 1, department: 1 }`
- `{ createdBy: 1 }`
- `{ isDeleted: 1 }`

**Hooks**:

- Pre-save: Validate parent exists and belongs to same org+dept, decrement material stock atomically
- Post-save: Emit socket event task:activity:added, create notifications
- Pre-delete (soft): Restore material stock, cascade soft-delete to comments and attachments

**Business Rules**:

- parentModel=Task requires parent to be ProjectTask or AssignedTask (NOT RoutineTask)
- parentModel=TaskActivity or TaskComment requires parent to belong to the same task as the route taskId
- Material stock is decremented atomically in the same database session
- If material stock would go below 0, return 409 CONFLICT_ERROR and reject the operation

### TaskComment Schema

```javascript
{
  parent: ObjectId (required, polymorphic ref),
  parentModel: String (enum: Task|TaskActivity|TaskComment, required),
  comment: String (2-2000 chars, required),
  mentions: [ObjectId] (ref: User, max 20, active users in same org),
  depth: Number (0-5, required),
  attachments: [ObjectId] (ref: Attachment),
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ parent: 1, parentModel: 1 }`
- `{ organization: 1, department: 1 }`
- `{ createdBy: 1 }`
- `{ mentions: 1 }`
- `{ isDeleted: 1 }`

**Hooks**:

- Pre-save: Parse @mentions from comment text, validate mentioned users are active and in same org, calculate depth from parent
- Post-save: Emit socket event task:comment:added, create notifications for mentioned users
- Pre-delete (soft): Cascade soft-delete to nested comments (recursive), attachments, and notifications

**Business Rules**:

- Maximum comment depth is 5 (replies beyond depth 5 return 400 VALIDATION_ERROR)
- Mentions are parsed from @username patterns in comment text
- Mentioned users must belong to the same organization
- parentModel=Task requires parent to equal the taskId in the route
- parentModel=TaskActivity or TaskComment requires parent to belong to the same task as the route taskId

### Material Schema

```javascript
{
  name: String (2-200 chars, required, unique per department case-insensitive),
  sku: String (pattern: /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, stored uppercase, unique per department case-insensitive, required),
  status: String (enum: ACTIVE|INACTIVE, default: ACTIVE),
  description: String (max 1000 chars, optional),
  unit: String (1-50 chars, required),
  category: String (enum, required),
  price: Number (min 0, optional),
  inventory: {
    stockOnHand: Number (min 0, default: 0, required),
    lowStockThreshold: Number (min 0, default: 0, required),
    reorderQuantity: Number (min 0, default: 0, optional),
    lastRestockedAt: Date (optional)
  },
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ organization: 1, department: 1, name: 1 }` unique (case-insensitive)
- `{ organization: 1, department: 1, sku: 1 }` unique (case-insensitive)
- `{ organization: 1, department: 1, category: 1 }`
- `{ organization: 1, department: 1, status: 1 }`
- `{ 'inventory.stockOnHand': 1 }`
- `{ isDeleted: 1 }`

**Virtuals**:

- `isLowStock`: Computed from stockOnHand <= lowStockThreshold
- `usageHistory`: Virtual populate to TaskActivity and RoutineTask materials

**Hooks**:

- Pre-save: Normalize SKU to uppercase, validate uniqueness within department
- Pre-delete (soft): Check for associations with RoutineTask or TaskActivity materials (including soft-deleted parents using .withDeleted()), return 409 CONFLICT_ERROR if associated

**Business Rules**:

- Material stock is decremented atomically when used in RoutineTask or TaskActivity
- Material stock is incremented atomically via restock endpoint
- If stock would go below 0, return 409 CONFLICT_ERROR and reject the operation
- Materials cannot be deleted if associated with tasks (suggest status=INACTIVE instead)
- Materials with status=INACTIVE are excluded from selection dropdowns but remain viewable

### Vendor Schema

```javascript
{
  name: String (2-200 chars, required, unique per organization),
  email: String (valid email, max 100 chars, unique per organization, required),
  phone: String (pattern: /^(\+251\d{9}|0\d{9})$/, unique per organization, required),
  website: String (valid URL, max 255 chars, optional),
  location: String (max 200 chars, optional),
  address: String (max 500 chars, optional),
  description: String (max 1000 chars, optional),
  status: String (enum: ACTIVE|INACTIVE, default: ACTIVE),
  isVerifiedPartner: Boolean (default: false),
  rating: Number (1-5, 0.5 increments, optional),
  organization: ObjectId (ref: Organization, required),
  createdBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ organization: 1, name: 1 }` unique
- `{ organization: 1, email: 1 }` unique
- `{ organization: 1, phone: 1 }` unique
- `{ organization: 1, status: 1 }`
- `{ organization: 1, rating: 1 }`
- `{ isDeleted: 1 }`

**Virtuals**:

- `projects`: Virtual populate to ProjectTask collection
- `metrics`: Computed performance metrics (total projects, active projects, completed projects, on-time delivery rate, average project duration, total spend)

**Hooks**:

- Pre-save: Validate email and phone uniqueness within organization
- Pre-delete (soft): Check for associations with ProjectTasks (including soft-deleted using .withDeleted()), return 409 CONFLICT_ERROR if associated

**Business Rules**:

- Vendors are organization-level resources (not department-scoped)
- Vendors cannot be deleted if associated with ProjectTasks (suggest status=INACTIVE instead)
- Vendors with status=INACTIVE are excluded from selection dropdowns but remain viewable
- Only non-platform SuperAdmins and Admins can create vendors in their own organization

### Attachment Schema

```javascript
{
  filename: String (1-255 chars, required),
  fileUrl: String (Cloudinary URL pattern with version segment, required),
  fileType: String (enum: Image|Video|Document|Audio|Other, required),
  fileSize: Number (min 0, max 10485760 bytes = 10MB, required),
  parent: ObjectId (required, polymorphic ref),
  parentModel: String (enum: Task|TaskActivity|TaskComment, required),
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  uploadedBy: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ parent: 1, parentModel: 1 }`
- `{ organization: 1, department: 1 }`
- `{ uploadedBy: 1 }`
- `{ isDeleted: 1 }`

**Hooks**:

- Pre-save: Validate fileUrl matches Cloudinary pattern for allowed resource types (image, video, raw) with version segment
- Pre-delete (soft): Mark as deleted, preserve Cloudinary URL for audit

**Business Rules**:

- File size limit: 10MB per file
- Allowed extensions: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3
- Files are uploaded directly to Cloudinary from frontend
- Backend creates Attachment record after successful Cloudinary upload
- Attachments are NOT supported for Material (CAN-021)
- Parent must belong to same organization and department

### Notification Schema

```javascript
{
  title: String (max 200 chars, required),
  message: String (1-500 chars, required),
  entity: ObjectId (optional, polymorphic ref),
  entityModel: String (enum: Task|TaskActivity|TaskComment|User|Department|Material|Vendor, optional),
  isRead: Boolean (default: false),
  expiresAt: Date (default: now + 30 days, TTL index),
  organization: ObjectId (ref: Organization, required),
  department: ObjectId (ref: Department, required),
  user: ObjectId (ref: User, required),
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional),
  deletedBy: ObjectId (ref: User, optional),
  timestamps: true
}
```

**Indexes**:

- `{ user: 1, isRead: 1 }`
- `{ organization: 1, department: 1 }`
- `{ entity: 1, entityModel: 1 }`
- `{ expiresAt: 1 }` TTL index (auto-delete after 30 days)
- `{ isDeleted: 1 }`

**Hooks**:

- Post-save: Emit socket event notification to user:{userId} room
- Pre-delete (soft): Mark as deleted, preserve for audit

**Business Rules**:

- Notifications auto-expire after 30 days via TTL index
- Notifications are delivered to watchers and mentioned users' active sessions via Socket.IO
- Notifications are created for: task creation, task updates, task assignments, mentions, due date reminders
- Email notifications are sent for important events via Nodemailer (Gmail SMTP)

## Authorization Matrix

The authorization matrix defines RBAC permissions for all resources across four user roles. Each operation specifies:

- **Scope**: Data access boundary (any, ownOrg, ownOrg.ownDept, ownOrg.crossDept)
- **Ownership**: Additional ownership requirements (self, createdBy, assignees, watchers, uploadedBy)

### Role Definitions

1. **Platform SuperAdmin**: isPlatformOrgUser=true, role=SuperAdmin

   - Cross-organization access where matrix specifies scope=any
   - Cannot delete platform organization
   - Full access to platform organization

2. **Organization SuperAdmin**: isPlatformOrgUser=false, role=SuperAdmin

   - Full control within own organization (scope=ownOrg)
   - Cannot delete own organization
   - Can create departments and users

3. **Admin**: role=Admin

   - Department-level management (scope=ownOrg.ownDept)
   - Cross-department read access in own organization (scope=ownOrg.crossDept for read operations)
   - Can create users in own department

4. **Manager**: role=Manager

   - Department-scoped resource management (scope=ownOrg.ownDept)
   - Can read across departments where allowed (scope=ownOrg.crossDept for specific read operations)
   - Can create tasks and materials

5. **User**: role=User
   - Individual contributor (scope=ownOrg.ownDept)
   - Ownership-based access (self, assignees, watchers)
   - Can create RoutineTasks and comments

### Authorization Matrix Table

| Resource         | Operation          | Platform SuperAdmin             | Org SuperAdmin                              | Admin                                       | Manager                                     | User                            |
| ---------------- | ------------------ | ------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------- |
| **Organization** | Create             | ❌ (via seeding only)           | ❌ (via registration only)                  | ❌                                          | ❌                                          | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg)                     |
|                  | Update             | ✅ (crossOrg)                   | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
|                  | Delete             | ✅ (crossOrg, NOT platform org) | ❌                                          | ❌                                          | ❌                                          | ❌                              |
|                  | Restore            | ✅ (crossOrg)                   | ❌                                          | ❌                                          | ❌                                          | ❌                              |
| **Department**   | Create             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ✅ (ownOrg.ownDept)                         | ❌                                          | ❌                              |
|                  | Delete             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
|                  | Restore            | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
| **User**         | Create             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (any, self)                  | ✅ (ownOrg, self)                           | ✅ (ownOrg, self)                           | ✅ (self)                                   | ✅ (self)                       |
|                  | Delete             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
|                  | Restore            | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ❌                                          | ❌                                          | ❌                              |
| **ProjectTask**  | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ❌                                          | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, watchers)   |
|                  | Update             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                                          | ❌                              |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ❌                                          | ❌                              |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ❌                                          | ❌                              |
| **AssignedTask** | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, assignees)  |
|                  | Update             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept, createdBy OR assignees) | ✅ (ownOrg.ownDept, createdBy OR assignees) | ✅ (ownOrg.ownDept, createdBy OR assignees) | ✅ (ownOrg.ownDept, assignees)  |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, assignees)              | ✅ (ownOrg.ownDept, assignees)  |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, assignees)              | ✅ (ownOrg.ownDept, assignees)  |
| **RoutineTask**  | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
| **TaskActivity** | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
| **TaskComment**  | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (ownOrg.ownDept, createdBy)  | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)  |
| **Material**     | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update             | ✅ (ownOrg.ownDept, createdBy)  | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, createdBy)              | ✅ (ownOrg.ownDept, createdBy)              | ❌                              |
| **Vendor**       | Create             | ❌                              | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ❌                                          | ❌                              |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg)                                 | ✅ (ownOrg)                     |
|                  | Update             | ✅ (ownOrg, createdBy)          | ✅ (ownOrg, createdBy)                      | ✅ (ownOrg, createdBy)                      | ✅ (ownOrg, createdBy)                      | ❌                              |
|                  | Delete             | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ✅ (ownOrg, createdBy)                      | ❌                                          | ❌                              |
|                  | Restore            | ✅ (ownOrg)                     | ✅ (ownOrg)                                 | ✅ (ownOrg, createdBy)                      | ❌                                          | ❌                              |
| **Attachment**   | Create             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Read               | ✅ (any)                        | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, uploadedBy)             | ✅ (ownOrg.ownDept, uploadedBy)             | ✅ (ownOrg.ownDept, uploadedBy) |
|                  | Restore            | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept, uploadedBy)             | ✅ (ownOrg.ownDept, uploadedBy)             | ✅ (ownOrg.ownDept, uploadedBy) |
| **Notification** | Read               | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Update (mark read) | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)                         | ✅ (ownOrg.ownDept)             |
|                  | Delete             | ✅ (ownOrg.ownDept)             | ✅ (ownOrg.ownDept)                         | ❌                                          | ❌                                          | ❌                              |

### Authorization Implementation

**Middleware Pattern**:

```javascript
// Authorization middleware
const authorize = (resource, operation) => {
  return async (req, res, next) => {
    const { user } = req;
    const { role, organization, department, isPlatformOrgUser } = user;

    // Get authorization rule from matrix
    const rule = authorizationMatrix[resource][operation][role];

    // Check scope
    if (rule.scope === "any" && isPlatformOrgUser && role === "SuperAdmin") {
      return next(); // Platform SuperAdmin cross-org access
    }

    if (rule.scope === "ownOrg") {
      // Check organization match
      if (targetResource.organization.toString() !== organization.toString()) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }
    }

    if (rule.scope === "ownOrg.ownDept") {
      // Check organization AND department match
      if (
        targetResource.organization.toString() !== organization.toString() ||
        targetResource.department.toString() !== department.toString()
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }
    }

    // Check ownership
    if (rule.ownership) {
      if (
        rule.ownership === "self" &&
        targetResource._id.toString() !== user._id.toString()
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }

      if (
        rule.ownership === "createdBy" &&
        targetResource.createdBy.toString() !== user._id.toString()
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }

      if (
        rule.ownership === "assignees" &&
        !targetResource.assignees.includes(user._id)
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }

      if (
        rule.ownership === "watchers" &&
        !targetResource.watchers.includes(user._id)
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }

      if (
        rule.ownership === "uploadedBy" &&
        targetResource.uploadedBy.toString() !== user._id.toString()
      ) {
        return res.status(403).json({ error: "UNAUTHORIZED_ERROR" });
      }
    }

    next();
  };
};
```

## API Endpoints

### Authentication Endpoints

**POST /api/auth/register** - 4-step customer organization registration

- Request Body:
  ```javascript
  {
    organization: {
      name: String (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/),
      email: String (valid email, max 100 chars, unique),
      phone: String (pattern: /^(\+251\d{9}|0\d{9})$/),
      address: String (5-500 chars),
      industry: String (enum),
      size: String (enum: Small|Medium|Large),
      description: String (max 1000 chars, optional)
    },
    department: {
      name: String (2-100 chars, pattern: /^[a-zA-Z0-9\s\-&.,'()]+$/),
      description: String (max 500 chars)
    },
    user: {
      firstName: String (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/),
      lastName: String (2-50 chars, pattern: /^[a-zA-Z\s\-']+$/),
      position: String (2-100 chars, pattern: /^[a-zA-Z\s\-']+$/),
      email: String (valid email, max 100 chars, unique),
      password: String (8-128 chars),
      confirmPassword: String (must match password)
    }
  }
  ```
- Response: `{ success: true, message: "Verification email sent" }`
- Errors: 400 (validation), 409 (duplicate email)
- Business Logic:
  - Create Organization with isPlatformOrg=false, isVerified=false
  - Create Department linked to organization
  - Create User with role=SuperAdmin, isHod=true, isPlatformOrgUser=false, isVerified=false
  - Update Department.manager to created user
  - Update Organization.createdBy to created user
  - Generate email verification token + expiry
  - Send verification email via Nodemailer
  - Do NOT issue access/refresh tokens until verification

**POST /api/auth/verify-email** - Email verification

- Request Body: `{ token: String }`
- Response: `{ success: true, message: "Email verified successfully" }`
- Errors: 400 (invalid/expired token), 404 (user not found)
- Business Logic:
  - Validate token and expiry
  - Set Organization.isVerified=true, verifiedAt=now
  - Set User.isVerified=true, emailVerifiedAt=now
  - Clear verification token fields
  - Send welcome email exactly once (idempotent)

**POST /api/auth/resend-verification** - Resend verification email

- Request Body: `{ email: String }`
- Response: `{ success: true, message: "Verification email sent" }`
- Errors: 400 (invalid email), 404 (user not found), 429 (rate limited)
- Business Logic:
  - Find user by email
  - Generate new verification token + expiry
  - Send verification email via Nodemailer
  - Rate limit: max 3 requests per 15 minutes per email

**POST /api/auth/login** - User login

- Request Body: `{ email: String, password: String }`
- Response: `{ success: true, data: { user: UserSummary }, message: "Login successful" }`
- Errors: 400 (validation), 401 (invalid credentials), 403 (unverified or inactive)
- Business Logic:
  - Validate email and password
  - Check isVerified=true (reject if false with 403)
  - Check status=ACTIVE (reject if INACTIVE with 403)
  - Compare password with bcrypt
  - Generate access token (15 min expiry) and refresh token (7 day expiry)
  - Set HttpOnly cookies: accessToken, refreshToken
  - Return user summary payload

**POST /api/auth/refresh** - Refresh access token

- Request: Refresh token from HttpOnly cookie
- Response: `{ success: true, message: "Token refreshed" }`
- Errors: 401 (invalid/expired refresh token), 403 (inactive user)
- Business Logic:
  - Verify refresh token from cookie
  - Check user status=ACTIVE
  - Generate new access token and refresh token (rotation)
  - Set new HttpOnly cookies
  - Invalidate old refresh token

**POST /api/auth/logout** - User logout

- Request: Refresh token from HttpOnly cookie
- Response: `{ success: true, message: "Logged out successfully" }`
- Errors: 401 (invalid refresh token)
- Business Logic:
  - Clear accessToken and refreshToken cookies
  - Invalidate refresh token in database (optional)

**POST /api/auth/forgot-password** - Request password reset

- Request Body: `{ email: String }`
- Response: `{ success: true, message: "Password reset email sent" }` (generic message even if email not found)
- Errors: 400 (validation), 429 (rate limited)
- Business Logic:
  - Find user by email (silently fail if not found)
  - Generate password reset token + expiry (1 hour)
  - Send password reset email via Nodemailer
  - Rate limit: max 3 requests per 15 minutes per email

**POST /api/auth/reset-password** - Reset password with token

- Request Body: `{ token: String, password: String, confirmPassword: String }`
- Response: `{ success: true, message: "Password reset successfully" }`
- Errors: 400 (validation), 401 (invalid/expired token), 404 (user not found)
- Business Logic:
  - Validate token and expiry
  - Validate password (8-128 chars) and confirmPassword match
  - Hash new password with bcrypt (>=12 rounds)
  - Update user password
  - Clear password reset token fields
  - Invalidate all existing refresh tokens

**POST /api/auth/change-password** - Change password (authenticated)

- Request Body: `{ currentPassword: String, newPassword: String, confirmNewPassword: String }`
- Response: `{ success: true, message: "Password changed successfully" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (inactive user), 401 (incorrect current password)
- Business Logic:
  - Verify current password with bcrypt
  - Validate new password (8-128 chars) and confirmNewPassword match
  - Hash new password with bcrypt (>=12 rounds)
  - Update user password
  - Invalidate all existing refresh tokens except current

### Organization Endpoints

**GET /api/organizations** - List organizations (Platform SuperAdmin only)

- Query Params: `page, limit, sortBy, sortOrder, search, includeDeleted`
- Response: `{ success: true, data: { organizations: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (not Platform SuperAdmin)
- Authorization: Platform SuperAdmin only (scope: any)

**GET /api/organizations/:organizationId** - Get organization details

- Response: `{ success: true, data: { organization: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg)

**PUT /api/organizations/:organizationId** - Update organization

- Request Body: Organization fields (name, email, phone, address, industry, size, description, logo)
- Response: `{ success: true, data: { organization: {...} }, message: "Organization updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (duplicate email)
- Authorization: Platform SuperAdmin (crossOrg), Org SuperAdmin (ownOrg)

**DELETE /api/organizations/:organizationId** - Soft delete organization

- Response: `{ success: true, message: "Organization deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized or platform org), 404 (not found)
- Authorization: Platform SuperAdmin (crossOrg, NOT platform org)
- Business Logic: Cascade soft-delete to departments, users, tasks, materials, vendors, activities, comments, attachments, notifications

**PATCH /api/organizations/:organizationId/restore** - Restore organization

- Response: `{ success: true, message: "Organization restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (crossOrg)
- Business Logic: Restore cascaded resources in correct order

### Department Endpoints

**GET /api/departments** - List departments

- Query Params: `page, limit, sortBy, sortOrder, search, status, managerId, memberCountMin, memberCountMax, createdFrom, createdTo, includeDeleted, organizationId (Platform SuperAdmin only)`
- Response: `{ success: true, data: { departments: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid organizationId for non-platform users)
- Authorization: Platform SuperAdmin (any), SuperAdmin/Admin (ownOrg), Manager/User (ownOrg.ownDept)

**POST /api/departments** - Create department

- Request Body: `{ name, description, status, managerId (optional) }`
- Response: `{ success: true, data: { department: {...} }, message: "Department created" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (manager not found)
- Authorization: SuperAdmin (ownOrg)
- Business Logic: Derive organization from req.user, set createdBy, validate manager is SuperAdmin/Admin with isHod=true

**GET /api/departments/:departmentId** - Get department details

- Response: `{ success: true, data: { department: {...}, aggregates: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), SuperAdmin/Admin (ownOrg), Manager/User (ownOrg.ownDept)

**GET /api/departments/:departmentId/dashboard** - Department dashboard aggregates

- Response: `{ success: true, data: { totalUsers, totalTasks, activeTasks, completedTasks, overdueTask, ... } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Same as GET department

**GET /api/departments/:departmentId/activity** - Department activity feed

- Query Params: `page, limit, entityModel, from, to`
- Response: `{ success: true, data: { activities: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 400 (invalid date range)
- Authorization: Same as GET department

**PUT /api/departments/:departmentId** - Update department

- Request Body: `{ name, description, status, managerId }`
- Response: `{ success: true, data: { department: {...} }, message: "Department updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg), Admin (ownOrg.ownDept)
- Business Logic: Setting status=INACTIVE prevents future user/task/material creation (409 CONFLICT_ERROR)

**DELETE /api/departments/:departmentId** - Soft delete department

- Response: `{ success: true, message: "Department deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg)
- Business Logic: Cascade soft-delete to users, tasks, materials, activities, comments, attachments, notifications

**PATCH /api/departments/:departmentId/restore** - Restore department

- Response: `{ success: true, message: "Department restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg)
- Business Logic: Restore cascaded resources in correct order

### User Endpoints

**GET /api/users** - List users

- Query Params: `page, limit, sortBy, sortOrder, search, role, departmentId, status, joinedFrom, joinedTo, employeeId, includeInactive, organizationId (Platform SuperAdmin only)`
- Response: `{ success: true, data: { users: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid organizationId for non-platform users)
- Authorization: Platform SuperAdmin (any), SuperAdmin/Admin (ownOrg), Manager/User (ownOrg.ownDept)

**POST /api/users** - Create user

- Request Body: `{ firstName, lastName, position, email, phone, role, departmentId, isHod, dateOfBirth, joinedAt, employeeId, skills, profilePicture }`
- Response: `{ success: true, data: { user: {...} }, message: "User created" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (department not found), 409 (duplicate email, inactive department)
- Authorization: SuperAdmin (ownOrg)
- Business Logic:
  - Auto-generate employeeId if not provided (4 digits, not 0000, sequential)
  - Set isVerified=true (auto-verified)
  - Generate temporary password, hash with bcrypt (>=12 rounds)
  - Generate password setup token + expiry
  - Send welcome email with password setup link via Nodemailer
  - Derive organization from req.user

**GET /api/users/:userId** - Get user profile

- Response: `{ success: true, data: { user: {...}, overviewAggregates: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), SuperAdmin/Admin (ownOrg), Manager/User (ownOrg.ownDept), Self

**GET /api/users/:userId/activity** - User activity feed

- Query Params: `page, limit, entityModel, from, to`
- Response: `{ success: true, data: { activities: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 400 (invalid date range)
- Authorization: Same as GET user

**GET /api/users/:userId/performance** - User performance metrics

- Query Params: `range (enum: week|month|quarter|year, default: month)`
- Response: `{ success: true, data: { completionRate, avgTaskTime, throughput, comparisonToDeptAvg, series: [...] } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 400 (invalid range)
- Authorization: Same as GET user

**PUT /api/users/:userId** - Update user

- Request Body: `{ firstName, lastName, position, phone, role, status, skills, profilePicture }`
- Response: `{ success: true, data: { user: {...} }, message: "User updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (duplicate email, immutability violation)
- Authorization: Platform SuperAdmin (any, self), SuperAdmin/Admin (ownOrg, self), Manager/User (self)
- Business Logic:
  - Enforce immutability for Admin/Manager/User targets: department, role, employeeId, joinedAt, isHod (409 CONFLICT_ERROR)
  - Setting status=INACTIVE denies login and refresh (403 FORBIDDEN)

**PUT /api/users/:userId/preferences** - Update user preferences

- Request Body: `{ themeMode, dateFormat, timeFormat, timezone }`
- Response: `{ success: true, data: { preferences: {...} }, message: "Preferences updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Self only

**PUT /api/users/:userId/security** - Update security settings

- Request Body: `{ twoFactorEnabled }`
- Response: `{ success: true, data: { security: {...} }, message: "Security settings updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Self only

**DELETE /api/users/:userId** - Soft delete user

- Response: `{ success: true, message: "User deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg)
- Business Logic: Cascade soft-delete to tasks, activities, comments, attachments, notifications, remove from watchers/assignees/mentions

**PATCH /api/users/:userId/restore** - Restore user

- Response: `{ success: true, message: "User restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg)
- Business Logic: Restore cascaded resources in correct order

### Task Endpoints

**GET /api/tasks** - List tasks

- Query Params: `page, limit, sortBy, sortOrder, search, type, status, priority, departmentId, assigneeId, createdById, watcherId, vendorId, materialId, startFrom, startTo, dueFrom, dueTo, tags, includeDeleted, organizationId (Platform SuperAdmin only)`
- Response: `{ success: true, data: { tasks: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid organizationId for non-platform users)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg.ownDept), User (ownOrg.ownDept + assignees/watchers)
- Business Logic: Union filters for status, priority, type (comma-separated values)

**POST /api/tasks** - Create task

- Request Body: `{ type, title, description, status, priority, tags, watchers, vendor (ProjectTask), assignees (AssignedTask), startDate, dueDate, date (RoutineTask), materials (RoutineTask) }`
- Response: `{ success: true, data: { task: {...} }, message: "Task created" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (vendor/assignees/materials not found), 409 (inactive department, insufficient stock)
- Authorization:
  - ProjectTask: SuperAdmin/Admin (ownOrg.ownDept)
  - AssignedTask: SuperAdmin/Admin/Manager (ownOrg.ownDept)
  - RoutineTask: All roles (ownOrg.ownDept)
- Business Logic:
  - Derive organization and department from req.user
  - Set createdBy to current user
  - Add creator to watchers by default (ProjectTask)
  - Create initial TaskActivity "Task created" (ProjectTask, AssignedTask only)
  - Decrement material stock atomically (RoutineTask)
  - Create notifications for assignees/watchers
  - Emit socket events: task:created, notification
  - Send optional email alerts

**GET /api/tasks/:taskId** - Get task details

- Response: `{ success: true, data: { task: {...}, overviewAggregates: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg.ownDept), User (ownOrg.ownDept + assignees/watchers)

**GET /api/tasks/:taskId/activities** - Get task activities

- Query Params: `page, limit`
- Response: `{ success: true, data: { activities: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Same as GET task

**POST /api/tasks/:taskId/activities** - Add task activity

- Request Body: `{ activity, materials, attachments }`
- Response: `{ success: true, data: { activity: {...} }, message: "Activity added" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (RoutineTask, insufficient stock)
- Authorization: All roles (ownOrg.ownDept)
- Business Logic:
  - Reject if parent task is RoutineTask (409 CONFLICT_ERROR)
  - Decrement material stock atomically
  - Emit socket event: task:activity:added
  - Create notifications

**GET /api/tasks/:taskId/comments** - Get task comments

- Query Params: `page, limit`
- Response: `{ success: true, data: { comments: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Same as GET task

**POST /api/tasks/:taskId/comments** - Add task comment

- Request Body: `{ comment, parentModel, parentId, attachments }`
- Response: `{ success: true, data: { comment: {...} }, message: "Comment added" }`
- Errors: 400 (validation, depth > 5), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: All roles (ownOrg.ownDept)
- Business Logic:
  - Parse @mentions from comment text
  - Validate mentioned users are active and in same org
  - Calculate depth from parent (max 5)
  - Create notifications for mentioned users
  - Emit socket event: task:comment:added

**PUT /api/tasks/:taskId** - Update task

- Request Body: Task fields (title, description, status, priority, tags, watchers, assignees, dates, materials)
- Response: `{ success: true, data: { task: {...} }, message: "Task updated" }`
- Errors: 400 (validation, type immutable), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (insufficient stock)
- Authorization:
  - ProjectTask: SuperAdmin (ownOrg.ownDept), Admin (ownOrg.ownDept + createdBy)
  - AssignedTask: SuperAdmin (ownOrg.ownDept), Admin/Manager/User (ownOrg.ownDept + createdBy OR assignees)
  - RoutineTask: SuperAdmin (ownOrg.ownDept), Admin/Manager/User (ownOrg.ownDept + createdBy)
- Business Logic:
  - Type is immutable (reject with 400)
  - Validate dueDate > startDate
  - For RoutineTask materials update, compute delta and adjust inventory atomically
  - Create TaskActivity for status/priority changes
  - Emit socket event: task:updated

**DELETE /api/tasks/:taskId** - Soft delete task

- Response: `{ success: true, message: "Task deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization:
  - ProjectTask: SuperAdmin (ownOrg.ownDept), Admin (ownOrg.ownDept + createdBy)
  - AssignedTask: SuperAdmin (ownOrg.ownDept), Admin (ownOrg.ownDept + createdBy), Manager/User (ownOrg.ownDept + assignees)
  - RoutineTask: SuperAdmin (ownOrg.ownDept), Admin/Manager/User (ownOrg.ownDept + createdBy)
- Business Logic:
  - Cascade soft-delete to activities, comments, attachments, notifications
  - For RoutineTask, restore material stock by incrementing inventory.stockOnHand
  - Emit socket event: task:deleted

**PATCH /api/tasks/:taskId/restore** - Restore task

- Response: `{ success: true, message: "Task restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (insufficient stock)
- Authorization: Same as DELETE
- Business Logic:
  - Restore cascaded resources in correct order
  - For RoutineTask, re-apply material usage (fail if insufficient stock)

### Material Endpoints

**GET /api/materials** - List materials

- Query Params: `page, limit, sortBy, sortOrder, search, category, status, sku, lowStockOnly, createdFrom, createdTo, departmentId, includeDeleted, organizationId (Platform SuperAdmin only)`
- Response: `{ success: true, data: { materials: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid organizationId for non-platform users)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg.ownDept)

**POST /api/materials** - Create material

- Request Body: `{ name, sku, status, description, unit, category, price, inventory: { stockOnHand, lowStockThreshold, reorderQuantity } }`
- Response: `{ success: true, data: { material: {...} }, message: "Material created" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 409 (duplicate name/sku, inactive department)
- Authorization: SuperAdmin/Admin/Manager (ownOrg.ownDept)
- Business Logic:
  - Normalize SKU to uppercase
  - Derive organization and department from req.user
  - Set createdBy to current user
  - Initialize inventory defaults if omitted

**GET /api/materials/:materialId** - Get material details

- Response: `{ success: true, data: { material: {...}, usageAggregates: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg.ownDept)

**GET /api/materials/:materialId/usage** - Get material usage history

- Query Params: `page, limit, from, to`
- Response: `{ success: true, data: { usage: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Same as GET material

**PUT /api/materials/:materialId** - Update material

- Request Body: Material fields (name, sku, status, description, unit, category, price, inventory)
- Response: `{ success: true, data: { material: {...} }, message: "Material updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (duplicate name/sku)
- Authorization: SuperAdmin (ownOrg.ownDept), Admin/Manager (ownOrg.ownDept + createdBy)
- Business Logic: Enforce SKU uniqueness within department, store uppercase SKU

**POST /api/materials/:materialId/restock** - Restock material

- Request Body: `{ quantity: Number (min 1) }`
- Response: `{ success: true, data: { material: {...} }, message: "Material restocked" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin/Admin/Manager (ownOrg.ownDept)
- Business Logic:
  - Run in database session
  - Increment inventory.stockOnHand atomically
  - Update inventory.lastRestockedAt to now

**DELETE /api/materials/:materialId** - Soft delete material

- Response: `{ success: true, message: "Material deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (associated with tasks)
- Authorization: SuperAdmin (ownOrg.ownDept), Admin/Manager (ownOrg.ownDept + createdBy)
- Business Logic:
  - Check for associations with RoutineTask or TaskActivity materials (including soft-deleted parents using .withDeleted())
  - If associated, return 409 CONFLICT_ERROR with message suggesting status=INACTIVE instead
  - Otherwise, soft-delete material

**PATCH /api/materials/:materialId/restore** - Restore material

- Response: `{ success: true, message: "Material restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg.ownDept), Admin/Manager (ownOrg.ownDept + createdBy)

### Vendor Endpoints

**GET /api/vendors** - List vendors

- Query Params: `page, limit, sortBy, sortOrder, search, status, ratingMin, ratingMax, verifiedPartner, createdFrom, createdTo, includeDeleted, organizationId (Platform SuperAdmin only)`
- Response: `{ success: true, data: { vendors: [...], pagination: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid organizationId for non-platform users)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg)

**POST /api/vendors** - Create vendor

- Request Body: `{ name, email, phone, website, location, address, description, status, isVerifiedPartner, rating }`
- Response: `{ success: true, data: { vendor: {...} }, message: "Vendor created" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 409 (duplicate email/phone)
- Authorization: Non-platform SuperAdmin/Admin (ownOrg)
- Business Logic:
  - Derive organization from req.user
  - Set createdBy to current user
  - Validate email and phone uniqueness within organization

**GET /api/vendors/:vendorId** - Get vendor details

- Response: `{ success: true, data: { vendor: {...}, metrics: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg)
- Business Logic: Compute performance metrics (total projects, active projects, completed projects, on-time delivery rate, average project duration, total spend)

**PUT /api/vendors/:vendorId** - Update vendor

- Request Body: Vendor fields (name, email, phone, website, location, address, description, status, isVerifiedPartner, rating)
- Response: `{ success: true, data: { vendor: {...} }, message: "Vendor updated" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (duplicate email/phone)
- Authorization: SuperAdmin/Admin/Manager (ownOrg + createdBy)
- Business Logic: Enforce email and phone uniqueness within organization

**POST /api/vendors/:vendorId/contact** - Contact vendor via email

- Request Body: `{ subject: String, message: String, ccMe: Boolean }`
- Response: `{ success: true, message: "Email sent to vendor" }`
- Errors: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin/Admin/Manager (ownOrg)
- Business Logic: Send email via Nodemailer, do not write DB log

**DELETE /api/vendors/:vendorId** - Soft delete vendor

- Response: `{ success: true, message: "Vendor deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (associated with ProjectTasks)
- Authorization: SuperAdmin (ownOrg), Admin (ownOrg + createdBy)
- Business Logic:
  - Check for associations with ProjectTasks (including soft-deleted using .withDeleted())
  - If associated, return 409 CONFLICT_ERROR with message suggesting status=INACTIVE instead
  - Otherwise, soft-delete vendor

**PATCH /api/vendors/:vendorId/restore** - Restore vendor

- Response: `{ success: true, message: "Vendor restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg), Admin (ownOrg + createdBy)

### Attachment Endpoints

**POST /api/attachments** - Create attachment (after Cloudinary upload)

- Request Body: `{ filename, fileUrl, fileType, fileSize, parent, parentModel }`
- Response: `{ success: true, data: { attachment: {...} }, message: "Attachment created" }`
- Errors: 400 (validation, invalid extension), 401 (unauthenticated), 403 (unauthorized), 404 (parent not found)
- Authorization: All roles (ownOrg.ownDept)
- Business Logic:
  - Validate fileUrl matches Cloudinary pattern for allowed resource types (image, video, raw) with version segment
  - Validate file extension against allowlist: .svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3
  - Validate parent belongs to same organization and department
  - Derive organization and department from parent
  - Set uploadedBy to current user
  - Emit socket events and create notifications where applicable

**GET /api/attachments/:attachmentId** - Get attachment details

- Response: `{ success: true, data: { attachment: {...} } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: Platform SuperAdmin (any), All roles (ownOrg.ownDept)

**DELETE /api/attachments/:attachmentId** - Soft delete attachment

- Response: `{ success: true, message: "Attachment deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg.ownDept), Admin/Manager/User (ownOrg.ownDept + uploadedBy)
- Business Logic: Soft-delete attachment, preserve Cloudinary URL for audit

**PATCH /api/attachments/:attachmentId/restore** - Restore attachment

- Response: `{ success: true, message: "Attachment restored" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg.ownDept), Admin/Manager/User (ownOrg.ownDept + uploadedBy)
- Business Logic: Ensure parent exists before restoring

### Notification Endpoints

**GET /api/notifications** - List user notifications

- Query Params: `page, limit, isRead, entityModel, from, to`
- Response: `{ success: true, data: { notifications: [...], pagination: {...}, unreadCount: Number } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid date range)
- Authorization: All roles (ownOrg.ownDept, user=self)
- Business Logic: Return only notifications for current user

**PATCH /api/notifications/:notificationId/read** - Mark notification as read

- Response: `{ success: true, message: "Notification marked as read" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: All roles (ownOrg.ownDept, user=self)
- Business Logic: Set isRead=true

**PATCH /api/notifications/mark-all-read** - Mark all notifications as read

- Response: `{ success: true, message: "All notifications marked as read", count: Number }`
- Errors: 401 (unauthenticated), 403 (unauthorized)
- Authorization: All roles (ownOrg.ownDept, user=self)
- Business Logic: Update only current-user notifications

**DELETE /api/notifications/:notificationId** - Delete notification

- Response: `{ success: true, message: "Notification deleted" }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 404 (not found)
- Authorization: SuperAdmin (ownOrg.ownDept)
- Business Logic: Soft-delete notification, preserve for audit

### Dashboard Endpoints

**GET /api/dashboard/overview** - Dashboard overview with KPIs, charts, and activity feed

- Query Params: `dateFrom, dateTo, departmentId, status, priority, taskType`
- Response: `{ success: true, data: { kpis: {...}, charts: {...}, activityFeed: [...], upcomingDeadlines: [...] } }`
- Errors: 401 (unauthenticated), 403 (unauthorized), 400 (invalid filters)
- Authorization: All roles (ownOrg.ownDept for Manager/User, ownOrg for SuperAdmin/Admin)
- Business Logic:
  - KPIs: My Tasks, Department Tasks, Overdue, Completed This Week (clickable)
  - Charts: Status distribution (pie), Priority breakdown (bar), Timeline trends (line)
  - Activity Feed: Real-time chronological feed (newest first) with avatars, timestamps, actions
  - Upcoming Deadlines: Tasks due in next 7 days (MuiDataGrid table)
  - Team Performance: Manager/Admin only, comparison to department averages
  - Apply filters to all widgets

## Real-Time Events (Socket.IO)

### Connection Flow

1. User logs in via POST /api/auth/login
2. Frontend receives access token in HttpOnly cookie
3. Frontend establishes Socket.IO connection with JWT authentication
4. Backend verifies JWT token from auth object
5. Backend checks user status=ACTIVE and isVerified=true
6. User joins rooms: `user:{userId}`, `org:{orgId}`, `dept:{deptId}`
7. Connection maintained throughout session
8. On logout, connection closed and rooms left

### Room Structure

- **user:{userId}**: User-specific room for personal notifications
- **org:{orgId}**: Organization-wide room for org-level events
- **dept:{deptId}**: Department-wide room for dept-level events
- **task:{taskId}**: Task-specific room for task updates (users join when viewing task details)

### Event Types

**Server → Client Events**:

1. **task:created**

   - Payload: `{ task: TaskSummary }`
   - Rooms: `org:{orgId}`, `dept:{deptId}`
   - Trigger: Task creation

2. **task:updated**

   - Payload: `{ task: TaskSummary }`
   - Rooms: `org:{orgId}`, `dept:{deptId}`, `task:{taskId}`
   - Trigger: Task update

3. **task:deleted**

   - Payload: `{ taskId: ObjectId }`
   - Rooms: `org:{orgId}`, `dept:{deptId}`
   - Trigger: Task soft-delete

4. **task:activity:added**

   - Payload: `{ activity: ActivitySummary, taskId: ObjectId }`
   - Rooms: `task:{taskId}`
   - Trigger: TaskActivity creation

5. **task:comment:added**

   - Payload: `{ comment: CommentSummary, taskId: ObjectId }`
   - Rooms: `task:{taskId}`
   - Trigger: TaskComment creation

6. **notification**

   - Payload: `{ notification: NotificationSummary }`
   - Rooms: `user:{userId}` for all recipients including watchers and mentioned users
   - Trigger: Notification creation

7. **user:status:changed**
   - Payload: `{ userId: ObjectId, status: String }`
   - Rooms: `org:{orgId}`
   - Trigger: User status update

**Client → Server Events**:

1. **authenticate**

   - Payload: `{ token: String }`
   - Purpose: Send JWT token on connection

2. **join:task**

   - Payload: `{ taskId: ObjectId }`
   - Purpose: Join task-specific room

3. **leave:task**
   - Payload: `{ taskId: ObjectId }`
   - Purpose: Leave task-specific room

### Socket.IO Authentication

```javascript
// Server-side authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user status and verification
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE' || !user.isVerified) {
      return next(new Error('Authentication error: User inactive or unverified'));
    }

    socket.userId = decoded.userId;
    socket.organizationId = decoded.organization;
    socket.departmentId = decoded.department;
    socket.role = decoded.role;

    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// On connection
io.on('connection', (socket) => {
  // Join user-specific rooms
  socket.join(`user:${socket.userId}`);
  socket.join(`org:${socket.organizationId}`);
  socket.join(`dept:${socket.departmentId}`);

  // Handle task room joins
  socket.on('join:task', ({ taskId }) => {
    socket.join(`task:${taskId}`);
  });

  socket.on('leave:task', ({ taskId }) => {
    socket.leave(`task:${taskId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Cleanup handled automatically by Socket.IO
  });
});
```

### Frontend Socket Integration

**socketService.js**:

```javascript
import { io } from "socket.io-client";
import { store } from "../store";
import { api } from "./api";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    this.socket = io(process.env.VITE_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  setupListeners() {
    // Task events
    this.socket.on("task:created", (data) => {
      store.dispatch(api.util.invalidateTags(["Task"]));
    });

    this.socket.on("task:updated", (data) => {
      store.dispatch(
        api.util.updateQueryData("getTask", data.task._id, (draft) => {
          Object.assign(draft, data.task);
        })
      );
      store.dispatch(api.util.invalidateTags(["Task"]));
    });

    this.socket.on("task:deleted", (data) => {
      store.dispatch(api.util.invalidateTags(["Task"]));
    });

    this.socket.on("task:activity:added", (data) => {
      store.dispatch(
        api.util.invalidateTags([{ type: "TaskActivity", id: data.taskId }])
      );
    });

    this.socket.on("task:comment:added", (data) => {
      store.dispatch(
        api.util.invalidateTags([{ type: "TaskComment", id: data.taskId }])
      );
    });

    // Notification events
    this.socket.on("notification", (data) => {
      store.dispatch(api.util.invalidateTags(["Notification"]));
      // Show toast notification
      toast.info(data.notification.message);
      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification(data.notification.title, {
          body: data.notification.message,
        });
      }
    });

    // User status events
    this.socket.on("user:status:changed", (data) => {
      store.dispatch(api.util.invalidateTags(["User"]));
    });
  }

  joinTask(taskId) {
    this.socket.emit("join:task", { taskId });
  }

  leaveTask(taskId) {
    this.socket.emit("leave:task", { taskId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
```

## Frontend Architecture

### Component Structure

**DashboardLayout** (Main authenticated layout):

- Header: Logo, search bar, notifications bell, profile menu
- Sidebar (md+ screens): Navigation menu with department selector for HOD users
- Bottom Navigation (xs screens): 4 items (Dashboard, Tasks, Users, Profile) + centered FAB
- Content Area: Route-specific page content

**Responsive Breakpoints**:

- xs (0-599px): Mobile layout, bottom nav, single column, full-height dialogs
- sm (600-899px): Tablet layout, collapsible sidebar, 2-column grids
- md (900-1199px): Desktop layout, permanent sidebar, 3-column grids
- lg (1200-1535px): Large desktop, expanded content, 4-column grids
- xl (1536+px): Extra large desktop, maximum width, 4+ column grids

### Redux Store Structure

```javascript
// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { api } from "../services/api";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import userReducer from "./slices/userSlice";
import departmentReducer from "./slices/departmentSlice";
import notificationReducer from "./slices/notificationSlice";
import themeReducer from "./slices/themeSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "theme"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: persistedAuthReducer,
    task: taskReducer,
    user: userReducer,
    department: departmentReducer,
    notification: notificationReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(api.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
```

### RTK Query API Setup

```javascript
// services/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include", // Include HttpOnly cookies
    prepareHeaders: (headers, { getState }) => {
      return headers;
    },
  }),
  tagTypes: [
    "Organization",
    "Department",
    "User",
    "Task",
    "TaskActivity",
    "TaskComment",
    "Material",
    "Vendor",
    "Attachment",
    "Notification",
    "Dashboard",
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    register: builder.mutation({
      query: (data) => ({ url: "/auth/register", method: "POST", body: data }),
    }),
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["User"],
    }),

    // Organization endpoints
    getOrganizations: builder.query({
      query: (params) => ({ url: "/organizations", params }),
      providesTags: ["Organization"],
    }),
    getOrganization: builder.query({
      query: (id) => `/organizations/${id}`,
      providesTags: (result, error, id) => [{ type: "Organization", id }],
    }),

    // Department endpoints
    getDepartments: builder.query({
      query: (params) => ({ url: "/departments", params }),
      providesTags: ["Department"],
    }),
    getDepartment: builder.query({
      query: (id) => `/departments/${id}`,
      providesTags: (result, error, id) => [{ type: "Department", id }],
    }),
    createDepartment: builder.mutation({
      query: (data) => ({ url: "/departments", method: "POST", body: data }),
      invalidatesTags: ["Department"],
    }),

    // User endpoints
    getUsers: builder.query({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation({
      query: (data) => ({ url: "/users", method: "POST", body: data }),
      invalidatesTags: ["User"],
    }),

    // Task endpoints
    getTasks: builder.query({
      query: (params) => ({ url: "/tasks", params }),
      providesTags: ["Task"],
    }),
    getTask: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation({
      query: (data) => ({ url: "/tasks", method: "POST", body: data }),
      invalidatesTags: ["Task"],
    }),

    // Material endpoints
    getMaterials: builder.query({
      query: (params) => ({ url: "/materials", params }),
      providesTags: ["Material"],
    }),

    // Vendor endpoints
    getVendors: builder.query({
      query: (params) => ({ url: "/vendors", params }),
      providesTags: ["Vendor"],
    }),

    // Notification endpoints
    getNotifications: builder.query({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),

    // Dashboard endpoints
    getDashboardOverview: builder.query({
      query: (params) => ({ url: "/dashboard/overview", params }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyEmailMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useGetMaterialsQuery,
  useGetVendorsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetDashboardOverviewQuery,
} = api;
```

### Custom Hooks

**useAuth.js**:

```javascript
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

export const useAuth = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const logout = () => {
    // Call logout mutation
    // Clear persisted state
    // Navigate to login
  };

  return { user, isAuthenticated, logout };
};
```

**useAuthorization.js**:

```javascript
import { useAuth } from "./useAuth";

export const useAuthorization = () => {
  const { user } = useAuth();

  const can = (resource, operation, target = null) => {
    // Implement authorization logic based on matrix
    // Check role, scope, ownership
    return true / false;
  };

  return { can };
};
```

**useSocket.js**:

```javascript
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { socketService } from "../services/socketService";

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect(user.token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return {
    joinTask: socketService.joinTask,
    leaveTask: socketService.leaveTask,
  };
};
```

### View Modes (List vs Grid)

**Resources with BOTH views** (toggle available):

- Tasks: List view (MUI Cards) + Grid view (MuiDataGrid)
- Users: List view (MUI Cards) + Grid view (MuiDataGrid)
- Departments: List view (MUI Cards) + Grid view (MuiDataGrid)

**Resources with ONLY Grid view** (no list view option):

- Materials: Grid view only (MuiDataGrid)
- Vendors: Grid view only (MuiDataGrid)

**MuiDataGrid Wrapper** (client/src/components/reusable/MuiDataGrid.jsx):

- Reusable wrapper around MUI X DataGrid
- Shared toolbar with search, filter, export, column visibility, density controls
- Responsive column hiding for xs/sm screens
- Row selection checkboxes
- Pagination controls

**Column Definitions** (client/src/components/columns/):

- taskColumns.js: Task grid columns
- userColumns.js: User grid columns
- departmentColumns.js: Department grid columns
- materialColumns.js: Material grid columns
- vendorColumns.js: Vendor grid columns

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property-Based Testing Overview

Property-based testing (PBT) validates software correctness by testing universal properties across many generated inputs. Each property is a formal specification that should hold for all valid inputs.

**Core Principles**:

1. **Universal Quantification**: Every property must contain an explicit "for all" statement
2. **Requirements Traceability**: Each property must reference the requirements it validates
3. **Executable Specifications**: Properties must be implementable as automated tests
4. **Comprehensive Coverage**: Properties should cover all testable acceptance criteria

**Common Property Patterns**:

1. **Invariants**: Properties that remain constant despite changes (e.g., tree balance, collection size)
2. **Round Trip**: Combining an operation with its inverse returns to original value (e.g., parse→print→parse)
3. **Idempotence**: Doing it twice = doing it once (e.g., f(x) = f(f(x)))
4. **Metamorphic**: Relationships between components (e.g., len(filter(x)) <= len(x))
5. **Model-Based**: Optimized implementation vs standard implementation
6. **Confluence**: Order of operations doesn't matter
7. **Error Conditions**: Bad inputs properly signal errors

### Multi-Tenant Data Isolation Properties

**Property 1: Organization-Level Isolation**
_For any_ non-platform user and any query for organization-level resources (Vendors), the query results should only include resources where organization matches the user's organization

**Validates: Requirements 3.1, 3.2**

**Property 2: Department-Level Isolation**
_For any_ non-platform user and any query for department-level resources (Tasks, Materials, Users), the query results should only include resources where both organization AND department match the user's organization and department

**Validates: Requirements 3.3**

**Property 3: Cross-Organization Access Denial**
_For any_ non-platform user and any attempt to access a resource from a different organization, the system should return 403 UNAUTHORIZED_ERROR

**Validates: Requirements 3.4**

**Property 4: Platform SuperAdmin Cross-Org Access**
_For any_ Platform SuperAdmin (isPlatformOrgUser=true) and any read operation on customer organization resources, the system should allow access where the authorization matrix specifies scope=any

**Validates: Requirements 3.5**

### RBAC Authorization Properties

**Property 5: Role-Based Operation Enforcement**
_For any_ user with a specific role and any CRUD operation on a resource, the system should allow or deny the operation based on the authorization matrix for that role-resource-operation combination

**Validates: Requirements 4.2**

**Property 6: Scope-Based Access Control**
_For any_ user attempting an operation and any resource, the system should enforce scope restrictions (any, ownOrg, ownOrg.ownDept, ownOrg.crossDept) as defined in the authorization matrix

**Validates: Requirements 4.4, 4.5, 4.6, 4.7**

**Property 7: Ownership-Based Access Control**
_For any_ user attempting an operation requiring ownership (createdBy, assignees, watchers, uploadedBy) and any resource, the system should allow the operation only if the ownership requirement is satisfied

**Validates: Requirements 4.9**

**Property 8: Immutability Enforcement**
_For any_ update attempt on immutable fields (department, role, employeeId, joinedAt, isHod) for Admin/Manager/User targets, the system should return 409 CONFLICT_ERROR

**Validates: Requirements 4.8, 28.1, 28.2, 28.3, 28.4, 28.5**

### Authentication and Security Properties

**Property 9: Password Hashing Round Trip**
_For any_ valid password string, hashing with bcrypt (>=12 rounds) and then comparing with the original password should return true

**Validates: Requirements 19.7**

**Property 10: JWT Token Expiry**
_For any_ generated access token, the expiry time should be exactly 15 minutes from creation, and for any refresh token, the expiry should be exactly 7 days from creation

**Validates: Requirements 19.2**

**Property 11: Token Rotation**
_For any_ valid refresh token used to generate a new access token, the system should generate a new refresh token and invalidate the old one

**Validates: Requirements 19.4, 19.5**

**Property 12: Inactive User Login Denial**
_For any_ user with status=INACTIVE, any login attempt should return 403 FORBIDDEN

**Validates: Requirements 19.8**

**Property 13: Unverified User Login Denial**
_For any_ user with isVerified=false, any login attempt should return 403 FORBIDDEN with message to verify email

**Validates: Requirements 19.9**

### Task Type-Specific Properties

**Property 14: ProjectTask Vendor Requirement**
_For any_ ProjectTask creation attempt, the system should require a valid vendor reference and reject creation if vendor is missing or inactive

**Validates: Requirements 7.1**

**Property 15: ProjectTask Date Validation**
_For any_ ProjectTask with startDate and dueDate, dueDate must be after startDate, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 7.1, 7.9**

**Property 16: AssignedTask Assignees Requirement**
_For any_ AssignedTask creation attempt, the system should require at least 1 and at most 50 assignees, all of whom must be active users in the same organization

**Validates: Requirements 8.1, 8.2**

**Property 17: RoutineTask Material Stock Decrement**
_For any_ RoutineTask creation with embedded materials, the system should decrement material inventory.stockOnHand atomically for each material by the specified quantity

**Validates: Requirements 9.2**

**Property 18: RoutineTask Stock Validation**
_For any_ RoutineTask creation attempt where any material stock would go below 0, the system should return 409 CONFLICT_ERROR and reject the entire operation

**Validates: Requirements 9.3**

**Property 19: TaskActivity Forbidden for RoutineTask**
_For any_ attempt to create a TaskActivity for a RoutineTask, the system should return 409 CONFLICT_ERROR

**Validates: Requirements 9.5**

### Soft Delete and Cascade Properties

**Property 20: Soft Delete Flag Setting**
_For any_ resource soft-delete operation, the system should set isDeleted=true, deletedAt=now, and deletedBy=currentUser

**Validates: Requirements 21.1**

**Property 21: Department Cascade Soft Delete**
_For any_ department soft-delete operation, the system should cascade soft-delete to all users, tasks, activities, comments, attachments, and notifications in that department

**Validates: Requirements 21.2**

**Property 22: User Cascade Soft Delete**
_For any_ user soft-delete operation, the system should cascade soft-delete to all tasks, activities, comments, attachments, and notifications created by that user

**Validates: Requirements 21.3**

**Property 23: Task Cascade Soft Delete**
_For any_ task soft-delete operation, the system should cascade soft-delete to all activities, comments, and attachments linked to that task

**Validates: Requirements 21.4**

**Property 24: Restore Cascade Order**
_For any_ department restore operation, the system should restore cascaded resources in correct order: department → users → tasks → activities/comments → attachments

**Validates: Requirements 21.6**

**Property 25: Query Exclusion of Deleted Resources**
_For any_ query without includeDeleted=true, the system should filter results by isDeleted=false

**Validates: Requirements 21.7**

**Property 26: WithDeleted Association Check**
_For any_ resource deletion check for associations (Material, Vendor), the system should use .withDeleted() to include soft-deleted parents in the association check

**Validates: Requirements 21.9**

### Material Inventory Properties

**Property 27: Material Stock Atomic Decrement**
_For any_ material usage in RoutineTask or TaskActivity, the system should decrement inventory.stockOnHand atomically in the same database session

**Validates: Requirements 12.3, 12.4**

**Property 28: Material Restock Atomic Increment**
_For any_ material restock operation with quantity Q, the system should increment inventory.stockOnHand by Q atomically and update inventory.lastRestockedAt to now

**Validates: Requirements 12.6**

**Property 29: Material Deletion Association Check**
_For any_ material deletion attempt, if the material is associated with any RoutineTask or TaskActivity materials (including soft-deleted parents), the system should return 409 CONFLICT_ERROR with message suggesting status=INACTIVE

**Validates: Requirements 12.9**

**Property 30: Material SKU Uniqueness**
_For any_ material creation or update within a department, the SKU (normalized to uppercase) must be unique case-insensitively, otherwise the system should return 409 CONFLICT_ERROR

**Validates: Requirements 23.10**

### Vendor Management Properties

**Property 31: Vendor Deletion Association Check**
_For any_ vendor deletion attempt, if the vendor is associated with any ProjectTasks (including soft-deleted), the system should return 409 CONFLICT_ERROR with message suggesting status=INACTIVE

**Validates: Requirements 13.5**

**Property 32: Vendor Email Uniqueness**
_For any_ vendor creation or update within an organization, the email must be unique, otherwise the system should return 409 CONFLICT_ERROR

**Validates: Requirements 23.11**

**Property 33: Vendor Phone Uniqueness**
_For any_ vendor creation or update within an organization, the phone must be unique, otherwise the system should return 409 CONFLICT_ERROR

**Validates: Requirements 23.11**

### Comment and Mention Properties

**Property 34: Comment Depth Enforcement**
_For any_ TaskComment reply attempt, if the resulting depth would exceed 5, the system should return 400 VALIDATION_ERROR

**Validates: Requirements 10.5**

**Property 35: Mention Parsing and Validation**
_For any_ TaskComment creation with @mentions, the system should parse @username patterns, validate that all mentioned users belong to the same organization (max 20 mentions), and create notifications for mentioned users

**Validates: Requirements 10.2, 10.3**

**Property 36: Comment Cascade Soft Delete**
_For any_ TaskComment soft-delete operation, the system should cascade soft-delete to all nested comments recursively

**Validates: Requirements 10.7**

### Attachment Properties

**Property 37: Attachment File Size Validation**
_For any_ attachment upload attempt, if the file size exceeds 10MB (10485760 bytes), the system should return 400 VALIDATION_ERROR

**Validates: Requirements 11.1**

**Property 38: Attachment Extension Allowlist**
_For any_ attachment upload attempt, if the file extension is not in the allowlist (.svg, .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3), the system should return 400 VALIDATION_ERROR

**Validates: Requirements 11.1**

**Property 39: Attachment Cloudinary URL Validation**
_For any_ attachment creation, the fileUrl must match the Cloudinary pattern for allowed resource types (image, video, raw) with version segment, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 11.4**

### Validation Properties

**Property 40: Organization Name Pattern Validation**
_For any_ organization name, it must match the pattern /^[a-zA-Z0-9\s\-&.,'()]+$/ and be between 2-100 characters, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.1**

**Property 41: Ethiopian Phone Format Validation**
_For any_ phone number (Organization, User, Vendor), it must match the pattern /^(\+251\d{9}|0\d{9})$/, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.1, 23.3, 23.11**

**Property 42: Email Format Validation**
_For any_ email address, it must be a valid email format with max 100 characters, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.1, 23.3, 23.11**

**Property 43: Task Title Length Validation**
_For any_ task title, it must be between 3-200 characters, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.4**

**Property 44: Task Description Length Validation**
_For any_ task description, it must be between 10-5000 characters, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.4**

**Property 45: Task Tags Validation**
_For any_ task tags array, it must contain at most 5 tags, each tag must be at most 50 characters, tags must be normalized to lowercase, and tags must be unique case-insensitively, otherwise the system should return 400 VALIDATION_ERROR

**Validates: Requirements 23.4**

### Registration and Verification Properties

**Property 46: Customer Organization Registration Round Trip**
_For any_ valid registration data (organization + department + user), the system should create Organization with isPlatformOrg=false, Department, and User with role=SuperAdmin, isHod=true, isPlatformOrgUser=false, all with isVerified=false, and send verification email

**Validates: Requirements 2.5, 2.6, 2.7**

**Property 47: Email Verification State Transition**
_For any_ valid verification token, the system should set Organization.isVerified=true, User.isVerified=true, clear verification tokens, and send welcome email exactly once

**Validates: Requirements 2.8**

**Property 48: Circular Dependency Resolution**
_For any_ customer organization registration, the system should create organization, department, and user in sequence, then update department.manager and organization.createdBy to resolve circular dependencies

**Validates: Requirements 2.9**

### Notification Properties

**Property 49: Notification Expiry**
_For any_ notification creation, the system should set expiresAt to now + 30 days, and the notification should be automatically deleted after expiry via TTL index

**Validates: Requirements 23.13**

**Property 50: Notification Delivery to Watchers and Mentions**
_For any_ notification creation, the system should emit notification events to user:{userId} rooms for all recipients including watchers and mentioned users' active sessions

**Validates: Requirements 15.11**

### Real-Time Event Properties

**Property 51: Task Creation Event Emission**
_For any_ task creation, the system should emit task:created event to org:{orgId} and dept:{deptId} rooms

**Validates: Requirements 14.3**

**Property 52: Task Update Event Emission**
_For any_ task update, the system should emit task:updated event to org:{orgId}, dept:{deptId}, and task:{taskId} rooms

**Validates: Requirements 14.4**

**Property 53: Socket.IO Authentication**
_For any_ Socket.IO connection attempt without a valid JWT token, the system should reject the connection with authentication error

**Validates: Requirements 14.1**

**Property 54: Socket.IO Room Joining**
_For any_ successful Socket.IO connection, the system should join the user to rooms: user:{userId}, org:{orgId}, dept:{deptId}

**Validates: Requirements 14.2**

### Error Handling Properties

**Property 55: Validation Error Response Format**
_For any_ validation failure, the system should return 400 VALIDATION_ERROR with detailed field-level error messages

**Validates: Requirements 23.14, 24.1**

**Property 56: Conflict Error Message Clarity**
_For any_ 409 CONFLICT_ERROR, the system should include a specific conflict reason in the error message (e.g., "Cannot delete material: associated with active tasks. Set status to INACTIVE instead.")

**Validates: Requirements 24.5**

**Property 57: Unauthorized Error Response**
_For any_ authorization failure, the system should return 403 UNAUTHORIZED_ERROR with a clear message

**Validates: Requirements 4.10, 24.3**

## Error Handling

### Error Code System

The system uses standardized HTTP status codes with custom error codes for consistent error handling:

**Error Types**:

1. **400 VALIDATION_ERROR**: Invalid input, missing required fields, format errors
2. **401 UNAUTHENTICATED_ERROR**: Missing/invalid/expired token
3. **403 UNAUTHORIZED_ERROR**: Insufficient permissions, inactive user, unverified user
4. **404 NOT_FOUND_ERROR**: Resource not found
5. **409 CONFLICT_ERROR**: Duplicate email, inactive department, insufficient stock, immutability violation, resource in use
6. **429 RATE_LIMITED_ERROR**: Too many requests
7. **500 INTERNAL_ERROR**: Server error

### Error Response Format

```javascript
{
  success: false,
  message: "Human-readable error message",
  error: {
    code: "ERROR_CODE",
    details: {
      field: "Specific field error message",
      // Additional context
    }
  }
}
```

### Backend Error Handling

**Custom Error Classes**:

```javascript
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.code = "VALIDATION_ERROR";
    this.details = details;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 403;
    this.code = "UNAUTHORIZED_ERROR";
  }
}

class ConflictError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.code = "CONFLICT_ERROR";
    this.details = details;
  }
}
```

**Global Error Handler Middleware**:

```javascript
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: {
        code: "VALIDATION_ERROR",
        details: Object.keys(err.errors).reduce((acc, key) => {
          acc[key] = err.errors[key].message;
          return acc;
        }, {}),
      },
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: {
        code: "UNAUTHENTICATED_ERROR",
      },
    });
  }

  // Custom errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        details: err.details,
      },
    });
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: {
      code: "INTERNAL_ERROR",
    },
  });
};
```

### Frontend Error Handling

**Error Boundary Component**:

```javascript
import { ErrorBoundary } from "react-error-boundary";

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {error.message}
      </Typography>
      <Button onClick={resetErrorBoundary} variant="contained" sx={{ mt: 2 }}>
        Try again
      </Button>
    </Box>
  );
};

// Usage
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onReset={() => window.location.reload()}
>
  <App />
</ErrorBoundary>;
```

**RTK Query Error Handling**:

```javascript
// In components
const { data, error, isLoading } = useGetTasksQuery();

useEffect(() => {
  if (error) {
    if (error.status === 401) {
      // Redirect to login
      navigate("/login");
      toast.error("Session expired. Please login again.");
    } else if (error.status === 403) {
      toast.error(
        error.data?.message ||
          "You do not have permission to perform this action"
      );
    } else if (error.status === 404) {
      toast.error("Resource not found");
    } else if (error.status === 409) {
      toast.error(error.data?.message || "Conflict error");
    } else if (error.status === 429) {
      toast.error("Too many requests. Please try again later.");
    } else {
      toast.error("An error occurred. Please try again.");
    }
  }
}, [error]);
```

### Specific Error Scenarios

**Immutability Violation**:

```javascript
// Backend
if (
  targetUser.role !== "SuperAdmin" &&
  (updates.department ||
    updates.role ||
    updates.employeeId ||
    updates.joinedAt ||
    updates.isHod)
) {
  throw new ConflictError(
    "Cannot modify immutable fields for Admin/Manager/User targets",
    {
      immutableFields: [
        "department",
        "role",
        "employeeId",
        "joinedAt",
        "isHod",
      ],
    }
  );
}
```

**Resource Association Conflict**:

```javascript
// Backend - Material deletion
const associatedTasks = await Task.find({
  "materials.material": materialId,
}).withDeleted();
if (associatedTasks.length > 0) {
  throw new ConflictError(
    "Cannot delete material: associated with active tasks. Set status to INACTIVE instead.",
    {
      associatedTaskCount: associatedTasks.length,
    }
  );
}
```

**Insufficient Stock**:

```javascript
// Backend - RoutineTask creation
for (const item of materials) {
  const material = await Material.findById(item.material);
  if (material.inventory.stockOnHand < item.quantity) {
    throw new ConflictError(
      `Insufficient stock for material ${material.name}`,
      {
        materialId: material._id,
        materialName: material.name,
        requested: item.quantity,
        available: material.inventory.stockOnHand,
      }
    );
  }
}
```


## Phase Delivery Model and Dependency Gates (PRD Section 22)

### Canonical Phase Taxonomy and Order

This design adopts PRD Section 22 as the single phase source and enforces a 9-phase sequence with no renaming or reordering:

1. Phase 0: Deep Project Understanding
2. Phase 1: Core Foundations (Backend Only)
3. Phase 2: Authentication and Basic Security (Backend -> Frontend)
4. Phase 3: Cross-Cutting Services and Middleware (Backend Only)
5. Phase 4: Organization-Level CRUD (Backend -> Frontend)
6. Phase 5: Task Domain (Backend -> Frontend)
7. Phase 6: Materials, Vendors, Notifications (Backend -> Frontend)
8. Phase 7: Dashboard and Authorization Finalization (Backend -> Frontend)
9. Phase 8: Integration, Polish, Handoff

### Phase Entry and Exit Criteria

- **Phase 0 entry**: PRD and repository are available.
  - **Exit**: File map and implementation constraints are reviewed; phase gates are documented for execution.
- **Phase 1 entry**: Phase 0 exit criteria complete.
  - **Exit**: Core backend constants, env validation, base models, error skeleton, and bootstrap/health endpoint are ready.
- **Phase 2 entry**: Phase 1 exit criteria complete.
  - **Exit**: Auth flows and baseline security middleware are implemented; frontend auth can consume validated backend contracts.
- **Phase 3 entry**: Phase 2 exit criteria complete.
  - **Exit**: Cross-cutting middleware/services (authorization matrix, rate limiting, validation pipeline, notification/email primitives) are ready for resource domains.
- **Phase 4 entry**: Phase 3 exit criteria complete.
  - **Exit**: Organization/department/user CRUD backend is validated, then frontend modules are integrated against those contracts.
- **Phase 5 entry**: Phase 4 exit criteria complete.
  - **Exit**: Task domain backend and realtime hooks are validated, then frontend task workflows are integrated.
- **Phase 6 entry**: Phase 5 exit criteria complete.
  - **Exit**: Materials/vendors/notifications backend is validated, then frontend modules and socket wiring are integrated.
- **Phase 7 entry**: Phase 6 exit criteria complete.
  - **Exit**: Dashboard aggregations and final authorization matrix/UI gates are complete and consistent.
- **Phase 8 entry**: Phase 7 exit criteria complete.
  - **Exit**: Integration polish, handoff artifacts, and final sync of contracts/constants are complete.

### Dependency Gates and Synchronous Execution Rules

- Execute phases synchronously in strict order; do not start Phase N+1 before Phase N exit.
- Starting from Phase 1, backend and frontend development run concurrently for early integration feedback, but backend deliverables still gate frontend feature implementation.
- Enforce backend internal dependency order per feature: shared constants/utilities -> models -> authorization matrix -> middleware -> validators -> controllers -> routes.
- Enforce frontend dependency order per feature: validated routes/contracts -> RTK endpoints -> hooks/state wiring -> pages/components.
- Middleware-before-controller rule is mandatory for auth, authorization, validation, and rate limiting.
- Socket/realtime primitives are gated by user context and notification readiness on both backend and frontend.
- Before phase exit, update previously implemented modules affected by integration changes to avoid stale mismatches.

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**:

- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary cases
- Focus on concrete scenarios

**Property-Based Tests**:

- Verify universal properties across all inputs
- Test with randomized data generation
- Ensure correctness properties hold for all valid inputs
- Minimum 100 iterations per property test

### Property-Based Testing Configuration

**Backend (Node.js)**:

- Library: fast-check (npm install --save-dev fast-check)
- Test runner: Manual execution (no test frameworks allowed)
- Configuration: Minimum 100 iterations per property

**Frontend (React)**:

- Library: fast-check (npm install --save-dev fast-check)
- Test runner: Manual execution (no test frameworks allowed)
- Configuration: Minimum 100 iterations per property

### Property Test Structure

Each property test must:

1. Reference the design document property number
2. Include a tag comment with feature name and property text
3. Generate randomized test data
4. Assert the property holds for all generated inputs
5. Run minimum 100 iterations

**Example Property Test**:

```javascript
// Feature: multi-tenant-task-manager, Property 1: Organization-Level Isolation
// For any non-platform user and any query for organization-level resources (Vendors),
// the query results should only include resources where organization matches the user's organization

import fc from "fast-check";

const testOrganizationLevelIsolation = () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.string(),
        userOrganization: fc.string(),
        isPlatformOrgUser: fc.constant(false),
        vendors: fc.array(
          fc.record({
            _id: fc.string(),
            organization: fc.string(),
          })
        ),
      }),
      async ({ userId, userOrganization, isPlatformOrgUser, vendors }) => {
        // Setup: Create user and vendors in database
        const user = await User.create({
          _id: userId,
          organization: userOrganization,
          isPlatformOrgUser,
        });
        await Vendor.insertMany(vendors);

        // Execute: Query vendors as non-platform user
        const results = await Vendor.find({ organization: userOrganization });

        // Assert: All results belong to user's organization
        results.forEach((vendor) => {
          assert.strictEqual(vendor.organization.toString(), userOrganization);
        });

        // Cleanup
        await User.deleteMany({});
        await Vendor.deleteMany({});
      }
    ),
    { numRuns: 100 }
  );
};
```

### Unit Test Focus Areas

**Backend Unit Tests**:

1. Validation middleware with specific invalid inputs
2. Authorization middleware with specific role-resource-operation combinations
3. Controller business logic with specific scenarios
4. Model hooks and virtuals with specific data
5. Service integrations (email, socket) with mocked dependencies

**Frontend Unit Tests**:

1. Component rendering with specific props
2. User interactions with specific events
3. Form validation with specific invalid inputs
4. Custom hooks with specific state changes
5. Utility functions with specific inputs

### Integration Testing

**Manual Integration Testing Checklist**:

1. Authentication flows (register, login, logout, password reset)
2. RBAC authorization (all roles, all resources, all operations)
3. Multi-tenancy isolation (cross-org access denied)
4. Real-time updates (Socket.IO events)
5. Form validation (frontend + backend alignment)
6. Responsive design (all breakpoints)
7. Accessibility (keyboard nav, screen readers, ARIA)
8. Error handling (all error codes, user-friendly messages)
9. Performance (load times, bundle size, network requests)

### Test Data Requirements

**Seeded Test Data**:

- Platform organization with SuperAdmin
- Multiple customer organizations
- Multiple departments per org (ACTIVE and INACTIVE)
- Multiple users per role (ACTIVE and INACTIVE)
- All task types with various statuses
- Materials with low stock scenarios
- Vendors with ratings
- Soft-deleted resources for restore testing
- Ownership scenarios (createdBy, assignees, watchers, mentions)

### Property Test Tag Format

Each property test must include a comment tag:

```javascript
// Feature: multi-tenant-task-manager, Property {number}: {property_text}
```

Example:

```javascript
// Feature: multi-tenant-task-manager, Property 17: RoutineTask Material Stock Decrement
// For any RoutineTask creation with embedded materials, the system should decrement
// material inventory.stockOnHand atomically for each material by the specified quantity
```

### Testing Constraints

**Forbidden**:

- Jest, Mocha, Chai, Supertest, Vitest, Cypress
- Any test framework or test runner
- Automated test execution in CI/CD

**Allowed**:

- fast-check for property-based testing
- Manual test execution
- Manual integration testing
- Manual accessibility testing
