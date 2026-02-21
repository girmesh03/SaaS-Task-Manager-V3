import { useMemo } from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import {
  MuiDataGrid,
  MuiEmptyState,
  MuiFilterButton,
  MuiLoading,
  MuiStatCard,
  MuiTextField,
  MuiTimeline,
} from "../reusable";
import { createUserTaskColumns } from "../columns";
import { useAuthorization, useTimezone } from "../../hooks";
import { PERFORMANCE_RANGES } from "../../utils/constants";

const USER_DETAILS_TABS = ["Overview", "Tasks", "Activity", "Performance"];
const USER_TASK_SCOPES = ["Assigned", "Created", "Watching"];
const USER_ACTIVITY_FILTERS = ["All", "Tasks", "Comments", "Files"];

/**
 * User details outlet matching overview/tasks/activity/performance screens.
 *
 * @returns {JSX.Element} User details page content.
 * @throws {never} This component does not throw.
 */
const UserDetailsPageContent = ({
  user,
  overview,
  performance,
  tasks,
  timelineItems,
  isActivityFetching,
  isTasksFetching,
  isPerformanceFetching,
  tab,
  onTabChange,
  taskScope,
  onTaskScopeChange,
  activityFilter,
  onActivityFilterChange,
  performanceRange,
  onPerformanceRangeChange,
}) => {
  const { can } = useAuthorization();
  const { formatDateTime } = useTimezone();

  const taskColumns = useMemo(
    () => createUserTaskColumns({ formatDateTime }),
    [formatDateTime],
  );

  if (!user) {
    return (
      <MuiEmptyState
        message="User not found"
        secondaryMessage="The requested user record is unavailable."
      />
    );
  }

  const canUpdateUser = can("User", "update", {
    target: {
      id: user.id,
      organization: user.organization?.id,
      department: user.department?.id,
    },
    params: { userId: user.id },
  });

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={user.profilePicture?.url || undefined}
                  alt={user.fullName}
                  sx={{ width: 68, height: 68 }}
                >
                  {String(user.fullName || "U")
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
                    bgcolor: user.status === "ACTIVE" ? "success.main" : "grey.400",
                    border: 2,
                    borderColor: "background.paper",
                  }}
                />
              </Box>
              <Stack spacing={0.35}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {user.fullName}
                  </Typography>
                  <Chip size="small" label={user.position || user.role} color="primary" />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <WorkOutlineOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {user.department?.name || "No Department"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Joined {user.joinedAt ? formatDateTime(user.joinedAt) : "N/A"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>

            <Button
              size="small"
              variant="outlined"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              disabled={!canUpdateUser}
            >
              Edit Profile
            </Button>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_event, nextValue) => onTabChange(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {USER_DETAILS_TABS.map((entry) => (
              <Tab key={entry} value={entry} label={entry} />
            ))}
          </Tabs>
        </Stack>
      </Paper>

      {tab === "Overview" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Personal Information
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<EditOutlinedIcon fontSize="small" />}
                    disabled={!canUpdateUser}
                  >
                    Edit
                  </Button>
                </Stack>
                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MuiTextField
                      label="Full Name"
                      value={user.fullName || ""}
                      startAdornment={<BadgeOutlinedIcon fontSize="small" />}
                      InputProps={{ readOnly: true }}
                      reserveHelperTextSpace={false}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MuiTextField
                      label="Email Address"
                      value={user.email || ""}
                      startAdornment={<MailOutlineOutlinedIcon fontSize="small" />}
                      InputProps={{ readOnly: true }}
                      reserveHelperTextSpace={false}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MuiTextField
                      label="Phone Number"
                      value={user.phone || "N/A"}
                      startAdornment={<PhoneOutlinedIcon fontSize="small" />}
                      InputProps={{ readOnly: true }}
                      reserveHelperTextSpace={false}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MuiTextField
                      label="Role"
                      value={user.role || ""}
                      startAdornment={<WorkOutlineOutlinedIcon fontSize="small" />}
                      InputProps={{ readOnly: true }}
                      reserveHelperTextSpace={false}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Recent Activity
                </Typography>
                <MuiTimeline
                  items={timelineItems.slice(0, 3)}
                  emptyMessage="No recent activity available."
                />
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
                <Grid size={6}>
                  <MuiStatCard title="Total Tasks" value={overview.totalTasks || 0} />
                </Grid>
                <Grid size={6}>
                  <MuiStatCard title="Completed" value={overview.completedTasks || 0} />
                </Grid>
              </Grid>
              <MuiStatCard
                title="Pending Review"
                value={overview.activeTasks || 0}
                subtitle="Open and in-progress tasks"
              />

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Skills
                </Typography>
                {(user.skills || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No skills added yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {(user.skills || []).map((skill) => (
                      <Stack key={skill} spacing={0.4}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {skill}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            100%
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            height: 6,
                            borderRadius: 999,
                            bgcolor: "primary.main",
                          }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      ) : null}

      {tab === "Tasks" ? (
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {USER_TASK_SCOPES.map((entry) => (
                <Chip
                  key={entry}
                  label={entry}
                  size="small"
                  color={taskScope === entry ? "primary" : "default"}
                  onClick={() => onTaskScopeChange(entry)}
                  variant={taskScope === entry ? "filled" : "outlined"}
                />
              ))}
            </Stack>
            <MuiFilterButton activeCount={0} />
          </Stack>

          {isTasksFetching ? (
            <MuiLoading message="Loading user tasks..." />
          ) : tasks.length === 0 ? (
            <MuiEmptyState
              message="No task data"
              secondaryMessage="Task details are loaded from task endpoints when available."
            />
          ) : (
            <MuiDataGrid
              autoHeight
              rows={tasks}
              columns={taskColumns}
              getRowId={(row) => row.id || row._id}
              hideFooterPagination
            />
          )}
        </Stack>
      ) : null}

      {tab === "Activity" ? (
        isActivityFetching ? (
          <MuiLoading message="Loading user activity..." />
        ) : (
          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Recent Activity
              </Typography>
              <MuiTextField
                select
                size="small"
                label="Activity Type"
                value={activityFilter}
                onChange={(event) => onActivityFilterChange(event.target.value)}
                startAdornment={<FilterAltOutlinedIcon fontSize="small" />}
                sx={{ minWidth: 180 }}
                reserveHelperTextSpace={false}
              >
                {USER_ACTIVITY_FILTERS.map((entry) => (
                  <MenuItem key={entry} value={entry}>
                    {entry}
                  </MenuItem>
                ))}
              </MuiTextField>
            </Stack>

            <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
              <MuiTimeline items={timelineItems} emptyMessage="No activity found." />
            </Paper>
          </Stack>
        )
      ) : null}

      {tab === "Performance" ? (
        isPerformanceFetching ? (
          <MuiLoading message="Loading performance metrics..." />
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="flex-end">
              <MuiTextField
                select
                label="Range"
                value={performanceRange}
                onChange={(event) => onPerformanceRangeChange(event.target.value)}
                startAdornment={<InsightsOutlinedIcon fontSize="small" />}
                sx={{ minWidth: 220 }}
                reserveHelperTextSpace={false}
              >
                {PERFORMANCE_RANGES.map((entry) => (
                  <MenuItem key={entry} value={entry}>
                    {entry}
                  </MenuItem>
                ))}
              </MuiTextField>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MuiStatCard title="Completion Rate" value={`${performance.completionRate || 0}%`} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MuiStatCard title="Avg. Task Time" value={`${performance.avgTaskTimeHours || 0}h`} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MuiStatCard title="Tasks Completed" value={performance.throughput || 0} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 220 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Monthly Throughput
                  </Typography>
                  {(performance.series || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No throughput data available.
                    </Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {(performance.series || []).map((entry) => (
                        <Stack key={entry.label} spacing={0.3}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">{entry.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.completed}
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "primary.main",
                              width: `${Math.min((entry.completed || 0) * 10, 100)}%`,
                            }}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 220 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Efficiency vs. Team
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Comparison to department average: {performance.comparisonToDeptAvg || 0}%
                  </Typography>
                  <Box
                    sx={{
                      height: 120,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                    }}
                  >
                    Performance radar visualization placeholder
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )
      ) : null}
    </Stack>
  );
};

UserDetailsPageContent.propTypes = {
  user: PropTypes.object,
  overview: PropTypes.object,
  performance: PropTypes.object,
  tasks: PropTypes.arrayOf(PropTypes.object),
  timelineItems: PropTypes.arrayOf(PropTypes.object),
  isActivityFetching: PropTypes.bool,
  isTasksFetching: PropTypes.bool,
  isPerformanceFetching: PropTypes.bool,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  taskScope: PropTypes.string.isRequired,
  onTaskScopeChange: PropTypes.func.isRequired,
  activityFilter: PropTypes.string.isRequired,
  onActivityFilterChange: PropTypes.func.isRequired,
  performanceRange: PropTypes.string.isRequired,
  onPerformanceRangeChange: PropTypes.func.isRequired,
};

export default UserDetailsPageContent;
