import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { MuiEmptyState, MuiLoading, MuiPagination } from "../reusable";
import TaskListCard from "./TaskListCard";

/**
 * Tasks list-mode renderer (cards + pagination).
 *
 * @param {{
 *   tasks: Array<Record<string, unknown>>;
 *   isLoading: boolean;
 *   page: number;
 *   totalPages: number;
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   onPageChange: (nextPage: number) => void;
 *   onView: (row: Record<string, unknown>) => void;
 *   onEdit: (row: Record<string, unknown>) => void;
 *   onDelete: (row: Record<string, unknown>) => void;
 *   onRestore: (row: Record<string, unknown>) => void;
 * }} props - Component props.
 * @returns {JSX.Element} Tasks list view.
 * @throws {never} This component does not throw.
 */
const TasksListView = ({
  tasks,
  isLoading,
  page,
  totalPages,
  can,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) => {
  if (isLoading) {
    return <MuiLoading message="Loading tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <MuiEmptyState
        message="No tasks found"
        secondaryMessage="Try adjusting filters or create a new task."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {tasks.map((row) => (
          <Grid key={row.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <TaskListCard
              row={row}
              can={can}
              onView={() => onView(row)}
              onEdit={() => onEdit(row)}
              onDelete={() => onDelete(row)}
              onRestore={() => onRestore(row)}
            />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" justifyContent="center">
        <MuiPagination
          page={page}
          count={totalPages}
          onChange={(_event, nextPage) => onPageChange(nextPage)}
        />
      </Stack>
    </Stack>
  );
};

TasksListView.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  can: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};

TasksListView.defaultProps = {
  tasks: [],
  isLoading: false,
};

export default TasksListView;

