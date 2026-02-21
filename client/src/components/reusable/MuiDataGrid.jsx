import { forwardRef, useCallback, useMemo, useState } from "react";
import autoTable from "jspdf-autotable";
import Box from "@mui/material/Box";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import jsPDF from "jspdf";
import MuiEmptyState from "./MuiEmptyState";
import MuiLoading from "./MuiLoading";

/**
 * Returns row id fallback when getRowId is not provided.
 *
 * @param {Record<string, unknown>} row - Grid row.
 * @returns {string | number | undefined} Resolved row id.
 * @throws {never} This helper does not throw.
 */
const defaultGetRowId = (row) => row?.id || row?._id;

/**
 * Converts row selection model to plain array of ids.
 *
 * @param {unknown} selectionModel - Data-grid selection model.
 * @returns {Array<string | number>} Selected row ids.
 * @throws {never} This helper does not throw.
 */
const toSelectedIds = (selectionModel) => {
  if (!selectionModel) {
    return [];
  }

  if (Array.isArray(selectionModel)) {
    return selectionModel;
  }

  if (selectionModel.ids && typeof selectionModel.ids.values === "function") {
    return Array.from(selectionModel.ids.values());
  }

  return [];
};

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
      getRowId = defaultGetRowId,
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
      loadingMessage = "Loading records...",
      emptyStateMessage = "No records found",
      emptyStateSecondaryMessage = "Adjust filters or create a new record.",
      emptyStateSx,
      sx,
      rowSelectionModel: controlledRowSelectionModel,
      onRowSelectionModelChange,
      exportFileName = "report",
      enableSelectionExport = false,
      ...muiProps
    },
    ref
  ) => {
    const apiRef = useGridApiRef();
    const [internalRowSelectionModel, setInternalRowSelectionModel] =
      useState(() => ({ type: "include", ids: new Set() }));

    const activeRowSelectionModel =
      controlledRowSelectionModel || internalRowSelectionModel;
    const selectedRowIds = useMemo(
      () => toSelectedIds(activeRowSelectionModel),
      [activeRowSelectionModel]
    );

    const rowLookup = useMemo(() => {
      return rows.reduce((lookup, row) => {
        const rowId = getRowId(row);
        if (rowId !== undefined && rowId !== null) {
          lookup.set(String(rowId), row);
        }
        return lookup;
      }, new Map());
    }, [getRowId, rows]);

    const exportableColumns = useMemo(() => {
      return columns.filter(
        (column) =>
          Boolean(column?.field) &&
          column.field !== "actions" &&
          column.field !== "__check__" &&
          column.field !== "__detail_panel_toggle__" &&
          column.disableExport !== true
      );
    }, [columns]);

    const rowsToExport = useMemo(() => {
      return selectedRowIds.filter(
        (rowId) => rowId !== undefined && rowId !== null
      );
    }, [selectedRowIds]);

    const handleRowSelectionChange = useCallback(
      (nextModel, details) => {
        if (!controlledRowSelectionModel) {
          setInternalRowSelectionModel(nextModel);
        }

        onRowSelectionModelChange?.(nextModel, details);
      },
      [controlledRowSelectionModel, onRowSelectionModelChange]
    );

    const handleExportPdf = useCallback(() => {
      if (!rowsToExport.length) {
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const head = [exportableColumns.map((column) => column.headerName || column.field)];
      const body = rowsToExport.map((rowId) => {
        return exportableColumns.map((column) => {
          const cellParams = apiRef.current?.getCellParams?.(rowId, column.field);
          const fallbackRow = rowLookup.get(String(rowId)) || {};
          const rawValue =
            cellParams?.formattedValue ??
            cellParams?.value ??
            fallbackRow[column.field];
          return rawValue === null || rawValue === undefined ? "" : String(rawValue);
        });
      });

      doc.setFontSize(12);
      doc.text("Selected Rows Report", 40, 40);

      autoTable(doc, {
        startY: 58,
        head,
        body,
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
        },
      });

      doc.save(`${exportFileName}.pdf`);
    }, [apiRef, exportFileName, exportableColumns, rowLookup, rowsToExport]);

    const LoadingOverlayComponent = useMemo(
      () =>
        function LoadingOverlay() {
          return <MuiLoading message={loadingMessage} />;
        },
      [loadingMessage]
    );

    const NoRowsOverlayComponent = useMemo(
      () =>
        function NoRowsOverlay() {
          return (
            <MuiEmptyState
              message={emptyStateMessage}
              secondaryMessage={emptyStateSecondaryMessage}
              sx={{ minHeight: 220, ...emptyStateSx }}
            />
          );
        },
      [emptyStateMessage, emptyStateSecondaryMessage, emptyStateSx]
    );

    const resolvedSlots = useMemo(() => {
      const nextSlots = {
        noRowsOverlay: NoRowsOverlayComponent,
        noResultsOverlay: NoRowsOverlayComponent,
        loadingOverlay: LoadingOverlayComponent,
      };

      if (toolbar) {
        nextSlots.toolbar = toolbar;
      }

      return {
        ...nextSlots,
        ...(muiProps.slots || {}),
      };
    }, [LoadingOverlayComponent, NoRowsOverlayComponent, muiProps.slots, toolbar]);

    const resolvedSlotProps = useMemo(() => {
      const toolbarSlotProps = slotProps?.toolbar || {};
      const selectedIdSet = new Set(rowsToExport);

      return {
        ...(slotProps || {}),
        toolbar: {
          ...toolbarSlotProps,
          selectedRowCount: rowsToExport.length,
          onExportPdf: handleExportPdf,
          csvExportOptions: {
            ...(toolbarSlotProps.csvExportOptions || {}),
            fileName: exportFileName,
            getRowsToExport: () => rowsToExport,
          },
          printExportOptions: {
            ...(toolbarSlotProps.printExportOptions || {}),
            fileName: exportFileName,
            getRowsToExport: () => rowsToExport,
          },
          selectedRowIds: selectedIdSet,
        },
      };
    }, [exportFileName, handleExportPdf, rowsToExport, slotProps]);

    return (
      <Box
        sx={[
          {
            width: "100%",
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeader": {
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-row": {
              alignItems: "center",
            },
          },
          sx,
        ]}
      >
        <DataGrid
          ref={ref}
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          checkboxSelection={checkboxSelection || enableSelectionExport}
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
          rowSelectionModel={activeRowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          slots={resolvedSlots}
          slotProps={resolvedSlotProps}
          {...muiProps}
        />
      </Box>
    );
  }
);

MuiDataGrid.displayName = "MuiDataGrid";

export default MuiDataGrid;
