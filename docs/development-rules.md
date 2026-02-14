````markdown
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
````

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

```

```
