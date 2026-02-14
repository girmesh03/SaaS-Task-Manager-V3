# Task Execution Protocol - MANDATORY

This protocol defines **seven mandatory steps** that MUST be followed when executing **each task**. No shortcuts. No exceptions.

## Step 1: Pre-Git Requirement (Before Task Execution)

**Purpose**: Ensure complete and accurate Git branch information to prevent issues during new branch creation and checkout.

**Actions**:

1. **Check Current State**:

   - Execute `git status` to check current branch, uncommitted changes, untracked files
   - Execute `git branch -vv` to display all local branches and tracking information
   - Execute `git fetch origin` to update remote tracking information

2. **Handle Uncommitted Changes**:

   - **IF uncommitted changes exist**:
     - Stay on current branch
     - Execute `git add .` to stage all changes
     - Execute `git commit -m "descriptive commit message"`
     - Execute `git push origin <current-branch>`
     - Execute `git checkout main` (or appropriate base branch)
     - Execute `git merge <feature-branch>`
     - Execute `git push origin main`
     - Execute `git branch -d <feature-branch>`
     - Execute `git push origin --delete <feature-branch>`
     - **Think twice before acting** - verify branch names and merge targets

3. **Synchronize Local with Remote**:

   - **IF local branch is behind remote**: Execute `git pull origin <branch>`
   - **IF merge conflicts detected**: HALT immediately, prompt user to resolve conflicts

4. **Create Feature Branch**:

   - Execute `git checkout -b <descriptive-branch-name>` (e.g., `feature/task-2-auth-state-management`)
   - Use clear, descriptive branch names matching task number and description

5. **Verify Clean State**:
   - Execute `git status` to confirm clean working directory
   - Confirm correct branch is checked out
   - Proceed to Step 2 only after verification

## Step 2: Comprehensive and Extremely Deep Codebase Analysis

**Purpose**: Capture every single detail of both `backend/*` and `client/*` to ensure absolute alignment with requirements, designs, specifications, and constraints.

**Critical Analysis Areas**:

### Backend Analysis (Complete Deep Dive):

1. **Configuration Layer** (`backend/config/*`):

   - `allowedOrigins.js`, `authorizationMatrix.json`, `corsOptions.js`, `db.js`

2. **Error Handling** (`backend/errorHandler/*`):

   - `CustomError.js`, `ErrorController.js`

3. **Validation Layer** (`backend/middlewares/validators/*`):

   - ALL validator files: `authValidators.js`, `organizationValidators.js`, `departmentValidators.js`, `userValidators.js`, `taskValidators.js`, `taskActivityValidators.js`, `taskCommentValidators.js`, `materialValidators.js`, `vendorValidators.js`, `notificationValidators.js`, `validation.js`
   - Understand exact validation rules, field constraints, patterns, max lengths

4. **Middleware Layer** (`backend/middlewares/*`):

   - `authMiddleware.js`, `authorization.js`, `rateLimiter.js`

5. **Model Layer** (`backend/models/*`):

   - `plugins/softDelete.js`
   - ALL model files: `Organization.js`, `Department.js`, `User.js`, `Task.js`, `ProjectTask.js`, `AssignedTask.js`, `RoutineTask.js`, `TaskActivity.js`, `TaskComment.js`, `Material.js`, `Vendor.js`, `Notification.js`
   - Understand discriminator patterns, schema structures, indexes, virtuals, methods

6. **Route Layer** (`backend/routes/*`):

   - `authRoutes.js`, `organizationRoutes.js`, `departmentRoutes.js`, `userRoutes.js`, `taskRoutes.js`, `taskActivityRoutes.js`, `taskCommentRoutes.js`, `materialRoutes.js`, `vendorRoutes.js`, `notificationRoutes.js`, `index.js`
   - ALL route files and their endpoint definitions
   - HTTP methods, paths, middleware chains, controller mappings

7. **Service Layer** (`backend/services/*`):

   - `emailService.js`, `notificationService.js`

8. **Utility Layer** (`backend/utils/*`):

   - `constants.js` - **SINGLE SOURCE OF TRUTH**
   - `logger.js`, `helpers.js`, `generateTokens.js`, `authorizationMatrix.js`, `validateEnv.js`
   - `socket.js`, `socketEmitter.js`, `socketInstance.js`, `userStatus.js`

9. **Application Entry Points**:
   - `app.js`, `server.js`

### Frontend Analysis (Complete Deep Dive):

10. **Redux State Management** (`client/src/redux/*`):

    - `app/store.js`, `features/*` - RTK Query base API, ALL feature slices and API endpoints

11. **Components** (`client/src/components/*`):

    - `reusable/*`, `common/*`, `common/ErrorBoundary.jsx`, `common/RouteError.jsx`, `columns/*`, `filter/*`, `layout/*`, `auth/*`, `department/*`, `user/*`, `task/*`, 'taskActivity/\_', `taskComment/*`, `material/*`, `vendor/*`, `attachment/*`, `notification/*`, `dashboard/\*`
    - Component patterns, prop structures, event handlers

12. **Pages** (`client/src/pages/*`):

    - Home (landing page), Login, Register, ForgotPassword, ResetPassword, Dashboard, Departments, Users, Tasks, Materials, Vendors, NotFound

13. **Services** (`client/src/services/*`):

    - `socketService.js`, `socketEvents.js`

14. **Hooks** (`client/src/hooks/*`):

    - `useAuth.js`, `useSocket.js`, `useAuthorization.js`, `useTimezone.js`, `useResponsive.js`

15. **Utils** (`client/src/utils/*`):

    - `constants.js` - **MUST match backend exactly**
    - `dateUtils.js`, `authorizationHelper.js`, `validators.js`

16. **Theme System**:

    - `client/src/theme/customizations/*`, `client/src/theme/AppTheme.jsx`, `client/src/theme/themePrimitives.js`

17. **Package Dependencies**:
    - `client/package.json` - Installed packages and versions

**Analysis Outcome**:

- Complete understanding of existing patterns
- Exact knowledge of validation rules
- Full awareness of authorization constraints
- Deep comprehension of data models and relationships
- Absolute clarity on UI/UX specifications

**Proceed to Step 3 only after completing this comprehensive analysis.**

## Step 3: Comprehensive Analysis of Previously Implemented Tasks (N - 1)

**Purpose**: Understand all previously implemented tasks to ensure consistency, avoid duplication, and maintain architectural patterns.

**Actions**:

1. **Identify Previous Tasks**:

   - Identify all tasks marked as completed (checked boxes)
   - For current task N, analyze tasks 1 through N-1

2. **Analyze Each Previous Task**:

   - **Files Created**: List all files created in each task
   - **Patterns Used**: Identify architectural patterns, naming conventions, code structures
   - **Dependencies**: Understand inter-task dependencies and shared utilities
   - **Validation Rules**: Note validation patterns and error handling approaches
   - **State Management**: Review Redux slice patterns, API endpoint structures
   - **Component Patterns**: Analyze component composition, prop patterns, event handling
   - **Styling Approaches**: Review MUI customization patterns, theme usage

3. **Consistency Verification**:

   - Ensure new task follows established patterns
   - Verify naming conventions match previous tasks
   - Confirm validation approaches are consistent
   - Check that constants are imported (never hardcoded)
   - Validate timezone handling matches established patterns
   - Ensure soft delete patterns are followed

4. **Gap Analysis**:
   - Identify any missing utilities needed for current task
   - Determine if new patterns are required
   - Plan for backward compatibility if changes needed

**Analysis Outcome**:

- Complete understanding of implementation history
- Clear picture of established patterns
- Confidence in maintaining consistency
- Awareness of potential conflicts or duplications

**Proceed to Step 4 only after completing this analysis.**

## Step 4: Task Execution Without Deviation

**Purpose**: Implement the task with absolute adherence to requirements, designs, specifications, and constraints.

### Mandatory Compliance Documents:

#### Code Compliance:

1. `backend/routes/*` - Exact endpoint paths and HTTP methods
2. `backend/middlewares/validators/*` - Exact validation rules and constraints
3. `backend/models/*` - Exact schema structures and field definitions
4. `backend/utils/constants.js` - Use constants, NEVER hardcode values
5. `client/src/utils/constants.js` - Must match backend constants EXACTLY
6. `client/src/utils/*` - Utilize available helpers and utils
7. `client/src/components/*` - Utilize available components and patterns
8. `client/src/hooks/*` - Utilize available hooks and patterns
9. `client/src/redux/*` - Utilize available Redux patterns and structures
10. `client/src/services/*` - Utilize available services and patterns
11. `client/src/theme/*` - Utilize available theme patterns and structures

### Implementation Rules:

1. **Validation Alignment**: Frontend validation MUST match backend validators exactly
2. **Soft Delete Compliance**: Show "Restore" for deleted, hide "Delete" for deleted, include deleted toggle
3. **Authorization Checks**: Use `useAuthorization` hook, hide/disable based on role and scope
4. **API Integration**: Use RTK Query endpoints, handle loading states, invalidate cache tags
5. **Component Patterns**: Use react-hook-form with Controller, wrap MUI with Mui prefix, React.memo for Cards
6. **Styling Consistency**: Use theme customizations, responsive design, MUI Grid v7 syntax (size prop)
7. **Testing Readiness**: Write clean, testable code, avoid side effects in render

### Implementation Verification:

- [ ] All UI specifications match established patterns
- [ ] All files created/modified match established patterns
- [ ] All validation rules match backend exactly
- [ ] All dates use timezone conversion functions
- [ ] All soft delete rules are followed
- [ ] All authorization checks are implemented
- [ ] All constants are imported (none hardcoded)
- [ ] All API endpoints use RTK Query
- [ ] All forms use react-hook-form with Controller
- [ ] All MUI components use Mui prefix wrappers
- [ ] All styling uses theme customizations
- [ ] Code follows established patterns from previous tasks

**Proceed to Step 5 only after completing implementation and verification.**

## Step 5: Backend Testing (MANDATORY FOR BACKEND TASKS ONLY)

**Purpose**: Using `docs/development-rules.md` Testing Rules section validate backend correctness before user review by executing real validators, controllers, and database logic using plain JavaScript scripts.

**Scope**:
This step MUST be performed **ONLY if the task includes backend changes**.
For frontend-only tasks, this step MUST be explicitly skipped.

**Actions**:

1. Execute validator logic directly using `.run(req)` and assert results with `validationResult(req)`.
2. Test all existence, uniqueness, scoping, soft-delete, and restore validation rules.
3. Invoke controllers directly as plain functions using fully constructed `req.user` and `req.validated`.
4. Assert authorization, ownership, organization isolation, and department isolation.
5. Verify database side effects explicitly (create, update, soft delete, restore, cascade).
6. **IF any test fails**: HALT, fix implementation, re-run tests.

**Proceed to Step 6 only after backend tests pass or are explicitly skipped.**

## Step 6: User Review and Feedback Integration

**Purpose**: Request user review of the implementation and apply any required updates or changes.

**Actions**:

1. **Present Implementation**:

   - Summarize what was implemented
   - List all files created/modified
   - Highlight key features and functionality
   - Note any deviations or decisions made (if any)

2. **Request Review**:

   - Ask user to review the implementation
   - Request feedback on functionality, design, code quality
   - Inquire about any changes or improvements needed

3. **Handle Feedback**:

   - **IF user requests changes**: Document, implement, re-request review, repeat until satisfied
   - **IF user approves**: Confirm explicit approval, move to Step 7

4. **Verification Before Proceeding**:
   - Ensure user has explicitly stated approval
   - Confirm no additional changes are needed
   - Get clear go-ahead for Git operations

**Do NOT proceed to Step 7 without explicit user approval.**

## Step 7: Post-Git Requirement (After Task Completion)

**Purpose**: Add, commit, push implementation, checkout, merge, and synchronize between local and remote repositories. Delete related branches after detailed verification.

**Actions**:

1. **Verify Current State**:

   - Execute `git status` to check current branch, all modified/created files, no unintended changes
   - Execute `git branch -vv` to display branch tracking information
   - Execute `git fetch origin` to update remote tracking information

2. **Stage and Commit Changes**:

   - Review all changes: `git diff`
   - Stage all changes: `git add .`
   - Verify staged changes: `git status`
   - Commit: `git commit -m "feat: [Task N] Descriptive task title and summary"`
   - Use conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, etc.

3. **Push Feature Branch**:

   - Push to remote: `git push origin <feature-branch>`
   - Verify push success
   - Confirm remote branch exists: `git branch -r`

4. **Checkout Base Branch**:

   - Checkout main: `git checkout main` (or appropriate base branch)
   - Verify clean state: `git status`
   - Pull latest changes: `git pull origin main`

5. **Merge Feature Branch**:

   - **CRITICAL: Think twice before merging**
   - Verify correct base branch: `git branch`
   - Merge: `git merge <feature-branch>`
   - **IF merge conflicts**: HALT immediately, prompt user to resolve conflicts
   - **IF merge successful**: Verify merged changes: `git log --oneline -5`

6. **Push Merged Changes**:

   - Push to remote: `git push origin main`
   - Verify push success
   - Confirm remote is updated: `git log origin/main --oneline -5`

7. **Delete Feature Branch (Local and Remote)**:

   - **CRITICAL: Verify merge success before deleting**
   - Confirm fully merged: `git branch --merged`
   - Delete local: `git branch -d <feature-branch>`
   - Delete remote: `git push origin --delete <feature-branch>`
   - Verify deletion: `git branch -a`

8. **Final Synchronization Verification**:

   - Execute `git status` - clean working directory
   - Execute `git branch -vv` - main branch in sync with origin
   - Execute `git log --oneline -5` - recent commit visible
   - Confirm local and remote synchronized

9. **Cleanup Verification**:
   - Verify no orphaned branches: `git branch -a`
   - Verify no uncommitted changes: `git status`
   - Verify correct branch: `git branch` (should be on main)

**Task Completion Confirmed**: All changes committed, pushed, merged, and branches cleaned up.

## Protocol Enforcement

**This protocol is MANDATORY for EVERY task.**

- **No shortcuts allowed**
- **No exceptions permitted**
- **All seven steps must be completed in order**
- **Each step must be verified before proceeding to next**
- **User approval required before Step 7**

**Failure to follow this protocol will result in:**

- Inconsistent implementations
- Git conflicts and branch issues
- Validation mismatches between frontend and backend
- Timezone handling errors
- Soft delete rule violations
- Authorization bypass vulnerabilities

**Success in following this protocol ensures:**

- Clean Git history
- Consistent code quality
- Exact alignment with specifications
- Maintainable codebase
- Predictable behavior
- Secure implementation

**REMEMBER**: This protocol is your roadmap to success. Follow it religiously.
