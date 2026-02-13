# Controller Test Execution Tasks

This document standardizes test planning and execution tracking per controller. A controller section is **incomplete** unless all three layers below are both **documented** and **executed**:
1. Route layer (authentication, authorization, rate limiting).
2. Validator layer (schema validation, existence checks, uniqueness checks).
3. Controller layer (business logic, side-effects, cascade behavior, event emission).

## Global completion gate (applies to every section)
- [ ] Route layer documented.
- [ ] Validator layer documented.
- [ ] Controller layer documented.
- [ ] Route layer executed.
- [ ] Validator layer executed.
- [ ] Controller layer executed.
- [ ] Success/failure scenarios with status codes documented per endpoint.
- [ ] Side-effects asserted: DB mutation, soft-delete/restore, socket events, email sends, stock adjustments, audit/activity entries (as applicable).

---

## Auth Controller
PRD linkage: `AUTH-VAL-*`, `AUTH-AUTHZ-*`, `AUTH-CTRL-*`, `SOCK-AUTH-*` (see `docs/prd-test-cases.md`).

### Route layer
- AuthN/AuthZ: cover login-free routes vs token/cookie protected routes (`/change-password`, `/logout`, `/refresh`).
- Rate limiting: verify auth abuse controls on login, register, forgot/reset, resend verification.

### Validator layer
- Schema: register payload (`organization`, `department`, `user`), login/reset/change payloads, token fields.
- Existence checks: refresh token cookie, verify/reset token validity.
- Uniqueness checks: organization email, user email during register.

### Controller layer
- Business logic: onboarding, email verification, login/refresh/logout, password flows.
- Side-effects: user/org/department creation, password hash updates, token issuance/invalidation, email sends.
- Event emission: socket auth handshake acceptance/rejection where applicable.

### Endpoints: success/failure scenarios and status codes
- `POST /api/auth/register`: `201`; `400` invalid schema; `409` duplicate org/user email.
- `POST /api/auth/verify-email`: `200`; `400` missing token; `400/404` invalid/expired token.
- `POST /api/auth/resend-verification`: `200`; `400` invalid email; `404` user missing.
- `POST /api/auth/login`: `200`; `400` invalid payload; `401` bad credentials; `403` inactive/unverified user; `429` rate limit.
- `POST /api/auth/refresh`: `200`; `401` missing/invalid/expired cookie.
- `POST /api/auth/forgot-password`: `200`; `400` invalid payload; `429` rate limit.
- `POST /api/auth/reset-password`: `200`; `400` invalid payload/token.
- `POST /api/auth/change-password`: `200`; `401` unauthenticated; `403` inactive; `400` validation failure.
- `POST /api/auth/logout`: `200`; `401` invalid/missing refresh cookie.

### Explicit side-effect checks
- DB: organization/department/user inserts on register, password and verification fields updates.
- Soft delete/restore: N/A.
- Socket: auth middleware acceptance/rejection for protected channels.
- Email: verification, welcome/onboarding, password reset emails.
- Stock adjustments: N/A.
- Audit/activity: auth audit entries if implemented.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Organization Controller
PRD linkage: `ORG-AUTH-*`, `ORG-VAL-*`, `ORG-AUTHZ-*`, `ORG-CTRL-*`.

### Route layer
- AuthN/AuthZ for org read/update/delete/restore routes.
- Rate limiting for update/verification-sensitive operations.

### Validator layer
- Schema for list filters and updatable fields.
- Existence checks for `organizationId` (including restore with soft-deleted lookup).
- Uniqueness checks for organization email/phone/domain fields where applicable.

### Controller layer
- Tenant scoping enforcement and platform vs customer behavior.
- Side-effects: org profile updates, verification flags, soft-delete/restore transitions.
- Event emission: organization lifecycle notifications/events if implemented.

### Endpoints: success/failure scenarios and status codes
- `GET /api/organizations/:organizationId`: `200`; `401`; `403`; `404`.
- `GET /api/organizations`: `200`; `400` invalid query; `401`; `403`.
- `PUT /api/organizations/:organizationId`: `200`; `400`; `401`; `403`; `404`; `409` duplicate constraints.
- `DELETE /api/organizations/:organizationId`: `200/204`; `401`; `403`; `404`; `409` blocked by dependencies.
- `PATCH /api/organizations/:organizationId/restore`: `200`; `400`; `401`; `403`; `404`; `409` conflict.

### Explicit side-effect checks
- DB: organization document mutations for profile/verification/status.
- Soft delete/restore: deletedAt flags and restoration correctness.
- Socket: org-scoped events if emitted.
- Email: verification/organization-contact notifications if applicable.
- Stock adjustments: N/A.
- Audit/activity: organization activity entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Department Controller
PRD linkage: `DEPT-AUTH-*`, `DEPT-VAL-*`, `DEPT-AUTHZ-*`, `DEPT-CTRL-*`.

### Route layer
- AuthN/AuthZ on create/list/get/update/delete/restore/activity routes.
- Rate limiting on write and activity-intensive routes.

### Validator layer
- Schema for department create/update and list/activity filters.
- Existence checks for `departmentId`, organization ownership, restore with `.withDeleted()`.
- Uniqueness checks for department name within organization.

### Controller layer
- Business logic for department lifecycle and activity retrieval.
- Side-effects: writes to department + denormalized references.
- Cascade behavior: restrictions when users/tasks still linked.
- Event emission for department changes.

### Endpoints: success/failure scenarios and status codes
- `POST /api/departments`: `201`; `400`; `401`; `403`; `409` duplicate.
- `GET /api/departments`: `200`; `400`; `401`; `403`.
- `GET /api/departments/:departmentId`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/departments/:departmentId`: `200`; `400`; `401`; `403`; `404`; `409`.
- `DELETE /api/departments/:departmentId`: `200/204`; `400`; `401`; `403`; `404`; `409` dependency.
- `PATCH /api/departments/:departmentId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.
- `GET /api/departments/:departmentId/activity`: `200`; `400`; `401`; `403`; `404`.

### Explicit side-effect checks
- DB: department create/update/delete/restore mutations.
- Soft delete/restore: recoverability and visibility toggles.
- Socket: department update/delete notifications.
- Email: optional notifications for leadership changes.
- Stock adjustments: N/A.
- Audit/activity: activity feed entries for department changes.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## User Controller
PRD linkage: `USER-AUTH-*`, `USER-VAL-*`, `USER-AUTHZ-*`, `USER-CTRL-*`.

### Route layer
- AuthN/AuthZ for CRUD + preferences/security/activity/performance.
- Rate limiting on profile/security updates and list endpoints.

### Validator layer
- Schema validation for create/update/preferences/security/list/activity/performance.
- Existence checks for user/department relations (including soft-deleted restore paths).
- Uniqueness checks for email/employeeId per organization.

### Controller layer
- Business logic: user creation, self/profile update constraints, restore flow.
- Side-effects: welcome email, profile and security state transitions.
- Cascade behavior: user deletion impact on tasks/mentions/ownership.
- Event emission: user status/profile change events.

### Endpoints: success/failure scenarios and status codes
- `POST /api/users`: `201`; `400`; `401`; `403`; `409` duplicate/conflict.
- `GET /api/users`: `200`; `400`; `401`; `403`.
- `GET /api/users/:userId`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/users/:userId`: `200`; `400`; `401`; `403`; `404`; `409` immutable/duplicate fields.
- `PUT /api/users/:userId/preferences`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/users/:userId/security`: `200`; `400`; `401`; `403`; `404`.
- `GET /api/users/:userId/activity`: `200`; `400`; `401`; `403`; `404`.
- `GET /api/users/:userId/performance`: `200`; `400`; `401`; `403`; `404`.
- `DELETE /api/users/:userId`: `200/204`; `400`; `401`; `403`; `404`; `409` dependency.
- `PATCH /api/users/:userId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.

### Explicit side-effect checks
- DB: user docs, preferences, security flags, status transitions.
- Soft delete/restore: deletedAt, restoration integrity.
- Socket: `user:status:changed` and related updates.
- Email: welcome/setup/security emails.
- Stock adjustments: N/A.
- Audit/activity: user activity entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Task Controller
PRD linkage: `TASK-AUTH-*`, `TASK-VAL-*`, `TASK-AUTHZ-*`, `TASK-CTRL-*`, `SOCK-CTRL-*`.

### Route layer
- AuthN/AuthZ for task create/list/get/update/delete/restore.
- Rate limiting on task write/comment/activity heavy workflows.

### Validator layer
- Schema validation for task payloads and list filters.
- Existence checks for task, assignees, watchers, department/project references.
- Uniqueness checks for task number/code if applicable.

### Controller layer
- Business logic: lifecycle transitions, assignee/watcher management.
- Side-effects: task activity/comment linkage and notification creation.
- Cascade behavior: delete/restore across activities, comments, attachments.
- Event emission: task and activity/comment socket events.

### Endpoints: success/failure scenarios and status codes
- `POST /api/tasks`: `201`; `400`; `401`; `403`; `409` business conflict.
- `GET /api/tasks`: `200`; `400`; `401`; `403`.
- `GET /api/tasks/:taskId`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/tasks/:taskId`: `200`; `400`; `401`; `403`; `404`; `409` invalid transition/conflict.
- `DELETE /api/tasks/:taskId`: `200/204`; `400`; `401`; `403`; `404`; `409` dependency.
- `PATCH /api/tasks/:taskId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.

### Explicit side-effect checks
- DB: task + dependent activity/comment/notification updates.
- Soft delete/restore: parent-child consistency.
- Socket: `task:created`, `task:updated`, `task:deleted`, `task:activity:added`, `task:comment:added`.
- Email: task assignment/mention notifications if enabled.
- Stock adjustments: N/A.
- Audit/activity: task timeline entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Material Controller
PRD linkage: `MAT-AUTH-*`, `MAT-VAL-*`, `MAT-AUTHZ-*`, `MAT-CTRL-*`.

### Route layer
- AuthN/AuthZ for create/list/get/update/restock/delete/restore/usage.
- Rate limiting for restock and usage analytics routes.

### Validator layer
- Schema validation for material payloads, restock payload, usage queries.
- Existence checks for material/vendor/task references and restore lookup.
- Uniqueness checks for SKU/material name per org (if required).

### Controller layer
- Business logic: inventory changes, usage calculation, status transitions.
- Side-effects: stock increments/decrements and related task/material links.
- Cascade behavior: prevent delete when referenced by active tasks.
- Event emission: material inventory change notifications.

### Endpoints: success/failure scenarios and status codes
- `POST /api/materials`: `201`; `400`; `401`; `403`; `409`.
- `GET /api/materials`: `200`; `400`; `401`; `403`.
- `GET /api/materials/:materialId`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/materials/:materialId`: `200`; `400`; `401`; `403`; `404`; `409`.
- `POST /api/materials/:materialId/restock`: `200`; `400`; `401`; `403`; `404`; `409`.
- `GET /api/materials/:materialId/usage`: `200`; `400`; `401`; `403`; `404`.
- `DELETE /api/materials/:materialId`: `200/204`; `400`; `401`; `403`; `404`; `409` reference constraint.
- `PATCH /api/materials/:materialId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.

### Explicit side-effect checks
- DB: material records + usage/restock history mutations.
- Soft delete/restore: availability across lookups.
- Socket: inventory updates if emitted.
- Email: low-stock/restock alerts if configured.
- Stock adjustments: verify exact quantity arithmetic and floor/ceiling rules.
- Audit/activity: inventory and procurement activity entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Vendor Controller
PRD linkage: `VEND-AUTH-*`, `VEND-VAL-*`, `VEND-AUTHZ-*`, `VEND-CTRL-*`.

### Route layer
- AuthN/AuthZ for create/list/get/update/contact/delete/restore.
- Rate limiting on contact/email endpoint.

### Validator layer
- Schema validation for vendor fields, contact payload, list filters.
- Existence checks for `vendorId` and restore with `.withDeleted()`.
- Uniqueness checks for vendor name/email/phone per org.

### Controller layer
- Business logic: creator-scoped update/delete rules, contact workflow.
- Side-effects: outbound email for contact action.
- Cascade behavior: delete blocked when linked to project tasks.
- Event emission: vendor status/verification change events if implemented.

### Endpoints: success/failure scenarios and status codes
- `POST /api/vendors`: `201`; `400`; `401`; `403`; `409`.
- `GET /api/vendors`: `200`; `400`; `401`; `403`.
- `GET /api/vendors/:vendorId`: `200`; `400`; `401`; `403`; `404`.
- `PUT /api/vendors/:vendorId`: `200`; `400`; `401`; `403`; `404`; `409`.
- `POST /api/vendors/:vendorId/contact`: `200/202`; `400`; `401`; `403`; `404`; `429`.
- `DELETE /api/vendors/:vendorId`: `200/204`; `400`; `401`; `403`; `404`; `409` associated task constraint.
- `PATCH /api/vendors/:vendorId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.

### Explicit side-effect checks
- DB: vendor create/update/delete/restore mutations.
- Soft delete/restore: recoverability and filtered visibility.
- Socket: vendor events if emitted.
- Email: Nodemailer send assertion for `/contact`.
- Stock adjustments: N/A (indirect only).
- Audit/activity: vendor change entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Attachment Controller
PRD linkage: `ATT-AUTH-*`, `ATT-VAL-*`, `ATT-AUTHZ-*`, `ATT-CTRL-*`.

### Route layer
- AuthN/AuthZ for upload/delete/restore.
- Rate limiting for upload endpoints.

### Validator layer
- Schema validation for file metadata and relation targets.
- Existence checks for attachment/task/comment refs including restore path.
- Uniqueness checks for duplicate file linkage constraints if applicable.

### Controller layer
- Business logic: upload metadata persistence and ownership rules.
- Side-effects: storage provider interactions and cleanup on delete.
- Cascade behavior: attachment visibility with parent task/comment delete/restore.
- Event emission: attachment added/removed notifications.

### Endpoints: success/failure scenarios and status codes
- `POST /api/attachments`: `201`; `400`; `401`; `403`; `404` parent missing; `409` duplicate/conflict.
- `DELETE /api/attachments/:attachmentId`: `200/204`; `400`; `401`; `403`; `404`.
- `PATCH /api/attachments/:attachmentId/restore`: `200`; `400`; `401`; `403`; `404`; `409`.

### Explicit side-effect checks
- DB: attachment rows/docs created/soft-deleted/restored.
- Soft delete/restore: deleted attachments excluded unless requested.
- Socket: attachment-related task events.
- Email: N/A unless attachment triggers notifications.
- Stock adjustments: N/A.
- Audit/activity: attachment activity entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Notification Controller
PRD linkage: `NOTIF-AUTH-*`, `NOTIF-VAL-*`, `NOTIF-AUTHZ-*`, `NOTIF-CTRL-*`, `SOCK-CTRL-006`.

### Route layer
- AuthN/AuthZ for list/read/read-all/delete.
- Rate limiting on list polling/read-all operations.

### Validator layer
- Schema validation for notification IDs and list query.
- Existence checks for notification ownership and restore references.
- Uniqueness checks: N/A (typically generated events), assert no duplicate fan-out where constrained.

### Controller layer
- Business logic: unread/read state transitions and delete semantics.
- Side-effects: bulk read updates and TTL cleanup behavior.
- Cascade behavior: behavior when source entities are deleted/restored.
- Event emission: per-user realtime notification push.

### Endpoints: success/failure scenarios and status codes
- `GET /api/notifications`: `200`; `400`; `401`; `403`.
- `PATCH /api/notifications/:notificationId/read`: `200`; `400`; `401`; `403`; `404`.
- `PATCH /api/notifications/read-all`: `200`; `401`; `403`.
- `DELETE /api/notifications/:notificationId`: `200/204`; `400`; `401`; `403`; `404`.

### Explicit side-effect checks
- DB: read flags, readAt timestamps, delete markers.
- Soft delete/restore: if implemented, verify recoverability rules.
- Socket: `notification` event to `user:{userId}` room.
- Email: optional mirrored notifications.
- Stock adjustments: N/A.
- Audit/activity: notification lifecycle entries.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.

---

## Dashboard Controller
PRD linkage: `DASH-AUTH-*`, `DASH-VAL-*`, `DASH-AUTHZ-*`, `DASH-CTRL-*`.

### Route layer
- AuthN/AuthZ for overview and department analytics routes.
- Rate limiting/caching checks for expensive aggregate endpoints.

### Validator layer
- Schema validation for date range, department filters, grouping options.
- Existence checks for department/org scoping inputs.
- Uniqueness checks: N/A.

### Controller layer
- Business logic: aggregate KPIs, trend calculations, empty-state handling.
- Side-effects: read-only behavior enforcement (no accidental mutations).
- Cascade behavior: dashboard consistency after upstream soft-delete/restore.
- Event emission: N/A unless dashboard triggers push refresh.

### Endpoints: success/failure scenarios and status codes
- `GET /api/dashboard/overview`: `200`; `400`; `401`; `403`.
- `GET /api/dashboard/departments`: `200`; `400`; `401`; `403`.

### Explicit side-effect checks
- DB: verify read-only queries (no mutation side-effects).
- Soft delete/restore: aggregates include/exclude deleted entities per query flags.
- Socket: N/A by default.
- Email: N/A.
- Stock adjustments: N/A.
- Audit/activity: optional dashboard access audit logs.

### Completion criteria
- [ ] Route layer documented + executed.
- [ ] Validator layer documented + executed.
- [ ] Controller layer documented + executed.
