import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Stack from "@mui/material/Stack";
import { toast } from "react-toastify";
import { MuiDialogConfirm } from "../../components/reusable";
import { createTasksColumns } from "../../components/columns";
import {
  TaskFilterDialog,
  TaskFormDialog,
  TasksGridView,
  TasksListView,
  TasksToolbar,
} from "../../components/task";
import { useAuth, useAuthorization, useTimezone } from "../../hooks";
import {
  selectResourceViewState,
  setResourceViewState,
} from "../../redux/features";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetDepartmentsQuery,
  useGetMaterialsQuery,
  useGetTaskQuery,
  useGetTasksQuery,
  useGetUsersQuery,
  useGetVendorsQuery,
  useRestoreTaskMutation,
  useUpdateTaskMutation,
} from "../../services/api";
import {
  PAGINATION_DEFAULTS,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
  VIEW_MODE,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { capitalizeFirstCharacter, countActiveFilters } from "../../utils/helpers";

const RESOURCE_KEY = "tasks";

const TASK_TABS = Object.freeze(["All Tasks", "Assigned to Me", "Completed"]);
const SORTABLE_FIELDS = new Set([
  "title",
  "type",
  "status",
  "priority",
  "createdAt",
  "updatedAt",
  "startDate",
  "dueDate",
  "date",
]);

const DEFAULT_FILTERS = {
  type: [],
  status: [],
  priority: [],
  departmentId: "",
  assigneeId: "",
  createdById: "",
  watcherId: "",
  vendorId: "",
  materialId: "",
  startFrom: "",
  startTo: "",
  dueFrom: "",
  dueTo: "",
  tags: "",
};

const DEFAULT_FORM_VALUES = {
  title: "",
  description: "",
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  tags: [],
  watchers: [],
  vendorId: "",
  assigneeIds: [],
  startDate: "",
  dueDate: "",
  date: "",
  materials: [],
};

/**
 * Tasks list page container (query orchestration + view state).
 *
 * @returns {JSX.Element} Tasks page.
 * @throws {never} This component does not throw.
 */
const TasksPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can } = useAuthorization();
  const { user: authUser, userId } = useAuth();
  const { formatDateTime } = useTimezone();

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

  const [tab, setTab] = useState(TASK_TABS[0]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState(TASK_TYPE.PROJECT);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    row: null,
  });
  const lastFilterSyncRef = useRef("");

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

  const showDepartmentFilter = Boolean(
    authUser?.role === "SuperAdmin" && authUser?.isPlatformOrgUser,
  );

  const createTarget = useMemo(
    () => ({
      organization: authUser?.organization?.id || authUser?.organization || undefined,
      department: authUser?.department?.id || authUser?.department || undefined,
    }),
    [authUser?.department, authUser?.organization],
  );

  const canCreateProject = can("Task", "create", {
    resourceType: TASK_TYPE.PROJECT,
    target: createTarget,
  });
  const canCreateAssigned = can("Task", "create", {
    resourceType: TASK_TYPE.ASSIGNED,
    target: createTarget,
  });
  const canCreateRoutine = can("Task", "create", {
    resourceType: TASK_TYPE.ROUTINE,
    target: createTarget,
  });
  const canCreateAny = canCreateProject || canCreateAssigned || canCreateRoutine;
  const taskTypeOptions = useMemo(
    () => [
      { value: TASK_TYPE.PROJECT, label: "Project", disabled: !canCreateProject },
      { value: TASK_TYPE.ASSIGNED, label: "Assigned", disabled: !canCreateAssigned },
      { value: TASK_TYPE.ROUTINE, label: "Routine", disabled: !canCreateRoutine },
    ],
    [canCreateAssigned, canCreateProject, canCreateRoutine],
  );

  const queryArgs = useMemo(() => {
    const tabConstraints = {};
    if (tab === "Assigned to Me" && userId) {
      tabConstraints.assigneeId = userId;
    }
    if (tab === "Completed") {
      tabConstraints.status = [TASK_STATUS.COMPLETED];
    }

    return {
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
      ...(Array.isArray(filters.type) && filters.type.length
        ? { type: filters.type }
        : {}),
      ...(Array.isArray(filters.status) && filters.status.length
        ? { status: filters.status }
        : {}),
      ...(Array.isArray(filters.priority) && filters.priority.length
        ? { priority: filters.priority }
        : {}),
      ...(showDepartmentFilter && filters.departmentId
        ? { departmentId: filters.departmentId }
        : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.createdById ? { createdById: filters.createdById } : {}),
      ...(filters.watcherId ? { watcherId: filters.watcherId } : {}),
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters.materialId ? { materialId: filters.materialId } : {}),
      ...(filters.startFrom ? { startFrom: filters.startFrom } : {}),
      ...(filters.startTo ? { startTo: filters.startTo } : {}),
      ...(filters.dueFrom ? { dueFrom: filters.dueFrom } : {}),
      ...(filters.dueTo ? { dueTo: filters.dueTo } : {}),
      ...(filters.tags ? { tags: filters.tags } : {}),
      ...tabConstraints,
    };
  }, [
    filters,
    includeDeleted,
    limit,
    page,
    showDepartmentFilter,
    sortBy,
    sortOrder,
    tab,
    userId,
  ]);

  const {
    data: tasksResponse,
    isFetching: isTasksFetching,
    error: tasksError,
  } = useGetTasksQuery(queryArgs);

  const tasksPayload = tasksResponse?.data || {};
  const tasks = tasksPayload.tasks || [];
  const pagination = tasksPayload.pagination || {};
  const currentPage = pagination.page || page;
  const totalPages = pagination.totalPages || 1;

  useEffect(() => {
    if (tasksError) {
      toastApiError(tasksError);
    }
  }, [tasksError]);

  const listForm = useForm({
    defaultValues: {
      ...DEFAULT_FILTERS,
      ...filters,
      includeDeleted,
    },
  });
  const taskForm = useForm({ defaultValues: DEFAULT_FORM_VALUES });

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
    }),
    [],
  );

  const columns = useMemo(
    () =>
      createTasksColumns({
        can,
        formatDateTime,
        navigate,
        openEditDialog: (row) => {
          setEditingTaskId(row.id);
          setTaskType(row.type || TASK_TYPE.PROJECT);
          taskForm.reset(DEFAULT_FORM_VALUES);
          setTaskDialogOpen(true);
        },
        openConfirmDialog: (mode, row) => {
          setConfirmState({ open: true, mode, row });
        },
      }),
    [can, formatDateTime, navigate, taskForm],
  );

  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();
  const [deleteTask, deleteState] = useDeleteTaskMutation();
  const [restoreTask, restoreState] = useRestoreTaskMutation();

  const isMutating =
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading ||
    restoreState.isLoading;

  const openCreateDialog = () => {
    setEditingTaskId(null);
    setTaskType(
      canCreateProject
        ? TASK_TYPE.PROJECT
        : canCreateAssigned
          ? TASK_TYPE.ASSIGNED
          : TASK_TYPE.ROUTINE,
    );
    taskForm.reset(DEFAULT_FORM_VALUES);
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTaskId(null);
  };

  const {
    data: editingTaskResponse,
    isFetching: isEditingTaskFetching,
    error: editingTaskError,
  } = useGetTaskQuery(editingTaskId, {
    skip: !editingTaskId || !taskDialogOpen,
  });

  const editingTask = editingTaskResponse?.data?.task || null;
  const editingInitialMaterials = useMemo(() => {
    const rows = editingTaskResponse?.data?.overviewAggregates?.materials || [];
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((entry) => ({
        materialId: entry?.material?.id || "",
        quantity: Number(entry?.quantity || 0),
      }))
      .filter((entry) => entry.materialId);
  }, [editingTaskResponse]);

  useEffect(() => {
    if (editingTaskError) {
      toastApiError(editingTaskError);
    }
  }, [editingTaskError]);

  useEffect(() => {
    if (!taskDialogOpen || !editingTaskId || !editingTask) {
      return;
    }

    taskForm.reset({
      title: editingTask.title || "",
      description: editingTask.description || "",
      status: editingTask.status || TASK_STATUS.TODO,
      priority: editingTask.priority || TASK_PRIORITY.MEDIUM,
      tags: Array.isArray(editingTask.tags) ? editingTask.tags : [],
      watchers: Array.isArray(editingTask.watchers)
        ? editingTask.watchers.map((entry) => entry.id || entry._id).filter(Boolean)
        : [],
      vendorId: editingTask.vendor?.id || "",
      assigneeIds: Array.isArray(editingTask.assignees)
        ? editingTask.assignees.map((entry) => entry.id || entry._id).filter(Boolean)
        : [],
      startDate: editingTask.startDate ? String(editingTask.startDate).slice(0, 10) : "",
      dueDate: editingTask.dueDate ? String(editingTask.dueDate).slice(0, 10) : "",
      date: editingTask.date ? String(editingTask.date).slice(0, 10) : "",
      materials: editingTask.type === TASK_TYPE.ROUTINE ? editingInitialMaterials : [],
    });
  }, [editingInitialMaterials, editingTask, editingTaskId, taskDialogOpen, taskForm]);

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", row: null });
  };

  const handleDeleteRestore = async () => {
    const row = confirmState.row;
    if (!row?.id) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreTask(row.id).unwrap();
        toast.success("Task restored");
      } else {
        await deleteTask(row.id).unwrap();
        toast.success("Task deleted");
      }
      closeConfirmDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const { data: usersResponse } = useGetUsersQuery(
    { page: 1, limit: 100, includeDeleted: false, includeInactive: false },
    {
      skip: !filterDialogOpen && !taskDialogOpen,
    },
  );
  const { data: vendorsResponse } = useGetVendorsQuery(
    { page: 1, limit: 100, includeDeleted: false, status: "ACTIVE" },
    { skip: !filterDialogOpen && !taskDialogOpen },
  );
  const { data: materialsResponse } = useGetMaterialsQuery(
    { page: 1, limit: 100, includeDeleted: false, status: "ACTIVE" },
    { skip: !filterDialogOpen && !taskDialogOpen },
  );
  const { data: departmentsResponse } = useGetDepartmentsQuery(
    {
      page: 1,
      limit: 100,
      includeDeleted: false,
      sortBy: "name",
      sortOrder: "asc",
    },
    { skip: !filterDialogOpen || !showDepartmentFilter },
  );

  const userOptions = useMemo(() => {
    const users = usersResponse?.data?.users || [];
    return users.map((entry) => ({ value: entry.id, label: entry.fullName }));
  }, [usersResponse]);
  const vendorOptions = useMemo(() => {
    const vendors = vendorsResponse?.data?.vendors || [];
    return vendors.map((entry) => ({ value: entry.id, label: entry.name }));
  }, [vendorsResponse]);
  const materialOptions = useMemo(() => {
    const materials = materialsResponse?.data?.materials || [];
    return materials.map((entry) => ({ value: entry.id, label: entry.name }));
  }, [materialsResponse]);
  const departmentOptions = useMemo(() => {
    const departments = departmentsResponse?.data?.departments || [];
    return departments.map((entry) => ({
      value: entry.id,
      label: capitalizeFirstCharacter(entry.name),
    }));
  }, [departmentsResponse]);

  const handleSubmitTask = async (values) => {
    try {
      const resolvedType = values.type || taskType;
      const payload = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        tags: values.tags || [],
        watchers: values.watchers || [],
        ...(resolvedType === TASK_TYPE.PROJECT
          ? {
              vendorId: values.vendorId,
              startDate: values.startDate,
              dueDate: values.dueDate,
            }
          : {}),
        ...(resolvedType === TASK_TYPE.ASSIGNED
          ? {
              assigneeIds: values.assigneeIds,
              startDate: values.startDate,
              dueDate: values.dueDate,
            }
          : {}),
        ...(resolvedType === TASK_TYPE.ROUTINE
          ? {
              date: values.date,
              materials: values.materials || [],
            }
          : {}),
      };

      if (editingTaskId) {
        await updateTask({ taskId: editingTaskId, body: payload }).unwrap();
        toast.success("Task updated");
      } else {
        await createTask({ ...payload, type: resolvedType }).unwrap();
        toast.success("Task created");
      }

      closeTaskDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  return (
    <Stack spacing={2}>
      <TasksToolbar
        tab={tab}
        onTabChange={(nextTab) => {
          setTab(nextTab);
          applyViewState({ page: 1 });
        }}
        viewMode={resolvedViewMode}
        onViewModeChange={(nextView) => applyViewState({ viewMode: nextView })}
        filterActiveCount={countActiveFilters(filters, includeDeleted)}
        onFilterClick={() => setFilterDialogOpen(true)}
        canCreate={canCreateAny}
        onCreate={openCreateDialog}
      />

      {isGridView ? (
        <TasksGridView
          tasks={tasks}
          columns={columns}
          isLoading={isTasksFetching && !tasksResponse}
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
        <TasksListView
          tasks={tasks}
          isLoading={isTasksFetching && !tasksResponse}
          page={currentPage}
          totalPages={totalPages}
          can={can}
          onPageChange={(nextPage) => applyViewState({ page: nextPage })}
          onView={(row) => navigate(`/dashboard/tasks/${row.id}`)}
          onEdit={(row) => {
            setEditingTaskId(row.id);
            setTaskType(row.type || TASK_TYPE.PROJECT);
            taskForm.reset(DEFAULT_FORM_VALUES);
            setTaskDialogOpen(true);
          }}
          onDelete={(row) => setConfirmState({ open: true, mode: "delete", row })}
          onRestore={(row) =>
            setConfirmState({ open: true, mode: "restore", row })
          }
        />
      )}

      <TaskFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        listForm={listForm}
        userOptions={userOptions}
        vendorOptions={vendorOptions}
        materialOptions={materialOptions}
        departmentOptions={departmentOptions}
        showDepartmentFilter={showDepartmentFilter}
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

      <TaskFormDialog
        open={taskDialogOpen}
        onClose={closeTaskDialog}
        isEditing={Boolean(editingTaskId)}
        taskType={taskType}
        onTaskTypeChange={(nextType) => {
          setTaskType(nextType);
          taskForm.reset({
            ...DEFAULT_FORM_VALUES,
            status: taskForm.getValues("status") || TASK_STATUS.TODO,
            priority: taskForm.getValues("priority") || TASK_PRIORITY.MEDIUM,
          });
        }}
        typeOptions={taskTypeOptions}
        taskForm={taskForm}
        isMutating={isMutating || isEditingTaskFetching}
        onSubmit={handleSubmitTask}
        userOptions={userOptions}
        vendorOptions={vendorOptions}
        materialOptions={materialOptions}
      />

      <MuiDialogConfirm
        open={confirmState.open}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteRestore}
        title={confirmState.mode === "restore" ? "Restore Task" : "Delete Task"}
        message={
          confirmState.mode === "restore"
            ? "Restore this task and related soft-deleted records?"
            : "Soft delete this task and cascade linked records?"
        }
        confirmText={confirmState.mode === "restore" ? "Restore" : "Delete"}
        confirmColor={confirmState.mode === "restore" ? "success" : "error"}
        isLoading={isMutating}
      />
    </Stack>
  );
};

export default TasksPage;
