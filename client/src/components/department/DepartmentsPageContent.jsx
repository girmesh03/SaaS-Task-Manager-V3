import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import {
  MuiDataGrid,
  MuiDataGridToolbar,
  MuiDialogConfirm,
  MuiEmptyState,
  MuiFilterButton,
  MuiLoading,
  MuiPagination,
  MuiViewToggle,
} from "../reusable";
import DepartmentFilter from "./DepartmentFilter";
import DepartmentFormDialog from "./DepartmentFormDialog";
import DepartmentListCard from "./DepartmentListCard";
import { createDepartmentsColumns } from "../columns";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  selectResourceViewState,
  setResourceViewState,
} from "../../redux/features";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useRestoreDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../../services/api";
import {
  DEPARTMENT_STATUS,
  PAGINATION_DEFAULTS,
  VIEW_MODE,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { capitalizeFirstCharacter, countActiveFilters } from "../../utils/helpers";

const RESOURCE_KEY = "departments";
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
 * Departments dashboard page with canonical list/grid, filters, and CRUD dialogs.
 *
 * @returns {JSX.Element} Departments page.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentsPageContent = ({
  departmentsResponse,
  toolbarDepartmentsResponse,
  toolbarDepartmentPage,
  isDepartmentsFetching,
  isToolbarDepartmentsFetching,
  usersResponse,
  onToolbarDepartmentPageChange,
  onToolbarDepartmentFilterOpen,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can, user: authUser } = useAuthorization();
  const isBelow768 = useMediaQuery("(max-width:767.95px)");
  const { formatDateTime } = useTimezone();
  const viewState = useSelector(selectResourceViewState(RESOURCE_KEY));

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    row: null,
  });
  const lastFilterSyncRef = useRef("");

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

  const [createDepartment, createState] = useCreateDepartmentMutation();
  const [updateDepartment, updateState] = useUpdateDepartmentMutation();
  const [deleteDepartment, deleteState] = useDeleteDepartmentMutation();
  const [restoreDepartment, restoreState] = useRestoreDepartmentMutation();

  const departmentsPayload = departmentsResponse?.data || {};
  const departments = useMemo(
    () => departmentsPayload.departments || [],
    [departmentsPayload.departments],
  );
  const pagination = departmentsPayload.pagination || {};

  const managerOptions = useMemo(() => {
    const users = usersResponse?.data?.users || [];
    return users
      .filter((item) => item.isHod)
      .map((item) => ({
        label: item.fullName,
        value: item.id,
      }));
  }, [usersResponse]);
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
    [departmentForm],
  );

  const openConfirmDialog = useCallback((mode, row) => {
    setConfirmState({ open: true, mode, row });
  }, []);

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", row: null });
  };

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

  const handleSubmitDepartment = async (values) => {
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
  };

  const columns = useMemo(
    () =>
      createDepartmentsColumns({
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
  const isGridView = (viewState.viewMode || VIEW_MODE.GRID) === VIEW_MODE.GRID;
  const gridPaginationModel = useMemo(
    () => ({
      page: Math.max((pagination.page || PAGINATION_DEFAULTS.PAGE) - 1, 0),
      pageSize: limit,
    }),
    [limit, pagination.page],
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

  const activeFilterCount = countActiveFilters(filters, includeDeleted);

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        justifyContent="flex-end"
        sx={{
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <MuiViewToggle
          value={viewState.viewMode || VIEW_MODE.GRID}
          onChange={(_event, nextView) => {
            if (!nextView) return;
            applyViewState({ viewMode: nextView });
          }}
          sx={{
            "& .MuiToggleButton-root": {
              minWidth: 34,
              height: 34,
              px: 0.75,
            },
          }}
        />
        {!isGridView ? (
          <MuiFilterButton
            activeCount={activeFilterCount}
            onClick={() => setFilterDialogOpen(true)}
            iconOnlyOnMobile
            sx={{ px: { xs: 0.75, sm: 1.25 } }}
          />
        ) : null}
        {!isBelow768 ? (
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={openCreateDialog}
            disabled={!can("Department", "create")}
            startIcon={<AddIcon fontSize="small" />}
            sx={{
              minWidth: "auto",
              px: 1.5,
            }}
            aria-label="Add department"
          >
            <Box component="span">Add Department</Box>
          </Button>
        ) : can("Department", "create") ? (
          <Tooltip title="Add Department">
            <IconButton
              size="small"
              onClick={openCreateDialog}
              aria-label="Add department"
              sx={{
                width: 34,
                height: 34,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      {!isGridView &&
        (isDepartmentsFetching ? (
          <MuiLoading message="Loading departments..." />
        ) : departments.length === 0 ? (
          <MuiEmptyState
            message="No departments found"
            secondaryMessage="Create a department or adjust filters."
          />
        ) : (
          <Grid container spacing={2}>
            {departments.map((row) => (
              <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <DepartmentListCard
                  row={row}
                  onView={() => navigate(`/dashboard/departments/${row.id}`)}
                  onEdit={() => openEditDialog(row)}
                  onDelete={() => openConfirmDialog("delete", row)}
                  onRestore={() => openConfirmDialog("restore", row)}
                  canView={can("Department", "read", {
                    target: {
                      organization: row.organization?.id,
                      department: row.id,
                    },
                  })}
                  canUpdate={can("Department", "update", {
                    target: {
                      organization: row.organization?.id,
                      department: row.id,
                    },
                  })}
                  canDelete={can("Department", "delete", {
                    target: {
                      organization: row.organization?.id,
                      department: row.id,
                    },
                  })}
                  canRestore={can("Department", "delete", {
                    target: {
                      organization: row.organization?.id,
                      department: row.id,
                    },
                  })}
                />
              </Grid>
            ))}
          </Grid>
        ))}

      {isGridView ? (
        <MuiDataGrid
          autoHeight
          rows={departments}
          columns={columns}
          getRowId={(row) => row.id}
          enableSelectionExport
          rowCount={pagination.totalItems || 0}
          pagination
          pageSizeOptions={[10, 20, 50]}
          paginationModel={gridPaginationModel}
          onPaginationModelChange={handleGridPaginationChange}
          slots={{ toolbar: MuiDataGridToolbar }}
          slotProps={{
            toolbar: {
              onFilterClick: () => setFilterDialogOpen(true),
              departmentFilterEnabled: canUseDepartmentSwitcher,
              departmentFilterValue: filters.departmentId || "",
              departmentFilterOptions: toolbarDepartmentOptions,
              departmentFilterInitialValue: currentDepartmentName,
              departmentFilterLoading: isToolbarDepartmentsFetching,
              departmentFilterPage:
                toolbarDepartmentPagination.page || toolbarDepartmentPage,
              departmentFilterTotalPages:
                toolbarDepartmentPagination.totalPages || 1,
              onDepartmentFilterPageChange: (nextPage) =>
                onToolbarDepartmentPageChange?.(nextPage),
              onDepartmentFilterOpen: () => onToolbarDepartmentFilterOpen?.(),
              onDepartmentFilterChange: (value) =>
                applyViewState({
                  filters: {
                    ...filters,
                    departmentId: value || "",
                  },
                  page: 1,
                }),
            },
          }}
          showToolbar
          loading={isDepartmentsFetching}
          loadingMessage="Loading departments..."
          emptyStateMessage="No departments found"
          emptyStateSecondaryMessage="Create a department or adjust filters."
          sortingMode="server"
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
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "grey.50",
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiDataGrid-columnHeaderTitle": {
                fontSize: "0.72rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "text.secondary",
                fontWeight: 700,
              },
            },
            "& .MuiDataGrid-cell": {
              borderColor: "divider",
            },
            "& .MuiDataGrid-row": {
              maxHeight: "none !important",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: 1,
              borderColor: "divider",
            },
          }}
          rowHeight={72}
          columnHeaderHeight={52}
        />
      ) : null}

      {!isGridView ? (
        <Stack direction="row" justifyContent="center">
          <MuiPagination
            page={pagination.page || PAGINATION_DEFAULTS.PAGE}
            count={pagination.totalPages || 1}
            onChange={(_event, nextPage) => applyViewState({ page: nextPage })}
          />
        </Stack>
      ) : null}

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
        onClose={() => setDepartmentDialogOpen(false)}
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

DepartmentsPageContent.propTypes = {
  departmentsResponse: PropTypes.object,
  toolbarDepartmentsResponse: PropTypes.object,
  toolbarDepartmentPage: PropTypes.number,
  isDepartmentsFetching: PropTypes.bool,
  isToolbarDepartmentsFetching: PropTypes.bool,
  usersResponse: PropTypes.object,
  onToolbarDepartmentPageChange: PropTypes.func,
  onToolbarDepartmentFilterOpen: PropTypes.func,
};

export default DepartmentsPageContent;
