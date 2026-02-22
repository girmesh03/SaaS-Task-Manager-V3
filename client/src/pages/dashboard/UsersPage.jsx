import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Stack from "@mui/material/Stack";
import { MuiDialogConfirm } from "../../components/reusable";
import {
  UsersGridView,
  UsersListView,
  UsersToolbar,
  UserFilter,
  UserFormDialog,
} from "../../components/user";
import { createUsersColumns } from "../../components/columns";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  selectResourceViewState,
  setResourceViewState,
} from "../../redux/features";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  useRestoreUserMutation,
  useUpdateUserMutation,
} from "../../services/api";
import {
  PAGINATION_DEFAULTS,
  VIEW_MODE,
  USER_ROLES,
  USER_STATUS,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import {
  capitalizeFirstCharacter,
  countActiveFilters,
} from "../../utils/helpers";

const RESOURCE_KEY = "users";
const TOOLBAR_DEPARTMENT_LIMIT = 8;
const DEFAULT_FILTERS = {
  role: "",
  status: "",
  departmentIds: [],
  joinedFrom: "",
  joinedTo: "",
  includeInactive: false,
};
const ROLE_OPTIONS = Object.values(USER_ROLES).map((value) => ({
  label: value,
  value,
}));
const STATUS_OPTIONS = Object.values(USER_STATUS).map((value) => ({
  label: value,
  value,
}));
const SORTABLE_FIELDS = new Set([
  "fullName",
  "email",
  "role",
  "departmentName",
  "status",
  "joinedAt",
]);

const DEFAULT_FORM_VALUES = {
  firstName: "",
  lastName: "",
  position: "",
  email: "",
  phone: "",
  password: "",
  role: USER_ROLES.USER,
  departmentId: "",
  isHod: false,
  status: USER_STATUS.ACTIVE,
};

const isImmutableRoleTarget = (role) =>
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.USER].includes(role);

/**
 * Resolves department id regardless of normalized shape.
 *
 * @param {unknown} department - User department payload.
 * @returns {string} Department id.
 * @throws {never} This helper does not throw.
 */
const resolveDepartmentId = (department) => {
  if (!department) {
    return "";
  }

  if (typeof department === "string") {
    return department;
  }

  if (typeof department === "object") {
    return String(department.id || department._id || "");
  }

  return "";
};

/**
 * Users page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} Users page.
 * @throws {never} Component rendering does not throw.
 */
const UsersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can, user: authUser } = useAuthorization();
  const { formatDateTime } = useTimezone();
  const [toolbarDepartmentPage, setToolbarDepartmentPage] = useState(
    PAGINATION_DEFAULTS.PAGE,
  );
  const [isToolbarDepartmentFilterOpen, setIsToolbarDepartmentFilterOpen] =
    useState(false);
  const viewState = useSelector(selectResourceViewState(RESOURCE_KEY));
  const page = viewState.page || PAGINATION_DEFAULTS.PAGE;
  const limit = viewState.limit || PAGINATION_DEFAULTS.LIMIT;
  const sortBy = viewState.sortBy || PAGINATION_DEFAULTS.SORT_BY;
  const sortOrder = viewState.sortOrder || PAGINATION_DEFAULTS.SORT_ORDER;
  const includeDeleted = Boolean(viewState.includeDeleted);
  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      ...(viewState.filters || {}),
    }),
    [viewState.filters],
  );
  const crossDepartmentTarget = useMemo(
    () => ({
      organization: authUser?.organization,
      department: "__cross_department__",
    }),
    [authUser?.organization],
  );
  const canUseDepartmentSwitcher = useMemo(() => {
    if (!authUser) {
      return false;
    }

    return can("User", "read", { target: crossDepartmentTarget });
  }, [authUser, can, crossDepartmentTarget]);

  const applyViewState = useCallback(
    (changes) => {
      dispatch(
        setResourceViewState({
          resource: RESOURCE_KEY,
          changes,
        }),
      );
    },
    [dispatch],
  );
  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
      includeInactive: Boolean(filters.includeInactive),
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.joinedFrom ? { joinedFrom: filters.joinedFrom } : {}),
      ...(filters.joinedTo ? { joinedTo: filters.joinedTo } : {}),
      ...(Array.isArray(filters.departmentIds) && filters.departmentIds.length
        ? { departmentId: filters.departmentIds }
        : {}),
    }),
    [
      filters.departmentIds,
      filters.includeInactive,
      filters.joinedFrom,
      filters.joinedTo,
      filters.role,
      filters.status,
      includeDeleted,
      limit,
      page,
      sortBy,
      sortOrder,
    ],
  );

  const {
    data: usersResponse,
    isFetching: isUsersFetching,
    error: usersError,
  } = useGetUsersQuery(queryArgs);
  const {
    data: departmentsResponse,
    error: departmentsError,
  } = useGetDepartmentsQuery({
    page: 1,
    limit: 100,
    includeDeleted: false,
    sortBy: "name",
    sortOrder: "asc",
  });
  const {
    data: toolbarDepartmentsResponse,
    isFetching: isToolbarDepartmentsFetching,
    error: toolbarDepartmentsError,
  } = useGetDepartmentsQuery(
    {
      page: toolbarDepartmentPage,
      limit: TOOLBAR_DEPARTMENT_LIMIT,
      includeDeleted: false,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      skip: !canUseDepartmentSwitcher || !isToolbarDepartmentFilterOpen,
    },
  );

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [profileSkills, setProfileSkills] = useState([]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    row: null,
  });
  const lastFilterSyncRef = useRef("");

  const listForm = useForm({
    defaultValues: {
      ...DEFAULT_FILTERS,
      ...filters,
      includeDeleted,
    },
  });
  const userForm = useForm({ defaultValues: DEFAULT_FORM_VALUES });

  const usersPayload = usersResponse?.data || {};
  const users = usersPayload.users || [];
  const pagination = usersPayload.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || page;

  const departmentOptions = useMemo(() => {
    const departments = departmentsResponse?.data?.departments || [];
    return departments.map((item) => ({
      label: capitalizeFirstCharacter(item.name),
      value: item.id,
    }));
  }, [departmentsResponse]);
  const toolbarDepartmentOptions = useMemo(() => {
    const departments = toolbarDepartmentsResponse?.data?.departments || [];
    return departments.map((item) => ({
      name: capitalizeFirstCharacter(item.name),
      value: item.id,
    }));
  }, [toolbarDepartmentsResponse?.data?.departments]);
  const toolbarDepartmentPagination =
    toolbarDepartmentsResponse?.data?.pagination || {};
  const currentDepartmentName = capitalizeFirstCharacter(
    authUser?.departmentName || authUser?.department?.name || "Department"
  );

  const canCreate = can("User", "create");
  const immutableTarget = Boolean(
    editingUser && isImmutableRoleTarget(editingUser.role),
  );
  const dialogDepartmentOptions = useMemo(() => {
    const selectedDepartment = editingUser?.department;
    const selectedDepartmentId = resolveDepartmentId(selectedDepartment);
    if (!selectedDepartmentId) {
      return departmentOptions;
    }

    if (departmentOptions.some((item) => item.value === selectedDepartmentId)) {
      return departmentOptions;
    }

    return [
      {
        value: selectedDepartmentId,
        label: selectedDepartment?.name || "Current Department",
      },
      ...departmentOptions,
    ];
  }, [departmentOptions, editingUser?.department]);

  useEffect(() => {
    if (usersError) {
      toastApiError(usersError);
    }
  }, [usersError]);

  useEffect(() => {
    if (departmentsError) {
      toastApiError(departmentsError);
    }
  }, [departmentsError]);

  useEffect(() => {
    if (toolbarDepartmentsError) {
      toastApiError(toolbarDepartmentsError);
    }
  }, [toolbarDepartmentsError]);

  useEffect(() => {
    if (!canUseDepartmentSwitcher || filters.departmentIds?.length) {
      return;
    }

    const currentDepartmentId = resolveDepartmentId(authUser?.department);
    if (!currentDepartmentId) {
      return;
    }

    applyViewState({
      filters: {
        ...filters,
        departmentIds: [currentDepartmentId],
      },
      page: PAGINATION_DEFAULTS.PAGE,
    });
  }, [applyViewState, authUser?.department, canUseDepartmentSwitcher, filters]);

  useEffect(() => {
    const nextValues = {
      ...DEFAULT_FILTERS,
      ...filters,
      includeDeleted,
    };
    const snapshot = JSON.stringify(nextValues);
    if (lastFilterSyncRef.current === snapshot) {
      return;
    }

    lastFilterSyncRef.current = snapshot;
    listForm.reset(nextValues);
  }, [filters, includeDeleted, listForm]);

  const openCreateDialog = () => {
    setEditingUser(null);
    userForm.reset({
      ...DEFAULT_FORM_VALUES,
      departmentId: resolveDepartmentId(authUser?.department),
    });
    setProfileSkills([]);
    setSkillInput("");
    setUserDialogOpen(true);
  };

  const openEditDialog = useCallback(
    (row) => {
      setEditingUser(row);
      userForm.reset({
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        position: row.position || "",
        email: row.email || "",
        phone: row.phone || "",
        password: "",
        role: row.role || USER_ROLES.USER,
        departmentId: resolveDepartmentId(row.department),
        isHod: Boolean(row.isHod),
        status: row.status || USER_STATUS.ACTIVE,
      });
      setProfileSkills(Array.isArray(row.skills) ? row.skills : []);
      setSkillInput("");
      setUserDialogOpen(true);
    },
    [userForm],
  );

  const openConfirmDialog = useCallback((mode, row) => {
    setConfirmState({
      open: true,
      mode,
      row,
    });
  }, []);

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", row: null });
  };

  const [createUser, createState] = useCreateUserMutation();
  const [updateUser, updateState] = useUpdateUserMutation();
  const [deleteUser, deleteState] = useDeleteUserMutation();
  const [restoreUser, restoreState] = useRestoreUserMutation();

  const handleDeleteRestore = async () => {
    const row = confirmState.row;
    if (!row?.id) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreUser(row.id).unwrap();
        toast.success("User restored");
      } else {
        await deleteUser(row.id).unwrap();
        toast.success("User deleted");
      }
      closeConfirmDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleSubmitUser = async (values) => {
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        position: values.position,
        email: values.email,
        phone: values.phone || undefined,
        status: values.status,
        skills: profileSkills,
        ...(editingUser && immutableTarget
          ? {}
          : {
              role: values.role,
              departmentId: values.departmentId,
              isHod: Boolean(values.isHod),
            }),
      };

      if (editingUser) {
        await updateUser({
          userId: editingUser.id,
          body: payload,
        }).unwrap();
        toast.success("User updated");
      } else {
        await createUser({
          ...payload,
          password: values.password,
        }).unwrap();
        toast.success("User created");
      }

      setUserDialogOpen(false);
    } catch (error) {
      toastApiError(error);
    }
  };

  const columns = useMemo(
    () =>
      createUsersColumns({
        can,
        formatDateTime,
        navigate,
        openEditDialog,
        openConfirmDialog,
      }),
    [can, formatDateTime, navigate, openConfirmDialog, openEditDialog],
  );
  const isMutating =
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading ||
    restoreState.isLoading;
  const resolvedViewMode = viewState.viewMode || VIEW_MODE.GRID;
  const isGridView = resolvedViewMode === VIEW_MODE.GRID;
  const gridPaginationModel = useMemo(
    () => ({
      page: Math.max((currentPage || PAGINATION_DEFAULTS.PAGE) - 1, 0),
      pageSize: limit,
    }),
    [currentPage, limit],
  );
  const sortModel = useMemo(() => {
    if (!sortBy || !SORTABLE_FIELDS.has(sortBy)) {
      return [];
    }
    return [{ field: sortBy, sort: sortOrder || "desc" }];
  }, [sortBy, sortOrder]);

  const handleGridPaginationChange = useCallback(
    (model) => {
      const nextPage = Number(model.page || 0) + 1;
      const nextLimit = Number(model.pageSize || limit);
      if (nextPage === page && nextLimit === limit) {
        return;
      }

      applyViewState({
        page: nextPage,
        limit: nextLimit,
      });
    },
    [applyViewState, limit, page],
  );

  const toolbarProps = useMemo(
    () => ({
      onFilterClick: () => setFilterDialogOpen(true),
      departmentFilterEnabled: canUseDepartmentSwitcher,
      departmentFilterValue: filters.departmentIds?.[0] || "",
      departmentFilterOptions: toolbarDepartmentOptions,
      departmentFilterInitialValue: currentDepartmentName,
      departmentFilterLoading: isToolbarDepartmentsFetching,
      departmentFilterPage:
        toolbarDepartmentPagination.page || toolbarDepartmentPage,
      departmentFilterTotalPages: toolbarDepartmentPagination.totalPages || 1,
      onDepartmentFilterPageChange: (nextPage) => setToolbarDepartmentPage(nextPage),
      onDepartmentFilterOpen: () => setIsToolbarDepartmentFilterOpen(true),
      onDepartmentFilterChange: (value) =>
        applyViewState({
          filters: {
            ...filters,
            departmentIds: value ? [value] : [],
          },
          page: 1,
        }),
    }),
    [
      applyViewState,
      canUseDepartmentSwitcher,
      currentDepartmentName,
      filters,
      isToolbarDepartmentsFetching,
      toolbarDepartmentOptions,
      toolbarDepartmentPage,
      toolbarDepartmentPagination.page,
      toolbarDepartmentPagination.totalPages,
    ],
  );

  return (
    <Stack spacing={2}>
      <UsersToolbar
        viewMode={resolvedViewMode}
        onViewModeChange={(nextView) => applyViewState({ viewMode: nextView })}
        filterActiveCount={countActiveFilters(filters, includeDeleted, [
          "includeInactive",
        ])}
        onFilterClick={() => setFilterDialogOpen(true)}
        canCreate={canCreate}
        onCreate={openCreateDialog}
      />

      {isGridView ? (
        <UsersGridView
          users={users}
          columns={columns}
          isLoading={isUsersFetching}
          rowCount={pagination.totalItems || 0}
          paginationModel={gridPaginationModel}
          onPaginationModelChange={handleGridPaginationChange}
          sortModel={sortModel}
          onSortModelChange={(model) => {
            const first = model[0];
            if (!first) return;
            const nextSortBy = first.field;
            const nextSortOrder = first.sort || "asc";
            if (!SORTABLE_FIELDS.has(nextSortBy)) {
              return;
            }
            if (
              String(sortBy || "") === String(nextSortBy || "") &&
              String(sortOrder || "desc") === String(nextSortOrder)
            ) {
              return;
            }
            applyViewState({
              sortBy: nextSortBy,
              sortOrder: nextSortOrder,
              page: 1,
            });
          }}
          toolbarProps={toolbarProps}
        />
      ) : (
        <UsersListView
          users={users}
          isLoading={isUsersFetching}
          page={currentPage}
          totalPages={totalPages}
          can={can}
          onPageChange={(nextPage) => applyViewState({ page: nextPage })}
          onView={(row) => navigate(`/dashboard/users/${row.id}`)}
          onEdit={(row) => openEditDialog(row)}
          onDelete={(row) => openConfirmDialog("delete", row)}
          onRestore={(row) => openConfirmDialog("restore", row)}
        />
      )}

      <UserFilter
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        listForm={listForm}
        roleOptions={ROLE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        departmentOptions={departmentOptions}
        onClear={() => {
          listForm.reset({
            ...DEFAULT_FILTERS,
            includeDeleted: false,
          });
          applyViewState({
            filters: DEFAULT_FILTERS,
            includeDeleted: false,
            page: 1,
          });
          setFilterDialogOpen(false);
        }}
        onApply={listForm.handleSubmit((values) => {
          const { includeDeleted: nextIncludeDeleted, ...nextFilters } = values;
          applyViewState({
            filters: nextFilters,
            includeDeleted: Boolean(nextIncludeDeleted),
            page: 1,
          });
          setFilterDialogOpen(false);
        })}
      />

      <UserFormDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        editingUser={editingUser}
        immutableTarget={immutableTarget}
        userForm={userForm}
        isMutating={isMutating}
        onSubmit={handleSubmitUser}
        departmentOptions={dialogDepartmentOptions}
        roleOptions={ROLE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        profileSkills={profileSkills}
        skillInput={skillInput}
        onSkillInputChange={setSkillInput}
        onSkillAdd={() => {
          const value = String(skillInput || "").trim();
          if (!value) return;
          setProfileSkills((current) =>
            current.includes(value) ? current : [...current, value],
          );
          setSkillInput("");
        }}
        onSkillRemove={(skill) =>
          setProfileSkills((current) =>
            current.filter((entry) => entry !== skill)
          )
        }
      />

      <MuiDialogConfirm
        open={confirmState.open}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteRestore}
        title={confirmState.mode === "restore" ? "Restore User" : "Delete User"}
        message={
          confirmState.mode === "restore"
            ? "Restore this user and related soft-deleted records?"
            : "Soft delete this user and cascade linked records?"
        }
        confirmText={confirmState.mode === "restore" ? "Restore" : "Delete"}
        confirmColor={confirmState.mode === "restore" ? "success" : "error"}
        isLoading={isMutating}
      />
    </Stack>
  );
};

export default UsersPage;
