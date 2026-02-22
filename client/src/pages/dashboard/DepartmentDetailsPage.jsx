import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import Stack from "@mui/material/Stack";
import {
  DepartmentDetailsHeader,
  DepartmentMembersTab,
  DepartmentOverviewTab,
  DepartmentTasksTab,
} from "../../components/department";
import { MuiEmptyState, MuiLoading } from "../../components/reusable";
import { useTimezone } from "../../hooks";
import {
  useGetDepartmentActivityQuery,
  useGetDepartmentDashboardQuery,
  useGetDepartmentQuery,
  useGetTasksQuery,
  useGetUsersQuery,
} from "../../services/api";
import { toastApiError } from "../../utils/errorHandling";

const TOP_LEVEL_TABS = Object.freeze(["Overview", "Members", "Tasks"]);
const TASK_SUB_TABS = Object.freeze(["All Activity", "Tasks", "Comments", "Files"]);

/**
 * Maps tab labels to activity entity model.
 *
 * @param {string} subTab - Selected task sub-tab.
 * @returns {string} Activity entity model.
 * @throws {never} This helper does not throw.
 */
const mapEntityModel = (subTab) => {
  if (subTab === "Tasks") return "Task";
  if (subTab === "Comments") return "TaskComment";
  if (subTab === "Files") return "Attachment";
  return "";
};

/**
 * Department details page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} Department details page.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentDetailsPage = () => {
  const { departmentId } = useParams();
  const { formatDateTime } = useTimezone();
  const [tab, setTab] = useState(TOP_LEVEL_TABS[0]);
  const [tasksSubTab, setTasksSubTab] = useState(TASK_SUB_TABS[0]);

  const {
    data: departmentResponse,
    isFetching: isDepartmentFetching,
    error: departmentError,
  } = useGetDepartmentQuery(departmentId, {
    skip: !departmentId,
  });
  const {
    data: dashboardResponse,
    isFetching: isDashboardFetching,
    error: dashboardError,
  } = useGetDepartmentDashboardQuery(departmentId, {
    skip: !departmentId || tab !== "Overview",
  });
  const {
    data: membersResponse,
    isFetching: isMembersFetching,
    error: membersError,
  } = useGetUsersQuery(
    {
      page: 1,
      limit: 50,
      departmentId,
      includeDeleted: false,
      includeInactive: true,
    },
    {
      skip: !departmentId,
    },
  );
  const {
    data: activityResponse,
    isFetching: isActivityFetching,
    error: activityError,
  } = useGetDepartmentActivityQuery(
    {
      departmentId,
      query: {
        page: 1,
        limit: 30,
        ...(mapEntityModel(tasksSubTab)
          ? { entityModel: mapEntityModel(tasksSubTab) }
          : {}),
      },
    },
    {
      skip: !departmentId || tab !== "Tasks",
    },
  );
  const {
    data: tasksResponse,
    isFetching: isTasksFetching,
    error: tasksError,
  } = useGetTasksQuery(
    {
      page: 1,
      limit: 30,
      departmentId,
      includeDeleted: false,
    },
    {
      skip: !departmentId || tab !== "Tasks" || tasksSubTab !== "Tasks",
    },
  );

  const payload = departmentResponse?.data || {};
  const department = payload.department || null;
  const aggregates = payload.aggregates || {};
  const dashboard = dashboardResponse?.data || {};
  const members = membersResponse?.data?.users || [];
  const tasks = tasksResponse?.data?.tasks || [];
  const totalTasks =
    dashboard.totalTasks ?? aggregates.totalTasks ?? department?.taskCount ?? 0;
  const overdueTasks =
    dashboard.overdueTasks ??
    dashboard.overdueTask ??
    aggregates.overdueTasks ??
    0;
  const completedTasks =
    dashboard.completedTasks ?? aggregates.completedTasks ?? 0;
  const activeTasks =
    dashboard.activeTasks ??
    aggregates.activeTasks ??
    department?.activeTaskCount ??
    0;
  const totalUsers =
    dashboard.totalUsers ?? aggregates.totalUsers ?? department?.memberCount ?? 0;
  const timelineItems = useMemo(
    () =>
      (activityResponse?.data?.activities || []).map((item) => ({
        id: item.id,
        title: item.title || item.entityModel || "Activity",
        description: item.description || "",
        subtitle: item.meta || "",
        timestamp: item.createdAt ? formatDateTime(item.createdAt) : "",
      })),
    [activityResponse?.data?.activities, formatDateTime],
  );

  useEffect(() => {
    if (departmentError) {
      toastApiError(departmentError);
    }
  }, [departmentError]);

  useEffect(() => {
    if (dashboardError && tab === "Overview") {
      toastApiError(dashboardError);
    }
  }, [dashboardError, tab]);

  useEffect(() => {
    if (membersError) {
      toastApiError(membersError);
    }
  }, [membersError]);

  useEffect(() => {
    if (activityError && tab === "Tasks") {
      toastApiError(activityError);
    }
  }, [activityError, tab]);

  useEffect(() => {
    if (tasksError && tab === "Tasks" && tasksSubTab === "Tasks") {
      toastApiError(tasksError);
    }
  }, [tasksError, tab, tasksSubTab]);

  if (isDepartmentFetching) {
    return <MuiLoading message="Loading department details..." />;
  }

  if (!department) {
    return (
      <MuiEmptyState
        message="Department not found"
        secondaryMessage="The requested department is unavailable."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <DepartmentDetailsHeader
        department={department}
        tab={tab}
        onTabChange={setTab}
        totalUsers={totalUsers}
        activeTasks={activeTasks}
      />

      {tab === "Overview" ? (
        <DepartmentOverviewTab
          isDashboardFetching={isDashboardFetching}
          dashboard={dashboard}
          members={members}
          activeTasks={activeTasks}
          overdueTasks={overdueTasks}
          completedTasks={completedTasks}
        />
      ) : null}

      {tab === "Members" ? (
        <DepartmentMembersTab
          members={members}
          isMembersFetching={isMembersFetching}
        />
      ) : null}

      {tab === "Tasks" ? (
        <DepartmentTasksTab
          tasksSubTab={tasksSubTab}
          onTasksSubTabChange={setTasksSubTab}
          isTasksFetching={isTasksFetching}
          isActivityFetching={isActivityFetching}
          tasks={tasks}
          timelineItems={timelineItems}
          totalTasks={totalTasks}
          overdueTasks={overdueTasks}
          completedTasks={completedTasks}
        />
      ) : null}
    </Stack>
  );
};

export default DepartmentDetailsPage;
