import { memo, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import {
  ColumnsPanelTrigger,
  ExportCsv,
  ExportPrint,
  FilterPanelTrigger,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";
import MuiSelectAutocomplete from "./MuiSelectAutocomplete";

/**
 * DataGrid toolbar slot component using MUI X v8 toolbar primitives.
 *
 * @param {Record<string, unknown>} props - Toolbar slot props.
 * @returns {JSX.Element} Toolbar slot component.
 * @throws {never} This component does not throw.
 */
const MuiDataGridToolbar = ({
  onFilterClick,
  filterLabel = "Filter",
  columnsLabel = "Columns",
  exportCsvLabel = "Export CSV",
  exportPdfLabel = "Export PDF",
  printLabel = "Print",
  departmentFilterEnabled = false,
  departmentFilterValue = "",
  departmentFilterOptions = [],
  onDepartmentFilterChange,
  departmentFilterInitialValue = "",
  departmentFilterLoading = false,
  departmentFilterPage = 1,
  departmentFilterTotalPages = 1,
  onDepartmentFilterPageChange,
  onDepartmentFilterOpen,
  selectedRowCount = 0,
  csvExportOptions,
  printExportOptions,
  onExportPdf,
  startActions,
  endActions,
  showQuickFilter = false,
  quickFilterPlaceholder = "Filter rows",
}) => {
  const hasSelectableRows = Number(selectedRowCount || 0) > 0;
  const [isDepartmentSelectorOpen, setIsDepartmentSelectorOpen] = useState(false);
  const selectedDepartmentLabel = useMemo(() => {
    if (!departmentFilterValue) {
      return departmentFilterInitialValue || "Select department";
    }

    const option = (departmentFilterOptions || []).find(
      (entry) => String(entry.value) === String(departmentFilterValue)
    );
    return (
      option?.name ||
      option?.label ||
      departmentFilterInitialValue ||
      "Select department"
    );
  }, [departmentFilterInitialValue, departmentFilterOptions, departmentFilterValue]);

  return (
    <Toolbar>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          flexWrap: "wrap",
          py: 0.5,
        }}
      >
        {startActions}

        {departmentFilterEnabled ? (
          isDepartmentSelectorOpen ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <MuiSelectAutocomplete
                value={departmentFilterValue}
                onOpen={() => onDepartmentFilterOpen?.()}
                onClose={() => setIsDepartmentSelectorOpen(false)}
                onChange={(_event, value) => {
                  onDepartmentFilterChange?.(value || "");
                }}
                options={departmentFilterOptions}
                valueMode="id"
                placeholder="Select department"
                isLoading={departmentFilterLoading}
                fullWidth={false}
                showSelectionChip={false}
                sx={{ width: { xs: 190, sm: 250 } }}
              />
              {departmentFilterTotalPages > 1 ? (
                <Pagination
                  size="small"
                  page={departmentFilterPage}
                  count={departmentFilterTotalPages}
                  onChange={(_event, value) =>
                    onDepartmentFilterPageChange?.(value)
                  }
                  sx={{
                    "& .MuiPagination-ul": {
                      flexWrap: "nowrap",
                    },
                  }}
                />
              ) : null}
            </Stack>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                onDepartmentFilterOpen?.();
                setIsDepartmentSelectorOpen(true);
              }}
              sx={{
                minWidth: "auto",
                px: 1.25,
                maxWidth: { xs: 180, sm: 260 },
              }}
            >
              {selectedDepartmentLabel}
            </Button>
          )
        ) : null}

        {showQuickFilter ? (
          <QuickFilter debounceMs={250}>
            <QuickFilterTrigger
              render={(triggerProps) => (
                <Tooltip title="Quick Filter">
                  <ToolbarButton
                    {...triggerProps}
                    aria-label="Quick Filter"
                    render={(buttonProps) => (
                      <IconButton {...buttonProps} size="small">
                        <SearchOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                  />
                </Tooltip>
              )}
            />
            <QuickFilterControl
              render={(controlProps) => (
                <TextField
                  {...controlProps}
                  size="small"
                  placeholder={quickFilterPlaceholder}
                  sx={{ width: { xs: 170, sm: 220 } }}
                />
              )}
            />
            <QuickFilterClear
              render={(clearProps) => (
                <Tooltip title="Clear quick filter">
                  <ToolbarButton
                    {...clearProps}
                    aria-label="Clear quick filter"
                    render={(buttonProps) => (
                      <IconButton {...buttonProps} size="small">
                        <ClearOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                  />
                </Tooltip>
              )}
            />
          </QuickFilter>
        ) : null}

        <FilterPanelTrigger
          onClick={onFilterClick}
          render={(triggerProps) => (
            <Tooltip title={filterLabel}>
              <ToolbarButton
                {...triggerProps}
                aria-label={filterLabel}
                render={(buttonProps) => (
                  <IconButton {...buttonProps} size="small">
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                )}
              />
            </Tooltip>
          )}
        />

        <ColumnsPanelTrigger
          render={(triggerProps) => (
            <Tooltip title={columnsLabel}>
              <ToolbarButton
                {...triggerProps}
                aria-label={columnsLabel}
                render={(buttonProps) => (
                  <IconButton {...buttonProps} size="small">
                    <ViewColumnIcon fontSize="small" />
                  </IconButton>
                )}
              />
            </Tooltip>
          )}
        />

        <ExportCsv
          options={csvExportOptions}
          disabled={!hasSelectableRows}
          render={(triggerProps) => (
            <Tooltip title={exportCsvLabel}>
              <span>
                <ToolbarButton
                  {...triggerProps}
                  aria-label={exportCsvLabel}
                  disabled={!hasSelectableRows}
                  render={(buttonProps) => (
                    <IconButton
                      {...buttonProps}
                      size="small"
                      disabled={!hasSelectableRows}
                    >
                      <DownloadOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                />
              </span>
            </Tooltip>
          )}
        />

        <ExportPrint
          options={printExportOptions}
          disabled={!hasSelectableRows}
          render={(triggerProps) => (
            <Tooltip title={printLabel}>
              <span>
                <ToolbarButton
                  {...triggerProps}
                  aria-label={printLabel}
                  disabled={!hasSelectableRows}
                  render={(buttonProps) => (
                    <IconButton
                      {...buttonProps}
                      size="small"
                      disabled={!hasSelectableRows}
                    >
                      <PrintOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                />
              </span>
            </Tooltip>
          )}
        />

        <Tooltip title={exportPdfLabel}>
          <span>
            <ToolbarButton
              aria-label={exportPdfLabel}
              disabled={!hasSelectableRows || !onExportPdf}
              onClick={() => onExportPdf?.()}
              render={(buttonProps) => (
                <IconButton
                  {...buttonProps}
                  size="small"
                  disabled={!hasSelectableRows || !onExportPdf}
                >
                  <PictureAsPdfOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            />
          </span>
        </Tooltip>

        {endActions}
      </Box>
    </Toolbar>
  );
};

MuiDataGridToolbar.propTypes = {
  onFilterClick: PropTypes.func,
  filterLabel: PropTypes.string,
  columnsLabel: PropTypes.string,
  exportCsvLabel: PropTypes.string,
  exportPdfLabel: PropTypes.string,
  printLabel: PropTypes.string,
  departmentFilterEnabled: PropTypes.bool,
  departmentFilterValue: PropTypes.string,
  departmentFilterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    })
  ),
  onDepartmentFilterChange: PropTypes.func,
  departmentFilterInitialValue: PropTypes.string,
  departmentFilterLoading: PropTypes.bool,
  departmentFilterPage: PropTypes.number,
  departmentFilterTotalPages: PropTypes.number,
  onDepartmentFilterPageChange: PropTypes.func,
  onDepartmentFilterOpen: PropTypes.func,
  selectedRowCount: PropTypes.number,
  csvExportOptions: PropTypes.object,
  printExportOptions: PropTypes.object,
  onExportPdf: PropTypes.func,
  startActions: PropTypes.node,
  endActions: PropTypes.node,
  showQuickFilter: PropTypes.bool,
  quickFilterPlaceholder: PropTypes.string,
};

export default memo(MuiDataGridToolbar);
