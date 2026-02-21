import { useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import {
  MuiDataGrid,
  MuiEmptyState,
  MuiFilterButton,
  MuiLoading,
  MuiStatCard,
  MuiTimeline,
} from "../reusable";
import {
  createDepartmentMemberColumns,
  createDepartmentTaskColumns,
} from "../columns";
import { useAuthorization, useTimezone } from "../../hooks";

const TOP_LEVEL_TABS = ["Overview", "Members", "Tasks"];
const TASK_SUB_TABS = ["All Activity", "Tasks", "Comments", "Files"];

/**
 * Department details outlet matching overview/members/tasks tab screens.
 *
 * @returns {JSX.Element} Department details page content.
 * @throws {never} This component does not throw.
 */
const DepartmentDetailsPageContent = ({
  department,
  aggregates,
  dashboard,
  members,
  tasks,
  timelineItems,
  isDashboardFetching,
  isMembersFetching,
  isTasksFetching,
  isActivityFetching,
  tab,
  onTabChange,
  tasksSubTab,
  onTasksSubTabChange,
}) => {
  const { can } = useAuthorization();
  const { formatDateTime } = useTimezone();

  const memberColumns = useMemo(
    () => createDepartmentMemberColumns({ formatDateTime }),
    [formatDateTime],
  );
  const taskColumns = useMemo(
    () => createDepartmentTaskColumns({ formatDateTime }),
    [formatDateTime],
  );

  const totalTasks = dashboard.totalTasks ?? aggregates.totalTasks ?? department?.taskCount ?? 0;
  const overdueTasks = dashboard.overdueTasks ?? dashboard.overdueTask ?? aggregates.overdueTasks ?? 0;
  const completedTasks = dashboard.completedTasks ?? aggregates.completedTasks ?? 0;
  const activeTasks = dashboard.activeTasks ?? aggregates.activeTasks ?? department?.activeTaskCount ?? 0;
  const totalUsers = dashboard.totalUsers ?? aggregates.totalUsers ?? department?.memberCount ?? 0;

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
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 1.5,
                  bgcolor: "primary.50",
                  color: "primary.main",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ApartmentRoundedIcon />
              </Box>
              <Stack spacing={0.35}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {department.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`Managed by ${department.manager?.fullName || "N/A"}`} />
                  <Chip size="small" label={`${totalUsers} Total Users`} />
                  <Chip size="small" label={`${activeTasks} Active Tasks`} />
                </Stack>
              </Stack>
            </Stack>

            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              disabled={!can("Task", "create")}
            >
              {tab === "Members" ? "Add User" : "Add New Task"}
            </Button>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_event, nextValue) => onTabChange(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {TOP_LEVEL_TABS.map((entry) => (
              <Tab key={entry} value={entry} label={entry} />
            ))}
          </Tabs>
        </Stack>
      </Paper>

      {tab === "Overview" ? (
        isDashboardFetching ? (
          <MuiLoading message="Loading dashboard metrics..." />
        ) : (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MuiStatCard
                  title="Tasks In Progress"
                  value={activeTasks}
                  icon={<TaskAltOutlinedIcon fontSize="small" />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MuiStatCard title="Overdue Tasks" value={overdueTasks} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MuiStatCard title="Team Velocity" value={dashboard.throughput || completedTasks} subtitle="Points per sprint" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MuiStatCard
                  title="Efficiency"
                  value={`${dashboard.completionRate || 0}%`}
                  subtitle="Goal reached"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 260 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Weekly Task Completion
                  </Typography>
                  {(dashboard.upcomingDeadlines || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No upcoming deadlines in the next 7 days.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {(dashboard.upcomingDeadlines || []).map((item) => (
                        <Typography key={item.id} variant="body2" color="text.secondary">
                          {item.title} | {item.priority} | {formatDateTime(item.dueDate)}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 260 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Active Members
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      View All
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {members.slice(0, 4).map((member) => (
                      <Stack key={member.id} direction="row" spacing={1} alignItems="center">
                        <PeopleAltOutlinedIcon fontSize="small" color="action" />
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {member.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.position || member.role}
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )
      ) : null}

      {tab === "Members" ? (
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="flex-end">
            <MuiFilterButton activeCount={0} />
          </Stack>
          {isMembersFetching ? (
            <MuiLoading message="Loading department members..." />
          ) : members.length === 0 ? (
            <MuiEmptyState
              message="No members found"
              secondaryMessage="This department has no active member records."
            />
          ) : (
            <MuiDataGrid
              autoHeight
              rows={members}
              columns={memberColumns}
              getRowId={(row) => row.id}
              hideFooterPagination
            />
          )}
        </Stack>
      ) : null}

      {tab === "Tasks" ? (
        <Stack spacing={1.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <MuiStatCard title="Total Tasks" value={totalTasks} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MuiStatCard title="Overdue" value={overdueTasks} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MuiStatCard title="Completed" value={completedTasks} />
            </Grid>
          </Grid>

          <Paper variant="outlined">
            <Tabs
              value={tasksSubTab}
              onChange={(_event, nextValue) => onTasksSubTabChange(nextValue)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              {TASK_SUB_TABS.map((entry) => (
                <Tab key={entry} value={entry} label={entry} />
              ))}
            </Tabs>
          </Paper>

          <Stack direction="row" justifyContent="flex-end">
            <MuiFilterButton activeCount={tasksSubTab === "All Activity" ? 0 : 1} />
          </Stack>

          {tasksSubTab === "Tasks" ? (
            isTasksFetching ? (
              <MuiLoading message="Loading department tasks..." />
            ) : tasks.length === 0 ? (
              <MuiEmptyState
                message="No tasks found"
                secondaryMessage="No task records are available for this department."
              />
            ) : (
              <MuiDataGrid
                autoHeight
                rows={tasks}
                columns={taskColumns}
                getRowId={(row) => row.id || row._id}
                hideFooterPagination
              />
            )
          ) : isActivityFetching ? (
            <MuiLoading message={`Loading ${tasksSubTab.toLowerCase()}...`} />
          ) : (
            <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
              <MuiTimeline
                items={timelineItems}
                emptyMessage={`No ${tasksSubTab.toLowerCase()} records found.`}
              />
            </Paper>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
};

DepartmentDetailsPageContent.propTypes = {
  department: PropTypes.object,
  aggregates: PropTypes.object,
  dashboard: PropTypes.object,
  members: PropTypes.arrayOf(PropTypes.object),
  tasks: PropTypes.arrayOf(PropTypes.object),
  timelineItems: PropTypes.arrayOf(PropTypes.object),
  isDashboardFetching: PropTypes.bool,
  isMembersFetching: PropTypes.bool,
  isTasksFetching: PropTypes.bool,
  isActivityFetching: PropTypes.bool,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tasksSubTab: PropTypes.string.isRequired,
  onTasksSubTabChange: PropTypes.func.isRequired,
};

export default DepartmentDetailsPageContent;
