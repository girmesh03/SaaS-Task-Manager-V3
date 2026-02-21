import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import {
  MuiActionColumn,
  MuiDataGrid,
  MuiDataGridToolbar,
  MuiDialogConfirm,
  MuiEmptyState,
  MuiFilterButton,
  MuiLoading,
  MuiPagination,
  MuiViewToggle,
} from "../reusable";
import UserFilter from "./UserFilter";
import UserFormDialog from "./UserFormDialog";
import { createUsersColumns } from "../columns";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  selectResourceViewState,
  setResourceViewState,
} from "../../redux/features";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
  useUpdateUserMutation,
} from "../../services/api";
import {
  PAGINATION_DEFAULTS,
  USER_IMMUTABLE_FIELDS,
  USER_ROLES,
  USER_STATUS,
  VIEW_MODE,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { capitalizeFirstCharacter, countActiveFilters } from "../../utils/helpers";

const RESOURCE_KEY = "users";
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

const DEFAULT_FILTERS = {
  role: "",
  status: "",
  departmentIds: [],
  joinedFrom: "",
  joinedTo: "",
  includeInactive: false,
};

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
 * Users dashboard page with canonical list/grid, filters, and CRUD dialogs.
 *
 * @returns {JSX.Element} Users page.
 * @throws {never} Component rendering does not throw.
 */
const UsersPageContent = ({
  usersResponse,
  departmentsResponse,
  toolbarDepartmentsResponse,
  toolbarDepartmentPage,
  isUsersFetching,
  isToolbarDepartmentsFetching,
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

  const [createUser, createState] = useCreateUserMutation();
  const [updateUser, updateState] = useUpdateUserMutation();
  const [deleteUser, deleteState] = useDeleteUserMutation();
  const [restoreUser, restoreState] = useRestoreUserMutation();

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

  const listForm = useForm({
    defaultValues: {
      ...DEFAULT_FILTERS,
      ...filters,
      includeDeleted,
    },
  });
  const userForm = useForm({ defaultValues: DEFAULT_FORM_VALUES });

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
  const isGridView = (viewState.viewMode || VIEW_MODE.GRID) === VIEW_MODE.GRID;
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
            activeCount={countActiveFilters(filters, includeDeleted, [
              "includeInactive",
            ])}
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
            disabled={!canCreate}
            startIcon={<AddIcon fontSize="small" />}
            sx={{
              minWidth: "auto",
              px: 1.5,
            }}
            aria-label="Add user"
          >
            <Box component="span">Add User</Box>
          </Button>
        ) : canCreate ? (
          <Tooltip title="Add User">
            <IconButton
              size="small"
              onClick={openCreateDialog}
              aria-label="Add user"
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
        (isUsersFetching ? (
          <MuiLoading message="Loading users..." />
        ) : users.length === 0 ? (
          <MuiEmptyState
            message="No users found"
            secondaryMessage="Try adjusting filters or create a new user."
          />
        ) : (
          <Grid container spacing={2}>
            {users.map((row) => (
              <Grid key={row.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack spacing={1.25} alignItems="center" textAlign="center">
                      <Box sx={{ position: "relative" }}>
                        <Avatar
                          src={row.profilePicture?.url || undefined}
                          alt={row.fullName}
                          sx={{ width: 72, height: 72 }}
                        >
                          {String(row.fullName || "U")
                            .split(" ")
                            .slice(0, 2)
                            .map((token) => token.charAt(0))
                            .join("")}
                        </Avatar>
                        <Box
                          sx={{
                            position: "absolute",
                            right: 2,
                            bottom: 2,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor:
                              row.status === USER_STATUS.ACTIVE
                                ? "success.main"
                                : "grey.400",
                            border: 2,
                            borderColor: "background.paper",
                          }}
                        />
                      </Box>

                      <Stack spacing={0.25} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {row.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.position || "Team Member"}
                        </Typography>
                        <Chip
                          size="small"
                          label={row.role}
                          color={
                            row.role === USER_ROLES.ADMIN
                              ? "secondary"
                              : row.role === USER_ROLES.MANAGER
                                ? "primary"
                                : "default"
                          }
                        />
                      </Stack>

                      <Divider sx={{ width: "100%" }} />

                      <Typography variant="body2" color="text.secondary">
                        {row.department?.name || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.email}
                      </Typography>

                      <MuiActionColumn
                        row={row}
                        onView={() => navigate(`/dashboard/users/${row.id}`)}
                        onEdit={() => openEditDialog(row)}
                        onDelete={() => openConfirmDialog("delete", row)}
                        onRestore={() => openConfirmDialog("restore", row)}
                        canView={can("User", "read", {
                          target: {
                            organization: row.organization?.id,
                            department: row.department?.id,
                          },
                          params: { userId: row.id },
                        })}
                        canUpdate={can("User", "update", {
                          target: {
                            id: row.id,
                            organization: row.organization?.id,
                            department: row.department?.id,
                          },
                          params: { userId: row.id },
                        })}
                        canDelete={can("User", "delete", {
                          target: {
                            organization: row.organization?.id,
                            department: row.department?.id,
                          },
                          params: { userId: row.id },
                        })}
                        canRestore={can("User", "delete", {
                          target: {
                            organization: row.organization?.id,
                            department: row.department?.id,
                          },
                          params: { userId: row.id },
                        })}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ))}

      {isGridView ? (
        <MuiDataGrid
          autoHeight
          rows={users}
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
              departmentFilterValue: filters.departmentIds?.[0] || "",
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
                    departmentIds: value ? [value] : [],
                  },
                  page: 1,
                }),
            },
          }}
          showToolbar
          loading={isUsersFetching}
          loadingMessage="Loading users..."
          emptyStateMessage="No users found"
          emptyStateSecondaryMessage="Try adjusting filters or create a new user."
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
            page={currentPage}
            count={totalPages}
            onChange={(_event, nextPage) => applyViewState({ page: nextPage })}
          />
        </Stack>
      ) : null}

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
          setProfileSkills((current) => current.filter((entry) => entry !== skill))
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

UsersPageContent.propTypes = {
  usersResponse: PropTypes.object,
  departmentsResponse: PropTypes.object,
  toolbarDepartmentsResponse: PropTypes.object,
  toolbarDepartmentPage: PropTypes.number,
  isUsersFetching: PropTypes.bool,
  isToolbarDepartmentsFetching: PropTypes.bool,
  onToolbarDepartmentPageChange: PropTypes.func,
  onToolbarDepartmentFilterOpen: PropTypes.func,
};

export default UsersPageContent;
