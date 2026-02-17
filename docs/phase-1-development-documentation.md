# Phase 1 Development Documentation

## Scope
This document captures the Phase 1 state of the multi-tenant MERN task manager codebase under:
- `backend/*`
- `client/*`

Phase 1 delivers runtime foundation, shell architecture, shared utilities, routing/layout scaffolding, reusable UI wrappers, and placeholder feature surfaces.

## Backend Directory Structure
```text
backend/
├─ app.js
├─ server.js
├─ package.json
├─ package-lock.json
├─ config/
│  ├─ allowedOrigins.js
│  ├─ authorizationMatrix.json
│  ├─ cloudinary.js
│  ├─ corsOptions.js
│  ├─ db.js
│  ├─ email.js
│  └─ index.js
├─ controllers/
│  └─ index.js
├─ middlewares/
│  ├─ authMiddleware.js
│  ├─ authorization.js
│  ├─ errorHandler.js
│  ├─ index.js
│  ├─ notFound.js
│  ├─ rateLimiter.js
│  ├─ validation.js
│  └─ validators/
│     └─ index.js
├─ mock/
│  ├─ data.js
│  ├─ seed.js
│  └─ wipe.js
├─ models/
│  ├─ Department.js
│  ├─ Organization.js
│  ├─ User.js
│  ├─ index.js
│  └─ plugins/
│     ├─ index.js
│     └─ softDelete.js
├─ routes/
│  ├─ attachmentRoutes.js
│  ├─ authRoutes.js
│  ├─ dashboardRoutes.js
│  ├─ departmentRoutes.js
│  ├─ index.js
│  ├─ materialRoutes.js
│  ├─ notificationRoutes.js
│  ├─ organizationRoutes.js
│  ├─ taskActivityRoutes.js
│  ├─ taskCommentRoutes.js
│  ├─ taskRoutes.js
│  ├─ userRoutes.js
│  └─ vendorRoutes.js
├─ services/
│  └─ index.js
└─ utils/
   ├─ constants.js
   ├─ env.js
   ├─ errors.js
   ├─ helpers.js
   ├─ index.js
   ├─ logger.js
   └─ validateEnv.js
```

## Backend File Coverage
- `backend/app.js`: Express app composition with security middleware, CORS, parsers, rate limiter, root/health routes, API routing, not-found, and error middleware.
- `backend/server.js`: Bootstraps env validation, database connect/start sequence, HTTP listener startup, and graceful shutdown flow.
- `backend/package.json`: Backend scripts and dependencies for runtime, development, and maintenance commands.
- `backend/package-lock.json`: Locked backend dependency graph.

- `backend/config/allowedOrigins.js`: Resolves canonical allowed origins from normalized environment values.
- `backend/config/authorizationMatrix.json`: Canonical role/resource/operation authorization matrix source.
- `backend/config/cloudinary.js`: Cloudinary config resolver with environment-aware enable/disable behavior.
- `backend/config/corsOptions.js`: Credential-safe CORS options object with origin guard.
- `backend/config/db.js`: Mongoose connection lifecycle helpers and connection-state utility.
- `backend/config/email.js`: Email transport config resolver with environment-aware enable/disable behavior.
- `backend/config/index.js`: Barrel export for config modules.

- `backend/controllers/index.js`: Phase 1 controller-layer placeholder marker.

- `backend/middlewares/authMiddleware.js`: Access-token extraction/verification and normalized `req.user` context middleware.
- `backend/middlewares/authorization.js`: Authorization middleware factory based on matrix rules, scope checks, and ownership predicates.
- `backend/middlewares/errorHandler.js`: Canonical error serialization and response shaping middleware.
- `backend/middlewares/index.js`: Barrel export for middleware modules.
- `backend/middlewares/notFound.js`: Unmatched-route not-found middleware.
- `backend/middlewares/rateLimiter.js`: Auth/API rate-limiter profiles and middleware exports.
- `backend/middlewares/validation.js`: Validator runner and validated payload extraction (`req.validated`).
- `backend/middlewares/validators/index.js`: Phase 1 validator-layer placeholder marker.

- `backend/mock/data.js`: Phase 1 mock metadata with phase-2 required platform env key groups.
- `backend/mock/seed.js`: Phase 1 seed command placeholder (non-mutating runtime marker).
- `backend/mock/wipe.js`: Phase 1 wipe command placeholder (non-mutating runtime marker).

- `backend/models/Department.js`: Phase 1 placeholder model surface.
- `backend/models/Organization.js`: Phase 1 placeholder model surface.
- `backend/models/User.js`: Phase 1 placeholder model surface.
- `backend/models/index.js`: Phase 1 model export surface and phase marker.
- `backend/models/plugins/index.js`: Phase 1 model-plugin export surface.
- `backend/models/plugins/softDelete.js`: Phase 1 soft-delete-plugin placeholder surface.

- `backend/routes/attachmentRoutes.js`: Phase 1 attachment route placeholder router.
- `backend/routes/authRoutes.js`: Phase 1 auth route placeholder router.
- `backend/routes/dashboardRoutes.js`: Phase 1 dashboard route placeholder router.
- `backend/routes/departmentRoutes.js`: Phase 1 department route placeholder router.
- `backend/routes/index.js`: API route aggregator and `/api` root endpoint.
- `backend/routes/materialRoutes.js`: Phase 1 material route placeholder router.
- `backend/routes/notificationRoutes.js`: Phase 1 notification route placeholder router.
- `backend/routes/organizationRoutes.js`: Phase 1 organization route placeholder router.
- `backend/routes/taskActivityRoutes.js`: Phase 1 task-activity route placeholder router.
- `backend/routes/taskCommentRoutes.js`: Phase 1 task-comment route placeholder router.
- `backend/routes/taskRoutes.js`: Phase 1 task route placeholder router.
- `backend/routes/userRoutes.js`: Phase 1 user route placeholder router.
- `backend/routes/vendorRoutes.js`: Phase 1 vendor route placeholder router.

- `backend/services/index.js`: Phase 1 service-layer placeholder marker.

- `backend/utils/constants.js`: Canonical backend constants (roles, enums, regex, pagination, env keys, status/error codes, limits).
- `backend/utils/env.js`: Environment normalization and alias mapping utility.
- `backend/utils/errors.js`: Canonical backend error classes and taxonomy.
- `backend/utils/helpers.js`: Shared helpers for pagination parsing, response shaping, id normalization, and UTC ISO conversion.
- `backend/utils/index.js`: Barrel export for utility modules.
- `backend/utils/logger.js`: Structured logger and log stream adapters with metadata redaction.
- `backend/utils/validateEnv.js`: Startup environment validation and canonical runtime constraint enforcement.

## Client Directory Structure
```text
client/
├─ eslint.config.js
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ public/
│  ├─ react.svg
│  └─ vite.svg
└─ src/
   ├─ main.jsx
   ├─ assets/
   │  └─ notFound_404.svg
   ├─ components/
   │  ├─ columns/
   │  │  └─ index.js
   │  ├─ common/
   │  │  ├─ index.js
   │  │  └─ RoutePlaceholder.jsx
   │  ├─ features/
   │  │  └─ index.js
   │  ├─ layouts/
   │  │  ├─ DashboardLayout.jsx
   │  │  ├─ index.js
   │  │  ├─ PublicLayout.jsx
   │  │  └─ RootLayout.jsx
   │  └─ reusable/
   │     ├─ CustomIcons.jsx
   │     ├─ index.js
   │     ├─ MuiActionColumn.jsx
   │     ├─ MuiAvatarStack.jsx
   │     ├─ MuiBackdrop.jsx
   │     ├─ MuiBadge.jsx
   │     ├─ MuiBottomNavigation.jsx
   │     ├─ MuiCheckbox.jsx
   │     ├─ MuiChip.jsx
   │     ├─ MuiDataGrid.jsx
   │     ├─ MuiDataGridToolbar.jsx
   │     ├─ MuiDialog.jsx
   │     ├─ MuiDialogConfirm.jsx
   │     ├─ MuiEmptyState.jsx
   │     ├─ MuiFAB.jsx
   │     ├─ MuiFilterButton.jsx
   │     ├─ MuiLoading.jsx
   │     ├─ MuiMultiSelect.jsx
   │     ├─ MuiNumberField.jsx
   │     ├─ MuiPagination.jsx
   │     ├─ MuiProgress.jsx
   │     ├─ MuiRating.jsx
   │     ├─ MuiSearchField.jsx
   │     ├─ MuiSelectAutocomplete.jsx
   │     ├─ MuiSlider.jsx
   │     ├─ MuiSpeedDial.jsx
   │     ├─ MuiStatCard.jsx
   │     ├─ MuiSwitch.jsx
   │     ├─ MuiTextField.jsx
   │     ├─ MuiThemeDropDown.jsx
   │     ├─ MuiTimeline.jsx
   │     ├─ MuiToggleButton.jsx
   │     ├─ MuiTooltip.jsx
   │     └─ MuiViewToggle.jsx
   ├─ hooks/
   │  ├─ index.js
   │  ├─ useAuth.js
   │  ├─ useAuthorization.js
   │  ├─ useResponsive.js
   │  └─ useTimezone.js
   ├─ pages/
   │  ├─ dashboard/
   │  │  ├─ DashboardPage.jsx
   │  │  ├─ DepartmentDetailsPage.jsx
   │  │  ├─ DepartmentsPage.jsx
   │  │  ├─ Home.jsx
   │  │  ├─ MaterialDetailsPage.jsx
   │  │  ├─ MaterialsPage.jsx
   │  │  ├─ NotFound.jsx
   │  │  ├─ SettingsPage.jsx
   │  │  ├─ TaskDetailsPage.jsx
   │  │  ├─ TasksPage.jsx
   │  │  ├─ UserDetailsPage.jsx
   │  │  ├─ UsersPage.jsx
   │  │  ├─ VendorDetailsPage.jsx
   │  │  └─ VendorsPage.jsx
   │  └─ public/
   │     ├─ ForgotPasswordPage.jsx
   │     ├─ LandingPage.jsx
   │     ├─ LoginPage.jsx
   │     ├─ RegisterPage.jsx
   │     ├─ ResetPasswordPage.jsx
   │     └─ VerifyEmailPage.jsx
   ├─ redux/
   │  ├─ features/
   │  │  └─ index.js
   │  └─ store/
   │     └─ index.js
   ├─ router/
   │  └─ routes.jsx
   ├─ services/
   │  ├─ api.js
   │  ├─ index.js
   │  ├─ socketEvents.js
   │  └─ socketService.js
   ├─ theme/
   │  ├─ AppTheme.jsx
   │  ├─ themePrimitives.js
   │  └─ customizations/
   │     ├─ charts.js
   │     ├─ dataDisplay.js
   │     ├─ dataGrid.js
   │     ├─ datePickers.js
   │     ├─ feedback.js
   │     ├─ index.js
   │     ├─ inputs.js
   │     ├─ navigation.js
   │     └─ surfaces.js
   └─ utils/
      ├─ authorizationHelper.js
      ├─ constants.js
      ├─ dateUtils.js
      ├─ index.js
      └─ validators.js
```

## Client File Coverage
- `client/eslint.config.js`: ESLint runtime configuration for frontend source.
- `client/index.html`: Vite HTML entry shell.
- `client/package.json`: Frontend scripts and dependency declarations.
- `client/package-lock.json`: Locked frontend dependency graph.
- `client/vite.config.js`: Vite bundler/dev-server configuration.
- `client/public/react.svg`: Static React icon asset.
- `client/public/vite.svg`: Static Vite icon asset.
- `client/src/main.jsx`: Frontend bootstrap with providers and router mount.
- `client/src/assets/notFound_404.svg`: 404 illustration asset.

- `client/src/components/columns/index.js`: Phase 1 column-definition placeholder marker.
- `client/src/components/common/index.js`: Barrel export for common components.
- `client/src/components/common/RoutePlaceholder.jsx`: Standardized placeholder card/dialog surface used by route placeholder pages.
- `client/src/components/features/index.js`: Phase 1 feature-component placeholder marker.

- `client/src/components/layouts/RootLayout.jsx`: Root layout with outlet and global toast mounting.
- `client/src/components/layouts/PublicLayout.jsx`: Public shell with top app bar, responsive drawer, and scrollable content below app bar.
- `client/src/components/layouts/DashboardLayout.jsx`: Authenticated shell with app bar, sidebar, mobile bottom navigation/FAB, and scrollable content below app bar.
- `client/src/components/layouts/index.js`: Barrel export for layout components.

- `client/src/components/reusable/CustomIcons.jsx`: Branded app-logo icon component.
- `client/src/components/reusable/index.js`: Barrel export for reusable MUI wrapper components.
- `client/src/components/reusable/MuiActionColumn.jsx`: Reusable row-action control cluster for list/grid actions.
- `client/src/components/reusable/MuiAvatarStack.jsx`: Stacked avatar renderer for assignees/watchers.
- `client/src/components/reusable/MuiBackdrop.jsx`: Backdrop/loading overlay wrapper.
- `client/src/components/reusable/MuiBadge.jsx`: Badge wrapper for counts/indicators.
- `client/src/components/reusable/MuiBottomNavigation.jsx`: Mobile bottom-navigation wrapper.
- `client/src/components/reusable/MuiCheckbox.jsx`: Checkbox wrapper with helper/error support.
- `client/src/components/reusable/MuiChip.jsx`: Enum/status/priority chip wrapper with type-to-color mapping.
- `client/src/components/reusable/MuiDataGrid.jsx`: DataGrid wrapper with canonical defaults and no-rows overlay.
- `client/src/components/reusable/MuiDataGridToolbar.jsx`: Toolbar wrapper for search/filter/grid actions.
- `client/src/components/reusable/MuiDialog.jsx`: Responsive dialog wrapper (mobile full-height behavior).
- `client/src/components/reusable/MuiDialogConfirm.jsx`: Confirm-dialog wrapper for sensitive actions.
- `client/src/components/reusable/MuiEmptyState.jsx`: Empty-state content renderer.
- `client/src/components/reusable/MuiFAB.jsx`: Floating action button wrapper.
- `client/src/components/reusable/MuiFilterButton.jsx`: Filter action button with active-filter badge count.
- `client/src/components/reusable/MuiLoading.jsx`: Loading-state renderer (inline/full-screen modes).
- `client/src/components/reusable/MuiMultiSelect.jsx`: Multi-select autocomplete wrapper.
- `client/src/components/reusable/MuiNumberField.jsx`: Number-input wrapper with range helpers.
- `client/src/components/reusable/MuiPagination.jsx`: Pagination wrapper with canonical defaults.
- `client/src/components/reusable/MuiProgress.jsx`: Circular/linear progress wrapper.
- `client/src/components/reusable/MuiRating.jsx`: Rating-input wrapper.
- `client/src/components/reusable/MuiSearchField.jsx`: Search-input wrapper built on `MuiTextField`.
- `client/src/components/reusable/MuiSelectAutocomplete.jsx`: Single/multi select-autocomplete wrapper.
- `client/src/components/reusable/MuiSlider.jsx`: Slider-input wrapper with local smoothing behavior.
- `client/src/components/reusable/MuiSpeedDial.jsx`: Speed-dial action wrapper.
- `client/src/components/reusable/MuiStatCard.jsx`: KPI/stat card wrapper.
- `client/src/components/reusable/MuiSwitch.jsx`: Switch-input wrapper with helper/error support.
- `client/src/components/reusable/MuiTextField.jsx`: Text-field wrapper with adornment and helper/error integration.
- `client/src/components/reusable/MuiThemeDropDown.jsx`: Theme mode selector dropdown.
- `client/src/components/reusable/MuiTimeline.jsx`: Timeline/activity feed renderer.
- `client/src/components/reusable/MuiToggleButton.jsx`: Toggle-button group wrapper.
- `client/src/components/reusable/MuiTooltip.jsx`: Tooltip wrapper with accessibility-focused defaults.
- `client/src/components/reusable/MuiViewToggle.jsx`: Grid/list view toggle control.

- `client/src/hooks/index.js`: Barrel export for hooks.
- `client/src/hooks/useAuth.js`: Phase 1 auth hook placeholder.
- `client/src/hooks/useAuthorization.js`: Phase 1 authorization hook placeholder.
- `client/src/hooks/useResponsive.js`: Breakpoint/device-mode resolver hook.
- `client/src/hooks/useTimezone.js`: Browser timezone resolver hook.

- `client/src/pages/dashboard/DashboardPage.jsx`: Dashboard route placeholder page.
- `client/src/pages/dashboard/DepartmentDetailsPage.jsx`: Department-details route placeholder page.
- `client/src/pages/dashboard/DepartmentsPage.jsx`: Departments-list route placeholder page.
- `client/src/pages/dashboard/Home.jsx`: Dashboard home placeholder page.
- `client/src/pages/dashboard/MaterialDetailsPage.jsx`: Material-details route placeholder page.
- `client/src/pages/dashboard/MaterialsPage.jsx`: Materials-list route placeholder page.
- `client/src/pages/dashboard/NotFound.jsx`: Global route fallback page.
- `client/src/pages/dashboard/SettingsPage.jsx`: Settings route placeholder page.
- `client/src/pages/dashboard/TaskDetailsPage.jsx`: Task-details route placeholder page.
- `client/src/pages/dashboard/TasksPage.jsx`: Tasks-list route placeholder page.
- `client/src/pages/dashboard/UserDetailsPage.jsx`: User-details route placeholder page.
- `client/src/pages/dashboard/UsersPage.jsx`: Users-list route placeholder page.
- `client/src/pages/dashboard/VendorDetailsPage.jsx`: Vendor-details route placeholder page.
- `client/src/pages/dashboard/VendorsPage.jsx`: Vendors-list route placeholder page.
- `client/src/pages/public/ForgotPasswordPage.jsx`: Forgot-password route placeholder page.
- `client/src/pages/public/LandingPage.jsx`: Public landing page shell.
- `client/src/pages/public/LoginPage.jsx`: Login route placeholder page.
- `client/src/pages/public/RegisterPage.jsx`: Registration route placeholder page.
- `client/src/pages/public/ResetPasswordPage.jsx`: Reset-password route placeholder page.
- `client/src/pages/public/VerifyEmailPage.jsx`: Verify-email route placeholder page.

- `client/src/redux/features/index.js`: Phase 1 redux-features placeholder marker.
- `client/src/redux/store/index.js`: Phase 1 redux-store placeholder surface.

- `client/src/router/routes.jsx`: Public and dashboard route map with lazy-loaded placeholders.

- `client/src/services/api.js`: Phase 1 API-layer placeholder metadata.
- `client/src/services/index.js`: Barrel export for service modules.
- `client/src/services/socketEvents.js`: Phase 1 socket-event registry placeholder.
- `client/src/services/socketService.js`: Phase 1 socket service placeholder API.

- `client/src/theme/AppTheme.jsx`: Theme provider composition and customization merge.
- `client/src/theme/themePrimitives.js`: Color tokens, typography primitives, shape, shadows, and layout primitives.
- `client/src/theme/customizations/charts.js`: Chart-related component overrides.
- `client/src/theme/customizations/dataDisplay.js`: Data-display component overrides.
- `client/src/theme/customizations/dataGrid.js`: DataGrid component overrides.
- `client/src/theme/customizations/datePickers.js`: Date-picker component overrides.
- `client/src/theme/customizations/feedback.js`: Feedback component overrides.
- `client/src/theme/customizations/index.js`: Barrel export for theme customization modules.
- `client/src/theme/customizations/inputs.js`: Input component overrides.
- `client/src/theme/customizations/navigation.js`: Navigation component overrides.
- `client/src/theme/customizations/surfaces.js`: Surface component overrides.

- `client/src/utils/authorizationHelper.js`: Phase 1 authorization helper placeholder.
- `client/src/utils/constants.js`: Frontend constants mirror (backend-relevant constants + frontend layout/navigation constants).
- `client/src/utils/dateUtils.js`: UI date formatting helper.
- `client/src/utils/index.js`: Barrel export for utility modules.
- `client/src/utils/validators.js`: Frontend validator helper primitives.

## Phase Status Notes
- `backend/models/*`: Phase 1 placeholder surfaces only; implementation is deferred to Phase 2.
- `backend/mock/*`: Phase 1 placeholder command/data surfaces only; implementation is deferred to Phase 2.
- Phase 2 mock implementation is expected to consume platform seed source values from backend environment keys for:
  - platform organization
  - first platform department
  - first user in that platform department

## Runtime Validation
- Backend seed command: `npm run seed` (passed; phase-1 placeholder behavior confirmed).
- Backend wipe command: `npm run wipe` (passed; phase-1 placeholder behavior confirmed).
- Backend runtime checks: `GET /` and `GET /health` on `http://127.0.0.1:4000` both returned `200`.
- Frontend lint: `npm run lint` (passed).
- Frontend production build: `npm run build` (passed).
