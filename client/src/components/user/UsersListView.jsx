import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { MuiEmptyState, MuiLoading, MuiPagination } from "../reusable";
import UserListCard from "./UserListCard";

/**
 * Users list-mode renderer (cards + pagination).
 *
 * @param {{
 *   users: Array<Record<string, unknown>>;
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
 * @returns {JSX.Element} Users list view.
 * @throws {never} This component does not throw.
 */
const UsersListView = ({
  users,
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
    return <MuiLoading message="Loading users..." />;
  }

  if (users.length === 0) {
    return (
      <MuiEmptyState
        message="No users found"
        secondaryMessage="Try adjusting filters or create a new user."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {users.map((row) => (
          <Grid key={row.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <UserListCard
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

UsersListView.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object),
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

UsersListView.defaultProps = {
  users: [],
  isLoading: false,
};

export default UsersListView;

