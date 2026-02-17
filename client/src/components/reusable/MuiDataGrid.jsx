import { forwardRef } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import MuiEmptyState from "./MuiEmptyState";

/**
 * DataGrid no-rows overlay content.
 *
 * @returns {JSX.Element} Empty-state overlay element.
 * @throws {never} This component does not throw.
 */
const NoRowsOverlay = () => (
  <MuiEmptyState
    message="No records found"
    secondaryMessage="Adjust filters or create a new record."
    sx={{ minHeight: 220 }}
  />
);

/**
 * Wrapper around MUI X DataGrid with canonical defaults.
 *
 * @param {Record<string, unknown>} props - Data grid props.
 * @returns {JSX.Element} Wrapped data-grid element.
 * @throws {never} This component does not throw.
 */
const MuiDataGrid = forwardRef(
  (
    {
      rows = [],
      columns = [],
      loading = false,
      getRowId,
      checkboxSelection = false,
      disableRowSelectionOnClick = true,
      pageSizeOptions = [10, 20, 50, 100],
      paginationModel,
      onPaginationModelChange,
      paginationMode = "server",
      rowCount,
      sortModel,
      onSortModelChange,
      sortingMode = "server",
      density = "standard",
      disableColumnMenu = false,
      autoHeight = false,
      toolbar,
      slotProps,
      sx,
      ...muiProps
    },
    ref
  ) => {
    const resolvedSlots = {
      noRowsOverlay: NoRowsOverlay,
      toolbar,
      ...(muiProps.slots || {}),
    };

    return (
      <Box sx={{ width: "100%", ...sx }}>
        <DataGrid
          ref={ref}
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          pageSizeOptions={pageSizeOptions}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          paginationMode={paginationMode}
          rowCount={rowCount}
          sortModel={sortModel}
          onSortModelChange={onSortModelChange}
          sortingMode={sortingMode}
          density={density}
          disableColumnMenu={disableColumnMenu}
          autoHeight={autoHeight}
          slots={resolvedSlots}
          slotProps={slotProps}
          {...muiProps}
        />
      </Box>
    );
  }
);

MuiDataGrid.displayName = "MuiDataGrid";

export default MuiDataGrid;
