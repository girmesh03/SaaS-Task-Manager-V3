import { useMemo } from "react";
import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { MuiDataGrid, MuiEmptyState, MuiFilterButton, MuiLoading } from "../reusable";
import { createUserTaskColumns } from "../columns";
import { useTimezone } from "../../hooks";

const USER_TASK_SCOPES = ["Assigned", "Created", "Watching"];

/**
 * User details Tasks tab.
 *
 * @param {{
 *   tasks: Array<Record<string, unknown>>;
 *   isTasksFetching: boolean;
 *   taskScope: string;
 *   onTaskScopeChange: (value: string) => void;
 * }} props - Component props.
 * @returns {JSX.Element} User tasks tab.
 * @throws {never} This component does not throw.
 */
const UserTasksTab = ({ tasks, isTasksFetching, taskScope, onTaskScopeChange }) => {
  const { formatDateTime } = useTimezone();
  const taskColumns = useMemo(
    () => createUserTaskColumns({ formatDateTime }),
    [formatDateTime],
  );

  return (
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
  );
};

UserTasksTab.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object),
  isTasksFetching: PropTypes.bool,
  taskScope: PropTypes.string.isRequired,
  onTaskScopeChange: PropTypes.func.isRequired,
};

UserTasksTab.defaultProps = {
  tasks: [],
  isTasksFetching: false,
};

export default UserTasksTab;

