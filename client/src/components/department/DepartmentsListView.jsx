import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import DepartmentListCard from "./DepartmentListCard";
import { MuiEmptyState, MuiLoading, MuiPagination } from "../reusable";

/**
 * Departments list-mode renderer (cards + pagination).
 *
 * @param {{
 *   departments: Array<Record<string, unknown>>;
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
 * @returns {JSX.Element} Departments list view.
 * @throws {never} This component does not throw.
 */
const DepartmentsListView = ({
  departments,
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
    return <MuiLoading message="Loading departments..." />;
  }

  if (departments.length === 0) {
    return (
      <MuiEmptyState
        message="No departments found"
        secondaryMessage="Create a department or adjust filters."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {departments.map((row) => (
          <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <DepartmentListCard
              row={row}
              onView={() => onView(row)}
              onEdit={() => onEdit(row)}
              onDelete={() => onDelete(row)}
              onRestore={() => onRestore(row)}
              canView={can("Department", "read", {
                target: {
                  organization: row.organization?.id,
                  department: row.id,
                },
              })}
              canUpdate={can("Department", "update", {
                target: {
                  organization: row.organization?.id,
                  department: row.id,
                },
              })}
              canDelete={can("Department", "delete", {
                target: {
                  organization: row.organization?.id,
                  department: row.id,
                },
              })}
              canRestore={can("Department", "delete", {
                target: {
                  organization: row.organization?.id,
                  department: row.id,
                },
              })}
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

DepartmentsListView.propTypes = {
  departments: PropTypes.arrayOf(PropTypes.object),
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

DepartmentsListView.defaultProps = {
  departments: [],
  isLoading: false,
};

export default DepartmentsListView;

