```markdown
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
```
