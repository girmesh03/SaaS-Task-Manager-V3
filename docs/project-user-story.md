# Complete User Story: Task Management System

## Executive Summary

This is a comprehensive, enterprise-grade **Task Management System** designed for organizations with hierarchical structures. The system enables organizations to manage departments, users with role-based permissions, and three distinct types of tasks (Project Tasks, Routine Tasks, and Assigned Tasks) with real-time collaboration features, material tracking, vendor management, and sophisticated notification systems.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Personas](#user-personas)
3. [Core User Journeys](#core-user-journeys)
4. [Detailed Feature Narratives](#detailed-feature-narratives)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Real-World Usage Scenarios](#real-world-usage-scenarios)

---

## System Overview

### What This System Does

The Task Management System is a full-stack web application that allows organizations to:

- **Organize hierarchically**: Organizations contain departments, departments contain users
- **Manage users with roles**: SuperAdmin, Admin, Manager, and User roles with granular permissions
- **Create and track tasks**: Three task types with different workflows and requirements
- **Collaborate in real-time**: Live updates, comments, activity tracking, and notifications
- **Track resources**: Materials and vendors associated with tasks
- **Monitor progress**: Dashboard analytics, task filtering, and status tracking

### Architecture

- **Backend**: Node.js/Express REST API with MongoDB database
- **Frontend**: React with Redux Toolkit for state management and Material-UI components
- **Real-time**: Socket.IO for live updates and notifications
- **Authentication**: JWT-based with refresh token rotation
- **Authorization**: Role-based access control (RBAC) with action-level permissions

## Authorization Rule

This applies to **every resource** and **every operation**.

```markdown
Each operation on a resource is defined as an ARRAY of rules.
Authorization is GRANTED if **ANY rule passes**.

Rule fields:

- roles: string[]
  Required user roles for this rule

- requires: string[] (optional)
  Boolean predicates evaluated against req.user / system context

- scope: string (optional)
  Spatial relationship between user and target resource

- ownership: string[] (optional)
  Relationship between user and target resource

- resourceType: string (optional)
  Used for subtype-specific rules (e.g., Task(ProjectTask, AssignedTask, RoutineTask))

Evaluation logic:

1. Role match
2. Requires predicates
3. Scope evaluation
4. Ownership evaluation
   → If ALL pass → rule passes
   → If ANY rule passes → ALLOW
   → Else → DENY
```

## Scope Vocabulary

Scopes answer **“WHERE is the target relative to the user?”**

```markdown
- self
  Target resource is the user itself

- ownOrg
  target.organization === req.user.organization.\_id

- crossOrg
  target.organization !== req.user.organization.\_id

- ownOrg.ownDept
  Same organization AND same department

- ownOrg.crossDept
  Same organization BUT different department

- any
  No spatial restriction (used sparingly, mostly platform-level reads)
```

📌 Notes:

- `Organization` → only `ownOrg`, `crossOrg`, `self`
- `Vendor` → org-level only
- `Task`, `User`, etc. → dual-scoped resources

## Ownership Vocabulary

Ownership answers **“WHAT is my relationship to this resource?”**

```markdown
- self
  resource.\_id === req.user.\_id

- createdBy
  resource.createdBy === req.user.\_id

- uploadedBy
  resource.uploadedBy === req.user.\_id

- assignees
  req.user.\_id ∈ resource.assignees[]

- watchers
  req.user.\_id ∈ resource.watchers[]

- mentioned
  req.user.\_id ∈ resource.mentions[]

- manager
  resource.manager === req.user.\_id

- isHod
  req.user.isHod === true
```

## Authorization Evaluation Order

```markdown
1. Extract rules for (resource, action)
2. For each rule:
   a. Check role match
   b. Check requires predicates
   c. Resolve scope (if defined)
   d. Resolve ownership (if defined)
3. If ANY rule passes → ALLOW
4. Else → DENY (default)
```

## FULL `authorizationMatrix.json` (FINAL & CANONICAL)

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

## Platform vs Customer Organizations

### Platform Organization

**Purpose**: System administration and cross-organization management

**Characteristics**:

- **Identifier**: `isPlatformOrg: true`
- **Users**: All users have `isPlatformOrgUser: true`
- **User Roles**: SuperAdmin, Admin, Manager, User
- **Protection**: CANNOT be deleted (immutable)
- **Permissions**: Platform SuperAdmin can access all customer organizations (based on the authorization matrix)
- **Cross-Organization Access**: Platform SuperAdmin can perform operation on customer organizations (based on the authorization matrix)

**Creation Process**:
Platform organizations are created during **backend setup via database seeding**:

1. **Database Seeding**: Run `npm run seed` in the backend directory
2. **Automatic Creation**: Seed script creates the platform organization with:
   - `isPlatformOrg: true`
   - Platform department (the first user department)
   - Platform SuperAdmin user with `isPlatformOrgUser: true`, `role: SuperAdmin` and `isHod: true`
3. **Immutable**: Once created, the platform organization cannot be deleted
4. **Purpose**: Provides system-level administration capabilities

### Customer Organization

**Purpose**: Tenant organizations for business operations

**Characteristics**:

- **Identifier**: `isPlatformOrg: false`
- **Users**: All users have `isPlatformOrgUser: false`
- **User Roles**: SuperAdmin, Admin, Manager, User
- **Protection**: SuperAdmin can make operation within own Organization or department within Organization (based on the authorization matrix)
- **Permissions**: Users limited to own organization only or department within organization (based on the authorization matrix)
- **Isolation**: Complete data isolation from other customer organizations

**Creation Process**:
Customer organizations are created via **frontend onboarding/registration workflow**:

1. **Organization Registration** (Step 1):

   - User provides organization details (name, email, phone, address, industry, size, with other optional fields)
   - System creates organization with `isPlatformOrg: false`
   - Organization is created but requires the user department and the user it self (Step 2 and Step 3)

2. **Department Creation** (Step 2):

   - User provides department details (name, description)
   - System creates the first department within the organization
   - Department is created but manager is not yet assigned

3. **User Registration** (Step 3):

   - User provides personal details (firstName, lastName, position, email, password, with other optional fields)
   - System creates the first user with:
     - `role: SuperAdmin` (becomes organization SuperAdmin)
     - `isHod: true` (becomes Head of Department)
     - `isPlatformOrgUser: false` (customer user)
   - User is assigned as department manager
   - User is set as organization creator (`createdBy`)

4. **Review and Submit** (Step 4):

   - Review and submit the form from the frontend to backend
   - On the backend, the organization, department and user will be created in a sequence

5. **Circular Dependency Resolution**:

   - Organization → Department → User → (back to) Department (as manager) → Organization (as creator)
   - Schema allows `manager` and `createdBy` to be optional during initial creation
   - After user creation, department manager and organization creator are updated

6. **Result**:
   - First user becomes both:
     - **SuperAdmin** can make operation on own organization or department within Organization (based on the authorization matrix)
     - **Head of Department** for their department (department manager, isHod:true)
   - The user organization and department are ready for use
   - User can now setup the departments and users for a given department within organization

### Key Differences

#### Platform Organization

**Creation**: Backend seeding
**Flag**: `isPlatformOrg: true`
**Users**: `isPlatformOrgUser: true`
**Deletion**: based on the authorization matrix
**Access Scope**: crossOrg and based on the authorization matrix
**Purpose**: System administration
**First User**: Platform SuperAdmin + HOD

#### Customer Organization

**Creation**: Frontend registration (org -> dept -> user -> review & submit)
**Flag**: `isPlatformOrg: false`
**Users**: `isPlatformOrgUser: false`
**Deletion**: based on the authorization matrix
**Access Scope**: ownOrg and based on the authorization matrix
**Purpose**: Business operations
**First User**: Organization SuperAdmin + HOD

---

## User Personas

### 1. Platform SuperAdmin - Sarah

**Background**: Sarah is the system administrator who oversees the entire platform and all customer organizations.

**Goals**:

- Monitor all organizations in the system
- Manage platform-level configurations
- Access customer organizations for support (read-only)
- Ensure data integrity and security across the platform

**Permissions**: Full access to platform organization, read-only access to all customer organizations

### 2. Organization SuperAdmin - Michael

**Background**: Michael is the IT director at TechCorp, responsible for managing the organization's task management setup.

**Goals**:

- Set up departments and assign department managers
- Manage user accounts and roles
- Configure organization-wide settings
- Monitor cross-department activities

**Permissions**: Full access within TechCorp organization, can manage all departments and users, cannot delete the organization

---

### 3. Department Manager (Hod) - Jennifer

**Background**: Jennifer leads the Engineering department at TechCorp with 15 team members.

**Goals**:

- Create and assign tasks to team members
- Track project progress and routine maintenance
- Review and approve task completions
- Manage department resources (materials and vendors)

**Permissions**: Can manage tasks, resources within the Engineering department, read access to other departments

---

### 4. Team Member (User) - David

**Background**: David is a software engineer in the Engineering department.

**Goals**:

- View and complete assigned tasks
- Update task progress, add activities and comments
- Collaborate with team members
- Track materials needed for tasks

**Permissions**: Can view and update tasks assigned to him, add comments, and view department resources

---

## Core User Journeys

### Journey 1: Organization Setup (Michael's Story)

#### Step 1: Registration and Onboarding

Michael visits the application for the first time. He sees a clean landing page with a "Get Started" button.

**What happens**:

1. Michael clicks "Get Started" and enters the **4-step onboarding wizard**:

**Step 1 - Organization Details**:

- Organization name: "TechCorp"
- Email: "info@techcorp.com"
- Phone: "+251912345678 | 0912345678"
- Address: "123 Tech Street, Addis Ababa, Ethiopia"
- Industry: "Technology" (dropdown: Technology, Healthcare, Finance, Education, Retail, Manufacturing, Construction, Hospitality, Transportation, Real Estate, Agriculture, Energy, Telecommunications, Media, Entertainment, Legal, Consulting, Insurance, Automotive, Aerospace, Pharmaceutical, Food & Beverage, Government, Non-Profit)
- Size: "Medium" (dropdown: Small, Medium, Large)
- Description: "Leading software development company"

**Step 2 - Department Setup**:

- Department name: "Engineering"
- Description: "Software development and infrastructure"

**Step 3 - User Registration**:

- First name: "Michael"
- Last name: "Chen"
- Position: "IT Director"
- Email: "michael.chen@techcorp.com"
- Password: (securely hashed with bcrypt, 12+ salt rounds)

**Step 4 - Review and Submit**:

- Review all entered information
- Submit the complete registration form

2. The system creates (in order):

   - Organization document with `isPlatformOrg: false`
   - Department document linked to TechCorp
   - User document with:
     - `role: SuperAdmin` (first user becomes organization SuperAdmin)
     - `isHod: true` (becomes Head of Department)
     - `isPlatformOrgUser: false` (customer user)
     - `position: "IT Director"`
     - `joinedAt: now` (must not be a future date)
     - Employee ID: "0001" (auto-generated)
   - Updates department with Michael as manager
   - Updates organization with Michael as creator (`createdBy`)
   - Generates JWT access token (15min expiry) and refresh token (7 days)

3. Michael is automatically logged in and redirected to the dashboard

**Technical details**:

- Password is hashed using bcrypt with 12 salt rounds
- JWT tokens are stored in httpOnly cookies for security
- User's organization and department are embedded in the JWT payload
- Frontend stores auth state in Redux (`authSlice`)
- Circular dependency resolved: Org → Dept → User → (back to) Dept (as manager) → Org (as creator)

#### Step 2: Creating Additional Departments

Michael navigates to the "Departments" page and clicks "Add Department".

**What happens**:

1. A dialog opens with fields:

   - Department name: "Marketing"
   - Description: "Marketing and customer relations"
   - Manager: (dropdown of users - currently only Michael)

2. Michael creates the department without a manager initially (will assign later)
3. The system creates a Department document linked to TechCorp
4. The department appears in the departments grid

**Technical details**:

- Department schema includes: `name`, `description`, `organization`, `manager`, `createdBy`
- Real-time update sent via Socket.IO to all connected TechCorp users
- Frontend updates Redux state (`departmentSlice`) automatically

#### Step 3: Creating Additional Users

Michael clicks "Users" and then "Create User".

**What happens**:

1. A form appears with:

   - First name: "Jennifer"
   - Last name: "Wong"
   - Position: "Engineering Lead"
   - Email: "jennifer.wong@techcorp.com"
   - Password: (user sets initial password)
   - Role: "Admin" (dropdown: SuperAdmin, Admin, Manager, User)
   - Department: "Engineering" (dropdown)
   - Is HOD: Yes and if role SuperAdmin/Admin then (checkbox - makes her department manager)
   - Employee ID: "0002" (auto-generated in backend)
   - Joined at: (auto-set to the current date/time in backend)

2. Michael submits the form
3. The system:

   - Creates a User document with required fields (firstName, lastName, position, email, role, organization, department, joinedAt)
   - Hashes the password with bcrypt (12+ salt rounds)
   - Creates a notification for Michael confirming the user creation
   - If "Is HOD" is checked and if role SuperAdmin/Admin, updates department with Jennifer as manager
   - Sends a welcome email to Jennifer with login instructions

4. Jennifer can now log in with her credentials
5. Optionally, she can change her password in profile settings

**Technical details**:

- Password hashed using bcrypt with 12+ salt rounds
- Email service uses Nodemailer with Gmail SMTP for welcome email
- Notification created with a `title`/`message` and `entityModel: "User"` pointing to the new user
- Socket.IO emits "notification" event to Michael's
- Authorization matrix grants Jennifer "Admin" permissions for Engineering department
- If isHod is true, department manager is automatically updated

#### Step 4: Managing Department Managers

Now that Jennifer is in the system as HOD, Michael can:

1. Go to Departments
2. Click "Edit" on Marketing department
3. Create a new user for Marketing with "Is HOD" checked
4. Or select an existing user and promote them to HOD
5. The user role must be SuperAdmin/Admin to be hod

**What happens**:

- Department document updated with new manager's user ID
- New manager receives a notification: "You have been assigned as manager of Marketing"
- Manager's permissions are now active for managing Marketing department
- Socket.IO broadcasts the update to all relevant users

---

### Journey 2: Task Creation and Management (Jennifer's Story)

#### Step 1: Creating a Project Task

Jennifer logs in and navigates to the "Tasks" page. She clicks "Create Task" and selects "Project Task".

**What happens**:

1. A comprehensive form appears with fields:

   - **Basic Info**:

     - Title: "Implement User Authentication System" (required, 3-200 chars)
     - Description: "Build JWT-based authentication system with refresh tokens and role-based access control"
     - Priority: "HIGH" (LOW, MEDIUM, HIGH, URGENT)
     - Status: "TODO" (auto-set)
     - Tags: ["security", "authentication"] (max 5 tags, stored lowercase, unique case-insensitive)

   - **Project-Specific Fields**:

     - Vendor: "TechSupply Inc" (dropdown of vendors)
     - Start date: 2024-01-15
     - Due date: 2024-02-15 (must be > start date)

   - **Assignment**:

     - Watchers: Jennifer Wong (HOD users only, auto-includes creator)
     - Organization: TechCorp (auto-filled in backend)
     - Department: Engineering (auto-filled in backend)

   - **Attachments**:
     - Can upload files (images, documents, video, audio, other, max 10MB each)

2. Jennifer submits the form

**What happens in the system**:

1. Backend creates a Task document with discriminator "ProjectTask"
2. Task schema validation ensures all required fields are present
3. System automatically:

   - Sets `createdBy` to Jennifer's user ID
   - Sets `organization` to TechCorp
   - Sets `department` to Engineering
   - Sets `status` to "TODO"
   - Persists the task as a "ProjectTask" (discriminator)
   - Generates unique task ID

4. Creates initial TaskActivity record:

   - `activity`: "Task created"
   - `parent`: task ID
   - `parentModel`: "Task (ProjectTask, AssignedTask)"
   - `createdBy`: Jennifer
   - `organization`: TechCorp
   - `department`: Engineering

5. Creates notification related to the task:

   - `title`: "New project task created"
   - `message`: "Implement User Authentication System"
   - `entity`: task ID
   - `entityModel`: "Task (ProjectTask, AssignedTask, RoutineTask)"
   - `organization`: TechCorp
   - `department`: Engineering

6. (Optional) Sends email alerts with task details

7. Socket.IO emits events:

   - "task:created" to all Engineering department users
   - "notification" to watchers' active sessions

8. Frontend:
   - Redux state updated with new task
   - Task appears in the grid immediately
   - Watchers see notification bell badge increment

**Technical details**:

- Task uses Mongoose discriminators for polymorphic task types
- ProjectTask schema extends base Task with project-specific fields (vendor, startDate, dueDate)
- Virtual populate for activities and comments
- Pre-save hooks validate business rules (dueDate > startDate)
- Post-save hooks trigger notifications and activity logging

#### Step 2: Vendor Works on the Project Task

The vendor (TechSupply Inc) receives notification and begins work. Jennifer tracks progress by adding activities.

**Jennifer adds an activity**:

1. Opens task details page
2. Navigate to activity tab and clicks "Add Activity"
3. Form appears (dialog):

   - Activity: "Vendor started design phase" (2-1000 chars)
   - Materials used: (can add materials with quantities)
   - Attachments: (can upload files)

4. Submits the activity

**What happens**:

- TaskActivity document created:

  - `activity`: "Vendor started design phase"
  - `parent`: task ID
  - `parentModel`: "Task (ProjectTask, AssignedTask)"
  - `createdBy`: Jennifer
  - `organization`: TechCorp
  - `department`: Engineering

- Activity appears in task timeline immediately
- Socket.IO broadcasts update to all watchers
- Frontend updates task activity list in real-time

**Jennifer adds materials to activity**:

1. In the activity form, clicks "Add Material"
2. Selects material from dropdown: "Development Laptops"
3. Enters quantity: 3
4. Material is embedded in the activity document

**Technical details**:

- TaskActivity can only be created for ProjectTask and AssignedTask (NOT RoutineTask)
- Materials are embedded subdocuments with quantities
- Materials must belong to same organization and department
- Max 20 materials per activity
- Attachments max 20 per activity

#### Step 3: Adding Comments

Jennifer wants to discuss the task with team members.

**Jennifer adds a comment**:

1. Navigate to comments tab on task details page
2. Types in comment box: "Great progress on the design phase! @david please review the mockups when ready."
3. Clicks "Post Comment"

**What happens**:

- Backend creates TaskComment document:

  - `parent`: task ID (polymorphic reference)
  - `parentModel`: "Task (ProjectTask, AssignedTask, RoutineTask)"
  - `createdBy`: Jennifer's ID
  - `comment`: comment text
  - `mentions`: [David's user ID] (parsed from @david)
  - `organization`: TechCorp
  - `department`: Engineering
  - `depth`: 0 (top-level comment)

- Comment appears in immediately
- David receives notification: "Jennifer Wong mentioned you in a comment"
- If David is viewing the same task, he sees the comment appear in real-time via Socket.IO

**David replies to the comment**:

1. Clicks "Reply" on Jennifer's comment
2. Types: "Will do! I'll have feedback by EOD."
3. Submits reply

**What happens**:

- TaskComment document created:

  - `parent`: Jennifer's comment ID (polymorphic reference)
  - `parentModel`: "TaskComment"
  - `createdBy`: David's ID
  - `comment`: reply text
  - `depth`: 1 (nested reply)

- Reply appears nested under Jennifer's comment
- Jennifer receives notification: "David Martinez replied to your comment"
- Max depth is 5 levels

**Technical details**:

- TaskComment supports polymorphic parents: Task, TaskActivity, TaskComment
- Mentions are parsed from @username patterns (max 20 mentions per comment)
- Mentioned users must belong to same organization
- Max depth enforced: 5 levels

#### Step 4: Tracking Progress

As the vendor progresses, Jennifer tracks the work by updating the task status and adding TaskActivity entries.

1. Updates status from "TODO" → "IN_PROGRESS"
2. Adds TaskActivity entries such as: "Design phase started", "Implementation underway", "Testing in progress"
3. Notifications can be created for the department

#### Step 5: Task Completion

Vendor finishes the work. Jennifer marks the task as completed:

1. Clicks "Complete Task" button
2. Confirmation dialog appears: "Mark task as completed?"
3. Jennifer confirms

**What happens**:

- Backend:

  - Updates status to "COMPLETED"
  - Creates completion activity
  - Sends notification related to the task

- Frontend:
  - Task status badge changes to "COMPLETED" (green)
  - Task moves to "COMPLETED" filter
  - Completion notification appears

---

### Journey 3: Routine Task Management (Jennifer's Story)

#### Creating a Routine Task

Jennifer needs to set up a recurring maintenance task.

**What happens**:

1. Clicks "Create Task" → "Routine Task"
2. Fills out form:

   - Title: "Weekly Server Backup Verification" (required, 3-200 chars)
   - Description: "Verify all server backups completed successfully and check for any errors"
   - Priority: "MEDIUM" (LOW, MEDIUM, HIGH, URGENT)
   - Status: "TODO" (auto-set)
   - Tags: ["maintenance", "backup"]
   - **Routine-Specific Fields**:
     - Date: 2024-01-20 (required, specific date for routine task)
   - **Materials** (added directly to task, no activities; select Material records + quantities):
     - "Backup Verification Checklist" - Quantity: 1
     - "Server Access Credentials" - Quantity: 1
   - Watchers: Jennifer Wong (HOD users only, auto-includes creator)
   - Can upload files (images, documents, video, audio, other, max 10MB each)
   - Organization: TechCorp (auto-filled in backend)
   - Department: Engineering (auto-filled in backend)

3. Submits the form

**System behavior**:

- Creates RoutineTask document with discriminator
- Materials are embedded directly in the task (NOT in activities)
- NO TaskActivities can be created for RoutineTask (design constraint)
- When task is completed:
  - Status changes to "COMPLETED"
  - Task is marked as completed for that specific date

**Technical details**:

- RoutineTask schema includes date field (required)
- Materials added directly to task with quantities (max 20, unique materials, all quantities > 0)
- No TaskActivity relationship (design constraint)
- Each routine task is for a specific date

---

### Journey 4: Assigned Task Workflow

#### Quick Task Assignment

Jennifer needs to assign a quick task to a team member.

**What happens**:

1. Clicks "Create Task" → "Assigned Task"
2. Fills out simplified form:

   - **Basic Info**:

     - Title: "Review pull request #234" (required, 3-200 chars)
     - Description: "Review pull request #234 for code quality and test coverage"
     - Priority: "HIGH"
     - Status: "TODO" (auto-set)
     - Tags: ["code-review"]

   - **Assigned Task Fields**:

     - Assignees: David Martinez (min 1, max 50, unique)
     - Start date: 2024-01-16 09:00
     - Due date: 2024-01-16 17:00 (must be > start date)

   - **Assignment**:

     - Watchers: Jennifer Wong (HOD users only, auto-includes creator)
     - Organization: TechCorp (auto-filled in backend)
     - Department: Engineering (auto-filled in backend)

   - **Attachments**:
     - Can upload files (images, documents, video, audio, other, max 10MB each)

3. Submits the form

**System behavior**:

- Creates AssignedTask document with discriminator
- Immediate notification to David: "You have been assigned to: Review pull request #234"
- Email sent with due date reminder
- Task appears in David's "My Tasks" view
- Due date reminder notification sent 1 hour before deadline

**David works on the task**:

1. David logs in and sees notification
2. Clicks notification, navigated to task details
3. Clicks "Start Task" - status changes to "IN_PROGRESS"
4. Adds activity: "Started code review, checking test coverage"
5. Adds comment: "@jennifer Found some issues with error handling, will document them"
6. Jennifer receives mention notification
7. David completes the task - status changes to "COMPLETED"
8. Jennifer receives completion notification

**Technical details**:

- AssignedTask requires at least 1 assignee (min 1, max 50)
- Assignees must be unique and belong to same organization
- TaskActivities can be created for AssignedTask (unlike RoutineTask)
- Start date and due date validation: dueDate > startDate
- Assignees are in ownership fields, so they have "own" permissions

---

### Journey 5: Real-Time Collaboration

#### Scenario: Multiple Users Working Simultaneously

Jennifer and Michael are both viewing the same task details page. David is working on the task from his computer.

**What happens**:

1. **David adds a comment**:

   - Comment appears instantly on both Jennifer's and Michael's screens
   - No page refresh needed
   - Socket.IO event: `task:comment:added`
   - Event payload includes comment data
   - Frontend Redux state updated automatically

2. **Jennifer changes task priority**:

   - Priority badge updates in real-time for all viewers
   - Activity timeline shows the change immediately
   - Socket.IO event: `task:updated`
   - Event payload includes updated task data
   - All connected users see the change

3. **Michael adds an activity**:
   - Activity appears in the timeline for all viewers
   - Socket.IO event: `task:activity:added`
   - Event payload includes activity data
   - Timeline auto-scrolls to show new activity

**Technical implementation**:

- Each user's browser maintains a Socket.IO connection
- On login, user joins rooms:

  - `user:{userId}` - personal room for notifications
  - `org:{orgId}` - organization-wide updates
  - `dept:{deptId}` - department-specific updates
  - `task:{taskId}` - when viewing a specific task

- Server emits events to appropriate rooms:

  ```javascript
  io.to(`task:${taskId}`).emit("task:updated", updatedTask);
  io.to(`user:${userId}`).emit("notification", notification);
  io.to(`dept:${deptId}`).emit("task:created", newTask);
  ```

- Frontend listeners update Redux state automatically:

  ```javascript
  socket.on("task:updated", (task) => {
    dispatch(updateTask(task));
  });

  socket.on("notification", (notification) => {
    dispatch(addNotification(notification));
  });
  ```

---

### Journey 6: Notification System

#### How Notifications Work

**Notification payload (schema-aligned)**:

A notification record contains:

- `title` (required, max 200)
- `message` (required, 1-500)
- `entity` + `entityModel` (optional; links the notification to a specific record)
- `organization` + `department` (required)
- `isRead` (default: false)
- `expiresAt` (default: now + 30 days)

**Common notification events (no `type` field)**:

- Task created/updated/completed/overdue (linked via `entityModel: "Task (ProjectTask, AssignedTask, RoutineTask)"`)
- Activity added (linked via `entityModel: "TaskActivity"`)
- Comment/mention/reply (linked via `entityModel: "TaskComment"`)
- User created/updated (linked via `entityModel: "User"`)
- Material created/updated (linked via `entityModel: "Material"`)
- Vendor created/updated (linked via `entityModel: "Vendor"`)

**Notification delivery**:

1. **In-app notifications**:

   - Stored in Notification collection
   - Badge count shown on bell icon in header
   - Dropdown shows recent notifications (last 10)
   - Click notification navigates to relevant page
   - Mark as read updates `isRead` flag
   - Auto-expire after 30 days via `expiresAt` (default: now + 30 days)

2. **Email notifications**:

   - Sent via Nodemailer for important events
   - User preferences control which events trigger emails
   - Email templates include task details and direct links
   - Sent asynchronously to avoid blocking API responses

3. **Real-time push**:
   - Socket.IO delivers instant notifications
   - Browser notification API (if permitted by user)
   - Sound/visual alerts for urgent notifications
   - Badge count updates in real-time

**User experience - David's perspective**:

1. Working on another task
2. Notification bell badge changes from 3 to 4
3. Bell icon pulses briefly (CSS animation)
4. Clicks bell, sees dropdown:
   - "Jennifer Wong mentioned you in a comment" (2 min ago) [unread]
   - "Task due soon: Weekly Server Backup Verification" (1 hour ago) [unread]
   - "Michael Chen added activity to: Implement User Authentication System" (3 hours ago) [read]
   - "New task assigned: Review pull request #234" (5 hours ago) [read]
5. Clicks first notification
6. Navigated to task details page, scrolled to the comment
7. Notification marked as read automatically
8. Badge count decreases to 3

**Technical details**:

- Notification model includes: title, message, entity, entityModel, organization, department, isRead, expiresAt
- `expiresAt` defaults to `Date.now + 30 days`
- Socket.IO emits to user-specific rooms
- Frontend maintains notification state in Redux

---

### Journey 7: Dashboard and Analytics

#### Jennifer's Dashboard View

When Jennifer logs in, she sees a comprehensive dashboard with key metrics and insights.

**Top Section - Key Metrics Cards**:

- **My Tasks**: 12 active tasks (tasks where she's creator or watcher)
- **Department Tasks**: 45 total tasks (all Engineering department tasks)
- **Overdue**: 3 tasks (red indicator, urgent attention needed)
- **Completed This Week**: 8 tasks (green indicator, progress tracking)

**Task Distribution Chart** (Pie Chart):

- Shows task status breakdown:
  - TODO: 15 tasks (33%)
  - IN_PROGRESS: 20 tasks (44%)
  - COMPLETED: 8 tasks (18%)
  - PENDING: 2 tasks (4%)
- Color-coded by status
- Click slice to filter tasks by that status

**Priority Breakdown** (Bar Chart):

- Shows task priority distribution:
  - URGENT: 5 tasks
  - HIGH: 12 tasks
  - MEDIUM: 18 tasks
  - LOW: 10 tasks
- Color-coded by priority
- Click bar to filter tasks by that priority

**Recent Activity Feed**:

- Real-time feed of recent activities:
  - "David Martinez completed: Weekly Server Backup Verification" (5 min ago)
  - "Sarah Johnson started: Database Migration" (15 min ago)
  - "Michael Chen commented on: Security Enhancement Q1" (1 hour ago)
  - "New material requested for: Implement User Authentication System" (2 hours ago)
- Shows last 10 activities
- Click activity to navigate to related task
- Auto-updates via Socket.IO

**Upcoming Deadlines** (Table):

- Shows tasks due in next 7 days
- Columns: Task title, Assignee, Due date, Priority, Status
- Sorted by due date (earliest first)
- Color-coded by priority
- Quick action buttons: View, Edit, Complete
- Pagination: 10 per page

**Team Performance** (if Manager or Admin):

- List of team members with metrics:
  - Active tasks count
  - Completed tasks this week
  - Average task completion time
  - Current workload indicator (Low, Medium, High)
- Click member to view their tasks

**Technical implementation**:

- Dashboard data fetched via aggregation pipelines
- MongoDB aggregations calculate metrics efficiently:
  ```javascript
  // Example: Task status distribution
  Task.aggregate([
    { $match: { department: deptId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  ```
- Real-time updates via Socket.IO
- Charts rendered with Recharts or Chart.js library
- Data cached in Redux for performance
- Refresh button to manually update metrics

---

### Journey 8: Advanced Filtering and Search

#### David's Task Management

David has many tasks and needs to find specific ones quickly.

**Filter options available**:

1. **Status filter**:

   - All, TODO, IN_PROGRESS, COMPLETED, PENDING
   - Multi-select checkboxes
   - Shows count for each status

2. **Priority filter**:

   - LOW, MEDIUM, HIGH, URGENT
   - Multi-select checkboxes
   - Shows count for each priority

3. **Task type filter**:

   - Project Tasks, Routine Tasks, Assigned Tasks
   - Radio buttons (single selection)
   - Shows count for each type

4. **Date range filter**:

   - Created date range
   - Due date range
   - Date picker components
   - Presets: Today, This Week, This Month, Custom

5. **Assignment filter**:

   - Assigned to me (tasks where I'm assignee)
   - Created by me (tasks I created)
   - Watching (tasks I'm watching)
   - All department tasks
   - Unassigned tasks

6. **Department filter** (for Managers/Admins):

   - Multi-select dropdown of departments
   - Shows tasks from selected departments
   - Requires cross-department read permission

7. **Tags filter**:

   - Multi-select dropdown of available tags
   - Shows tasks with selected tags
   - AND/OR logic toggle

8. **Search**:
   - Full-text search across description
   - Real-time search as you type
   - Debounced to avoid excessive API calls
   - Minimum 3 characters to trigger search

**Example usage**:

David wants to find all high-priority assigned tasks due this week:

1. Opens filter dialog (click "Filters" button)
2. Selects:
   - Task type: "Assigned Tasks"
   - Priority: "HIGH"
   - Due date: "This week" (preset)
   - Status: "IN_PROGRESS"
   - Assignment: "Assigned to me"
3. Clicks "Apply Filters"
4. Grid updates showing 3 matching tasks
5. Filter chips appear above grid showing active filters:
   - "Type: Assigned Tasks" [x]
   - "Priority: HIGH" [x]
   - "Due: This week" [x]
   - "Status: IN_PROGRESS" [x]
   - "Assignment: Assigned to me" [x]
6. Can click [x] on chip to remove individual filter
7. "Clear All" button removes all filters at once

**Technical implementation**:

- Frontend builds filter object from UI selections
- Sent to backend as query parameters:
  ```javascript
  GET /api/tasks?priority=HIGH&status=IN_PROGRESS&dueDate[gte]=2024-01-15&dueDate[lte]=2024-01-21&assignee=userId
  ```
- Backend constructs MongoDB query dynamically:
  ```javascript
  const query = {
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: { $gte: startOfWeek, $lte: endOfWeek },
    assignees: userId,
  };
  ```
- Results paginated (20 per page default)
- Sort options: due date, priority, created date, title
- Filter state persisted in URL for bookmarking
- Redux state maintains current filters

---

### Journey 9: Material and Vendor Management

#### Tracking Resources

Jennifer needs to manage materials and vendors for projects.

**Material Management**:

1. **Creating materials**:

   - Navigate to "Materials" page
   - Click "Add Material"
   - Form fields (dialog):
     - Name: "Development Laptops" (2-200 chars, unique per department)
     - Unit: "units" (1-50 chars)
     - Category: "Other" (dropdown: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other)
     - Price: $1,500 (optional, >= 0, default: 0)

2. **Using materials in tasks**:

   **For ProjectTask/AssignedTask**:

   - Materials added to TaskActivity (not directly to task)
   - When adding activity, select materials and specify quantities
   - Example: "Development Laptops" - Quantity: 3
   - Materials embedded in activity document

   **For RoutineTask**:

   - Materials added directly to task (no activities)
   - When creating/editing routine task, add materials with quantities
   - Example: "Backup Verification Checklist" - Quantity: 1
   - Materials embedded in task document

3. **Material tracking**:
   - Department view shows all materials
   - Filter by category
   - Search by name
   - View which tasks use each material
   - Cost tracking (if prices are set)

**Vendor Management**:

1. **Adding a vendor**:

   - Navigate to "Vendors" page
   - Click "Add Vendor"
   - Form fields (dialog):
     - Name: "TechSupply Inc" (2-200 chars, unique per org)
     - Email: "john@techsupply.com" (unique per org)
     - Phone: "+251912345678" (Ethiopian format, unique per org)
     - Address: "123 Tech Street, Addis Ababa" (optional, max 500 chars)

2. **Vendor usage**:

   - When creating ProjectTask, select vendor from dropdown
   - Vendor linked to task
   - Track which vendors used for which projects
   - Attachments such as contracts/invoices are attached to tasks, activities, or comments (not vendors)

3. **Vendor tracking**:
   - Organization-wide view (vendors are org-level, not dept-level)
   - Filter by rating
   - Search by name, email, phone
   - View all tasks associated with each vendor
   - Vendor performance metrics

**Technical implementation**:

- Material and Vendor are separate collections
- Material belongs to organization AND department (dual scoping)
- Vendor belongs to organization ONLY (no department scoping)
- Materials referenced in Task (RoutineTask) or TaskActivity (ProjectTask/AssignedTask)
- Vendors referenced in ProjectTask
- When deleting a Material/Vendor, ensure referenced tasks/activities are handled safely (validation or cleanup)

---

### Journey 10: Authorization and Security

#### Role-Based Access Control in Action

The system implements sophisticated RBAC using an authorization matrix.

**Scenario 1: Platform SuperAdmin (Sarah)**

Sarah is a Platform SuperAdmin who needs to support a customer organization.

**What Sarah can do**:

1. Login to platform organization
2. Navigate to "Organizations" page
3. See list of all customer organizations
4. Click on "TechCorp" organization
5. View (as permitted by the authorization matrix):
   - Organization details
   - All departments
   - All users
   - All tasks
   - All materials
   - All vendors
6. CAN:
   - Update customer organizations (per Organization `update` rules)
   - Delete customer organizations (per Organization `delete` rules)
7. CANNOT (by default):
   - Create/update/delete customer departments, users, tasks, materials, vendors unless explicitly allowed by the matrix
   - Delete the platform organization (immutable protection)

**Authorization checks**:

- `isPlatformOrgUser: true` AND `role: SuperAdmin`
- Cross-org reads are allowed only where the matrix defines `scope: any` on `read`
- Cross-org organization updates/deletes are allowed only where the matrix defines `scope: crossOrg` on Organization

**Scenario 2: Organization SuperAdmin (Michael)**

Michael is TechCorp's SuperAdmin.

**What Michael can do**:

1. Full control over TechCorp organization:
   - Create/edit/delete departments
   - Create/edit/delete users
   - Assign roles and permissions
   - Manage vendors (org-level)
2. Department-scoped resources:
   - Tasks: create/read/update/delete within Michael's own department (and based on ownership rules)
   - Materials: manage within Michael's own department (and based on ownership rules)
   - Notifications: read/update within Michael's own department
3. Cross-department access (within the same organization):
   - Read departments across the organization
   - Read users across the organization
4. CANNOT:
   - Delete TechCorp organization (customer SuperAdmin restriction)
   - Access other customer organizations
   - Access platform organization

**Authorization checks**:

- `isPlatformOrgUser: false` AND `role: SuperAdmin`
- Cannot delete own organization

**Scenario 3: Department Admin (Jennifer)**

Jennifer is an Admin for the Engineering department.

**What Jennifer can do**:

1. Full control over Engineering department:
   - Read/update users in TechCorp (cannot delete users)
   - Create tasks in Engineering; update/delete tasks in Engineering based on task subtype + ownership rules
   - Create/update/delete materials in Engineering based on ownership rules
   - Create/update/delete vendors in TechCorp based on ownership rules (org-level)
2. Cross-department access:
   - Read access to other departments (Marketing, Sales, etc.)
   - Can view users from other departments
3. CANNOT:
   - Create users
   - Delete users
   - Edit/delete tasks in other departments
   - Create/edit/delete departments
   - Access other organizations

**Authorization checks**:

- `role: Admin`
- Users: read/update within own organization; delete not allowed by default
- Tasks: create/read/update/delete within own department (and based on task subtype + ownership rules)

**Scenario 4: Manager**

A Manager has similar permissions to Admin but with some restrictions.

**What a Manager can do**:

1. Own resources:
   - Update/delete TaskActivity they created
   - Update/delete TaskComment they created
2. Department access:
   - Read tasks in own department
   - Create AssignedTasks and RoutineTasks in own department
   - Read users and materials in own department
3. CANNOT:
   - Delete users
   - Create/delete departments
   - Create ProjectTasks
   - Delete AssignedTasks unless they are an assignee

**Authorization checks**:

- `role: Manager`
- Tasks: can create AssignedTasks and RoutineTasks in own department
- Tasks: can update based on ownership (`createdBy`, `assignees`) in own department
- Tasks: can delete AssignedTasks where they are an assignee, and RoutineTasks they created

**Scenario 5: Regular User (David)**

David is a regular User in the Engineering department.

**What David can do**:

1. Own resources:
   - Read/write access to tasks assigned to him
   - Read/write access to tasks he created
   - Read/write access to comments he created
2. Department access:
   - Read access to all department tasks
   - Read access to all department users
   - Read access to department materials
3. CANNOT:
   - Create or delete organizations, departments, users, materials, or vendors
   - Create ProjectTasks or AssignedTasks
   - Access other departments or organizations

**Authorization checks**:

- `role: User`
- Tasks: can create RoutineTasks in own department
- Tasks: can update AssignedTasks where they are an assignee, and RoutineTasks they created
- Tasks: can delete AssignedTasks where they are an assignee, and RoutineTasks they created
- Users: can update own profile; can read users in own department

**Security features**:

1. **Authentication**:

   - JWT access tokens (15 min expiry)
   - Refresh tokens (7 days expiry)
   - Token rotation on refresh
   - HttpOnly cookies prevent XSS
   - CSRF protection

2. **Password security**:

   - Bcrypt hashing (12 rounds)
   - Password strength validation
   - Password change available in user profile settings
   - Password reset via email

3. **Data protection**:

   - Organization data isolation
   - Department scoping
   - Activity logging for all changes
   - Input validation and sanitization

4. **API security**:
   - Rate limiting
   - CORS configuration
   - Helmet.js security headers
   - Request validation with express-validator

---

## Detailed Feature Narratives

### Feature 1: Task Activity Timeline

Every ProjectTask and AssignedTask has a complete activity timeline showing all changes.

**What gets logged**:

- Task creation
- Status changes
- Priority changes
- Field updates (description, dates, etc.)
- Materials added/removed
- Comments added
- Attachments added
- Task completion

**Activity structure**:

```javascript
{
  parent: ObjectId,
  parentModel: 'Task (ProjectTask, AssignedTask)',
  createdBy: ObjectId,
  activity: 'Status changed from TODO to IN_PROGRESS',
  materials: [
    { material: ObjectId, quantity: 3 }
  ],
  attachments: [ObjectId],
  organization: ObjectId,
  department: ObjectId,
}
```

**User experience**:

- Timeline displayed on task details page
- Chronological order (newest first)
- User avatars and names
- Relative timestamps ("2 hours ago")
- Expandable details for complex changes
- Filter/search activities
- Materials shown with quantities
- Attachments shown with preview

**Technical details**:

- TaskActivity can only be created for ProjectTask and AssignedTask
- NOT allowed for RoutineTask (design constraint)
- Materials embedded as subdocuments with quantities
- Max 20 materials per activity
- Max 20 attachments per activity

### Feature 2: Task Comments and Mentions

Rich commenting system with @mentions and threading.

**Features**:

- Comment on tasks, activities, and other comments
- @mention users to notify them (max 20 mentions per comment)
- Reply to specific comments (threading, max depth 5)
- Edit own comments
- Delete own comments
- Attach files to comments
- Polymorphic parent support

**Example flow**:

1. Jennifer comments on a task: "Hey @david, I need clarification on the requirements"
2. System parses @mention, finds David's user
3. Creates TaskComment:
   - `parent`: task ID
   - `parentModel`: "Task (ProjectTask, AssignedTask, RoutineTask)"
   - `createdBy`: Jennifer
   - `comment`: comment text
   - `mentions`: [David's user ID]
   - `organization`: TechCorp
   - `department`: Engineering
   - `depth`: 0
4. Sends notification to David: "Jennifer Wong mentioned you in a comment"
5. David receives notification, clicks it
6. Navigated to task, comment is highlighted
7. David replies: "@jennifer Sure, let me explain..."
8. Creates TaskComment:
   - `parent`: Jennifer's comment ID
   - `parentModel`: "TaskComment"
   - `createdBy`: David
   - `comment`: reply text
   - `mentions`: [Jennifer's user ID]
   - `organization`: TechCorp
   - `department`: Engineering
   - `depth`: 1
9. Jennifer receives notification: "David Martinez replied to your comment"
10. Another user replies to David's reply (depth 2)
11. Max depth is 5 levels, no more nesting allowed beyond depth 5

**Technical implementation**:

- TaskComment supports polymorphic parents: Task (ProjectTask, AssignedTask, RoutineTask), TaskActivity, TaskComment
- Mentions parsed from @username patterns (max 20 mentions)
- `depth` ranges 0-5 (default: 0)
- Max depth enforced: 5 levels

### Feature 3: File Attachments

Tasks, activities, and comments support file attachments.

**Features**:

- Upload multiple files
- Supported types: Image, Document, Video, Audio, Other
- File size limit: 10MB per file
- Allowed extensions: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .txt, .mp4, .mp3
- Preview images inline
- Download files
- Polymorphic parent support

**Storage**:

- Files stored in Cloudinary
- Metadata stored in MongoDB
- Secure signed URLs for access

**Upload flow**:

1. User selects file (drag-and-drop or file picker)
2. Frontend validates file type and size
3. Frontend uploads directly to Cloudinary
4. Cloudinary returns URL
5. Frontend sends `fileUrl` to backend
6. Backend creates Attachment document:
   - `filename`
   - `fileUrl` (Cloudinary)
   - `fileType`
   - `fileSize`
   - `parent` (polymorphic)
   - `parentModel`
   - `uploadedBy`
   - `organization`
   - `department`
7. Attachment appears in UI immediately

**Technical details**:

- Attachment model with polymorphic parent
- Parent can be: Task (ProjectTask, AssignedTask, RoutineTask), TaskActivity, TaskComment
- Cloudinary URL pattern validation (`fileUrl` must match the required pattern)
- File type enum: Image, Document, Video, Audio, Other
- Max file size: 10,485,760 bytes (10MB)

### Feature 4: Real-Time Updates via Socket.IO

Live updates for collaborative work.

**Events emitted**:

- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `task:activity:added` - Activity added to task
- `task:comment:added` - Comment added to task
- `notification` - New notification for user
- `user:status:changed` - User online/offline status

**Room structure**:

- `user:{userId}` - Personal notifications
- `org:{orgId}` - Organization-wide updates
- `dept:{deptId}` - Department-specific updates
- `task:{taskId}` - Task-specific updates (when viewing task)

**Connection flow**:

1. User logs in
2. Frontend establishes Socket.IO connection
3. Sends authentication token
4. Backend verifies token
5. User joins appropriate rooms based on organization and department
6. Connection maintained throughout session
7. On logout, connection closed and rooms left

**Technical details**:

- Socket.IO server integrated with Express
- JWT authentication for socket connections
- Room-based event broadcasting
- Automatic reconnection on disconnect
- Frontend listeners update Redux state
- Optimistic updates for better UX

---

## Real-World Usage Scenarios

### Scenario 1: Hotel Housekeeping Management

**Context**: A hotel uses the system to manage housekeeping tasks.

**Setup**:

- Organization: "Grand Hotel"
- Departments: Housekeeping, Maintenance, Front Desk
- Users: Housekeeping Manager (Admin), Housekeepers (Users)

**Workflow**:

1. **Routine Tasks**:

   - Manager creates routine task: "Room 101 Daily Cleaning"
   - Date: 2024-01-20
   - Priority: MEDIUM
   - Materials: Cleaning supplies, Linens

2. **Project Tasks**:

   - Manager creates project task: "Renovate Presidential Suite"
   - Vendor: "Interior Design Co"
   - Start date: 2024-01-21
   - Due date: 2024-02-20
   - Materials tracked via TaskActivity (e.g., Furniture, Fixtures)
   - Watchers: Manager, Front Desk Manager

3. **Assigned Tasks**:
   - Manager assigns task: "Inspect Room 205 for damages"
   - Assignee: Housekeeper B
   - Start date: 2024-01-20 10:00
   - Due date: 2024-01-20 17:00
   - Priority: HIGH

**Benefits**:

- Real-time task updates
- Material tracking for inventory
- Vendor management for renovations
- Activity logging for accountability
- Cross-department visibility

### Scenario 2: Software Development Team

**Context**: A tech company uses the system for project management.

**Setup**:

- Organization: "TechCorp"
- Departments: Engineering, QA, DevOps
- Users: Engineering Manager (Admin), Developers (Users), QA Engineers (Users)

**Workflow**:

1. **Project Tasks**:

   - Manager creates project task: "Build Payment Gateway Integration"
   - Vendor: "Payment Processor Inc"
   - Start date: 2024-01-15
   - Due date: 2024-02-15
   - Watchers: Manager, QA Lead
   - Activities track progress updates (e.g., "API integration started", "Testing in progress")

2. **Assigned Tasks**:

   - Manager assigns task: "Code Review for PR #234"
   - Assignees: Senior Developer, QA Engineer
   - Start date: 2024-01-16 09:00
   - Due date: 2024-01-17 17:00
   - Priority: HIGH
   - Comments used for feedback and discussion

3. **Routine Tasks**:
   - Manager creates routine task: "Weekly Security Scan"
   - Date: 2024-01-22 (Monday)
   - Priority: HIGH
   - Materials: Security tools, Credentials

**Benefits**:

- Task dependencies tracking
- Code review workflow
- Vendor integration management
- Cross-team collaboration
- Routine tasks created per date

### Scenario 3: Healthcare Facility

**Context**: A clinic uses the system for patient care coordination.

**Setup**:

- Organization: "City Clinic"
- Departments: Nursing, Pharmacy, Administration
- Users: Head Nurse (Admin), Nurses (Users), Pharmacists (Users)

**Workflow**:

1. **Routine Tasks**:

   - Head Nurse creates routine task: "Morning Medication Round"
   - Date: 2024-01-20
   - Priority: URGENT
   - Materials: Medications, Patient charts

2. **Assigned Tasks**:

   - Head Nurse assigns task: "Patient discharge paperwork for Room 5"
   - Assignees: Nurse, Pharmacist
   - Start date: 2024-01-20 10:00
   - Due date: 2024-01-20 14:00
   - Priority: HIGH
   - Comments for coordination

3. **Project Tasks**:
   - Administrator creates project task: "Upgrade Medical Equipment"
   - Vendor: "Medical Supplies Co"
   - Start date: 2024-01-20
   - Due date: 2024-02-10
   - Watchers: Head Nurse, Administrator

**Benefits**:

- Patient care coordination
- Medication tracking
- Equipment management
- Cross-department communication
- Compliance documentation

### Scenario 4: Restaurant Chain

**Context**: A restaurant chain uses the system for operations management.

**Setup**:

- Organization: "Tasty Bites"
- Departments: Kitchen, Service, Management
- Users: Restaurant Manager (Admin), Chefs (Users), Servers (Users)

**Workflow**:

1. **Routine Tasks**:

   - Manager creates routine task: "Daily Inventory Check"
   - Date: 2024-01-20
   - Priority: HIGH
   - Materials: Inventory sheets, Supplies

2. **Assigned Tasks**:

   - Manager assigns task: "Prepare special menu for event"
   - Assignees: Chef A, Chef B
   - Start date: 2024-01-20 09:00
   - Due date: 2024-01-25 17:00
   - Priority: URGENT
   - Comments for menu planning

3. **Project Tasks**:
   - Manager creates project task: "Kitchen Renovation"
   - Vendor: "Commercial Kitchen Co"
   - Start date: 2024-01-21
   - Due date: 2024-02-28
   - Materials tracked via TaskActivity (e.g., Equipment, Fixtures)
   - Watchers: Manager, Owner

**Benefits**:

- Inventory management
- Event coordination
- Vendor management for supplies
- Staff task assignment
- Real-time updates

---

## Technical Implementation Details

### Backend Architecture

**Layered Architecture**:

```
Request
  ↓
Routes (endpoint definitions)
  ↓
Authentication Middleware (JWT verification)
  ↓
Validation Middleware (express-validator)
  ↓
Authorization Middleware (RBAC checks)
  ↓
Controllers (business logic)
  ↓
Services (external services)
  ↓
Models (data access)
  ↓
MongoDB
```

**Key Technologies**:

- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT for authentication
- Socket.IO for real-time
- Nodemailer for emails
- Bcrypt for password hashing
- Winston for logging

**Design Patterns**:

- Discriminator pattern for task polymorphism
- Cascade operations with transactions
- Polymorphic references for comments and attachments
- Repository pattern for data access
- Service layer for business logic

### Frontend Architecture

**Component Structure**:

```
src/
├── components/
│   ├── common/          # Shared components
│   ├── layout/          # Layout components
│   ├── task/            # Task-specific components
│   ├── user/            # User-specific components
│   └── ...
├── pages/               # Route pages
├── redux/               # State management
│   ├── app/            # Store configuration
│   └── features/       # Feature slices
├── hooks/               # Custom hooks
├── services/            # External services
├── utils/               # Utility functions
└── theme/               # MUI theme
```

**Key Technologies**:

- React 19
- Redux Toolkit + RTK Query
- Material-UI v7
- React Hook Form
- Socket.IO Client
- Axios for HTTP

**State Management**:

- Redux Toolkit for global state
- RTK Query for API calls and caching
- Redux Persist for auth state
- Local state for UI-only concerns

**Design Patterns**:

- Container/Presentational components
- Custom hooks for reusable logic
- HOCs for authorization checks
- Render props for flexible composition
- Context API for theme and auth

### Database Schema Design

**Collections**:

- Organizations
- Departments
- Users
- Tasks (with discriminators: ProjectTask, RoutineTask, AssignedTask)
- TaskActivities
- TaskComments
- Materials
- Vendors
- Notifications
- Attachments

**Indexes**:

- Compound unique indexes for multi-tenancy
- TTL index for notification expiration (`Notification.expiresAt`)
- Text indexes for search
- Geospatial indexes (if location-based features)

**Relationships**:

- One-to-many: Organization → Departments, Departments → Users
- Embedded: RoutineTask.materials, TaskActivity.materials
- References: AssignedTask.assignees (Users), Task.watchers (Users)
- Polymorphic: Comments → Parent (Task/Activity/Comment), Attachments → Parent
- Discriminator: Task → ProjectTask/RoutineTask/AssignedTask

### API Design

**RESTful Endpoints**:

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

# Users
GET    /api/users
POST   /api/users
GET    /api/users/:userId
PUT    /api/users/:userId
DELETE /api/users/:userId
PATCH /api/users/:userId/restore

# Departments
GET    /api/departments
POST   /api/departments
GET    /api/departments/:departmentId
PUT    /api/departments/:departmentId
DELETE /api/departments/:departmentId
PATCH /api/departments/:departmentId/restore

# Tasks
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:taskId
PUT    /api/tasks/:taskId
DELETE /api/tasks/:taskId
PATCH  /api/tasks/:taskId/restore

# Task Activities
GET    /api/tasks/:taskId/activities
POST   /api/tasks/:taskId/activities
GET    /api/tasks/:taskId/activities/:activityId
PUT    /api/tasks/:taskId/activities/:activityId
DELETE /api/tasks/:taskId/activities/:activityId
PATCH  /api/tasks/:taskId/activities/:activityId/restore

# Task Comments
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
GET    /api/tasks/:taskId/comments/:commentId
PUT    /api/tasks/:taskId/comments/:commentId
DELETE /api/tasks/:taskId/comments/:commentId
PATCH  /api/tasks/:taskId/comments/:commentId/restore

# Materials
GET    /api/materials
POST   /api/materials
GET    /api/materials/:materialId
PUT    /api/materials/:materialId
DELETE /api/materials/:materialId
PATCH /api/materials/:materialId/restore

# Vendors
GET    /api/vendors
POST   /api/vendors
GET    /api/vendors/:vendorId
PUT    /api/vendors/:vendorId
DELETE /api/vendors/:vendorId
PATCH /api/vendors/:vendorId/restore

# Notifications
GET    /api/notifications
PUT    /api/notifications/:notificationId/read
DELETE /api/notifications/:notificationId
```

**Response Format**:

```javascript
// Success
{
  success: true,
  <resourceName>: populatedData,
  message: "Operation successful"
}

// Error
{
  success: false,
  message: "Error message",
  error: {...}
  details: [ ... ] // Validation errors
}

// Paginated
{
  success: true,
  pagination: {
    totalDocs: 100,
    limit: 20,
    page: 1,
    totalPages: 5,
    hasNextPage: true,
    hasPrevPage: false
  },
  <resourceName>: populatedData
}
```

### Security Implementation

**Authentication Flow**:

1. User submits credentials
2. Validator middleware validates credentials
3. Backend generates access token (15 min) and refresh token (7 days)
4. Tokens stored in httpOnly cookies
5. Frontend includes cookies in all requests
6. Backend verifies access token on each request
7. If access token expired, frontend requests refresh
8. Backend validates refresh token and issues new access token
9. If refresh token expired, user must login again

**Authorization Flow**:

1. Request reaches authorization middleware
2. Extract user info from JWT (role, organization, department)
3. Check authorization matrix for permission
4. Verify resource scope (organization, department)
5. Check ownership if required
6. Allow or deny request

**Data Protection**:

- Organization isolation enforced at query level
- Department scoping for applicable resources
- Activity logging for all changes
- Input validation and sanitization
- Rate limiting to prevent abuse

---

## Conclusion

This Task Management System provides a comprehensive solution for organizations to manage tasks, collaborate in real-time, track resources, and maintain accountability. The multi-tenant architecture ensures data isolation, while the role-based access control provides granular permissions. The three task types (Project, Routine, Assigned) cater to different workflows, and activity logging supports auditability.

The system is designed for scalability, security, and user experience, with real-time updates, advanced filtering, and comprehensive notification system. Whether used in hospitality, healthcare, software development, or any other industry, the system adapts to various organizational structures and workflows.
