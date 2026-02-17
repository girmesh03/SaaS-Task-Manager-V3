# Implementation Plan: Multi-Tenant Task Manager

## Overview

This implementation plan provides a complete, phase-by-phase execution checklist aligned with:

- `docs/product-requirements-document-new.md`
- `docs/ui/*`
- `.kiro/specs/multi-tenant-task-manager/requirements.md`
- `.kiro/specs/multi-tenant-task-manager/design.md`

**Total Requirements**: 63 requirements with detailed acceptance criteria
**Design Scope**: architecture, data models, API contracts, authorization matrix, UI flows
**Technology Stack**: MERN (MongoDB, Express, React, Node.js), Socket.IO, Redux Toolkit, Material UI

**Synchronous Phase Rule (Mandatory)**:

1. Backend tasks in a phase MUST be completed first.
2. Frontend tasks in the same phase MUST start only after backend tasks are complete and manually verified.
3. Any dependency required by Phase N MUST already be delivered in Phase N-1.
4. `backend/app.js` and `backend/server.js` MUST be updated together in every backend phase where bootstrapping changes.
5. Backend tests are manual/API verification tasks only (no Jest/Mocha/Chai/Supertest/Vitest/Cypress).
6. Frontend tests are not implemented in this project (manual verification only).

---

## Phase 1: Foundation and Runtime Baseline (Backend -> Frontend)

**Phase Gate**:

- No business resource controllers in this phase.
- Deliver only foundational runtime, shared utilities, and shell UI/layout baselines.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 1.1 Establish backend project structure and baseline modules
  - Create folders: `backend/config`, `backend/controllers`, `backend/middleware`, `backend/models`, `backend/plugins`, `backend/routes`, `backend/services`, `backend/utils`, `backend/validators`, `backend/mock`
  - Preserve existing entry files: `backend/app.js`, `backend/server.js`
  - Add barrel exports only where helpful; avoid circular imports
  - Ensure all modules use ES modules (`type: "module"`)
  - Detailed architecture extraction to enforce in this task:
    - Backend layering is fixed as: Routes -> Authentication Middleware -> Validation Middleware -> Authorization Middleware -> Controllers -> Services -> Models -> Database; folder boundaries must preserve this order to avoid mixed concerns.
    - Multi-tenant boundaries are model-layer and middleware-layer concerns from the start: organization-scoped resources and organization+department-scoped resources must be separated in structure and naming.
    - This phase is foundational only: do not implement business resource logic in controllers yet; only prepare module locations, import surfaces, and runtime wiring points.
    - File naming and placement must align with canonical backend artifacts referenced across docs: `allowedOrigins.js`, `authorizationMatrix.json`, `corsOptions.js`, `db.js`, middleware validators, model set, route set, services, and utility modules.
    - All subsequent phases depend on this structure for synchronous backend-first delivery; missing folders or incorrect placement blocks route/model/controller progression in Phases 2-6.
  - _Requirements: 34.9, 34.15, 61, Design: Backend Architecture_

- [ ] 1.2 Implement environment and constants foundation
  - Create `backend/utils/constants.js` for enums, limits, regex, API defaults, error codes
  - Create `backend/utils/validateEnv.js` to validate required env keys at startup
  - Add canonical regex and enum mappings from PRD (phone regex, status/priority mapping)
  - Keep all constants centralized (no hardcoded literals in controllers)
  - Detailed canonical extraction to enforce in this task:
    - Phone regex must be canonical everywhere: `^(\+251\d{9}|0\d{9})$` for Organization/User/Vendor validation and examples.
    - Task status enum source of truth is fixed: `TODO`, `IN_PROGRESS`, `PENDING`, `COMPLETED`; task priority enum source of truth is fixed: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
    - UI label mapping must remain a serializer concern based on canonical enums: `TODO->To Do`, `IN_PROGRESS->In Progress`, `PENDING->In Review`, `COMPLETED->Completed`, `URGENT->Critical`; backend stores and validates canonical enum values only.
    - Attachment extension allowlist constants must include: `.svg`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt`, `.mp4`, `.mp3`.
    - Attachment fileUrl validation constants must support Cloudinary `image|video|raw` URL pattern with required version segment.
    - Environment validation must fail startup deterministically when required keys are missing: database URI, auth secrets, cookie/token settings, email transport settings, cloudinary settings, runtime environment, and client origin/cors settings.
    - Constants module must include pagination/search defaults and must define includeDeleted default behavior as excluded unless explicitly requested.
  - _Requirements: 34.8, 35 (CAN-006, CAN-013), Design: Utilities_

- [ ] 1.3 Implement shared backend helpers and logging
  - Create `backend/utils/helpers.js` (date helpers, pagination parser, response helpers)
  - Create `backend/utils/logger.js` (structured logger with environment-aware transports)
  - Create `backend/utils/errors.js` with custom error classes matching canonical error taxonomy
  - Replace direct `console.log` usage in runtime path with logger
  - Detailed extraction to enforce in this task:
    - Error taxonomy must include canonical categories used across contracts: `VALIDATION_ERROR`, `UNAUTHENTICATED_ERROR`, `UNAUTHORIZED_ERROR`, `NOT_FOUND_ERROR`, `CONFLICT_ERROR`, `RATE_LIMITED_ERROR`, `INTERNAL_ERROR`.
    - Standard error response shape must be uniform for all controllers and middleware: success flag false, human-readable message, machine-readable error code, and optional validation/detail payload.
    - Pagination helper must normalize `page`, `limit`, `sortBy`, `sortOrder`, and search query inputs for consistent list endpoint behavior in every resource controller.
    - Date/time helpers must preserve UTC storage semantics and support ISO output formatting contracts expected by frontend formatting rules.
    - Logging utility must replace runtime `console` statements in app startup, shutdown, db lifecycle, and middleware error paths; logs must include enough context for traceability without leaking tenant-sensitive payloads.
  - _Requirements: 24, 58, Design: Error Handling + Logging_

- [ ] 1.4 Implement baseline config modules
  - Create `backend/config/db.js` (Mongoose connection lifecycle and graceful shutdown hooks)
  - Create `backend/config/allowedOrigins.js` and `backend/config/corsOptions.js`
  - Create `backend/config/authorizationMatrix.json` seeded from PRD canonical matrix
  - Create `backend/config/cloudinary.js` and `backend/config/email.js` placeholders
  - Detailed extraction to enforce in this task:
    - Authorization matrix JSON from PRD Section 8.4 is backend source of truth; later middleware and frontend permission helpers must consume this canonical contract without parallel rule definitions.
    - CORS config must support credentialed cookie auth and environment-based allowed origins while preventing wildcard leakage for authenticated routes.
    - Database config must support explicit connect/disconnect lifecycle hooks and graceful process termination sequencing.
    - Cloudinary and email config modules must expose deterministic behavior in local/non-configured environments (safe fallback strategy) and production (strict config requirement).
    - Config modules must avoid embedding business logic and remain pure infrastructure concerns consumed by app/server/services.
  - _Requirements: 19, 43, 62, Design: Config Layer_

- [ ] 1.5 Implement middleware skeleton (foundation only)
  - Create `backend/middleware/errorHandler.js` (final responder)
  - Create `backend/middleware/notFound.js`
  - Create `backend/middleware/rateLimiter.js` baseline profiles
  - Create `backend/middleware/validation.js` runner (`.run(req)`, `validationResult(req)`)
  - Create `backend/middleware/authMiddleware.js` and `backend/middleware/authorization.js` skeletons (full rules in Phase 2)
  - Detailed extraction to enforce in this task:
    - Validation middleware contract must run validators with `.run(req)` and use `validationResult(req)` for unified request rejection behavior.
    - Auth middleware skeleton must read JWT auth context from HttpOnly cookie flow and prepare normalized `req.user` shape used by authorization and controllers.
    - Authorization skeleton must target canonical rule evaluation strategy: collect candidate rules and allow when any rule passes.
    - Rate limiter skeleton must reserve dedicated profiles for auth-sensitive endpoints and general API endpoints with 429 error mapping.
    - Error middleware must map known failure classes to canonical status/error-code behavior and leave unknowns as `INTERNAL_ERROR`.
    - Not-found middleware must be final unmatched route guard before error responder.
  - _Requirements: 19, 24, 43, 44, Design: Middleware_

- [ ] 1.6 Synchronize `app.js` and `server.js` runtime wiring
  - Update `backend/app.js` to use core middleware stack and health/root routes
  - Update `backend/server.js` to initialize env validation, db connection, and app startup consistently
  - Ensure startup order: validate env -> connect db -> start server
  - Ensure shutdown order: stop accepting requests -> close db -> exit
  - Detailed extraction to enforce in this task:
    - App/server separation must remain explicit: `app.js` composes middleware/routes; `server.js` owns process/bootstrap lifecycle and network listener control.
    - Health and root routes are required early to support manual readiness checks before resource endpoints are implemented.
    - Startup path must be deterministic and fail-fast when env/database prerequisites are invalid.
    - Shutdown path must prevent request acceptance first, then close network/database resources in strict order.
    - Any future socket bootstrap in later phases must be attached in synchronized app/server flow without duplicating auth/config initialization.
  - _Requirements: 19, 61, Design: Server Lifecycle_

- [ ] 1.7 Tests (Backend)
  - No backend controller/resource tests in Phase 1
  - Validate startup manually: env validation, DB connect/disconnect, health route, seed command
  - Detailed manual verification extraction:
    - Validate startup failure path when required environment variables are missing.
    - Validate successful startup path with ordered logs and healthy process state.
    - Validate database connection and graceful shutdown behavior under manual stop.
    - Validate health/root route responses and error middleware fallback behavior for unknown route requests.
    - Validate seed idempotency behavior and platform baseline entity existence.
  - _Rules: tests begin after resource controllers are implemented_

### Frontend

- [ ] 1.8 Stabilize existing frontend entry and layout baseline
  - Keep and extend existing files: `client/src/main.jsx`, `client/src/router/routes.jsx`, `client/src/components/layouts/RootLayout.jsx`
  - Ensure `ToastContainer` remains globally available
  - Keep lazy loading in route config and ensure fallback behavior via `MuiLoading`
  - Reusable components to validate/develop for this task:
    - `MuiLoading`: global lazy-route fallback and page transition loading state for public and dashboard shells (`docs/ui/public_layout_screen.png`, `docs/ui/desktop-dashboard-layout.png`)
    - `MuiThemeDropDown`: header theme toggle behavior in authenticated and public shells (`docs/ui/desktop-dashboard-layout.png`, `docs/ui/mobile-dashboard-layout.png`, `docs/ui/landing-page.png`)
    - `MuiBottomNavigation` + `MuiFAB`: xs-only navigation and centered create action per CAN-002 (`docs/ui/mobile-dashboard-layout.png`)
    - `MuiAppIconLogo`: sidebar/public brand mark alignment with logo placement constraints (sidebar owns logo in dashboard layout per CAN-024) (`docs/ui/desktop-dashboard-layout.png`, `docs/ui/public_layout_screen.png`, `docs/ui/landing-page.png`)
  - Detailed extraction to enforce in this task:
    - Frontend entry pipeline must preserve the canonical layout chain (`RootLayout` -> `DashboardLayout` -> page outlet) for protected routes and the public-layout chain for unauthenticated routes.
    - Global toast handling must remain mounted once at app root because canonical error-handling requires consistent toast behavior for 401/403/409/429/500 and success flows.
    - Route-level lazy loading must cover heavy modules (data grids, charts, dialogs) and must expose `MuiLoading` as the shared fallback state.
    - Core auth UX contract must remain compatible with API rules: frontend handles 401 via refresh flow and logout-on-refresh-failure, while 403 is toast-only with no forbidden page and no forced logout (CAN-012).
    - Entry/layout baseline must preserve canonical navigation naming and placement rules already fixed by requirements, including sidebar terminology and shared header action zones.
  - _Requirements: 61, 59, Design: Frontend Architecture_

- [ ] 1.9 Build frontend folder architecture (without breaking current files)
  - Add folders: `client/src/store`, `client/src/services`, `client/src/hooks`, `client/src/utils`, `client/src/components/common`, `client/src/components/columns`, `client/src/components/features`
  - Keep existing `client/src/theme/*` customization architecture as the baseline design system
  - Add index exports only where it improves import hygiene
  - Reusable-component inventory source of truth for this phase: `client/src/components/reusable/index.js` must export only canonical `Mui*` wrappers used by screen specs and list/detail/dialog flows.
  - Detailed extraction to enforce in this task:
    - Folder boundaries must map directly to architecture contracts: reusable UI wrappers, feature components, per-resource DataGrid column definitions, hooks for auth/authorization/responsive/date logic, and service modules for RTK Query/socket integration.
    - Reusable component exports must remain canonicalized behind `client/src/components/reusable/index.js` so downstream pages consume consistent `Mui*` wrappers instead of raw ad-hoc MUI variants.
    - Structure must support cross-phase delivery order: list/grid/dialog foundations are reused across Tasks/Users/Departments/Materials/Vendors and Settings/Dashboard flows without duplicated component logic.
    - Theme architecture must remain centralized under `client/src/theme/*` so appearance toggles and preference persistence can apply globally with no per-page theme drift.
    - Organization of store/services/hooks must match Section 18 endpoint segmentation and permission-gated UI composition patterns defined in requirements/design.
  - _Requirements: 58, 61, Design: Frontend Structure_

- [ ] 1.10 Implement layout shells from UI references
  - Public layout shell aligned to `docs/ui/public_layout_screen.png` and `docs/ui/landing-page.png`
  - Dashboard layout shell aligned to `docs/ui/desktop-dashboard-layout.png` and `docs/ui/mobile-dashboard-layout.png`
  - Enforce CAN-024 now: dashboard header has no logo; sidebar owns logo
  - Enforce CAN-002 now: bottom nav on xs only with 4 items + centered FAB
  - Reusable components to validate/develop for this task:
    - `MuiAppIconLogo`: render in sidebar/public header branding; never in dashboard top header (CAN-024)
    - `MuiThemeDropDown`: theme control in header on all dashboard/public shells
    - `MuiBottomNavigation`: enforce canonical items Dashboard/Tasks/Users/Profile on xs only (CAN-002)
    - `MuiFAB`: centered mobile create trigger on xs (`docs/ui/mobile-dashboard-layout.png`)
    - `MuiSearchField`: top-header global search visual/interaction baseline for dashboard shells (`docs/ui/desktop-dashboard-layout.png`)
  - Detailed extraction to enforce in this task:
    - Public header must keep canonical CTA labels exactly `Log In` and `Sign Up` (CAN-025) and preserve nav structure from landing/public reference screens.
    - Dashboard header composition must follow canonical layout: page title, optional org switcher (platform superadmin only), search, theme toggle, notifications, and user menu; product logo must be excluded from this header (CAN-024).
    - Sidebar composition must own product logo placement and include workspace/manage/configuration groupings with canonical nav wording, including `Tasks` label (CAN-010).
    - Responsive behavior must follow canonical breakpoints (CAN-001): xs mobile drawer + bottom navigation, sm+ hide bottom navigation, and auto-close drawer on mobile route changes.
    - Bottom navigation must include exactly 4 items (`Dashboard`, `Tasks`, `Users`, `Profile`) with centered FAB; `Profile` must open menu entries for additional destinations (Departments/Materials/Vendors) per mobile IA rules (CAN-002).
    - Global search placement and spacing must align with desktop dashboard layout references and remain reusable across resource list pages.
  - _Requirements: 61, 35 (CAN-002, CAN-024), Design: Layouts_

- [ ] 1.11 Add protected/public route map placeholders
  - Public placeholders: `/`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`
  - Protected placeholders: `/dashboard`, `/dashboard/tasks`, `/dashboard/tasks/:taskId`, `/dashboard/users`, `/dashboard/users/:userId`, `/dashboard/departments`, `/dashboard/departments/:departmentId`, `/dashboard/materials`, `/dashboard/materials/:materialId`, `/dashboard/vendors`, `/dashboard/vendors/:vendorId`, `/dashboard/settings`
  - Keep file extension consistency with current project (`.jsx`)
  - Route-level reusable wrappers required at placeholder stage: `MuiLoading` (lazy fallback), `MuiDialog` (mobile full-height recipe for all modal routes/components), `MuiEmptyState` (placeholder empty content states where data is not connected yet).
  - Detailed extraction to enforce in this task:
    - Route inventory must mirror canonical page set from requirements and PRD UI coverage, including all list/detail/settings/auth paths required by Section 18 data contracts.
    - Protected routes must be nested under authenticated layout wrappers and remain compatible with role/tenant authorization handling introduced in later phases.
    - Placeholder routes must be scaffolded with reusable fallback states (`MuiLoading`, `MuiEmptyState`) so UI behavior remains deterministic before API integration.
    - Any route that will host modal workflows must adopt canonical dialog foundations early, including mobile full-height behavior contract for xs screens (CAN-017).
    - URL naming must remain stable and unchanged across phases to avoid API/UI traceability drift with requirements and UI reference files.
  - _Requirements: 61, 40-42, Design: Routing_

- [ ] 1.12 Tests (Frontend)
  - No frontend test implementation in this project
  - Manual validation only: route rendering, layout responsiveness, header/sidebar/bottom-nav behavior
  - Detailed manual verification extraction:
    - Validate public and protected route placeholders mount under correct layout wrappers and that lazy fallback states render consistently.
    - Validate breakpoints and navigation rules: xs bottom navigation/FAB visibility, sm+ bottom nav hidden, sidebar drawer behavior on mobile route transitions.
    - Validate header/sidebar logo placement contract (logo in sidebar/public layouts only, not dashboard header) and canonical header actions presence.
    - Validate public CTA labels are exactly `Log In` and `Sign Up` and route links navigate to the correct placeholders.
    - Validate global toast container availability and baseline error-notification visibility in route shell flows.

---

## Phase 2: Data Model + Contract Scaffolding (Backend -> Frontend)

**Phase Gate**:

- Phase 1 completed.
- Deliver schemas, validators, route contracts, and API/service scaffolds.
- Use placeholders for non-complete controllers where needed.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 2.1 Implement soft-delete and schema base plugins
  - Create `backend/plugins/softDelete.js` with `isDeleted`, `deletedAt`, `deletedBy`, `restore()` helpers
  - Add query helpers to include/exclude deleted records deterministically
  - Ensure plugin support for cascade logic later
  - Detailed extraction to enforce in this task:
    - Soft-delete lifecycle is canonical for this project; hard delete is excluded from normal business flows.
    - Query behavior must exclude deleted records by default and include them only when includeDeleted is explicitly requested.
    - `.withDeleted()` support is required for create/restore collision checks and association conflict checks before delete (CAN-015).
    - Restore behavior must clear deletion markers and support ordered parent/child restore operations used by cascade restoration.
    - Plugin behavior must be reusable across all resources to avoid inconsistent delete/restore semantics.
  - _Requirements: 34.1, 46, Design: Data Lifecycle_

- [ ] 2.2 Implement all core models with canonical fields/indexes
  - Create models: `Organization`, `Department`, `User`, `Task` (base + discriminators), `TaskActivity`, `TaskComment`, `Material`, `Vendor`, `Attachment`, `Notification`
  - Enforce canonical enums, constraints, and immutable-field rules
  - Add multi-tenant indexes (organization/department scoped uniques)
  - Add notification TTL index (`expiresAt`)
  - Enforce CAN-021: Attachment parentModel excludes Material
  - Detailed model extraction to enforce in this task:
    - Organization model must include identity/contact, verification metadata, and immutable `isPlatformOrg` behavior with soft-delete support.
    - Department model must enforce status enum `ACTIVE|INACTIVE` (CAN-022), description max 500 (CAN-026), manager relation, and organization-scoped uniqueness.
    - User model must enforce role/status enums, org+dept references, `isHod`, `isPlatformOrgUser`, verification and security metadata, and immutable-field guard targets (CAN-016).
    - User employeeId must follow canonical 4-digit non-`0000` pattern with organization-scoped uniqueness.
    - Task base model must enforce canonical status/priority enums (CAN-013), tag limits, tenant scope fields, and soft-delete fields.
    - Task discriminators must enforce type-specific required fields:
      - ProjectTask vendor + `startDate/dueDate` ordering.
      - AssignedTask assignee constraints + date ordering.
      - RoutineTask date + embedded materials behavior.
    - TaskActivity and TaskComment models must support parent polymorphism and tenant scope; TaskComment depth metadata must support depth <= 5 enforcement.
    - Material model must include canonical SKU/inventory/status structure and department-scoped uniqueness (CAN-019).
    - Vendor model must include extended fields and status/rating/partner metadata (CAN-020).
    - Attachment model must enforce parent allowlist excluding Material (CAN-021) and file metadata needed for extension/fileUrl validation (CAN-027).
    - Notification model must support read-state and expiry with TTL index for auto-cleanup.
    - Indexes must support canonical list/filter contracts for org/dept/status/role/type/priority/date and includeDeleted scenarios.
  - _Requirements: 44, 46, 35 (CAN-015, CAN-016, CAN-019, CAN-020, CAN-021, CAN-022, CAN-026, CAN-027), Design: Models_

- [ ] 2.3 Implement validator modules for all resources
  - Create per-resource validators in `backend/validators/*`
  - Enforce `.run(req)` execution and centralized validation middleware response shape
  - Ensure withDeleted existence checks for create/restore collision paths
  - Enforce scope-aware validation (org-only vs org+dept)
  - Detailed validation extraction to enforce in this task:
    - Validators must encode canonical field bounds and formats (lengths, enums, required/optional logic) for auth, users, departments, tasks, comments, activities, materials, vendors, attachments, notifications, and dashboard filters.
    - Organization/User/Vendor phone validators must use canonical Ethiopian regex (CAN-006).
    - Department validators must enforce 500-char description maximum on create/update (CAN-026).
    - Task validators must enforce per-type required payload fields, status/priority enums, date ordering, and tag constraints.
    - Comment validators must enforce depth <= 5 and mention constraints.
    - Attachment validators must enforce extension allowlist and cloudinary URL pattern rules.
    - Material/Vendor delete and restore validators must use `.withDeleted()` checks and deterministic conflict behavior (CAN-015).
    - User update validators must enforce immutable-field conflict rules for Admin/Manager/User targets (CAN-016).
    - Filter validators must normalize and sanitize union-filter combinations required by CAN-004.
  - _Requirements: 44, 24, 35 (CAN-004, CAN-006, CAN-027), Design: Validation_

- [ ] 2.4 Implement auth + authorization + tenant scoping middleware (full)
  - Complete JWT cookie extraction and verification
  - Attach normalized `req.user` context (`role`, `organization`, `department`, `isPlatformOrgUser`, `isHod`)
  - Implement authorization engine from canonical matrix JSON (allow if ANY rule passes)
  - Implement 401 refresh behavior and 403 handling semantics (do not force logout behavior in API)
  - Detailed auth/rbac extraction to enforce in this task:
    - Authorization matrix JSON from PRD Section 8.4 is single source of truth; middleware must evaluate matrix candidates and allow if any candidate rule passes (CAN-005).
    - Middleware must evaluate `requires`, `scope`, `ownership`, and resource-type predicates consistently.
    - Scope semantics must cover `any`, `ownOrg`, `ownOrg.ownDept`, and allowed cross-department reads per role matrix.
    - Ownership checks must support canonical ownership predicates (`self`, `createdBy`, `assignees`, `watchers`, `mentioned`, `uploadedBy`, `manager`).
    - Non-platform users must be prevented from cross-organization access in all protected flows.
    - Platform SuperAdmin cross-org access must remain matrix-restricted, not unconditional.
    - Inactive and unverified account restrictions must be enforced in auth paths according to canonical behavior.
    - 401 and 403 behaviors must remain contract-distinct to preserve frontend refresh/toast-only handling expectations.
  - _Requirements: 19, 43, 60, 62, 35 (CAN-005, CAN-012)_

- [ ] 2.5 Implement service scaffolds
  - `backend/services/emailService.js` (verification/welcome/reset/contact templates)
  - `backend/services/notificationService.js` (in-app + optional email orchestration)
  - `backend/services/socketService.js` (connect/auth/room/event abstractions)
  - Keep runtime-safe no-op fallbacks for missing integrations in local dev
  - Detailed service extraction to enforce in this task:
    - Email service templates must support verification, welcome/onboarding, password reset, and vendor contact workflows.
    - Notification service must support notification creation, single-read, mark-all-read, optional delete, and expiry compatibility.
    - Socket service must support authenticated room orchestration (`user:{id}`, `org:{id}`, `dept:{id}`, `task:{id}`) and event broadcast primitives.
    - Service interfaces must remain controller-oriented and integration-safe for local development when external providers are not configured.
    - Event and notification payloads must remain tenant-safe and authorization-compatible.
  - _Requirements: 14, 15, 19, Design: Services_

- [ ] 2.6 Create canonical route files with controller placeholders
  - `backend/routes/authRoutes.js`
  - `backend/routes/userRoutes.js`
  - `backend/routes/departmentRoutes.js`
  - `backend/routes/taskRoutes.js`
  - `backend/routes/materialRoutes.js`
  - `backend/routes/vendorRoutes.js`
  - `backend/routes/attachmentRoutes.js`
  - `backend/routes/notificationRoutes.js`
  - `backend/routes/dashboardRoutes.js`
  - Include only canonical MVP endpoints from PRD Section 18
  - Detailed route-contract extraction to enforce in this task:
    - Auth endpoints: register, verify-email, resend-verification, login, refresh, logout, forgot-password, reset-password, change-password.
    - User endpoints: list/create/get/update/delete/restore plus preferences, security, activity, performance.
    - Department endpoints: list/create/get/update/delete/restore plus department dashboard and department activity feed.
    - Task endpoints: list/create/get/update/delete/restore plus nested activity/comment resource endpoints.
    - Material endpoints: list/create/get/update/delete/restore, usage history, restock.
    - Vendor endpoints: list/create/get/update/delete/restore and contact vendor.
    - Attachment endpoints: create/delete/restore with task-context parent allowlist.
    - Notification endpoints: list/read-one/mark-all-read/optional delete.
    - Dashboard endpoints: org overview and department dashboard.
    - Explicitly keep `/api/organizations` standalone CRUD out of canonical MVP route inventory.
    - Route declaration order must preserve middleware chain contract: auth -> validation -> authorization -> controller.
  - _Requirements: 54, 62, Design: API Contract_

- [ ] 2.7 Wire all routes and middleware in app/server
  - Mount canonical API route prefixes in `backend/app.js`
  - Attach error/notFound middleware at the end of stack
  - Initialize socket service from `backend/server.js` with shared auth secret
  - Keep app/server startup flow synchronized
  - Detailed bootstrap extraction to enforce in this task:
    - Prefix mounts must remain stable and canonical for all resource groups (`/api/auth`, `/api/users`, `/api/departments`, `/api/tasks`, `/api/materials`, `/api/vendors`, `/api/attachments`, `/api/notifications`, `/api/dashboard`).
    - Middleware order in app composition must preserve deterministic validation and authorization behavior across resources.
    - `notFound` middleware must be after route mounts; centralized error responder must be final.
    - Server bootstrap must initialize socket integration with JWT auth compatibility shared with HTTP auth middleware.
    - Any bootstrapping change must keep `app.js` and `server.js` synchronized by phase rule.
  - _Requirements: 14, 19, 54, Design: Bootstrap_

- [ ] 2.8 Create seed/wipe baseline scripts
  - Create `backend/mock/seed.js` for platform org bootstrap (`isPlatformOrg=true`)
  - Create `backend/mock/wipe.js` to clear test data safely
  - Reserve `backend/mock/data.js` for deterministic test fixtures
  - Ensure seed creates platform org + platform dept + platform SuperAdmin (`isPlatformOrgUser=true`, `isHod=true`)
  - Detailed extraction to enforce in this task:
    - Seed flow must create Platform Organization (immutable), Platform Department, and Platform SuperAdmin user with `isPlatformOrgUser=true` and `isHod=true`.
    - Platform creation must resolve circular references in sequence: create org, create dept, create user, then update `department.manager` and `organization.createdBy`.
    - Seeded platform entities are required prerequisites for cross-organization authorization and role-matrix regression scenarios in later phases.
    - Wipe script must protect against accidental destructive behavior and remain suitable for repeatable manual API verification cycles.
    - Fixture file reservation must support deterministic IDs/relations for org, dept, user, task, material, and vendor scenarios introduced in later phases.
  - _Requirements: 62, 44, Design: Seeding_

- [ ] 2.9 Prepare fixture data and scripts for vertical-slice phases
  - Extend `backend/mock/data.js` with org/department/user/task/material/vendor fixtures
  - Ensure fixtures cover status/priority/type permutations and deleted records
  - Add scripted scenarios for low stock, vendor associations, comment depth, inactive departments
  - Detailed fixture extraction to enforce in this task:
    - Include platform and customer organization contexts for cross-tenant authorization verification.
    - Include role fixtures for Platform SuperAdmin, SuperAdmin, Admin, Manager, and User with HOD and non-HOD variants.
    - Include active and inactive department fixtures for create-block enforcement paths.
    - Include task fixtures for all three types with varied status/priority/date/tag/assignee/watcher permutations.
    - Include material fixtures with low-stock and inventory edge cases plus association links.
    - Include vendor fixtures with status/rating/verified permutations and task associations.
    - Include comment fixtures reaching depth boundary and mention scenarios.
    - Include soft-deleted fixtures for list/includeDeleted/restore conflict scenarios.
  - _Requirements: 34, 46, Design: Test Data_

- [ ] 2.10 Tests (Backend)
  - No backend resource tests in Phase 2 (controllers are still placeholders or partial)
  - Manual verification: model validation, route registration, middleware authorization flow
  - Detailed manual verification extraction:
    - Validate schema-level constraint failures and success paths for representative payloads.
    - Validate route inventory matches canonical endpoint contracts from PRD Section 18.
    - Validate auth middleware user-context extraction and authorization middleware allow/deny behavior for matrix sample cases.
    - Validate default deleted exclusion and `.withDeleted()` query behavior in validation and existence checks.

### Frontend

- [ ] 2.11 Configure store and RTK Query base layer
  - Create `client/src/store/index.js` and slices for auth/theme/resource view state
  - Create `client/src/services/api.js` with baseQuery and credentials policy
  - Implement auth refresh flow integration at API layer
  - Detailed extraction to enforce in this task:
    - Store architecture must separate auth/session state, UI preference state (including theme), and resource-view state (filters, pagination, view mode, dialog state) to support consistent behavior across all list/detail pages.
    - RTK Query base layer must use cookie-auth credentials mode and canonical response/error transform contracts so frontend handlers receive stable payload shapes from Section 18 endpoints.
    - Auth refresh behavior must follow canonical policy: on 401 attempt refresh, retry original request, and only logout if refresh fails; 403 must never trigger logout (CAN-012).
    - API cache strategy must support per-resource invalidation and real-time reconciliation in later phases for tasks/comments/notifications/dashboard widgets.
    - Base-layer error mapping must remain compatible with centralized toast behavior, preserving deterministic handling for 401/403/409/429/network failures.
  - _Requirements: 19, 58, 61, Design: State/API Architecture_

- [ ] 2.12 Add endpoint scaffolds matching backend canonical contracts
  - Auth endpoints
  - Users endpoints (`/preferences`, `/security`, `/activity`, `/performance`)
  - Departments endpoints (`/activity`, `/dashboard`)
  - Tasks endpoints (`/activities`, `/comments`, `/restore`)
  - Materials endpoints (`/restock`, `/usage`, `/restore`)
  - Vendors endpoints (`/contact`, `/restore`)
  - Notifications endpoints (`PATCH /api/notifications/mark-all-read`)
  - Dashboard endpoints (`/api/dashboard/overview`, `/api/departments/:departmentId/dashboard`)
  - Reusable component contract impact:
    - `MuiDataGrid` + `MuiDataGridToolbar` must receive endpoint-compatible server pagination, sorting, search, and union-filter params for all list resources.
    - `MuiFilterButton`, `MuiSearchField`, and `MuiPagination` must map to canonical query contract (`page`, `limit`, `sortBy`, `sortOrder`, `q`, `includeDeleted`, resource filters) from PRD Section 18.
    - `MuiDialog` and form wrappers must map submit payloads to canonical create/update endpoints for Users/Departments/Tasks/Materials/Vendors.
  - Detailed extraction to enforce in this task:
    - Endpoint scaffold inventory must match canonical Section 18 contracts exactly and remain segmented by resource domain (`auth`, `users`, `departments`, `tasks`, `materials`, `vendors`, `attachments`, `notifications`, `dashboard`).
    - List endpoint query builders must normalize canonical list params (`page`, `limit`, `sortBy`, `sortOrder`, `search/q`, `includeDeleted`) plus resource-specific filter unions (CAN-004).
    - Mutation endpoints must preserve canonical method/path behavior for soft-delete/restore actions and nested resource operations (activities/comments/usage/restock/contact/mark-all-read).
    - Frontend endpoint layer must not introduce or depend on forbidden non-canonical routes (notably standalone `/api/organizations/*` CRUD in canonical MVP flow).
    - Typed endpoint contracts must align with reusable UI wrappers so list pages, dialogs, and detail tabs consume a single normalized request/response schema.
  - _Requirements: 54, 63, Design: API Contracts_

- [ ] 2.13 Implement cross-cutting hooks/utilities
  - `useAuth`, `useAuthorization`, `useResponsive`, `useDebounce`, `useTimezone`
  - Date formatting via `Intl.DateTimeFormat` for all user-facing formatting
  - Error-to-toast normalization helper (403 toast-only)
  - Reusable component dependencies:
    - `useResponsive` drives `MuiDialog` full-height xs behavior (CAN-017), `MuiBottomNavigation` visibility (CAN-002), and `MuiDataGrid` responsive column handling (CAN-023).
    - `useTimezone` and `Intl.DateTimeFormat` formatting utilities are consumed by `MuiDataGrid` columns, `MuiTimeline`, and dashboard/task/user activity timestamps (CAN-014).
  - Detailed extraction to enforce in this task:
    - `useAuth` must expose authenticated user/session state and canonical auth helpers used by route guards, profile menus, and protected action controls.
    - `useAuthorization` must evaluate permissions using the canonical matrix contract and route/component-level checks, avoiding duplicated hardcoded role logic.
    - `useResponsive` must implement canonical breakpoints (CAN-001) and drive mobile-only behaviors (bottom nav/FAB/dialog full-height/list-card columns).
    - `useDebounce` must be used for search/filter commit behavior so list querying remains performant and consistent with requirements around controlled rerenders.
    - `useTimezone` and date utilities must enforce CAN-014: user-facing formatting via `Intl.DateTimeFormat`; dayjs usage restricted to internal computations and picker adapters.
    - Error normalization helper must preserve canonical UX: 403 toast-only, 401 refresh-first semantics, conflict and rate-limit messaging surfaced via toast contracts.
  - _Requirements: 58, 60, 35 (CAN-012, CAN-014), Design: Hooks/Utils_

- [ ] 2.14 Implement reusable component foundations
  - Reusable `MuiDataGrid` wrapper + toolbar
  - Full-height mobile dialog helper pattern (CAN-017)
  - Shared empty/loading/error states
  - File upload input primitives for later task/detail modules
  - Reusable components to validate/develop from UI references and canonical requirements:
    - `MuiDataGrid`: canonical Grid view for Tasks/Users/Departments/Materials/Vendors and dashboard deadlines table; must support row selection, server pagination, sorting, loading, empty state (`docs/ui/tasks_list_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_list_view_screen.png`, `docs/ui/materials_list_view_screen.png`, `docs/ui/vendors_list_view_screen.png`, `docs/ui/desktop_dashboard_overview_screen.png`).
    - `MuiDataGridToolbar`: shared search/filter/export/column visibility/density controls in all Grid views (`docs/ui/tasks_list_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_list_view_screen.png`).
    - `MuiViewToggle`: grid/list mode toggle for Tasks/Users/Departments, with Grid=`MuiDataGrid` and List=cards semantics (CAN-023) (`docs/ui/tasks_grid_view_screen.png`, `docs/ui/tasks_list_view_screen.png`, `docs/ui/users_grid_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_grid_view_screen.png`, `docs/ui/departments_list_view_screen.png`).
    - `MuiFilterButton`: canonical entry action to open resource filter dialogs (`docs/ui/tasks_filter_dialog_screen.png`, `docs/ui/users_filter_dialog_screen.png`, `docs/ui/departments_filter_dialog_screen.png`).
    - `MuiSearchField`: standard search input appearance/behavior in list and details headers (`docs/ui/tasks_list_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_list_view_screen.png`, `docs/ui/materials_list_view_screen.png`, `docs/ui/vendors_list_view_screen.png`, `docs/ui/material_details_screen.png`, `docs/ui/vendor_details_screen.png`).
    - `MuiDialog`: canonical modal container for create/update/filter/contact/restock flows; must enforce xs `100vh` pattern and required MUI a11y props (CAN-017) (`docs/ui/create_update_task_dialog_screen.png`, `docs/ui/create_update_user_dialog_screen.png`, `docs/ui/create_update_department_dialog_screen.png`, `docs/ui/tasks_filter_dialog_screen.png`, `docs/ui/users_filter_dialog_screen.png`, `docs/ui/departments_filter_dialog_screen.png`).
    - `MuiDialogConfirm`: reusable soft-delete/restore confirmation dialog for all resources with conflict-safe messaging (CAN-015).
    - `MuiEmptyState`: consistent no-data state with optional CTA for empty lists/details.
    - `MuiLoading`: shared loading block/full-screen loading pattern for route/page/modal waiting states.
    - `MuiTimeline`: activity feed renderer for task comments/activities, department all-activity stream, user activity stream, and dashboard recent activity (`docs/ui/task_details_activities_screen.png`, `docs/ui/task_details_comments_screen.png`, `docs/ui/dept_details_activity_tab_screen.png`, `docs/ui/user_details_activity_screen.png`, `docs/ui/desktop_dashboard_overview_screen.png`).
    - `MuiAvatarStack`: assignee/member stacks in tasks, departments, and detail cards (`docs/ui/tasks_grid_view_screen.png`, `docs/ui/departments_grid_view_screen.png`, `docs/ui/departments_list_view_screen.png`, `docs/ui/task_details_overview_screen.png`).
    - `MuiChip`: canonical status/priority/role/category chips with enum mapping (CAN-013) (`docs/ui/tasks_grid_view_screen.png`, `docs/ui/tasks_list_view_screen.png`, `docs/ui/users_grid_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_filter_dialog_screen.png`, `docs/ui/materials_list_view_screen.png`, `docs/ui/vendors_list_view_screen.png`).
    - `MuiPagination`: standardized page navigation in list/grid pages (`docs/ui/tasks_grid_view_screen.png`, `docs/ui/tasks_list_view_screen.png`, `docs/ui/users_grid_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/departments_grid_view_screen.png`, `docs/ui/departments_list_view_screen.png`, `docs/ui/materials_list_view_screen.png`, `docs/ui/vendors_list_view_screen.png`).
    - `MuiActionColumn`: reusable action-cell controls (view/edit/delete/restore) for all tabular resources.
    - `MuiStatCard` + `MuiProgress`: KPI/metric card primitives for dashboard, department overview, user performance, vendor/material details (`docs/ui/desktop_dashboard_overview_screen.png`, `docs/ui/dept_details_overview_tab_screen.png`, `docs/ui/user_details_performance_screen.png`, `docs/ui/vendor_details_screen.png`, `docs/ui/material_details_screen.png`).
    - Form wrappers required by dialogs/forms: `MuiTextField`, `MuiNumberField`, `MuiSelectAutocomplete`, `MuiMultiSelect`, `MuiCheckbox`, `MuiSwitch`, `MuiRating`, `MuiSlider`.
    - Shared utility wrappers required across list/dialog/form flows: `MuiToggleButton`, `MuiTooltip`, `MuiBackdrop`.
    - Layout wrappers required by canonical navigation: `MuiBottomNavigation`, `MuiFAB`, `MuiThemeDropDown`, `MuiAppIconLogo`.
  - Detailed extraction to enforce in this task:
    - Component foundations must encode canonical view semantics: Grid view uses `MuiDataGrid`, List view uses cards in responsive MUI Grid layout (CAN-023).
    - `MuiDataGrid` wrappers must support server pagination/sort/search, row selection, virtualized rendering for long lists, and default page-size behavior aligned with canonical list contracts.
    - Dialog foundation must encode full-height mobile behavior at width <= 600 with required accessibility props and safe-area styling (CAN-017).
    - Shared chips/badges/labels must implement canonical enum-to-label mapping for status/priority/role/category, preserving backend enum values in payloads (CAN-013).
    - Shared file-input primitives must enforce canonical attachment guards for extension/file size/user feedback patterns and support task-context flows only (CAN-021/CAN-027).
    - Shared loading/empty/error primitives must remain consistent across all pages to satisfy traceability checklist criteria for frontend UX and error handling.
    - Reusable exports must preserve strict `Mui*` naming and remain the only component surface used by feature pages for consistency.
  - _Requirements: 59, 61, 35 (CAN-017, CAN-023), Design: Reusable Components_

- [ ] 2.15 Build auth/public page skeletons (connected to placeholder APIs)
  - Pages: Login, Register (4-step wizard), Verify Email, Forgot Password, Reset Password
  - Enforce CAN-007 (no terms checkbox)
  - Use PRD image/copy alignment for public CTAs: “Log In” and “Sign Up” (CAN-025)
  - Reusable components to validate/develop for this task:
    - `MuiAppIconLogo`, `MuiThemeDropDown`, and public CTA/button patterns aligned to `docs/ui/landing-page.png` and `docs/ui/public_layout_screen.png`.
    - Auth-form wrappers: `MuiTextField`, `MuiNumberField`, `MuiSelectAutocomplete`, `MuiCheckbox`, `MuiLoading`.
    - `MuiDialog` for verification/reset helper modals with canonical mobile behavior.
  - Detailed extraction to enforce in this task:
    - Public/auth screens must preserve canonical page inventory and flow sequence: Login, 4-step Register wizard, Verify Email, Forgot Password, Reset Password.
    - Registration UX must explicitly omit terms acceptance controls (CAN-007) and align onboarding semantics with org+department+superadmin creation contract.
    - Public header/footer and hero content must remain aligned with landing/public references, including canonical CTA labels `Log In` and `Sign Up` (CAN-025).
    - Verification flow skeletons must support verify-email and resend-verification interactions, with state messaging for unverified/inactive access constraints.
    - Login and password-recovery skeletons must align with auth endpoint contracts and preserve toast-first feedback behavior for validation and auth failures.
    - All auth/public modal behaviors must respect canonical responsive dialog rules, especially xs full-height handling.
  - _Requirements: 19, 35 (CAN-007, CAN-025), UI refs: `landing-page.png`, `public_layout_screen.png`_

- [ ] 2.16 Tests (Frontend)
  - No frontend test implementation
  - Manual validation only: auth skeleton flows, toasts, route guards, responsive dialog behavior
  - Detailed manual verification extraction:
    - Validate public/auth route rendering and navigation links across desktop and mobile shell variants.
    - Validate registration wizard structure, verify-email/resend placeholders, and absence of terms checkbox (CAN-007).
    - Validate auth error UX contracts: 401 refresh/logout compatibility, 403 toast-only behavior, and consistent success/error toast rendering.
    - Validate responsive dialog behavior for auth helpers at xs breakpoint (100vh full-height behavior).
    - Validate canonical CTA labels and brand/header composition against public UI references.

---

## Phase 3: Department and User Vertical Slice (Backend -> Frontend)

**Phase Gate**:

- Phase 2 complete (models, validators, route scaffolds).
- Backend Dept/User endpoints must be complete before frontend screens start.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 3.1 Implement Department controller logic (full)
  - `listDepartments` with canonical filters (search/status/manager/member-count/date/includeDeleted/organizationId rules)
  - `createDepartment` with manager validation and description max 500
  - `getDepartment` with detail aggregates required by header cards
  - `getDepartmentDashboard` for overview tab KPIs/charts
  - `getDepartmentActivity` for Tasks sub-tabs (All Activity / Comments / Files filtering)
  - `updateDepartment` and `deleteDepartment`/`restoreDepartment`
  - Enforce inactive department creation-block rules (users/tasks/materials)
  - Detailed extraction to enforce in this task:
    - Department list filtering must support canonical dimensions: text search, status, manager/HOD selection, member-count range, created date range, includeDeleted, and organizationId restrictions for platform-only contexts.
    - Department create must enforce name + description constraints, org scope, and valid manager role constraints where manager is provided.
    - Department description validation must remain max 500 chars in all create/update paths (CAN-026).
    - Department status must enforce `ACTIVE|INACTIVE` lifecycle behavior (CAN-022), including 409 blocking of new User/Task/Material creation for inactive departments.
    - Department detail payload must satisfy details screens/contracts: header metadata and summary aggregates for users/tasks/active tasks.
    - Department dashboard endpoint must provide overview analytics payload for overview tab widgets.
    - Department activity endpoint must provide chronological feed with filters supporting All Activity/Tasks/Comments/Files views.
    - Delete/restore operations must follow soft-delete cascade expectations for department-scoped dependents.
  - _Requirements: 41, 42, 54, 62, 35 (CAN-018, CAN-022, CAN-026)_

- [ ] 3.2 Implement User controller logic (full)
  - `listUsers` with canonical filters (department/role/joined/includeDeleted)
  - `createUser` with auto-verified onboarding + welcome email behavior
  - `getUser` detail payload for Overview tab
  - `getUserActivity` and `getUserPerformance`
  - `updateUser` with immutable field protection for Admin/Manager/User targets
  - `updateUserPreferences` and `updateUserSecurity`
  - `deleteUser` and `restoreUser`
  - Detailed extraction to enforce in this task:
    - User list filtering must support canonical query dimensions: search, department, role, joined date range, includeDeleted, and tenant-safe organization constraints.
    - User create must enforce required profile fields, role constraints, department scope, canonical phone validation, and auto-verification/welcome flows for organization-created users.
    - User create must generate employeeId under canonical format constraints and handle uniqueness within organization scope.
    - User detail endpoint must return data required by Overview/Tasks/Activity/Performance tabs.
    - User activity endpoint must provide chronological activity feed contract; performance endpoint must provide KPI/review/trend contract used by performance tab.
    - User update must enforce immutable fields for Admin/Manager/User targets and return deterministic conflict behavior (CAN-016).
    - Preferences update must support appearance/notification/date-time settings contract; security update must support security settings contract.
    - User delete/restore must respect cascade side-effects and ownership detachment expectations (tasks/comments/mentions/watchers/assignees/notifications).
    - Read scope rules by role must be enforced: platform superadmin cross-org (matrix-governed), superadmin/admin own-org, manager/user own-dept.
  - _Requirements: 40, 43, 54, 63, 35 (CAN-011, CAN-016)_

- [ ] 3.3 Finalize auth controllers for production behavior
  - Register/verify-email/resend verification flow
  - Login/refresh/logout cookie + token rotation semantics
  - Forgot/reset/change password flows
  - Block unverified/inactive access exactly per canonical behavior
  - Detailed extraction to enforce in this task:
    - Registration flow must support onboarding sequence creating organization, initial department, and initial superadmin user in deterministic order.
    - Registration-created org/user verification state must remain unverified until email verification completes (CAN-008).
    - Verification endpoint must atomically set user/org verified state, clear verification tokens, and ensure welcome email idempotency.
    - Resend verification must regenerate and reissue verification token/email under guarded conditions.
    - Login must enforce credential validity, verified status, active status, and issue secure cookie-based access/refresh token pair.
    - Refresh must validate refresh token and apply rotation semantics without violating session continuity rules.
    - Logout must clear auth cookies and terminate auth session context.
    - Forgot/reset/change-password flows must enforce token validity and password policy contracts.
  - _Requirements: 19, 62, 35 (CAN-008)_

- [ ] 3.4 Finalize Dept/User/Auth route wiring with validation and authorization
  - Attach validators to all payload and param routes
  - Ensure organizationId query parameter restrictions for non-platform users
  - Ensure standardized success/error response shapes
  - Detailed extraction to enforce in this task:
    - Every department/user/auth endpoint must run canonical validator sets before controller execution.
    - Authorization middleware must be applied per action according to matrix requirements and resource ownership/scope.
    - Organization query overrides must be blocked for non-platform users and matrix-governed for platform contexts.
    - Response contracts must remain standardized across success and failure paths to preserve frontend handling compatibility.
    - Route files must stay aligned with canonical Section 18 endpoint list and method/path contracts.
  - _Requirements: 24, 43, 54_

- [ ] 3.5 Implement Dept/User socket + notification events
  - Emit user create/update/status events to scoped rooms
  - Emit department update events where required
  - Ensure event payloads contain only tenant-scoped data
  - Detailed extraction to enforce in this task:
    - User lifecycle changes must emit room-scoped events to authorized user/org/dept recipients only.
    - Department updates relevant to list/detail/dashboard flows must emit scoped update events for live UI refresh.
    - Notification records for user/department events must align with notification schema and unread/read behavior.
    - Event payloads must not expose cross-tenant identifiers or unauthorized entity details.
    - Socket event naming and payload shape must remain consistent with service-layer contracts used by frontend cache update handlers.
  - _Requirements: 14, 15, 60_

- [ ] 3.6 Tests (Backend)
  - Manual API verification for Auth, Users, Departments
  - Validate role matrix behavior across platform and customer org contexts
  - Validate immutable fields, inactive department restrictions, includeDeleted behavior
  - Validate department activity and dashboard payload contracts
  - _No test frameworks; use manual/curl/Postman scripts_
  - Detailed manual verification extraction:
    - Execute role-by-role checks for platform and customer tenants across all department/user/auth routes.
    - Verify auth flows: register, verify, resend, login, refresh, logout, forgot/reset/change-password with correct status/error contracts.
    - Verify immutable field conflict behavior for prohibited user target updates.
    - Verify inactive-department create-block enforcement for user/task/material creation attempts.
    - Verify includeDeleted toggle behavior and restore pathways.
    - Verify department dashboard/activity response completeness against tab-level data expectations.

### Frontend

- [ ] 3.7 Implement Users list page (grid/list) + filter dialog + create/edit dialog
  - Align with `docs/ui/users_grid_view_screen.png`, `docs/ui/users_list_view_screen.png`, `docs/ui/users_filter_dialog_screen.png`, `docs/ui/create_update_user_dialog_screen.png`
  - Keep view-toggle semantics consistent with CAN-023
  - Support role-gated actions and includeDeleted toggle behavior
  - Reusable components to validate/develop for this task:
    - `MuiViewToggle`, `MuiDataGrid`, `MuiDataGridToolbar`, `MuiPagination`, `MuiActionColumn` for Grid/List parity and action handling.
    - `MuiSearchField` + `MuiFilterButton` to drive list-level filtering UX and open `MuiDialog`-based filter modal.
    - `MuiDialog` for create/update user form and filter dialog; `MuiDialogConfirm` for delete confirmation.
    - `MuiChip` for role/status labels and canonical enum display mapping.
    - `MuiAvatarStack` for assignee/member visual stacks in list/card variants.
    - `MuiLoading`/`MuiEmptyState` for fetch/empty states.
  - Endpoint contracts consumed by this task (PRD Section 18):
    - `GET /api/users` (pagination/search/filter/includeDeleted)
    - `POST /api/users`, `PUT /api/users/:userId`, `DELETE /api/users/:userId`, `PATCH /api/users/:userId/restore`
  - Detailed extraction to enforce in this task:
    - Users page must support both canonical display modes (Grid=`MuiDataGrid`, List=cards) with parity in filtering, sorting, pagination, and action availability (CAN-023).
    - Users filter dialog must include canonical controls: department multi-select, role, joined-at range, and includeDeleted toggle, aligned with `docs/ui/users_filter_dialog_screen.png`.
    - Users list/grid content must surface canonical identity and management attributes (name, contact, role, department, joined date, status/online indicators, actions) with responsive truncation/ellipsis behavior.
    - Create/update user dialog must align with `docs/ui/create_update_user_dialog_screen.png` structure, including personal info, role/department assignment, HOD toggle semantics, and profile details sections.
    - Role-gated action visibility must follow canonical permission matrix for view/edit/delete/restore and must preserve 403 toast-only UX on forbidden actions.
    - IncludeDeleted handling must round-trip to API query params and remain consistent across both grid/list views and pagination state.
  - _Requirements: 40, 61, 59_

- [ ] 3.8 Implement User details page with canonical tabs
  - Tabs: Overview, Tasks, Activity, Performance
  - Overview aligned to `docs/ui/user_details_overview_screen.png`
  - Tasks aligned to `docs/ui/user_details_tasks_screen.png`
  - Activity aligned to `docs/ui/user_details_activity_screen.png`
  - Performance aligned to `docs/ui/user_details_performance_screen.png`
  - Reusable components to validate/develop for this task:
    - `MuiTimeline` for chronological activity feed rendering with avatar/timestamp/action text.
    - `MuiDataGrid` for Tasks-tab tabular listing where applicable.
    - `MuiStatCard`, `MuiProgress`, and chart containers for performance widgets and KPI summaries.
    - `MuiChip` for role/status labels; `MuiAvatarStack` for assignees and collaborators.
    - `MuiSearchField` + `MuiFilterButton` for tab-level task/activity filtering.
    - `MuiDialog` for edit profile/user actions.
  - Endpoint contracts consumed by this task:
    - `GET /api/users/:userId`
    - `GET /api/users/:userId/activity`
    - `GET /api/users/:userId/performance`
    - `GET /api/tasks` (for user Tasks tab filters such as assigned/created/watching)
  - Detailed extraction to enforce in this task:
    - User details IA must be exactly `Overview`, `Tasks`, `Activity`, `Performance` (CAN-011) with tab content matching provided reference screens.
    - Overview tab must include profile header context, personal info card, role/department metadata, task stats, skills/proficiency widgets, and recent activity summary as shown in user detail overview references.
    - Tasks tab must support canonical scoped task views (assigned/created/watching) with list-level search/filter/pagination behavior.
    - Activity tab must render chronological activity feed with timestamps, entity references, and action text formatting consistent with `MuiTimeline` usage and canonical date formatting rules.
    - Performance tab must render KPI metrics, throughput/efficiency visualizations, and review history sections aligned with `docs/ui/user_details_performance_screen.png`.
    - Detail page actions and editable fields must remain role-gated and tenant-safe, preserving immutable-target rules and toast-only forbidden feedback.
  - _Requirements: 40, 35 (CAN-011), UI refs listed above_

- [ ] 3.9 Implement Departments list page (grid/list) + filter + create/edit dialog
  - Align with `docs/ui/departments_grid_view_screen.png`, `docs/ui/departments_list_view_screen.png`, `docs/ui/departments_filter_dialog_screen.png`, `docs/ui/create_update_department_dialog_screen.png`
  - Enforce description max 500 and status chips
  - Reusable components to validate/develop for this task:
    - `MuiViewToggle`, `MuiDataGrid`, `MuiDataGridToolbar`, `MuiPagination`, `MuiActionColumn`.
    - `MuiSearchField` + `MuiFilterButton` to open department filter dialog and support search.
    - `MuiDialog` for create/update/filter flows with mobile full-height behavior (CAN-017).
    - `MuiChip` for ACTIVE/INACTIVE status and task-count chips.
    - `MuiAvatarStack` for manager/team preview stacks.
    - `MuiLoading`/`MuiEmptyState` for load and no-result handling.
  - Endpoint contracts consumed by this task:
    - `GET /api/departments`
    - `POST /api/departments`, `PUT /api/departments/:departmentId`, `DELETE /api/departments/:departmentId`, `PATCH /api/departments/:departmentId/restore`
  - Detailed extraction to enforce in this task:
    - Departments page must support both canonical views (Grid/DataGrid and card-list mode) with consistent behaviors for search/filter/pagination/actions (CAN-023).
    - Department list/grid fields must align with references: department identity (icon/name/id), description, manager, members/avatar stack, task counts/status, created date, and row/card actions.
    - Filter dialog must include canonical controls from requirements: name search, status, head-of-department selector, member-count range, date-added range, includeDeleted, and organization filter (platform superadmin-only context).
    - Create/update department dialog must align with `docs/ui/create_update_department_dialog_screen.png`, enforce max description length 500 (CAN-026), manager selection rules, and validation messaging.
    - Status handling must implement ACTIVE/INACTIVE chip/display semantics and preserve downstream create-block awareness for inactive departments (CAN-022).
    - Restore/delete flows must be role-gated and conflict-safe with consistent confirmation and toast messaging contracts.
  - _Requirements: 41, 35 (CAN-022, CAN-026)_

- [ ] 3.10 Implement Department details page with canonical IA
  - Top-level tabs: Overview, Members, Tasks (no top-level Activity tab)
  - Overview aligned to `docs/ui/dept_details_overview_tab_screen.png`
  - Members aligned to `docs/ui/dept_details_users_tab_screen.png`
  - Tasks aligned to `docs/ui/dept_details_tasks_tab_screen.png`
  - Tasks sub-tabs include All Activity, Tasks, Comments, Files; activity feed aligned to `docs/ui/dept_details_activity_tab_screen.png`
  - Enforce sidebar-only department selector (HOD only); none in detail header
  - Reusable components to validate/develop for this task:
    - `MuiStatCard`/`MuiProgress` for overview KPI blocks and progress strips.
    - `MuiDataGrid` + `MuiDataGridToolbar` for Members and Tasks tabular sections.
    - `MuiTimeline` for Tasks -> All Activity stream with task/comment/file variants.
    - `MuiSearchField`, `MuiFilterButton`, `MuiChip`, and `MuiAvatarStack` for scoped filtering and visual metadata.
    - `MuiDialog` for edit department and nested create actions from details context.
  - Endpoint contracts consumed by this task:
    - `GET /api/departments/:departmentId`
    - `GET /api/departments/:departmentId/dashboard`
    - `GET /api/departments/:departmentId/activity`
    - `GET /api/tasks` (department-scoped task lists/sub-tabs)
  - Detailed extraction to enforce in this task:
    - Department details top-level IA must remain exactly 3 tabs (`Overview`, `Members`, `Tasks`), with activity represented as Tasks sub-tab content (`All Activity`) and not as a top-level tab (CAN-018).
    - Overview tab must render KPI/stat widgets, completion charts, active members section, and recent activity/task summaries aligned with `docs/ui/dept_details_overview_tab_screen.png`.
    - Members tab must render department-scoped user management list with search/filter/sort/action affordances per role permissions.
    - Tasks tab must render summary cards, task list/filter controls, and sub-tabs for `All Activity`, `Tasks`, `Comments`, `Files`, driven by department activity/task endpoints.
    - Department selector behavior must follow CAN-009: selector exists in sidebar for HOD-only contexts and must not be shown in department detail header.
    - Real-time and permission-gated interactions in this page must preserve tenant scoping and canonical toast handling for unauthorized operations.
  - _Requirements: 41, 61, 35 (CAN-009, CAN-018)_

- [ ] 3.11 Integrate Users/Departments with API and role gating
  - Hook page-level data dependencies into RTK Query
  - Implement optimistic updates only where safe
  - Add toast-only handling for 403 responses
  - Reusable component behavior checks:
    - `MuiActionColumn` must hide/show actions using authorization results.
    - `MuiDialog`, `MuiDialogConfirm`, and form wrappers must disable immutable target fields for Admin/Manager/User edit flows (CAN-016).
    - `MuiDataGrid` and List cards must keep equivalent capabilities for search/filter/sort/pagination in authorized scope only.
  - Detailed extraction to enforce in this task:
    - API integration must wire all users/departments list/detail/dialog actions to canonical endpoint contracts with consistent query/payload normalization.
    - Authorization gating must be applied at route, section, and control levels so only permitted actions render or execute for current role/scope.
    - Immutable target-field rules (CAN-016) must be enforced in UI controls (disabled/read-only) and error pathways must surface deterministic conflict/forbidden messages.
    - Optimistic updates must be limited to low-risk mutations and must reconcile correctly with server responses for delete/restore/status/profile updates.
    - Error behavior must follow canonical frontend policy: 403 toast-only/no logout, 401 refresh-first flow, conflict toasts for business-rule violations.
    - Grid/list parity must remain intact after integration, including includeDeleted toggles, pagination resets, and filter-chip state synchronization.
  - _Requirements: 60, 59, 35 (CAN-012)_

- [ ] 3.12 Tests (Frontend)
  - No frontend test implementation
  - Manual validation only: users/departments flows in xs/sm/md and role-based action visibility
  - Detailed manual verification extraction:
    - Validate users and departments list/detail/create/update/delete/restore flows in both supported views and across breakpoints.
    - Validate filter dialog behavior and query synchronization (including includeDeleted toggles, date ranges, role/department/status filters).
    - Validate user details and department details tab IA against canonical tab structures and endpoint-driven data sections.
    - Validate role-based control visibility, immutable-field disablement, and forbidden-action handling with toast-only 403 behavior.
    - Validate responsive behavior for dialogs, list cards, DataGrid layouts, avatar stacks, and ellipsis handling in constrained widths.

---

## Phase 4: Tasks + Activities + Comments + Files Vertical Slice (Backend -> Frontend)

**Phase Gate**:

- Phase 3 complete (user/department identity and authorization contexts stable).
- Task workflows depend on Department/User data and permissions.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 4.1 Implement Task controller logic for all task types
  - `listTasks` with full union-filter support
  - `createTask` with type-specific validation:
    - ProjectTask (vendor/startDate/dueDate)
    - AssignedTask (assignees/startDate/dueDate)
    - RoutineTask (date/materials)
  - `getTask`, `updateTask`, `deleteTask`, `restoreTask`
  - Auto-add creator watcher for ProjectTask
  - Enforce enum mapping and tag constraints
  - Detailed extraction to enforce in this task:
    - Task list endpoint must support canonical union-filter behavior (status, priority, type, created ranges, due ranges, department, assignment modes, tags, includeDeleted, search) per CAN-004.
    - Task create must enforce shared rules (title/description/priority/status defaults/tags constraints) and type-specific required fields for ProjectTask, AssignedTask, and RoutineTask.
    - ProjectTask creation must enforce active-vendor constraint, start/due date ordering, and creator watcher auto-inclusion.
    - AssignedTask creation must enforce assignee validity and tenant-scope constraints.
    - RoutineTask creation must enforce date and embedded material usage rules, including inventory-safe behavior coordinated with material logic.
    - Status/priority validation must remain canonical enum-based (CAN-013), and serializer mapping to display labels must not mutate stored enum values.
    - Task update must preserve discriminator invariants, ownership/scope permissions, and date/relationship validity.
    - Task delete/restore must enforce soft-delete cascade and restore behavior for child entities and inventory side-effects.
    - Task detail payload must supply data contract for Overview/Activities/Comments/Files tabs.
  - _Requirements: 42, 43, 54, 35 (CAN-004, CAN-013)_

- [ ] 4.2 Implement TaskActivity controllers
  - `GET /api/tasks/:taskId/activities`
  - `POST /api/tasks/:taskId/activities`
  - Block activity creation for RoutineTask parents (409)
  - Enforce material usage stock updates atomically
  - Detailed extraction to enforce in this task:
    - Activity creation must be allowed only for ProjectTask and AssignedTask; RoutineTask parent attempts must return canonical conflict behavior.
    - Activity payload must enforce description constraints and optional materials/attachments constraints from canonical validators.
    - Material consumption inside activity create/update/delete/restore flows must execute in DB session-safe atomic operations with delta handling.
    - Activity list endpoint must return chronological data with createdBy metadata, material usage summaries, and attachment summaries.
    - Activity mutations must integrate with task event/notification emission contracts where applicable.
  - _Requirements: 8, 42, 46, 35 (CAN-019)_

- [ ] 4.3 Implement TaskComment controllers
  - `GET /api/tasks/:taskId/comments`
  - `POST /api/tasks/:taskId/comments`
  - Enforce depth max 5 and mention parsing
  - Emit mention notifications
  - Detailed extraction to enforce in this task:
    - Comment creation must enforce canonical text length constraints and parent polymorphism rules.
    - Reply depth must be validated against max depth 5 (CAN-003); attempts beyond depth limit must return validation error contract.
    - Mention parsing must support canonical mention limits and tenant-safe user resolution behavior.
    - Mention notifications must be created and emitted to eligible recipients through notification/socket services.
    - Comment list endpoint must return thread-ready structure for nested rendering and ownership checks.
    - Comment delete/restore behavior must follow soft-delete cascade semantics for nested replies.
  - _Requirements: 10, 42, 35 (CAN-003)_

- [ ] 4.4 Implement Attachment controllers for task contexts
  - `POST /api/attachments`
  - `DELETE /api/attachments/:attachmentId`
  - `PATCH /api/attachments/:attachmentId/restore`
  - Validate extension allowlist + Cloudinary URL pattern
  - Enforce parent model allowlist (Task/TaskActivity/TaskComment only)
  - Detailed extraction to enforce in this task:
    - Attachment create must validate canonical file extension allowlist and max file size constraints.
    - Attachment create must validate cloudinary URL pattern supporting `image|video|raw` with version segment (CAN-027).
    - Parent model allowlist must enforce only Task/TaskActivity/TaskComment and reject Material parent usage (CAN-021).
    - Attachment delete and restore must remain soft-delete operations and preserve auditable metadata.
    - Attachment response payload must contain metadata needed for preview/download behavior in task detail files UX.
  - _Requirements: 11, 54, 35 (CAN-021, CAN-027)_

- [ ] 4.5 Implement task-triggered notification/event orchestration
  - On assignment, mention, status change, activity/comment/file add
  - Emit scoped socket events for list and detail updates
  - Detailed extraction to enforce in this task:
    - Notification generation must cover task create/update/delete effects, assignment transitions, mention events, and activity/comment/file additions.
    - Socket events must be emitted to canonical scoped rooms (task/user/dept/org) without cross-tenant leakage.
    - Notification entities must include title/message/entity reference and unread/read defaults with expiry compatibility.
    - Optional email notification paths must remain service-orchestrated and role/event-gated.
    - Event naming/payload shape must remain stable for frontend cache update handling.
  - _Requirements: 14, 15, 42_

- [ ] 4.6 Tests (Backend)
  - Manual API verification for Task CRUD, Activity, Comments, Attachments
  - Validate RoutineTask activity block (409)
  - Validate comment depth guard and mention notifications
  - Validate files endpoints, size/extension/url guards, restore behavior
  - Validate includeDeleted and tenant-scope enforcement
  - Detailed manual verification extraction:
    - Verify all task types create/update/delete/restore with valid and invalid payload paths.
    - Verify union-filter combinations and assignment filter semantics on list endpoint.
    - Verify activity constraints, especially RoutineTask activity block behavior.
    - Verify comment threading depth limit and mention notification behavior.
    - Verify attachment guards (extension, size, URL pattern, parent model allowlist) and restore semantics.
    - Verify inventory side-effects on routine/activity material usage mutations.
    - Verify matrix + tenant scope behavior across all task nested routes.

### Frontend

- [ ] 4.7 Implement Tasks listing module (grid/list/tabs/filter/create CTA)
  - Align with `docs/ui/tasks_grid_view_screen.png` and `docs/ui/tasks_list_view_screen.png`
  - Tabs: All Tasks, Assigned to Me, Completed
  - Enforce grid/list toggle and DataGrid row selection behavior
  - Reusable components to validate/develop for this task:
    - `MuiViewToggle`, `MuiDataGrid`, `MuiDataGridToolbar`, `MuiPagination`, `MuiActionColumn`.
    - `MuiSearchField`, `MuiFilterButton`, and active-filter `MuiChip` rows.
    - `MuiAvatarStack` for assignee/watcher summaries and list-card variants.
    - `MuiDialog` for create/edit entrypoints and `MuiDialogConfirm` for soft delete.
    - `MuiLoading`/`MuiEmptyState` for skeleton/no-data behavior.
  - Endpoint contracts consumed by this task:
    - `GET /api/tasks` (union filters, sort, includeDeleted, assignment filters)
    - `POST /api/tasks`, `PUT /api/tasks/:taskId`, `DELETE /api/tasks/:taskId`, `PATCH /api/tasks/:taskId/restore`
  - Detailed extraction to enforce in this task:
    - Tasks page must render canonical tabs exactly: `All Tasks`, `Assigned to Me`, `Completed`, with each tab applying its scoped query behavior on top of base filters.
    - Tasks page must support both canonical views (Grid/DataGrid and card-list mode) with parity for selection, actions, pagination, sorting, search, and filter state (CAN-023).
    - Grid view must expose row-selection behavior and action controls consistent with reference screens and role-based permissions.
    - Filter-chip row must reflect active canonical filter union values and support chip removal/reset interactions that immediately update the dataset.
    - Task list items/cards must consistently surface canonical metadata: title, type/status/priority chips, assignees/watchers, due timeline cues, and action affordances.
    - IncludeDeleted behavior must remain explicit and reversible without losing current search/sort/pagination context.
  - _Requirements: 42, 61, 59, 35 (CAN-023)_

- [ ] 4.8 Implement Task filter dialog and dynamic create/update dialog
  - Filter dialog aligned to `docs/ui/tasks_filter_dialog_screen.png`
  - Create/update dialog aligned to `docs/ui/create_update_task_dialog_screen.png`
  - Include type-specific fields and validation mapping
  - Show stock/cost preview for RoutineTask materials
  - Reusable components to validate/develop for this task:
    - `MuiDialog` (filter + create/update) with canonical mobile full-height behavior (CAN-017).
    - Form wrappers: `MuiTextField`, `MuiSelectAutocomplete`, `MuiMultiSelect`, `MuiNumberField`, `MuiCheckbox`, `MuiChip`.
    - `MuiFilterButton` trigger and `MuiSearchField` within filter panel where required.
  - Endpoint contracts consumed by this task:
    - `GET /api/tasks` (all union filters from CAN-004)
    - `POST /api/tasks` and `PUT /api/tasks/:taskId` for dynamic type-specific payloads
    - `GET /api/materials` (active materials for RoutineTask stock/cost preview)
    - `GET /api/vendors` (active vendors for ProjectTask selection)
  - Detailed extraction to enforce in this task:
    - Task filter dialog must implement full canonical union filters (status, priority, type, created/due ranges, department, assignment, tags, includeDeleted) per CAN-004.
    - Filter dialog UX must mirror `docs/ui/tasks_filter_dialog_screen.png` controls and preserve applied state across reopen/reset/apply actions.
    - Create/update task dialog must dynamically render type-specific sections for ProjectTask, AssignedTask, and RoutineTask while preserving shared base fields.
    - ProjectTask form behavior must enforce active-vendor selection; AssignedTask form must enforce assignee selection constraints; RoutineTask form must include material selectors and quantity-aware stock/cost preview.
    - Task status/priority inputs and chips must preserve canonical enum mappings (CAN-013) and avoid local display-value drift from backend contracts.
    - Dialog behavior must follow mobile full-height/accessibility requirements (CAN-017) and canonical form validation messaging flow.
  - _Requirements: 42, 35 (CAN-004, CAN-019)_

- [ ] 4.9 Implement Task details page with canonical tab naming
  - Tabs: Overview, Activities, Comments, Files
  - Overview aligned to `docs/ui/task_details_overview_screen.png`
  - Activities aligned to `docs/ui/task_details_activities_screen.png`
  - Comments aligned to `docs/ui/task_details_comments_screen.png`
  - Files aligned to `docs/ui/task_details_attachments_screen.png`
  - Reusable components to validate/develop for this task:
    - `MuiTimeline` for Activities/Comments chronology.
    - `MuiSearchField` + `MuiFilterButton` for tab-level searching/filtering in activity/files.
    - `MuiChip` for task type/status/priority badges with canonical display mapping.
    - `MuiAvatarStack` for collaborators/watchers in task header.
    - `MuiDataGrid` for required materials/history tables in overview blocks.
    - `MuiDialog` + `MuiDialogConfirm` for edit/delete flows.
  - Endpoint contracts consumed by this task:
    - `GET /api/tasks/:taskId`
    - `GET /api/tasks/:taskId/activities`, `POST /api/tasks/:taskId/activities`
    - `GET /api/tasks/:taskId/comments`, `POST /api/tasks/:taskId/comments`
    - `POST /api/attachments`, `DELETE /api/attachments/:attachmentId`, `PATCH /api/attachments/:attachmentId/restore`
  - Detailed extraction to enforce in this task:
    - Task detail IA must be exactly `Overview`, `Activities`, `Comments`, `Files` and match each provided UI reference panel layout.
    - Header region must expose task identity, canonical type/status/priority chips, due/estimate metadata, assignee/watcher visuals, and share/edit actions.
    - Overview tab must include full description, requirements/tags, assignee/date/status details, and material/status-history blocks where applicable.
    - Activities tab must render chronological activity items with search/add-note controls and event metadata suitable for timeline consumption.
    - Comments tab must support threaded discussions with mention-rich content and role/action affordances tied to canonical comment behavior.
    - Files tab must provide upload/dropzone, preview cards, metadata, and soft-delete/restore file actions using attachment endpoint contracts.
  - _Requirements: 32, 42, 35 (CAN-003)_

- [ ] 4.10 Implement task detail subcomponents
  - Activity log with search and add-note actions
  - Threaded comment editor/replies/mentions (depth-aware UX)
  - File dropzone/gallery/preview/download/remove actions
  - Required materials table and status history panel
  - Reusable components to validate/develop for this task:
    - `MuiTimeline` for activity/comment stream groupings.
    - `MuiSearchField` for activity/file search controls.
    - `MuiDialog` for add-note/upload/reply flows, plus `MuiDialogConfirm` for delete/remove actions.
    - `MuiChip` for status and type metadata; `MuiAvatarStack` for participant context.
    - `MuiDataGrid` where structured materials/history tables are needed in detail views.
  - Detailed extraction to enforce in this task:
    - Activity log module must support canonical event rendering for create/update/status/comment/file changes with timestamp, actor, and entity references.
    - Threaded comment module must enforce UI depth guard at max 5 replies (CAN-003), mention entry patterns, and reply/edit/delete affordances consistent with authorization.
    - File module must enforce canonical upload constraints (size/extension helper messaging), preview/download affordances, and attachment lifecycle actions.
    - Required materials and status-history subviews must present structured, scannable tables/cards aligned with task type semantics and API payload contracts.
    - Search controls inside activities/files must debounce and filter in-place without resetting unrelated task-detail tab state.
    - All subcomponents must preserve accessibility and responsive behavior, especially dialog/focus flows and overflow handling in dense content blocks.
  - _Requirements: 32, 42, 11_

- [ ] 4.11 Integrate task pages with real-time updates
  - Subscribe/unsubscribe task rooms on detail mount/unmount
  - Update list/detail cache on task/activity/comment/file events
  - Keep unread notification count synchronized
  - Reusable component synchronization checks:
    - `MuiDataGrid`, list cards, `MuiTimeline`, and badge/chip components must update from socket-driven cache changes without full page reload.
    - `MuiLoading` should only appear for initial fetch/loading transitions, not for every socket event.
  - Detailed extraction to enforce in this task:
    - Task list and task detail pages must subscribe to scoped realtime channels and unsubscribe cleanly on navigation/unmount to prevent duplicate event handling.
    - Incoming task/activity/comment/file events must reconcile RTK Query caches for both collection and detail views without destructive refetch loops.
    - Notification badge/unread counters must stay synchronized with task-related realtime events and notification read-state updates.
    - Realtime updates must preserve current local UI context (active tab, filter selection, pagination position) while reflecting latest data.
    - Permission-sensitive events must only update data already authorized for the current user’s tenant/scope context.
    - Loading indicators must remain transition-only and not flash on each realtime delta.
  - _Requirements: 14, 15_

- [ ] 4.12 Tests (Frontend)
  - No frontend test implementation
  - Manual validation only: task creation/edit/delete/restore, filters, tabs, activity/comments/files UX across breakpoints
  - Detailed manual verification extraction:
    - Validate task list tabs, view toggle, union filters, includeDeleted behavior, and action controls in both grid and list views.
    - Validate create/update dialogs for all task types, including type-specific field validation and routine material stock/cost previews.
    - Validate task details tab IA and end-to-end activity/comment/file interactions, including mention flows and attachment lifecycle actions.
    - Validate realtime updates across task list/detail pages and unread notification synchronization behavior.
    - Validate responsive behavior for dialogs, detail headers, timelines, and DataGrid/card presentations on xs/sm/md breakpoints.

---

## Phase 5: Materials and Vendors Vertical Slice (Backend -> Frontend)

**Phase Gate**:

- Phase 4 complete (task and attachment systems stable).
- Material/Vendor deletion constraints rely on task associations from previous phase.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 5.1 Implement Material controller logic
  - `listMaterials` with canonical filters
  - `createMaterial`, `getMaterial`, `updateMaterial`
  - `POST /api/materials/:materialId/restock`
  - `GET /api/materials/:materialId/usage`
  - `deleteMaterial`/`restoreMaterial`
  - Enforce association delete block with `.withDeleted()` checks and 409 fallback guidance (set INACTIVE)
  - Detailed extraction to enforce in this task:
    - Material list endpoint must support canonical filters: search, category, status, sku, lowStockOnly, created date ranges, includeDeleted, and role-permitted department scoping.
    - Material create/update must enforce canonical schema constraints for name, SKU uniqueness per department, category, unit, price, status, and inventory fields.
    - Material detail endpoint must return header/meta contract used by materials detail screen and dependent widgets.
    - Restock endpoint must increment stock atomically and update `inventory.lastRestockedAt` in the same transactional flow (CAN-019).
    - Usage endpoint must return routine-task and task-activity derived consumption history with quantity/cost/date/status context.
    - Material status `INACTIVE` must block new selection in task creation/update while preserving read access.
    - Material delete must enforce `.withDeleted()` association checks against RoutineTask.materials and TaskActivity.materials and return canonical 409 conflict guidance when associated (CAN-015).
    - Material restore must preserve soft-delete semantics and compatibility with list/includeDeleted behavior.
  - _Requirements: 39, 54, 35 (CAN-015, CAN-019)_

- [ ] 5.2 Implement Vendor controller logic
  - `listVendors`, `createVendor`, `getVendor`, `updateVendor`
  - `POST /api/vendors/:vendorId/contact`
  - `deleteVendor`/`restoreVendor`
  - Enforce association delete block with `.withDeleted()` checks and 409 fallback guidance
  - Compute and return vendor metrics for details page
  - Detailed extraction to enforce in this task:
    - Vendor list endpoint must support canonical filters: search, status, rating ranges, verified-partner flag, date ranges, includeDeleted.
    - Vendor create/update must enforce canonical constraints for name, email, phone regex, optional website/location/address/description, status, partner flag, and rating precision/range.
    - Vendor detail endpoint must return metrics required by UI contract (project counts, delivery performance, duration/spend indicators).
    - Contact vendor endpoint must support role-gated email composition flow with backend email service integration.
    - Vendor status `INACTIVE` must block new project-task selection while preserving read access.
    - Vendor delete must enforce `.withDeleted()` association checks against ProjectTask links and return canonical 409 conflict guidance when associated (CAN-015).
    - Vendor restore must preserve soft-delete lifecycle and includeDeleted compatibility.
  - _Requirements: 13, 54, 35 (CAN-015, CAN-020)_

- [ ] 5.3 Finalize material/vendor routes, validators, and service hooks
  - Attach role and tenant scoping middleware
  - Integrate notification/email hooks for vendor contact action
  - Ensure standard paginated response format
  - Detailed extraction to enforce in this task:
    - Route contracts must remain aligned with Section 18 method/path definitions for materials and vendors.
    - Validators must enforce canonical field, filter, delete-conflict, and restore-collision rules with clear status/error payload behavior.
    - Authorization must enforce tenant and role boundaries consistently (org-level vendor scope, dept-level material scope where required).
    - Paginated response schema must remain uniform with metadata for list pages and reusable grid components.
    - Vendor contact route must orchestrate notification/email side-effects without bypassing authorization and validation gates.
  - _Requirements: 24, 43, 54_

- [ ] 5.4 Tests (Backend)
  - Manual API verification for Materials and Vendors
  - Validate low-stock/restock behavior and usage endpoint payloads
  - Validate delete conflict (409) for associated resources
  - Validate vendor contact endpoint role gating
  - Detailed manual verification extraction:
    - Verify list filtering combinations and includeDeleted behavior for both materials and vendors.
    - Verify create/update validation failures and success paths for canonical field constraints.
    - Verify atomic restock and usage-related inventory math under valid and invalid scenarios.
    - Verify delete conflict behavior with associated and non-associated materials/vendors.
    - Verify vendor contact endpoint authorization and side-effect behavior.
    - Verify cross-tenant access denial and org/dept scoping consistency.

### Frontend

- [ ] 5.5 Implement Materials list and details flows
  - Align list with `docs/ui/materials_list_view_screen.png`
  - Align details with `docs/ui/material_details_screen.png`
  - Implement search/filter/create/edit/delete/restore and restock dialog
  - Exclude material attachments section per CAN-021
  - Reusable components to validate/develop for this task:
    - `MuiDataGrid`, `MuiDataGridToolbar`, `MuiPagination`, `MuiActionColumn` for materials list.
    - `MuiSearchField` + `MuiFilterButton` for list/detail filters.
    - `MuiDialog` for create/edit/restock/filter flows; `MuiDialogConfirm` for delete/restore confirmation.
    - `MuiChip` for category/status chips and low-stock indication labels.
    - `MuiStatCard` + `MuiProgress` for detail KPI cards (usage, associated tasks, usage rate).
    - `MuiLoading`/`MuiEmptyState` for loading and empty-result states.
  - Endpoint contracts consumed by this task:
    - `GET /api/materials`, `POST /api/materials`, `PUT /api/materials/:materialId`, `DELETE /api/materials/:materialId`, `PATCH /api/materials/:materialId/restore`
    - `GET /api/materials/:materialId`, `GET /api/materials/:materialId/usage`, `POST /api/materials/:materialId/restock`
  - Detailed extraction to enforce in this task:
    - Materials page must use canonical Grid/DataGrid presentation only (no list-card mode) and align with `docs/ui/materials_list_view_screen.png` layout and controls.
    - Materials list columns and metadata must cover canonical contract: name+SKU, category chip, unit, unit price, created-by context, and action controls, with optional inventory/low-stock columns.
    - Materials filter behavior must support canonical dimensions (category, status, low-stock toggle, date range, includeDeleted, search) and keep filter state synchronized with query params.
    - Material details page must align with `docs/ui/material_details_screen.png` including header metadata (icon/name/status/SKU/unit/unit price), edit/restock actions, KPI cards, and usage-history table.
    - Restock dialog flow must support quantity entry and successful refresh of stock-dependent widgets and usage aggregates after mutation.
    - Material attachment UI must remain excluded from this feature set (CAN-021), and conflict/deletion messaging must align with canonical 409 guidance.
  - _Requirements: 39, 35 (CAN-019, CAN-021)_

- [ ] 5.6 Implement Vendors list and details flows
  - Align list with `docs/ui/vendors_list_view_screen.png`
  - Align details with `docs/ui/vendor_details_screen.png`
  - Implement search/filter/create/edit/delete/restore and contact vendor action
  - Render partner/status/rating/metrics exactly from API payloads
  - Reusable components to validate/develop for this task:
    - `MuiDataGrid`, `MuiDataGridToolbar`, `MuiPagination`, `MuiActionColumn` for vendor list.
    - `MuiSearchField` + `MuiFilterButton` for query and filter controls.
    - `MuiDialog` for create/edit/filter/contact-vendor email flows; `MuiDialogConfirm` for delete/restore confirmation.
    - `MuiChip` and `MuiRating` for status/partner/rating visualization.
    - `MuiStatCard` + `MuiProgress` for vendor metrics cards (active projects, avg duration, spend, delivery).
    - `MuiLoading`/`MuiEmptyState` for loading and no-result states.
  - Endpoint contracts consumed by this task:
    - `GET /api/vendors`, `POST /api/vendors`, `PUT /api/vendors/:vendorId`, `DELETE /api/vendors/:vendorId`, `PATCH /api/vendors/:vendorId/restore`
    - `GET /api/vendors/:vendorId`, `POST /api/vendors/:vendorId/contact`
  - Detailed extraction to enforce in this task:
    - Vendors page must use canonical Grid/DataGrid presentation only (no list-card mode) and align with `docs/ui/vendors_list_view_screen.png`.
    - Vendor list columns must include canonical details: vendor identity, contact info, rating visualization, project counts/status, and row actions.
    - Vendor filter behavior must support canonical controls (status, rating range, verified partner, includeDeleted, search) with query-state consistency.
    - Vendor detail page must align with `docs/ui/vendor_details_screen.png`, including partner/status/rating presentation, contact metadata, top metrics, and associated projects table.
    - Contact vendor action must open a canonical dialog workflow and map cleanly to role-gated backend contact endpoint behavior.
    - Delete/restore flows must preserve soft-delete semantics, with conflict toasts for associated vendor constraints following canonical 409 messaging.
  - _Requirements: 13, 35 (CAN-020)_

- [ ] 5.7 Integrate Materials/Vendors with task workflows
  - Ensure task dialogs use active-only material/vendor selectors
  - Display conflict toasts from blocked deletes
  - Maintain consistent status chip and enum label mapping
  - Reusable components to validate/develop for this task:
    - `MuiSelectAutocomplete` and `MuiMultiSelect` for active-only vendor/material selectors in task dialogs.
    - `MuiChip` for enum/status mapping consistency across Tasks/Materials/Vendors.
    - `MuiDialogConfirm` conflict copy for 409 association-block responses (CAN-015 guidance to set INACTIVE).
  - Detailed extraction to enforce in this task:
    - Task creation/update dialogs must consume active-only vendor/material option sets so inactive resources cannot be newly assigned.
    - Selector components must display canonical labels/metadata (status, unit/category, rating/partner where applicable) while submitting canonical identifiers.
    - Association-block conflict responses for materials/vendors must surface deterministic toast messaging and guidance to set status `INACTIVE` rather than delete (CAN-015).
    - Cross-module status and priority chip mappings must remain consistent with canonical enum-label/color conventions (CAN-013).
    - Task/material/vendor pages must remain contract-aligned when resources are deleted/restored/inactivated, including stale-selection and validation edge cases.
  - _Requirements: 42, 13, 39, 35 (CAN-013, CAN-015)_

- [ ] 5.8 Tests (Frontend)
  - No frontend test implementation
  - Manual validation only: list/detail/filter/pagination/restock/contact flows and error handling
  - Detailed manual verification extraction:
    - Validate materials and vendors list/detail pages for search/filter/pagination/action behavior against UI references.
    - Validate create/update/delete/restore flows, including includeDeleted toggles and post-mutation state consistency.
    - Validate material restock interactions and usage-history rendering, including low-stock indicators and KPI refresh behavior.
    - Validate vendor contact dialog flow and role-gated access behavior.
    - Validate 409 conflict handling for associated materials/vendors and confirm canonical toast guidance appears without breaking session continuity.

---

## Phase 6: Dashboard, Notifications, and Settings (Backend -> Frontend)

**Phase Gate**:

- Phase 5 complete (resource metrics available for dashboard cards and detail widgets).
- Settings preferences require stable user endpoints from Phase 3.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 6.1 Implement dashboard endpoints and aggregations
  - `GET /api/dashboard/overview`
  - `GET /api/departments/:departmentId/dashboard`
  - Return KPI cards, chart series, upcoming deadlines, recent activity, and scoped filters
  - Support role-based visibility (org-wide widgets for privileged roles)
  - Detailed extraction to enforce in this task:
    - Dashboard overview endpoint must provide role-aware payloads:
      - Org-wide roles: organization task/user KPIs, department performance, projects overview, materials usage, vendor performance, activity feed, upcoming deadlines.
      - Department/personal roles: my/dept tasks, overdue, completed-this-week, scoped charts/activity/deadlines.
    - Aggregation payload must include chart-ready distributions and trend series aligned with status, priority, and timeline requirements.
    - Upcoming deadlines contract must provide data needed for tabular rendering of next-7-day due tasks.
    - Filters must support canonical dimensions (`date range`, optional permitted `departmentId`, status, priority, taskType) and apply consistently across all widgets.
    - Department dashboard endpoint must provide overview analytics payload for department detail overview tab contract.
    - Endpoint behavior must be tenant-safe and role-authorized for org vs dept visibility boundaries.
  - _Requirements: 16, 41, 54_

- [ ] 6.2 Implement notifications endpoint logic
  - `GET /api/notifications`
  - `PATCH /api/notifications/:notificationId/read`
  - `PATCH /api/notifications/mark-all-read`
  - `DELETE /api/notifications/:notificationId` (optional)
  - Maintain TTL semantics and unread-count consistency
  - Detailed extraction to enforce in this task:
    - Notification list endpoint must return current-user notifications with canonical ordering and optional filter support (read state, entity model, date range where applicable).
    - Read-one endpoint must update `isRead` deterministically and preserve ownership/tenant constraints.
    - Mark-all-read endpoint must perform bulk read transition for current user only (`PATCH /api/notifications/mark-all-read` canonical path).
    - Optional delete endpoint must remain soft-delete behavior when enabled by UI contract.
    - Notification expiry behavior must remain TTL-index driven with `expiresAt` semantics (default 30-day lifecycle).
    - Unread count behavior must remain consistent across read/mark-all/delete actions and real-time pushes.
  - _Requirements: 15, 54_

- [ ] 6.3 Complete settings-related update endpoints
  - Ensure `PUT /api/users/:userId/preferences` supports notifications + appearance payloads
  - Ensure `PUT /api/users/:userId/security` supports two-factor persistence
  - Ensure `POST /api/auth/change-password` behavior aligns with Account tab UX
  - Detailed extraction to enforce in this task:
    - Preferences endpoint must support canonical appearance and notification preference payload fields expected by Settings tabs.
    - Security endpoint must support two-factor setting persistence and validation rules.
    - Change-password endpoint must enforce current-password verification and new-password policy semantics.
    - Settings endpoints must maintain ownership and role constraints, and preserve standardized success/error response contracts.
    - Date/time preference fields must remain compatible with frontend `Intl.DateTimeFormat` rendering policy.
  - _Requirements: 33, 63, 54_

- [ ] 6.4 Complete real-time delivery integration
  - Notification push to user rooms
  - Entity change events needed by dashboard/activity widgets
  - Ensure cross-tenant event isolation
  - Detailed extraction to enforce in this task:
    - Socket auth must ensure only authenticated users join rooms tied to their tenant scope.
    - Notification events must be emitted to user rooms for new notifications and read-state-affecting updates where needed.
    - Entity-change events required by dashboard and activity widgets must be emitted with stable event names and payload structures.
    - Realtime layer must preserve cross-tenant isolation; no room joins or event payloads may expose other-tenant entities.
    - Disconnect/reconnect behavior must remain compatible with frontend event subscription lifecycle expectations.
  - _Requirements: 14, 15, 60_

- [ ] 6.5 Tests (Backend)
  - Manual API verification for dashboard, notifications, settings endpoints
  - Validate filter combinations and payload consistency
  - Validate mark-all-read route path and behavior
  - Validate 401 refresh and 403 toast-only contract compatibility
  - Detailed manual verification extraction:
    - Verify dashboard endpoint payload completeness for both org-wide and department/personal role contexts.
    - Verify dashboard filter combinations produce consistent aggregate changes across KPI/chart/table sections.
    - Verify notification read-one and mark-all-read behaviors maintain unread counts and ownership boundaries.
    - Verify settings preference/security/change-password update paths for valid and invalid payloads.
    - Verify auth failure vs authorization failure status semantics (401 vs 403) remain contract-correct for frontend behavior.

### Frontend

- [ ] 6.6 Implement Dashboard overview page from UI specs
  - Align with `docs/ui/desktop_dashboard_overview_screen.png`
  - Implement filters row, chips, refresh, export, and chart interactions
  - Keep header/left-nav behavior aligned with layout canonical rules
  - Reusable components to validate/develop for this task:
    - `MuiStatCard` and `MuiProgress` for KPI and health widgets.
    - `MuiDataGrid` + `MuiDataGridToolbar` for upcoming deadlines and table widgets.
    - `MuiSearchField`, `MuiFilterButton`, `MuiChip` for dashboard filters and active-filter chips.
    - `MuiTimeline`/activity list primitives for recent activity stream.
    - `MuiLoading`/`MuiEmptyState` for widget-level loading/empty states.
    - `MuiThemeDropDown` and `MuiAppIconLogo` placement compliance in header/sidebar (CAN-024).
  - Endpoint contracts consumed by this task:
    - `GET /api/dashboard/overview`
    - `GET /api/departments/:departmentId/dashboard` (role-permitted scoped views)
  - Detailed extraction to enforce in this task:
    - Dashboard page must align with `docs/ui/desktop_dashboard_overview_screen.png` and render role-scoped widgets per canonical contracts (org-wide vs department/personal contexts).
    - KPI cards, chart widgets, activity feed, and upcoming-deadlines table must use canonical data contracts and update coherently when filters change.
    - Filter row must support canonical dimensions (date range, departmentId where permitted, status, priority, task type) and show active filter chips with clear/remove behavior.
    - Chart interactions and KPI clicks must preserve canonical drill/navigation expectations to filtered list pages where specified.
    - Export and refresh controls must align with requirements: export filtered snapshot semantics and manual reload/cache-bust behavior for dashboard data.
    - Layout composition must preserve header/sidebar rules, including no dashboard header logo and sidebar-owned branding placement (CAN-024).
  - _Requirements: 16, 61, 35 (CAN-024)_

- [ ] 6.7 Implement notification UI module
  - Notification bell + badge + dropdown
  - Read single, mark all read, optional delete
  - Route navigation from notification entity links
  - Reusable components to validate/develop for this task:
    - `MuiBadge` for unread count indicator.
    - `MuiTimeline`/list feed presentation for dropdown items.
    - `MuiDialogConfirm` for optional delete confirmation.
    - `MuiLoading`/`MuiEmptyState` for notification dropdown loading and empty states.
  - Endpoint contracts consumed by this task:
    - `GET /api/notifications`
    - `PATCH /api/notifications/:notificationId/read`
    - `PATCH /api/notifications/mark-all-read`
    - `DELETE /api/notifications/:notificationId` (if enabled)
  - Detailed extraction to enforce in this task:
    - Notification bell must display unread badge count and open dropdown/list with newest-first ordering and canonical notification metadata.
    - Notification item interactions must support read-single behavior, entity-link navigation, and optional delete flow where enabled by contract.
    - `Mark all as read` interaction must clear unread state consistently in UI and synchronize with backend unread counts.
    - Notification rendering must support mixed event types (task/activity/comment/mention/system) with consistent labels, timestamps, and icons.
    - Empty/loading states in dropdown/list must use reusable primitives and preserve non-blocking UX.
    - Notification UX must remain compatible with realtime push updates and session-safe error handling.
  - _Requirements: 15_

- [ ] 6.8 Implement Settings page with canonical tabs
  - Tabs: Profile, Account, Notifications, Appearance
  - Profile aligned to `docs/ui/settings_profile_tab_screen.png`
  - Account aligned to `docs/ui/settings_account_tab_screen.png`
  - Add Notifications and Appearance tab UIs per PRD section 10/18 contracts
  - Reusable components to validate/develop for this task:
    - Form wrappers: `MuiTextField`, `MuiNumberField`, `MuiSwitch`, `MuiCheckbox`, `MuiSelectAutocomplete`, `MuiMultiSelect`.
    - `MuiDialog` for nested edit actions from settings sections.
    - `MuiChip` and `MuiProgress` for profile completeness/skills visualization where shown.
    - `MuiThemeDropDown` integration consistency with appearance settings.
  - Endpoint contracts consumed by this task:
    - `PUT /api/users/:userId/preferences`
    - `PUT /api/users/:userId/security`
    - `POST /api/auth/change-password`
  - Detailed extraction to enforce in this task:
    - Settings IA must include exactly four tabs (`Profile`, `Account`, `Notifications`, `Appearance`) and align profile/account screens with provided references.
    - Profile tab must support personal-information editing and profile context display sections as specified in settings profile UI references.
    - Account tab must support email update and password change workflows with canonical validation and messaging expectations.
    - Notifications tab must expose preference controls mapped to preferences payload fields (in-app/email/reminders and related toggles).
    - Appearance tab must expose theme/presentation preferences compatible with global theme behavior and preference persistence contracts.
    - All settings forms must use canonical reusable form wrappers and preserve consistent validation, helper text, and save/cancel interaction patterns.
  - _Requirements: 33, 63_

- [ ] 6.9 Integrate settings persistence and app-wide theme behavior
  - Persist profile/account/security/preferences changes through proper endpoints
  - Keep theme persistence via Redux and backend preference sync
  - Enforce toast-only 403 handling in settings actions
  - Reusable component behavior checks:
    - All settings forms use reusable `Mui*` form inputs and keep unified validation/error display.
    - Theme toggles (`MuiThemeDropDown`) and preference forms stay synchronized without duplicate state divergence.
  - Detailed extraction to enforce in this task:
    - Settings mutations must map exactly to canonical endpoints (`preferences`, `security`, `change-password`) with payload shaping that matches backend contracts.
    - Theme preference updates must synchronize Redux UI state and persisted backend preference state without race conditions or stale overrides.
    - Date/time and locale-related preference fields must remain compatible with `Intl.DateTimeFormat`-based rendering policy (CAN-014).
    - Form-level success/error feedback must use canonical toast behavior and preserve session continuity for forbidden responses (CAN-012).
    - Settings route behavior must remain ownership-safe and role-safe, preventing unauthorized edits while keeping current UI context stable.
  - _Requirements: 60, 63, 35 (CAN-012, CAN-014)_

- [ ] 6.10 Tests (Frontend)
  - No frontend test implementation
  - Manual validation only: dashboard widgets, notification interactions, settings tabs and persistence behavior
  - Detailed manual verification extraction:
    - Validate dashboard role-scoped widget payload rendering, filter application, and cross-widget consistency.
    - Validate dashboard refresh/export controls and resulting UI state updates.
    - Validate notification dropdown/list behavior (read one, mark all read, optional delete, entity-link navigation, unread badge updates).
    - Validate settings tab forms for profile/account/notifications/appearance update flows and persisted state after reload.
    - Validate canonical error-handling behavior in dashboard/notification/settings interactions (401 refresh flow, 403 toast-only, conflict/rate-limit messaging).

---

## Phase 7: Cross-Phase Hardening, Canonical Compliance, and Release Preparation (Backend -> Frontend)

**Phase Gate**:

- Phases 1-6 complete and manually validated.
- This phase closes quality, consistency, and release-readiness gaps.

**Task Execution Protocol (Mandatory 7 Steps)**:

- Apply `.kiro/steering/task-execution-protocol.md` to every Backend and Frontend task in this phase before marking it complete.
- Step 1: Pre-Git Requirement (Before Task Execution)
- Step 2: Comprehensive and Extremely Deep Codebase Analysis
- Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)
- Step 4: Task Execution Without Deviation
- Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)
- Step 6: User Review and Feedback Integration
- Step 7: Post-Git Requirement (After Task Completion)

### Backend

- [ ] 7.1 Run full backend manual regression by role and tenant
  - Role matrix: Platform SuperAdmin, SuperAdmin, Admin, Manager, User
  - Scope checks: ownOrg, crossOrg, ownDept, crossDept, ownership predicates
  - Resource lifecycle checks: create/read/update/delete/restore for all resources
  - Detailed regression extraction to enforce in this task:
    - Validate role-matrix outcomes for each resource family (auth/users/departments/tasks/activities/comments/attachments/materials/vendors/notifications/dashboard/settings).
    - Validate tenant isolation for non-platform users and matrix-governed cross-org access for platform superadmin only.
    - Validate ownership predicates (`self`, `createdBy`, `assignees`, `watchers`, `mentioned`, `uploadedBy`, `manager`) across protected operations.
    - Validate full soft-delete lifecycle and restore pathways with includeDeleted behavior on all relevant list endpoints.
    - Validate inactive/verified/account-status edge behavior across auth and protected routes.
    - Validate side-effect consistency for notifications, socket events, and inventory updates under mutation flows.
  - _Requirements: 43, 60, 62_

- [ ] 7.2 Complete backend canonical decision compliance pass (CAN-001 to CAN-027)
  - Verify enum mappings, filters, immutable fields, association delete blocks, regex, TTL, attachment guards
  - Verify no forbidden `/api/organizations` dependency in canonical MVP flow
  - Verify log/error response consistency and endpoint contracts
  - Detailed canonical extraction to enforce in this task:
    - Validate backend-relevant canonical decisions end-to-end: CAN-005, CAN-006, CAN-008, CAN-013, CAN-015, CAN-016, CAN-019, CAN-020, CAN-021, CAN-022, CAN-026, CAN-027.
    - Validate canonical enums and serializer mappings remain consistent between model validators, controllers, and response payloads.
    - Validate union-filter support and filter normalization across list endpoints per CAN-004.
    - Validate delete-block conflict behavior for associated Materials/Vendors using `.withDeleted()` checks (CAN-015).
    - Validate immutable field conflict behavior for user update targets (CAN-016).
    - Validate attachment allowlist and cloudinary URL guards in upload/create flows (CAN-021/CAN-027).
    - Validate inventory/restock atomicity and no-negative-stock enforcement for material-affecting flows (CAN-019).
    - Validate department inactive-state restrictions and description length constraints (CAN-022/CAN-026).
    - Validate endpoint inventory aligns with canonical Section 18 contracts and excludes forbidden organization CRUD route dependency.
  - _Requirements: 35, 54, 58_

- [ ] 7.3 Performance and security hardening
  - Validate and optimize indexes for common list/query paths
  - Confirm rate limit profiles and CORS correctness
  - Confirm no tenant data leaks in response serializers
  - Detailed hardening extraction to enforce in this task:
    - Re-check index strategy against high-frequency filters (org/dept/status/priority/type/date/includeDeleted and relation lookups).
    - Validate bcrypt strength and token/cookie handling policies remain compliant with auth security requirements.
    - Validate CORS policy, cookie credentials settings, and origin restrictions in production-like configuration.
    - Validate rate-limiter behavior and error contract for auth-sensitive and general endpoints.
    - Validate response serializers prevent tenant leakage and avoid exposing internal-only fields.
    - Validate socket room join/emit paths maintain tenant-bound event isolation.
    - Validate logging/error output avoids sensitive payload leakage while preserving audit/debug traceability.
  - _Requirements: 19, 24, 43, 44_

- [ ] 7.4 Tests (Backend)
  - Execute final manual backend checklist and capture evidence
  - Focus on high-risk flows: auth refresh, cross-tenant access, task/file/comment workflows, dashboard aggregations
  - Document all defects and retest closures
  - Detailed final verification extraction:
    - Produce manual verification evidence per resource and per role, including request/response snapshots and expected status assertions.
    - Prioritize high-risk sequences: token refresh rotation, cross-tenant authorization denials, attachment guards, comment depth/mention handling, material inventory atomicity, and association-delete conflicts.
    - Verify dashboard/notification/settings contracts against current backend outputs and canonical endpoint shapes.
    - Re-run failed scenarios after fixes and record closure evidence for each defect.
    - Confirm release readiness only after all canonical compliance and regression checks are fully green.

### Frontend

- [ ] 7.5 Run UI parity pass against all provided reference screens
  - Landing/public: `landing-page.png`, `public_layout_screen.png`
  - Layout: `desktop-dashboard-layout.png`, `mobile-dashboard-layout.png`
  - Dashboard: `desktop_dashboard_overview_screen.png`
  - Departments: grid/list/filter/create/details screens
  - Users: grid/list/filter/create/details screens
  - Tasks: list/grid/filter/create/details screens
  - Materials/Vendors: list/details screens
  - Settings: profile/account screens + PRD-defined notifications/appearance tabs
  - Reusable component parity checklist:
    - Validate every list/grid screen uses `MuiDataGrid` for Grid view and card layout for List view (CAN-023).
    - Validate all filter/create/edit/contact/restock flows use canonical `MuiDialog` pattern (CAN-017).
    - Validate consistent usage of `MuiDataGridToolbar`, `MuiSearchField`, `MuiFilterButton`, `MuiPagination`, `MuiActionColumn`.
    - Validate `MuiChip` enum mapping, `MuiAvatarStack` rendering, `MuiStatCard`/`MuiProgress` KPI visuals, and `MuiTimeline` activity streams against each UI reference.
  - Detailed extraction to enforce in this task:
    - Every referenced `docs/ui/*` screen must be validated for layout structure, information architecture, action placement, and key component composition, not only visual similarity.
    - Parity pass must confirm canonical decisions impacting UI are fully satisfied, especially CAN-002/009/011/018/023/024/025 and resource-specific CAN rules reflected in each screen family.
    - Each screen’s data dependencies must map to existing Section 18 endpoint contracts with no missing API wiring or placeholder-only sections remaining.
    - Dialog-driven flows (create/edit/filter/contact/restock/delete/restore) must match canonical behavior, copy intent, and responsive presentation across all screen families.
    - Status/priority/role/category label consistency must be verified across tasks/users/departments/materials/vendors/details/dashboard/settings views.
    - Screen parity verification must include mobile/tablet behavior required by PRD sections, not only desktop reference compositions.
  - _Requirements: 61, 63, 35_

- [ ] 7.6 Responsive/accessibility/usability hardening
  - Validate xs/sm/md/lg/xl behavior and mobile full-height dialogs
  - Validate keyboard focus order, contrast, and label semantics
  - Validate overflow ellipsis behavior in lists/cards/tables
  - Reusable component hardening scope:
    - `MuiBottomNavigation` visibility and centered `MuiFAB` on xs only (CAN-002).
    - `MuiDialog` focus/aria/full-height behavior on xs (CAN-017).
    - `MuiDataGrid` responsive column visibility and keyboard navigation behavior on xs/sm.
    - `MuiEmptyState`, `MuiLoading`, and notification badges for accessible aria semantics.
  - Detailed extraction to enforce in this task:
    - Breakpoint behavior must be validated against canonical ranges (CAN-001) for layout, navigation, cards, DataGrid columns, dialogs, and action visibility.
    - Mobile navigation must satisfy bottom-nav item set, centered FAB, profile-menu “More” behavior, and touch-target minimums for interactive controls.
    - Dialog accessibility must enforce focus trap/restore, required aria attributes, keyboard escape handling, and xs full-height viewport styling (CAN-017).
    - Data-dense UI elements (tables/cards/timeline rows/chips) must preserve readability with ellipsis/truncation rules, accessible labels, and predictable keyboard traversal.
    - Color/contrast and semantic indicators for statuses/priorities/errors must remain perceivable and consistent across all modules.
    - Usability hardening must confirm loading/empty/error states are non-blocking, understandable, and consistent with global UX rules.
  - _Requirements: 59, 61, 35 (CAN-001, CAN-017, CAN-023)_

- [ ] 7.7 Final frontend integration and bug-fix sweep
  - Resolve API mismatch issues immediately with backend contract owners
  - Ensure route guards, toasts, optimistic updates, and cache invalidation are stable
  - Validate no forbidden page on 403; session continuity preserved
  - Reusable component regression scope:
    - Verify all reusable component props and event contracts remain backward-compatible across Tasks/Users/Departments/Materials/Vendors/Dashboard/Settings pages.
    - Verify reusable dialog/form/input components submit payloads matching Section 18 endpoint contracts without local schema drift.
  - Detailed extraction to enforce in this task:
    - Final integration pass must reconcile any frontend/backend contract mismatches in query params, payload shapes, enum mappings, and response adapters.
    - Route guard and session behavior must remain canonical across full app navigation: 401 refresh-then-logout on refresh failure, 403 toast-only/no logout/no forbidden page.
    - Cache invalidation and optimistic updates must be audited for all mutation-heavy modules to prevent stale cards/tables/detail panes after edits/deletes/restores.
    - Reusable component APIs must be frozen for release with consistent prop contracts, error-state behavior, and event signatures across all consuming pages.
    - Bug-fix sweep must prioritize high-risk UX paths: nested dialogs, filter unions, realtime list/detail updates, and role-gated action surfaces.
    - Final fixes must preserve canonical UI consistency and must not regress validated parity/accessibility/responsive outcomes from prior tasks.
  - _Requirements: 60, 59, 35 (CAN-012)_

- [ ] 7.8 Tests (Frontend)
  - No frontend test implementation
  - Execute final manual UAT checklist for all major flows and breakpoints
  - Detailed manual verification extraction:
    - Execute end-to-end UAT across auth, dashboard, departments, users, tasks, materials, vendors, notifications, and settings flows for representative roles/scopes.
    - Validate all required UI reference screens and responsive variants are functionally complete and behaviorally aligned with canonical requirements.
    - Validate all frontend error/success feedback pathways with canonical toast behavior and session continuity rules.
    - Validate cross-feature integration paths (task-material-vendor links, user/department detail dependencies, dashboard drilldowns, notification deep-links).
    - Record and close all residual defects before release readiness, ensuring no unresolved canonical compliance gaps remain.

---

## Notes

**Implementation Dependencies (Strict)**:

- Phase 1 must complete before any model/controller/UI feature work.
- Phase 2 data contracts must complete before Phase 3 resource implementation.
- Phase 3 identity/resource flows must complete before Phase 4 task detail workflows.
- Phase 4 task linkage must complete before Phase 5 material/vendor association logic.
- Phase 5 metric-bearing resources must complete before Phase 6 dashboard analytics.
- Phase 6 functional completion is required before Phase 7 hardening and release prep.

**Testing Policy**:

- Backend: manual/API verification only, executed after each resource controller completion in its phase.
- Frontend: no formal test suite; manual verification only.
- No forbidden test frameworks (Jest, Mocha, Chai, Supertest, Vitest, Cypress).

**Canonical Consistency Policy**:

- Keep `requirements.md`, `design.md`, and `tasks.md` synchronized whenever any contract/UI/flow changes.
- Treat PRD Section 18 and CAN-001..CAN-027 as the authoritative source for endpoint contracts and behavior.
