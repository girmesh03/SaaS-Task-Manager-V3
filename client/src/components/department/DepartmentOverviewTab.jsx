import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import { MuiLoading, MuiStatCard } from "../reusable";
import { useTimezone } from "../../hooks";

/**
 * Department details Overview tab.
 *
 * @param {{
 *   isDashboardFetching: boolean;
 *   dashboard: Record<string, unknown>;
 *   members: Array<Record<string, unknown>>;
 *   activeTasks: number;
 *   overdueTasks: number;
 *   completedTasks: number;
 * }} props - Component props.
 * @returns {JSX.Element} Department overview tab.
 * @throws {never} This component does not throw.
 */
const DepartmentOverviewTab = ({
  isDashboardFetching,
  dashboard,
  members,
  activeTasks,
  overdueTasks,
  completedTasks,
}) => {
  const { formatDateTime } = useTimezone();

  if (isDashboardFetching) {
    return <MuiLoading message="Loading dashboard metrics..." />;
  }

  return (
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
          <MuiStatCard
            title="Team Velocity"
            value={dashboard.throughput || completedTasks}
            subtitle="Points per sprint"
          />
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
                <Stack
                  key={member.id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
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
  );
};

DepartmentOverviewTab.propTypes = {
  isDashboardFetching: PropTypes.bool,
  dashboard: PropTypes.object,
  members: PropTypes.arrayOf(PropTypes.object),
  activeTasks: PropTypes.number.isRequired,
  overdueTasks: PropTypes.number.isRequired,
  completedTasks: PropTypes.number.isRequired,
};

DepartmentOverviewTab.defaultProps = {
  isDashboardFetching: false,
  dashboard: {},
  members: [],
};

export default DepartmentOverviewTab;

