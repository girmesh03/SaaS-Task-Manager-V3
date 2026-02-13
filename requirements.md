# Requirements

## UI Reference Coverage

Canonical source set used:
- `docs/ui/*.png` filenames (35 total).
- PRD Section 23.2 **Required UI Screens Coverage (By Reference Name)** in `docs/product-requirements-document-new.md`.

### Feature Requirement IDs (Frontend/UI)

- **FR-UI-001**: Public shell + landing page composition and auth CTAs (CAN-025).
- **FR-UI-002**: Dashboard layout behavior for desktop/mobile including sidebar/header/nav constraints (CAN-001, CAN-002, CAN-024).
- **FR-UI-003**: Dashboard overview widgets and analytics integration.
- **FR-UI-004**: Department listing/filtering/dialog/detail tabs, status, and description constraints (CAN-018, CAN-022, CAN-026).
- **FR-UI-005**: User listing/filtering/dialog/detail tabs and immutable-field behavior (CAN-011, CAN-016).
- **FR-UI-006**: Task listing/filtering/dialog/detail tabs and status/priority mapping (CAN-003, CAN-004, CAN-013).
- **FR-UI-007**: Materials list/detail including inventory + restock semantics (CAN-019, CAN-021).
- **FR-UI-008**: Vendors list/detail with extended vendor fields and delete constraints (CAN-015, CAN-020).
- **FR-UI-009**: Settings profile/account tab UX and account-management flows.
- **FR-UI-010**: Responsive tablet/mobile behavior for all covered screens (CAN-001, CAN-017).
- **FR-UI-011**: Grid/List implementation conventions (`MuiDataGrid` vs cards + toolbar) (CAN-023).
- **FR-UI-012**: Data dependency compliance: every screen binds to required API contracts (PRD 23.3).

### Screen Coverage List (Exact Reference Name -> Requirement IDs)

- `public_layout_screen` -> FR-UI-001, FR-UI-010
- `landing-page` -> FR-UI-001, FR-UI-010
- `desktop-dashboard-layout` -> FR-UI-002, FR-UI-010
- `mobile-dashboard-layout` -> FR-UI-002, FR-UI-010
- `desktop_dashboard_overview_screen` -> FR-UI-003, FR-UI-010, FR-UI-012
- `departments_filter_dialog_screen` -> FR-UI-004, FR-UI-011, FR-UI-012
- `departments_grid_view_screen` -> FR-UI-004, FR-UI-011, FR-UI-012
- `departments_list_view_screen` -> FR-UI-004, FR-UI-011, FR-UI-012
- `create_update_department_dialog_screen` -> FR-UI-004, FR-UI-010, FR-UI-012
- `dept_details_overview_tab_screen` -> FR-UI-004, FR-UI-012
- `dept_details_users_tab_screen` -> FR-UI-004, FR-UI-005, FR-UI-012
- `dept_details_tasks_tab_screen` -> FR-UI-004, FR-UI-006, FR-UI-012
- `dept_details_activity_tab_screen` -> FR-UI-004, FR-UI-006, FR-UI-012
- `users_filter_dialog_screen` -> FR-UI-005, FR-UI-011, FR-UI-012
- `users_grid_view_screen` -> FR-UI-005, FR-UI-011, FR-UI-012
- `users_list_view_screen` -> FR-UI-005, FR-UI-011, FR-UI-012
- `create_update_user_dialog_screen` -> FR-UI-005, FR-UI-010, FR-UI-012
- `user_details_overview_screen` -> FR-UI-005, FR-UI-012
- `user_details_tasks_screen` -> FR-UI-005, FR-UI-006, FR-UI-012
- `user_details_activity_screen` -> FR-UI-005, FR-UI-012
- `user_details_performance_screen` -> FR-UI-005, FR-UI-012
- `tasks_filter_dialog_screen` -> FR-UI-006, FR-UI-011, FR-UI-012
- `tasks_grid_view_screen` -> FR-UI-006, FR-UI-011, FR-UI-012
- `tasks_list_view_screen` -> FR-UI-006, FR-UI-011, FR-UI-012
- `create_update_task_dialog_screen` -> FR-UI-006, FR-UI-010, FR-UI-012
- `task_details_overview_screen` -> FR-UI-006, FR-UI-012
- `task_details_activities_screen` -> FR-UI-006, FR-UI-012
- `task_details_comments_screen` -> FR-UI-006, FR-UI-012
- `task_details_attachments_screen` -> FR-UI-006, FR-UI-012
- `materials_list_view_screen` -> FR-UI-007, FR-UI-011, FR-UI-012
- `material_details_screen` -> FR-UI-007, FR-UI-012
- `vendors_list_view_screen` -> FR-UI-008, FR-UI-011, FR-UI-012
- `vendor_details_screen` -> FR-UI-008, FR-UI-012
- `settings_profile_tab_screen` -> FR-UI-009, FR-UI-012
- `settings_account_tab_screen` -> FR-UI-009, FR-UI-012
