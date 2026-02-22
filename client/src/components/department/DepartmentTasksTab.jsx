import { useMemo } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { MuiDataGrid, MuiEmptyState, MuiFilterButton, MuiLoading, MuiStatCard, MuiTimeline } from "../reusable";
import { createDepartmentTaskColumns } from "../columns";
import { useTimezone } from "../../hooks";

const TASK_SUB_TABS = ["All Activity", "Tasks", "Comments", "Files"];

/**
 * Department details Tasks tab.
 *
 * @param {{
 *   tasksSubTab: string;
 *   onTasksSubTabChange: (value: string) => void;
 *   isTasksFetching: boolean;
 *   isActivityFetching: boolean;
 *   tasks: Array<Record<string, unknown>>;
 *   timelineItems: Array<Record<string, unknown>>;
 *   totalTasks: number;
 *   overdueTasks: number;
 *   completedTasks: number;
 * }} props - Component props.
 * @returns {JSX.Element} Tasks tab.
 * @throws {never} This component does not throw.
 */
const DepartmentTasksTab = ({
  tasksSubTab,
  onTasksSubTabChange,
  isTasksFetching,
  isActivityFetching,
  tasks,
  timelineItems,
  totalTasks,
  overdueTasks,
  completedTasks,
}) => {
  const { formatDateTime } = useTimezone();
  const taskColumns = useMemo(
    () => createDepartmentTaskColumns({ formatDateTime }),
    [formatDateTime],
  );

  return (
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
  );
};

DepartmentTasksTab.propTypes = {
  tasksSubTab: PropTypes.string.isRequired,
  onTasksSubTabChange: PropTypes.func.isRequired,
  isTasksFetching: PropTypes.bool,
  isActivityFetching: PropTypes.bool,
  tasks: PropTypes.arrayOf(PropTypes.object),
  timelineItems: PropTypes.arrayOf(PropTypes.object),
  totalTasks: PropTypes.number.isRequired,
  overdueTasks: PropTypes.number.isRequired,
  completedTasks: PropTypes.number.isRequired,
};

DepartmentTasksTab.defaultProps = {
  isTasksFetching: false,
  isActivityFetching: false,
  tasks: [],
  timelineItems: [],
};

export default DepartmentTasksTab;

