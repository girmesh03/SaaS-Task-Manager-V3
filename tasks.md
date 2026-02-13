# Frontend Tasks

## Screen-Referenced Frontend Subtasks

### FE-ST-001 `public_layout_screen`
- Scope: Build public shell layout with header/footer and auth CTA placement.
- Required implementation checkpoints:
  - Route coverage: `/` wired and accessible.
  - Component ownership finalized in `PublicLayout, PublicHeader, PublicFooter`.
  - Data hooks integrated for `GET /api/health` with loading/error/success states.
  - Requirement ID traceability: FR-UI-001, FR-UI-010.
- UI reference images:
  - `docs/ui/public_layout_screen.png`

### FE-ST-002 `landing-page`
- Scope: Implement marketing landing composition and CTA wiring.
- Required implementation checkpoints:
  - Route coverage: `/` wired and accessible.
  - Component ownership finalized in `LandingPage, HeroSection, FeatureSections`.
  - Data hooks integrated for `None` with loading/error/success states.
  - Requirement ID traceability: FR-UI-001, FR-UI-010.
- UI reference images:
  - `docs/ui/landing-page.png`

### FE-ST-003 `desktop-dashboard-layout`
- Scope: Implement desktop dashboard shell with sidebar/header conventions.
- Required implementation checkpoints:
  - Route coverage: `/app/*` wired and accessible.
  - Component ownership finalized in `DesktopDashboardLayout, Sidebar, DashboardHeader`.
  - Data hooks integrated for `GET /api/auth/me; GET /api/notifications` with loading/error/success states.
  - Requirement ID traceability: FR-UI-002, FR-UI-010.
- UI reference images:
  - `docs/ui/desktop-dashboard-layout.png`

### FE-ST-004 `mobile-dashboard-layout`
- Scope: Implement mobile dashboard shell with bottom navigation/drawer.
- Required implementation checkpoints:
  - Route coverage: `/app/*` wired and accessible.
  - Component ownership finalized in `MobileDashboardLayout, BottomNav, MobileDrawer`.
  - Data hooks integrated for `GET /api/auth/me; GET /api/notifications` with loading/error/success states.
  - Requirement ID traceability: FR-UI-002, FR-UI-010.
- UI reference images:
  - `docs/ui/mobile-dashboard-layout.png`

### FE-ST-005 `desktop_dashboard_overview_screen`
- Scope: Implement dashboard overview widgets and analytics cards.
- Required implementation checkpoints:
  - Route coverage: `/app/dashboard` wired and accessible.
  - Component ownership finalized in `DashboardOverviewPage, KPIWidgets, ActivityPanel`.
  - Data hooks integrated for `GET /api/dashboard/overview` with loading/error/success states.
  - Requirement ID traceability: FR-UI-003, FR-UI-012.
- UI reference images:
  - `docs/ui/desktop_dashboard_overview_screen.png`

### FE-ST-006 `departments_filter_dialog_screen`
- Scope: Implement departments filter dialog with full filter set.
- Required implementation checkpoints:
  - Route coverage: `/app/departments` wired and accessible.
  - Component ownership finalized in `DepartmentFiltersDialog`.
  - Data hooks integrated for `GET /api/departments; GET /api/users?role=Manager` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/departments_filter_dialog_screen.png`

### FE-ST-007 `departments_grid_view_screen`
- Scope: Implement departments grid view via MuiDataGrid.
- Required implementation checkpoints:
  - Route coverage: `/app/departments` wired and accessible.
  - Component ownership finalized in `DepartmentsPage, DepartmentsGrid`.
  - Data hooks integrated for `GET /api/departments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/departments_grid_view_screen.png`

### FE-ST-008 `departments_list_view_screen`
- Scope: Implement departments list cards view and toggle behavior.
- Required implementation checkpoints:
  - Route coverage: `/app/departments` wired and accessible.
  - Component ownership finalized in `DepartmentsList`.
  - Data hooks integrated for `GET /api/departments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/departments_list_view_screen.png`

### FE-ST-009 `create_update_department_dialog_screen`
- Scope: Implement create/update department dialog validations and submit flow.
- Required implementation checkpoints:
  - Route coverage: `/app/departments` wired and accessible.
  - Component ownership finalized in `DepartmentDialog`.
  - Data hooks integrated for `POST /api/departments; PATCH /api/departments/:departmentId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-010, FR-UI-012.
- UI reference images:
  - `docs/ui/create_update_department_dialog_screen.png`

### FE-ST-010 `dept_details_overview_tab_screen`
- Scope: Implement department details overview tab composition.
- Required implementation checkpoints:
  - Route coverage: `/app/departments/:departmentId` wired and accessible.
  - Component ownership finalized in `DepartmentDetailsPage, DepartmentOverviewTab`.
  - Data hooks integrated for `GET /api/departments/:departmentId; GET /api/departments/:departmentId/dashboard` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-012.
- UI reference images:
  - `docs/ui/dept_details_overview_tab_screen.png`

### FE-ST-011 `dept_details_users_tab_screen`
- Scope: Implement department members tab with role/status states.
- Required implementation checkpoints:
  - Route coverage: `/app/departments/:departmentId?tab=members` wired and accessible.
  - Component ownership finalized in `DepartmentMembersTab`.
  - Data hooks integrated for `GET /api/departments/:departmentId/users` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-005, FR-UI-012.
- UI reference images:
  - `docs/ui/dept_details_users_tab_screen.png`

### FE-ST-012 `dept_details_tasks_tab_screen`
- Scope: Implement department tasks tab with list/grid and filters.
- Required implementation checkpoints:
  - Route coverage: `/app/departments/:departmentId?tab=tasks` wired and accessible.
  - Component ownership finalized in `DepartmentTasksTab`.
  - Data hooks integrated for `GET /api/tasks?department=:departmentId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/dept_details_tasks_tab_screen.png`

### FE-ST-013 `dept_details_activity_tab_screen`
- Scope: Implement department activity sub-tab timeline/feed.
- Required implementation checkpoints:
  - Route coverage: `/app/departments/:departmentId?tab=tasks&subtab=activity` wired and accessible.
  - Component ownership finalized in `DepartmentActivityTab`.
  - Data hooks integrated for `GET /api/departments/:departmentId/activity` with loading/error/success states.
  - Requirement ID traceability: FR-UI-004, FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/dept_details_activity_tab_screen.png`

### FE-ST-014 `users_filter_dialog_screen`
- Scope: Implement users filter dialog and chip summaries.
- Required implementation checkpoints:
  - Route coverage: `/app/users` wired and accessible.
  - Component ownership finalized in `UserFiltersDialog`.
  - Data hooks integrated for `GET /api/users; GET /api/departments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/users_filter_dialog_screen.png`

### FE-ST-015 `users_grid_view_screen`
- Scope: Implement users grid view with row actions.
- Required implementation checkpoints:
  - Route coverage: `/app/users` wired and accessible.
  - Component ownership finalized in `UsersPage, UsersGrid`.
  - Data hooks integrated for `GET /api/users` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/users_grid_view_screen.png`

### FE-ST-016 `users_list_view_screen`
- Scope: Implement users list/card view with responsive layout.
- Required implementation checkpoints:
  - Route coverage: `/app/users` wired and accessible.
  - Component ownership finalized in `UsersList`.
  - Data hooks integrated for `GET /api/users` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/users_list_view_screen.png`

### FE-ST-017 `create_update_user_dialog_screen`
- Scope: Implement create/update user dialog with immutable field handling.
- Required implementation checkpoints:
  - Route coverage: `/app/users` wired and accessible.
  - Component ownership finalized in `UserDialog`.
  - Data hooks integrated for `POST /api/users; PATCH /api/users/:userId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-010, FR-UI-012.
- UI reference images:
  - `docs/ui/create_update_user_dialog_screen.png`

### FE-ST-018 `user_details_overview_screen`
- Scope: Implement user details overview tab.
- Required implementation checkpoints:
  - Route coverage: `/app/users/:userId` wired and accessible.
  - Component ownership finalized in `UserDetailsPage, UserOverviewTab`.
  - Data hooks integrated for `GET /api/users/:userId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-012.
- UI reference images:
  - `docs/ui/user_details_overview_screen.png`

### FE-ST-019 `user_details_tasks_screen`
- Scope: Implement user details tasks tab.
- Required implementation checkpoints:
  - Route coverage: `/app/users/:userId?tab=tasks` wired and accessible.
  - Component ownership finalized in `UserTasksTab`.
  - Data hooks integrated for `GET /api/tasks?assignee=:userId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/user_details_tasks_screen.png`

### FE-ST-020 `user_details_activity_screen`
- Scope: Implement user details activity tab timeline.
- Required implementation checkpoints:
  - Route coverage: `/app/users/:userId?tab=activity` wired and accessible.
  - Component ownership finalized in `UserActivityTab`.
  - Data hooks integrated for `GET /api/users/:userId/activity` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-012.
- UI reference images:
  - `docs/ui/user_details_activity_screen.png`

### FE-ST-021 `user_details_performance_screen`
- Scope: Implement user performance tab and metrics widgets.
- Required implementation checkpoints:
  - Route coverage: `/app/users/:userId?tab=performance` wired and accessible.
  - Component ownership finalized in `UserPerformanceTab`.
  - Data hooks integrated for `GET /api/users/:userId/performance` with loading/error/success states.
  - Requirement ID traceability: FR-UI-005, FR-UI-012.
- UI reference images:
  - `docs/ui/user_details_performance_screen.png`

### FE-ST-022 `tasks_filter_dialog_screen`
- Scope: Implement tasks filter dialog with canonical union filters.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks` wired and accessible.
  - Component ownership finalized in `TaskFiltersDialog`.
  - Data hooks integrated for `GET /api/tasks; GET /api/users; GET /api/departments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/tasks_filter_dialog_screen.png`

### FE-ST-023 `tasks_grid_view_screen`
- Scope: Implement tasks grid view with toolbar and actions.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks` wired and accessible.
  - Component ownership finalized in `TasksPage, TasksGrid`.
  - Data hooks integrated for `GET /api/tasks` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/tasks_grid_view_screen.png`

### FE-ST-024 `tasks_list_view_screen`
- Scope: Implement tasks list card view and grouping.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks` wired and accessible.
  - Component ownership finalized in `TasksList`.
  - Data hooks integrated for `GET /api/tasks` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/tasks_list_view_screen.png`

### FE-ST-025 `create_update_task_dialog_screen`
- Scope: Implement create/update task dialog including assignment/material selectors.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks` wired and accessible.
  - Component ownership finalized in `TaskDialog`.
  - Data hooks integrated for `POST /api/tasks; PATCH /api/tasks/:taskId; GET /api/materials; GET /api/users` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-010, FR-UI-012.
- UI reference images:
  - `docs/ui/create_update_task_dialog_screen.png`

### FE-ST-026 `task_details_overview_screen`
- Scope: Implement task details overview tab with metadata/actions.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks/:taskId` wired and accessible.
  - Component ownership finalized in `TaskDetailsPage, TaskOverviewTab`.
  - Data hooks integrated for `GET /api/tasks/:taskId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/task_details_overview_screen.png`

### FE-ST-027 `task_details_activities_screen`
- Scope: Implement task activities tab timeline and filters.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks/:taskId?tab=activities` wired and accessible.
  - Component ownership finalized in `TaskActivitiesTab`.
  - Data hooks integrated for `GET /api/tasks/:taskId/activities` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/task_details_activities_screen.png`

### FE-ST-028 `task_details_comments_screen`
- Scope: Implement task comments tab with threaded comments (max depth 5).
- Required implementation checkpoints:
  - Route coverage: `/app/tasks/:taskId?tab=comments` wired and accessible.
  - Component ownership finalized in `TaskCommentsTab`.
  - Data hooks integrated for `GET /api/tasks/:taskId/comments; POST /api/tasks/:taskId/comments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/task_details_comments_screen.png`

### FE-ST-029 `task_details_attachments_screen`
- Scope: Implement task attachments tab for upload/list/preview actions.
- Required implementation checkpoints:
  - Route coverage: `/app/tasks/:taskId?tab=attachments` wired and accessible.
  - Component ownership finalized in `TaskAttachmentsTab`.
  - Data hooks integrated for `GET /api/tasks/:taskId/attachments; POST /api/attachments` with loading/error/success states.
  - Requirement ID traceability: FR-UI-006, FR-UI-012.
- UI reference images:
  - `docs/ui/task_details_attachments_screen.png`

### FE-ST-030 `materials_list_view_screen`
- Scope: Implement materials list view with inventory/SKU indicators.
- Required implementation checkpoints:
  - Route coverage: `/app/materials` wired and accessible.
  - Component ownership finalized in `MaterialsPage, MaterialsList`.
  - Data hooks integrated for `GET /api/materials` with loading/error/success states.
  - Requirement ID traceability: FR-UI-007, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/materials_list_view_screen.png`

### FE-ST-031 `material_details_screen`
- Scope: Implement material details view including usage and restock actions.
- Required implementation checkpoints:
  - Route coverage: `/app/materials/:materialId` wired and accessible.
  - Component ownership finalized in `MaterialDetailsPage`.
  - Data hooks integrated for `GET /api/materials/:materialId; GET /api/materials/:materialId/usage; POST /api/materials/:materialId/restock` with loading/error/success states.
  - Requirement ID traceability: FR-UI-007, FR-UI-012.
- UI reference images:
  - `docs/ui/material_details_screen.png`

### FE-ST-032 `vendors_list_view_screen`
- Scope: Implement vendors list view with status + partner fields.
- Required implementation checkpoints:
  - Route coverage: `/app/vendors` wired and accessible.
  - Component ownership finalized in `VendorsPage, VendorsList`.
  - Data hooks integrated for `GET /api/vendors` with loading/error/success states.
  - Requirement ID traceability: FR-UI-008, FR-UI-011, FR-UI-012.
- UI reference images:
  - `docs/ui/vendors_list_view_screen.png`

### FE-ST-033 `vendor_details_screen`
- Scope: Implement vendor details view with metrics and extended fields.
- Required implementation checkpoints:
  - Route coverage: `/app/vendors/:vendorId` wired and accessible.
  - Component ownership finalized in `VendorDetailsPage`.
  - Data hooks integrated for `GET /api/vendors/:vendorId` with loading/error/success states.
  - Requirement ID traceability: FR-UI-008, FR-UI-012.
- UI reference images:
  - `docs/ui/vendor_details_screen.png`

### FE-ST-034 `settings_profile_tab_screen`
- Scope: Implement settings profile tab forms and validation states.
- Required implementation checkpoints:
  - Route coverage: `/app/settings?tab=profile` wired and accessible.
  - Component ownership finalized in `SettingsPage, SettingsProfileTab`.
  - Data hooks integrated for `GET /api/auth/me; PATCH /api/users/me` with loading/error/success states.
  - Requirement ID traceability: FR-UI-009, FR-UI-012.
- UI reference images:
  - `docs/ui/settings_profile_tab_screen.png`

### FE-ST-035 `settings_account_tab_screen`
- Scope: Implement settings account tab for security/session controls.
- Required implementation checkpoints:
  - Route coverage: `/app/settings?tab=account` wired and accessible.
  - Component ownership finalized in `SettingsAccountTab`.
  - Data hooks integrated for `PATCH /api/users/me/password; POST /api/auth/logout-all; GET /api/auth/sessions` with loading/error/success states.
  - Requirement ID traceability: FR-UI-009, FR-UI-012.
- UI reference images:
  - `docs/ui/settings_account_tab_screen.png`

## Final Traceability Matrix

| Screen | Components | Routes | APIs | Requirement IDs |
|---|---|---|---|---|
| `public_layout_screen` | PublicLayout, PublicHeader, PublicFooter | `/` | GET /api/health | FR-UI-001, FR-UI-010 |
| `landing-page` | LandingPage, HeroSection, FeatureSections | `/` | None | FR-UI-001, FR-UI-010 |
| `desktop-dashboard-layout` | DesktopDashboardLayout, Sidebar, DashboardHeader | `/app/*` | GET /api/auth/me; GET /api/notifications | FR-UI-002, FR-UI-010 |
| `mobile-dashboard-layout` | MobileDashboardLayout, BottomNav, MobileDrawer | `/app/*` | GET /api/auth/me; GET /api/notifications | FR-UI-002, FR-UI-010 |
| `desktop_dashboard_overview_screen` | DashboardOverviewPage, KPIWidgets, ActivityPanel | `/app/dashboard` | GET /api/dashboard/overview | FR-UI-003, FR-UI-012 |
| `departments_filter_dialog_screen` | DepartmentFiltersDialog | `/app/departments` | GET /api/departments; GET /api/users?role=Manager | FR-UI-004, FR-UI-011, FR-UI-012 |
| `departments_grid_view_screen` | DepartmentsPage, DepartmentsGrid | `/app/departments` | GET /api/departments | FR-UI-004, FR-UI-011, FR-UI-012 |
| `departments_list_view_screen` | DepartmentsList | `/app/departments` | GET /api/departments | FR-UI-004, FR-UI-011, FR-UI-012 |
| `create_update_department_dialog_screen` | DepartmentDialog | `/app/departments` | POST /api/departments; PATCH /api/departments/:departmentId | FR-UI-004, FR-UI-010, FR-UI-012 |
| `dept_details_overview_tab_screen` | DepartmentDetailsPage, DepartmentOverviewTab | `/app/departments/:departmentId` | GET /api/departments/:departmentId; GET /api/departments/:departmentId/dashboard | FR-UI-004, FR-UI-012 |
| `dept_details_users_tab_screen` | DepartmentMembersTab | `/app/departments/:departmentId?tab=members` | GET /api/departments/:departmentId/users | FR-UI-004, FR-UI-005, FR-UI-012 |
| `dept_details_tasks_tab_screen` | DepartmentTasksTab | `/app/departments/:departmentId?tab=tasks` | GET /api/tasks?department=:departmentId | FR-UI-004, FR-UI-006, FR-UI-012 |
| `dept_details_activity_tab_screen` | DepartmentActivityTab | `/app/departments/:departmentId?tab=tasks&subtab=activity` | GET /api/departments/:departmentId/activity | FR-UI-004, FR-UI-006, FR-UI-012 |
| `users_filter_dialog_screen` | UserFiltersDialog | `/app/users` | GET /api/users; GET /api/departments | FR-UI-005, FR-UI-011, FR-UI-012 |
| `users_grid_view_screen` | UsersPage, UsersGrid | `/app/users` | GET /api/users | FR-UI-005, FR-UI-011, FR-UI-012 |
| `users_list_view_screen` | UsersList | `/app/users` | GET /api/users | FR-UI-005, FR-UI-011, FR-UI-012 |
| `create_update_user_dialog_screen` | UserDialog | `/app/users` | POST /api/users; PATCH /api/users/:userId | FR-UI-005, FR-UI-010, FR-UI-012 |
| `user_details_overview_screen` | UserDetailsPage, UserOverviewTab | `/app/users/:userId` | GET /api/users/:userId | FR-UI-005, FR-UI-012 |
| `user_details_tasks_screen` | UserTasksTab | `/app/users/:userId?tab=tasks` | GET /api/tasks?assignee=:userId | FR-UI-005, FR-UI-006, FR-UI-012 |
| `user_details_activity_screen` | UserActivityTab | `/app/users/:userId?tab=activity` | GET /api/users/:userId/activity | FR-UI-005, FR-UI-012 |
| `user_details_performance_screen` | UserPerformanceTab | `/app/users/:userId?tab=performance` | GET /api/users/:userId/performance | FR-UI-005, FR-UI-012 |
| `tasks_filter_dialog_screen` | TaskFiltersDialog | `/app/tasks` | GET /api/tasks; GET /api/users; GET /api/departments | FR-UI-006, FR-UI-011, FR-UI-012 |
| `tasks_grid_view_screen` | TasksPage, TasksGrid | `/app/tasks` | GET /api/tasks | FR-UI-006, FR-UI-011, FR-UI-012 |
| `tasks_list_view_screen` | TasksList | `/app/tasks` | GET /api/tasks | FR-UI-006, FR-UI-011, FR-UI-012 |
| `create_update_task_dialog_screen` | TaskDialog | `/app/tasks` | POST /api/tasks; PATCH /api/tasks/:taskId; GET /api/materials; GET /api/users | FR-UI-006, FR-UI-010, FR-UI-012 |
| `task_details_overview_screen` | TaskDetailsPage, TaskOverviewTab | `/app/tasks/:taskId` | GET /api/tasks/:taskId | FR-UI-006, FR-UI-012 |
| `task_details_activities_screen` | TaskActivitiesTab | `/app/tasks/:taskId?tab=activities` | GET /api/tasks/:taskId/activities | FR-UI-006, FR-UI-012 |
| `task_details_comments_screen` | TaskCommentsTab | `/app/tasks/:taskId?tab=comments` | GET /api/tasks/:taskId/comments; POST /api/tasks/:taskId/comments | FR-UI-006, FR-UI-012 |
| `task_details_attachments_screen` | TaskAttachmentsTab | `/app/tasks/:taskId?tab=attachments` | GET /api/tasks/:taskId/attachments; POST /api/attachments | FR-UI-006, FR-UI-012 |
| `materials_list_view_screen` | MaterialsPage, MaterialsList | `/app/materials` | GET /api/materials | FR-UI-007, FR-UI-011, FR-UI-012 |
| `material_details_screen` | MaterialDetailsPage | `/app/materials/:materialId` | GET /api/materials/:materialId; GET /api/materials/:materialId/usage; POST /api/materials/:materialId/restock | FR-UI-007, FR-UI-012 |
| `vendors_list_view_screen` | VendorsPage, VendorsList | `/app/vendors` | GET /api/vendors | FR-UI-008, FR-UI-011, FR-UI-012 |
| `vendor_details_screen` | VendorDetailsPage | `/app/vendors/:vendorId` | GET /api/vendors/:vendorId | FR-UI-008, FR-UI-012 |
| `settings_profile_tab_screen` | SettingsPage, SettingsProfileTab | `/app/settings?tab=profile` | GET /api/auth/me; PATCH /api/users/me | FR-UI-009, FR-UI-012 |
| `settings_account_tab_screen` | SettingsAccountTab | `/app/settings?tab=account` | PATCH /api/users/me/password; POST /api/auth/logout-all; GET /api/auth/sessions | FR-UI-009, FR-UI-012 |
