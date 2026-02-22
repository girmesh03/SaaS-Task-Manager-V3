import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Stack from "@mui/material/Stack";
import { MuiDialogConfirm } from "../../components/reusable";
import {
  DepartmentFilter,
  DepartmentFormDialog,
  DepartmentsGridView,
  DepartmentsListView,
  DepartmentsToolbar,
} from "../../components/department";
import { createDepartmentsColumns } from "../../components/columns";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  selectResourceViewState,
  setResourceViewState,
} from "../../redux/features";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  useRestoreDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../../services/api";
import {
  DEPARTMENT_STATUS,
  PAGINATION_DEFAULTS,
  VIEW_MODE,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import {
  capitalizeFirstCharacter,
  countActiveFilters,
  hasValue,
} from "../../utils/helpers";

const RESOURCE_KEY = "departments";
const TOOLBAR_DEPARTMENT_LIMIT = 8;
const DEFAULT_FILTERS = {
  departmentId: "",
  status: "",
  managerId: "",
  memberCountMin: "",
  memberCountMax: "",
  createdFrom: "",
  createdTo: "",
  organizationId: "",
};

const STATUS_OPTIONS = Object.values(DEPARTMENT_STATUS).map((value) => ({
  label: value,
  value,
}));
const SORTABLE_FIELDS = new Set([
  "name",
  "description",
  "managerName",
  "memberCount",
  "taskCount",
  "status",
  "createdAt",
]);
const DEFAULT_FORM_VALUES = {
  name: "",
  description: "",
  managerId: "",
};

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
 * Departments page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} Departments page.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can, user: authUser } = useAuthorization();
  const { formatDateTime } = useTimezone();
  const [toolbarDepartmentPage, setToolbarDepartmentPage] = useState(
    PAGINATION_DEFAULTS.PAGE
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
    [viewState.filters]
  );
  const crossDepartmentTarget = useMemo(
    () => ({
      organization: authUser?.organization,
      department: "__cross_department__",
    }),
    [authUser?.organization]
  );
  const canUseDepartmentSwitcher = useMemo(() => {
    if (!authUser) {
      return false;
    }

    return can("Department", "read", { target: crossDepartmentTarget });
  }, [authUser, can, crossDepartmentTarget]);
  const canFilterByOrganization = useMemo(() => {
    if (!authUser) {
      return false;
    }

    return can("Department", "read", {
      target: {
        organization: "__cross_organization__",
        department: authUser.department,
      },
    });
  }, [authUser, can]);

  const applyViewState = useCallback(
    (changes) => {
      dispatch(
        setResourceViewState({
          resource: RESOURCE_KEY,
          changes,
        })
      );
    },
    [dispatch]
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.managerId ? { managerId: filters.managerId } : {}),
      ...(hasValue(filters.memberCountMin)
        ? { memberCountMin: Number(filters.memberCountMin) }
        : {}),
      ...(hasValue(filters.memberCountMax)
        ? { memberCountMax: Number(filters.memberCountMax) }
        : {}),
      ...(filters.createdFrom ? { createdFrom: filters.createdFrom } : {}),
      ...(filters.createdTo ? { createdTo: filters.createdTo } : {}),
      ...(filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
    }),
    [
      filters.createdFrom,
      filters.createdTo,
      filters.departmentId,
      filters.managerId,
      filters.memberCountMax,
      filters.memberCountMin,
      filters.organizationId,
      filters.status,
      includeDeleted,
      limit,
      page,
      sortBy,
      sortOrder,
    ]
  );

  const {
    data: departmentsResponse,
    isFetching: isDepartmentsFetching,
    error: departmentsError,
  } = useGetDepartmentsQuery(queryArgs);
  const {
    data: toolbarDepartmentsResponse,
    isFetching: isToolbarDepartmentsFetching,
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
    }
  );
  const { data: usersResponse } = useGetUsersQuery({
    page: 1,
    limit: 100,
    includeDeleted: false,
    includeInactive: true,
  });

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    row: null,
  });
  const lastFilterSyncRef = useRef("");

  const departmentsPayload = departmentsResponse?.data || {};
  const departments = useMemo(
    () => departmentsPayload.departments || [],
    [departmentsPayload.departments]
  );
  const pagination = departmentsPayload.pagination || {};
  const currentPage = pagination.page || page;
  const totalPages = pagination.totalPages || 1;

  const managerOptions = useMemo(() => {
    const users = usersResponse?.data?.users || [];
    return users
      .filter((item) => item.isHod)
      .map((item) => ({
        label: item.fullName,
        value: item.id,
      }));
  }, [usersResponse?.data?.users]);
  const filterDepartmentOptions = useMemo(() => {
    const records = departmentsResponse?.data?.departments || [];
    return records.map((item) => ({
      label: capitalizeFirstCharacter(item.name),
      value: item.id,
    }));
  }, [departmentsResponse?.data?.departments]);
  const toolbarDepartmentOptions = useMemo(() => {
    const records = toolbarDepartmentsResponse?.data?.departments || [];
    return records.map((item) => ({
      name: capitalizeFirstCharacter(item.name),
      value: item.id,
    }));
  }, [toolbarDepartmentsResponse?.data?.departments]);
  const toolbarDepartmentPagination =
    toolbarDepartmentsResponse?.data?.pagination || {};
  const currentDepartmentName = capitalizeFirstCharacter(
    authUser?.departmentName || authUser?.department?.name || "Department"
  );

  const listForm = useForm({
    defaultValues: {
      ...DEFAULT_FILTERS,
      ...filters,
      includeDeleted,
    },
  });
  const departmentForm = useForm({ defaultValues: DEFAULT_FORM_VALUES });

  useEffect(() => {
    if (departmentsError) {
      toastApiError(departmentsError);
    }
  }, [departmentsError]);

  useEffect(() => {
    if (!canUseDepartmentSwitcher || filters.departmentId) {
      return;
    }

    const currentDepartmentId = resolveDepartmentId(authUser?.department);
    if (!currentDepartmentId) {
      return;
    }

    applyViewState({
      filters: {
        ...filters,
        departmentId: currentDepartmentId,
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
    setEditingDepartment(null);
    departmentForm.reset(DEFAULT_FORM_VALUES);
    setDepartmentDialogOpen(true);
  };

  const openEditDialog = useCallback(
    (row) => {
      setEditingDepartment(row);
      departmentForm.reset({
        name: row.name || "",
        description: row.description || "",
        managerId: row.manager?.id || "",
      });
      setDepartmentDialogOpen(true);
    },
    [departmentForm]
  );

  const openConfirmDialog = useCallback((mode, row) => {
    setConfirmState({ open: true, mode, row });
  }, []);

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", row: null });
  };

  const closeDepartmentDialog = useCallback(() => {
    setDepartmentDialogOpen(false);
  }, []);

  const [createDepartment, createState] = useCreateDepartmentMutation();
  const [updateDepartment, updateState] = useUpdateDepartmentMutation();
  const [deleteDepartment, deleteState] = useDeleteDepartmentMutation();
  const [restoreDepartment, restoreState] = useRestoreDepartmentMutation();

  const handleDeleteRestore = async () => {
    const row = confirmState.row;
    if (!row?.id) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreDepartment(row.id).unwrap();
        toast.success("Department restored");
      } else {
        await deleteDepartment(row.id).unwrap();
        toast.success("Department deleted");
      }
      closeConfirmDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleSubmitDepartment = useCallback(
    async (values) => {
      try {
        const payload = {
          name: values.name,
          description: values.description,
          managerId: values.managerId || undefined,
        };

        if (editingDepartment) {
          await updateDepartment({
            departmentId: editingDepartment.id,
            body: payload,
          }).unwrap();
          toast.success("Department updated");
        } else {
          await createDepartment(payload).unwrap();
          toast.success("Department created");
        }

        setDepartmentDialogOpen(false);
      } catch (error) {
        toastApiError(error);
      }
    },
    [createDepartment, editingDepartment, updateDepartment]
  );

  const columns = useMemo(
    () =>
      createDepartmentsColumns({
        can,
        formatDateTime,
        navigate,
        openEditDialog,
        openConfirmDialog,
      }),
    [can, formatDateTime, navigate, openConfirmDialog, openEditDialog]
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
    [currentPage, limit]
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
    [applyViewState, limit, page]
  );

  const toolbarProps = useMemo(
    () => ({
      onFilterClick: () => setFilterDialogOpen(true),
      departmentFilterEnabled: canUseDepartmentSwitcher,
      departmentFilterValue: filters.departmentId || "",
      departmentFilterOptions: toolbarDepartmentOptions,
      departmentFilterInitialValue: currentDepartmentName,
      departmentFilterLoading: isToolbarDepartmentsFetching,
      departmentFilterPage:
        toolbarDepartmentPagination.page || toolbarDepartmentPage,
      departmentFilterTotalPages: toolbarDepartmentPagination.totalPages || 1,
      onDepartmentFilterPageChange: (nextPage) =>
        setToolbarDepartmentPage(nextPage),
      onDepartmentFilterOpen: () => setIsToolbarDepartmentFilterOpen(true),
      onDepartmentFilterChange: (value) =>
        applyViewState({
          filters: {
            ...filters,
            departmentId: value || "",
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
    ]
  );

  return (
    <Stack spacing={2}>
      <DepartmentsToolbar
        viewMode={resolvedViewMode}
        onViewModeChange={(nextView) => applyViewState({ viewMode: nextView })}
        filterActiveCount={countActiveFilters(filters, includeDeleted)}
        onFilterClick={() => setFilterDialogOpen(true)}
        canCreate={can("Department", "create")}
        onCreate={openCreateDialog}
      />

      {isGridView ? (
        <DepartmentsGridView
          departments={departments}
          columns={columns}
          isLoading={isDepartmentsFetching}
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
        <DepartmentsListView
          departments={departments}
          isLoading={isDepartmentsFetching}
          page={currentPage}
          totalPages={totalPages}
          can={can}
          onPageChange={(nextPage) => applyViewState({ page: nextPage })}
          onView={(row) => navigate(`/dashboard/departments/${row.id}`)}
          onEdit={(row) => openEditDialog(row)}
          onDelete={(row) => openConfirmDialog("delete", row)}
          onRestore={(row) => openConfirmDialog("restore", row)}
        />
      )}

      <DepartmentFilter
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        listForm={listForm}
        canUseDepartmentSwitcher={canUseDepartmentSwitcher}
        departmentOptions={filterDepartmentOptions}
        statusOptions={STATUS_OPTIONS}
        managerOptions={managerOptions}
        canFilterByOrganization={canFilterByOrganization}
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

      <DepartmentFormDialog
        open={departmentDialogOpen}
        onClose={closeDepartmentDialog}
        editingDepartment={editingDepartment}
        departmentForm={departmentForm}
        managerOptions={managerOptions}
        onSubmit={handleSubmitDepartment}
        isMutating={isMutating}
      />

      <MuiDialogConfirm
        open={confirmState.open}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteRestore}
        title={
          confirmState.mode === "restore"
            ? "Restore Department"
            : "Delete Department"
        }
        message={
          confirmState.mode === "restore"
            ? "Restore this department and related soft-deleted records?"
            : "Soft delete this department and related scoped records?"
        }
        confirmText={confirmState.mode === "restore" ? "Restore" : "Delete"}
        confirmColor={confirmState.mode === "restore" ? "success" : "error"}
        isLoading={isMutating}
      />
    </Stack>
  );
};

export default DepartmentsPage;
