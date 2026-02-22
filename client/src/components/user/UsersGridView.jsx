import PropTypes from "prop-types";
import { MuiDataGrid, MuiDataGridToolbar } from "../reusable";

/**
 * Users grid-mode renderer (DataGrid + server pagination/sorting).
 *
 * @param {{
 *   users: Array<Record<string, unknown>>;
 *   columns: import("@mui/x-data-grid").GridColDef[];
 *   isLoading: boolean;
 *   rowCount: number;
 *   paginationModel: { page: number; pageSize: number };
 *   onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
 *   sortModel: Array<{ field: string; sort: "asc" | "desc" }>;
 *   onSortModelChange: (model: Array<{ field: string; sort: "asc" | "desc" }>) => void;
 *   toolbarProps?: Record<string, unknown>;
 * }} props - Component props.
 * @returns {JSX.Element} Users grid view.
 * @throws {never} This component does not throw.
 */
const UsersGridView = ({
  users,
  columns,
  isLoading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  toolbarProps,
}) => {
  return (
    <MuiDataGrid
      autoHeight
      rows={users}
      columns={columns}
      getRowId={(row) => row.id}
      enableSelectionExport
      rowCount={rowCount}
      pagination
      pageSizeOptions={[10, 20, 50]}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      slots={{ toolbar: MuiDataGridToolbar }}
      slotProps={{
        toolbar: toolbarProps,
      }}
      showToolbar
      loading={isLoading}
      loadingMessage="Loading users..."
      emptyStateMessage="No users found"
      emptyStateSecondaryMessage="Try adjusting filters or create a new user."
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        "& .MuiDataGrid-columnHeaders": {
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "text.secondary",
            fontWeight: 700,
          },
        },
        "& .MuiDataGrid-cell": {
          borderColor: "divider",
        },
        "& .MuiDataGrid-row": {
          maxHeight: "none !important",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: 1,
          borderColor: "divider",
        },
      }}
      rowHeight={72}
      columnHeaderHeight={52}
    />
  );
};

UsersGridView.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  rowCount: PropTypes.number,
  paginationModel: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
  }).isRequired,
  onPaginationModelChange: PropTypes.func.isRequired,
  sortModel: PropTypes.array.isRequired,
  onSortModelChange: PropTypes.func.isRequired,
  toolbarProps: PropTypes.object,
};

UsersGridView.defaultProps = {
  users: [],
  isLoading: false,
  rowCount: 0,
  toolbarProps: null,
};

export default UsersGridView;

