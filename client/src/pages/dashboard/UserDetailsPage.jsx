import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import Stack from "@mui/material/Stack";
import {
  UserActivityTab,
  UserDetailsHeader,
  UserOverviewTab,
  UserPerformanceTab,
  UserTasksTab,
} from "../../components/user";
import { MuiEmptyState, MuiLoading } from "../../components/reusable";
import { useAuthorization, useTimezone } from "../../hooks";
import {
  useGetTasksQuery,
  useGetUserActivityQuery,
  useGetUserPerformanceQuery,
  useGetUserQuery,
} from "../../services/api";
import { PERFORMANCE_RANGES } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

const USER_DETAILS_TABS = Object.freeze([
  "Overview",
  "Tasks",
  "Activity",
  "Performance",
]);
const USER_TASK_SCOPES = Object.freeze(["Assigned", "Created", "Watching"]);
const USER_ACTIVITY_FILTERS = Object.freeze(["All", "Tasks", "Comments", "Files"]);

/**
 * Maps activity filter labels to backend activity entity model.
 *
 * @param {string} filter - UI activity filter.
 * @returns {string} Activity entity model value.
 * @throws {never} This helper does not throw.
 */
const toActivityEntityModel = (filter) => {
  if (filter === "Tasks") return "Task";
  if (filter === "Comments") return "TaskComment";
  if (filter === "Files") return "Attachment";
  return "";
};

/**
 * User details page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} User details page.
 * @throws {never} Component rendering does not throw.
 */
const UserDetailsPage = () => {
  const { userId } = useParams();
  const { can } = useAuthorization();
  const { formatDateTime } = useTimezone();
  const [tab, setTab] = useState(USER_DETAILS_TABS[0]);
  const [taskScope, setTaskScope] = useState(USER_TASK_SCOPES[0]);
  const [activityFilter, setActivityFilter] = useState(USER_ACTIVITY_FILTERS[0]);
  const [performanceRange, setPerformanceRange] = useState(PERFORMANCE_RANGES[1]);

  const {
    data: userResponse,
    isFetching: isUserFetching,
    error: userError,
  } = useGetUserQuery(userId, {
    skip: !userId,
  });
  const {
    data: activityResponse,
    isFetching: isActivityFetching,
    error: activityError,
  } = useGetUserActivityQuery(
    {
      userId,
      query: {
        page: 1,
        limit: 20,
        ...(toActivityEntityModel(activityFilter)
          ? { entityModel: toActivityEntityModel(activityFilter) }
          : {}),
      },
    },
    {
      skip: !userId || (tab !== "Overview" && tab !== "Activity"),
    },
  );
  const {
    data: performanceResponse,
    isFetching: isPerformanceFetching,
    error: performanceError,
  } = useGetUserPerformanceQuery(
    {
      userId,
      query: { range: performanceRange },
    },
    { skip: !userId || tab !== "Performance" },
  );
  const {
    data: tasksResponse,
    isFetching: isTasksFetching,
    error: tasksError,
  } = useGetTasksQuery(
    {
      page: 1,
      limit: 20,
      includeDeleted: false,
      ...(taskScope === "Assigned" ? { assigneeId: userId } : {}),
      ...(taskScope === "Created" ? { createdById: userId } : {}),
      ...(taskScope === "Watching" ? { watcherId: userId } : {}),
    },
    { skip: !userId || tab !== "Tasks" },
  );

  const payload = userResponse?.data || {};
  const user = payload.user || null;
  const overview = payload.overviewAggregates || {};
  const canUpdateUser = Boolean(
    user &&
      can("User", "update", {
        target: {
          id: user.id,
          organization: user.organization?.id,
          department: user.department?.id,
        },
        params: { userId: user.id },
      }),
  );
  const performance = performanceResponse?.data || {};
  const tasks = tasksResponse?.data?.tasks || [];
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
    if (userError) {
      toastApiError(userError);
    }
  }, [userError]);

  useEffect(() => {
    if (activityError && (tab === "Overview" || tab === "Activity")) {
      toastApiError(activityError);
    }
  }, [activityError, tab]);

  useEffect(() => {
    if (performanceError && tab === "Performance") {
      toastApiError(performanceError);
    }
  }, [performanceError, tab]);

  useEffect(() => {
    if (tasksError && tab === "Tasks") {
      toastApiError(tasksError);
    }
  }, [tasksError, tab]);

  if (isUserFetching) {
    return <MuiLoading message="Loading user details..." />;
  }

  if (!user) {
    return (
      <MuiEmptyState
        message="User not found"
        secondaryMessage="The requested user record is unavailable."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <UserDetailsHeader
        user={user}
        tab={tab}
        onTabChange={setTab}
        canUpdateUser={canUpdateUser}
      />

      {tab === "Overview" ? (
        <UserOverviewTab
          user={user}
          overview={overview}
          timelineItems={timelineItems}
          canUpdateUser={canUpdateUser}
        />
      ) : null}

      {tab === "Tasks" ? (
        <UserTasksTab
          tasks={tasks}
          isTasksFetching={isTasksFetching}
          taskScope={taskScope}
          onTaskScopeChange={setTaskScope}
        />
      ) : null}

      {tab === "Activity" ? (
        <UserActivityTab
          isActivityFetching={isActivityFetching}
          activityFilter={activityFilter}
          onActivityFilterChange={setActivityFilter}
          timelineItems={timelineItems}
        />
      ) : null}

      {tab === "Performance" ? (
        <UserPerformanceTab
          performance={performance}
          isPerformanceFetching={isPerformanceFetching}
          performanceRange={performanceRange}
          onPerformanceRangeChange={setPerformanceRange}
        />
      ) : null}
    </Stack>
  );
};

export default UserDetailsPage;
