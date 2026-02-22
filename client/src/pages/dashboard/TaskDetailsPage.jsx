import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import { toast } from "react-toastify";
import {
  TaskActivitiesTab,
  TaskCommentsTab,
  TaskDetailsHeader,
  TaskFilesTab,
  TaskFormDialog,
  TaskOverviewTab,
  useTaskRealtime,
} from "../../components/task";
import { MuiDialogConfirm, MuiEmptyState, MuiLoading } from "../../components/reusable";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  useDeleteTaskMutation,
  useGetMaterialsQuery,
  useGetTaskActivitiesQuery,
  useGetTaskQuery,
  useGetUsersQuery,
  useGetVendorsQuery,
  useRestoreTaskMutation,
  useUpdateTaskMutation,
} from "../../services/api";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
} from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

/**
 * Task details page container (query orchestration + tabs).
 *
 * @returns {JSX.Element} Task details page.
 * @throws {never} This component does not throw.
 */
const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const { can } = useAuthorization();
  const { formatDateTime } = useTimezone();

  const [tab, setTab] = useState("Overview");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState(TASK_TYPE.PROJECT);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
  });

  const DEFAULT_FORM_VALUES = useMemo(
    () => ({
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
    }),
    [],
  );

  const taskForm = useForm({ defaultValues: DEFAULT_FORM_VALUES });

  const {
    data: taskResponse,
    isFetching: isTaskFetching,
    error: taskError,
    refetch: refetchTask,
  } = useGetTaskQuery(taskId, { skip: !taskId });

  const task = taskResponse?.data?.task || null;
  const overview = taskResponse?.data?.overviewAggregates || {};
  const files = taskResponse?.data?.files || [];

  useTaskRealtime({ taskId: task?.id || taskId });

  const shouldLoadActivity = tab === "Overview" || tab === "Activities";
  const {
    data: activitiesResponse,
    isFetching: isActivitiesFetching,
    error: activitiesError,
  } = useGetTaskActivitiesQuery(
    { taskId, query: { page: 1, limit: 50, includeDeleted: false } },
    { skip: !taskId || !shouldLoadActivity },
  );

  const activities = useMemo(
    () => activitiesResponse?.data?.activities || [],
    [activitiesResponse],
  );

  const statusHistoryItems = useMemo(() => {
    const history = (Array.isArray(activities) ? activities : [])
      .filter((entry) => {
        const activityText = String(entry?.activity || "").toLowerCase();
        return (
          activityText.includes("status changed") ||
          activityText.includes("priority changed") ||
          activityText.includes("task created")
        );
      })
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        title: String(entry.activity || "Update"),
        subtitle: entry.createdBy?.fullName ? `by ${entry.createdBy.fullName}` : "",
        timestamp: entry.createdAt ? formatDateTime(entry.createdAt) : "",
        color: "info",
        variant: "outlined",
      }));

    return history;
  }, [activities, formatDateTime]);

  const canEdit = Boolean(
    task &&
      can("Task", "update", {
        resourceType: task.type,
        target: task,
        params: { taskId: task.id },
      }),
  );

  const canDelete = Boolean(
    task &&
      can("Task", "delete", {
        resourceType: task.type,
        target: task,
        params: { taskId: task.id },
      }),
  );

  const canRestore = canDelete;

  const canCreateActivity = Boolean(
    task &&
      can("TaskActivity", "create", {
        target: task,
        params: { taskId: task.id },
      }),
  );

  const [updateTask, updateState] = useUpdateTaskMutation();
  const [deleteTask, deleteState] = useDeleteTaskMutation();
  const [restoreTask, restoreState] = useRestoreTaskMutation();

  const isMutating =
    updateState.isLoading || deleteState.isLoading || restoreState.isLoading;

  useEffect(() => {
    if (taskError) {
      toastApiError(taskError);
    }
  }, [taskError]);

  useEffect(() => {
    if (activitiesError && shouldLoadActivity) {
      toastApiError(activitiesError);
    }
  }, [activitiesError, shouldLoadActivity]);

  const { data: usersResponse } = useGetUsersQuery(
    { page: 1, limit: 100, includeDeleted: false, includeInactive: false },
    {
      skip: !taskDialogOpen,
    },
  );
  const { data: vendorsResponse } = useGetVendorsQuery(
    { page: 1, limit: 100, includeDeleted: false, status: "ACTIVE" },
    { skip: !taskDialogOpen },
  );
  const { data: materialsResponse } = useGetMaterialsQuery(
    { page: 1, limit: 100, includeDeleted: false, status: "ACTIVE" },
    { skip: !taskDialogOpen },
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

  const openEditDialog = () => {
    if (!task) return;

    setTaskType(task.type || TASK_TYPE.PROJECT);
    taskForm.reset({
      ...DEFAULT_FORM_VALUES,
      title: task.title || "",
      description: task.description || "",
      status: task.status || TASK_STATUS.TODO,
      priority: task.priority || TASK_PRIORITY.MEDIUM,
      tags: Array.isArray(task.tags) ? task.tags : [],
      watchers: Array.isArray(task.watchers) ? task.watchers.map((entry) => entry.id) : [],
      vendorId: task.vendor?.id || "",
      assigneeIds: Array.isArray(task.assignees) ? task.assignees.map((entry) => entry.id) : [],
      startDate: task.startDate ? String(task.startDate).slice(0, 10) : "",
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      date: task.date ? String(task.date).slice(0, 10) : "",
      materials:
        task.type === TASK_TYPE.ROUTINE && Array.isArray(overview.materials)
          ? overview.materials
              .map((entry) => ({
                materialId: entry?.material?.id || "",
                quantity: Number(entry?.quantity || 0),
              }))
              .filter((entry) => entry.materialId)
          : [],
    });
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
  };

  const handleSubmitTask = async (values) => {
    if (!task) return;

    try {
      const resolvedType = taskType || task.type;
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

      await updateTask({ taskId: task.id, body: payload }).unwrap();
      toast.success("Task updated");
      closeTaskDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete" });
  };

  const handleDeleteRestore = async () => {
    if (!task) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreTask(task.id).unwrap();
        toast.success("Task restored");
      } else {
        await deleteTask(task.id).unwrap();
        toast.success("Task deleted");
      }
      closeConfirmDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.info("Copy this URL from your browser address bar.");
    }
  };

  if (isTaskFetching && !taskResponse) {
    return <MuiLoading message="Loading task details..." />;
  }

  if (!task) {
    return (
      <MuiEmptyState
        message="Task not found"
        secondaryMessage="The requested task record is unavailable."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <TaskDetailsHeader
        task={task}
        tab={tab}
        onTabChange={setTab}
        canEdit={canEdit && !task.isDeleted}
        canDelete={canDelete && !task.isDeleted}
        canRestore={canRestore && task.isDeleted}
        onShare={handleShare}
        onEdit={openEditDialog}
        onDelete={() => setConfirmState({ open: true, mode: "delete" })}
        onRestore={() => setConfirmState({ open: true, mode: "restore" })}
      />

      {tab === "Overview" ? (
        <TaskOverviewTab
          task={task}
          overview={overview}
          statusHistoryItems={statusHistoryItems}
        />
      ) : null}

      {tab === "Activities" ? (
        <TaskActivitiesTab
          taskId={task.id}
          taskType={task.type}
          activities={activities}
          isLoading={isActivitiesFetching && !activitiesResponse}
          canCreateActivity={canCreateActivity}
        />
      ) : null}

      {tab === "Comments" ? <TaskCommentsTab taskId={task.id} /> : null}

      {tab === "Files" ? (
        <TaskFilesTab
          taskId={task.id}
          files={files}
          isLoading={isTaskFetching && !taskResponse}
          isTaskDeleted={Boolean(task.isDeleted)}
          onRefresh={refetchTask}
        />
      ) : null}

      <TaskFormDialog
        open={taskDialogOpen}
        onClose={closeTaskDialog}
        isEditing
        taskType={taskType}
        onTaskTypeChange={() => undefined}
        typeOptions={null}
        taskForm={taskForm}
        isMutating={isMutating}
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

export default TaskDetailsPage;
