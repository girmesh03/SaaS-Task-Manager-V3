import { memo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import DownloadIcon from "@mui/icons-material/Download";
import MuiSearchField from "./MuiSearchField";

/**
 * Toolbar component for grid/list screens with search and quick actions.
 *
 * @param {Record<string, unknown>} props - Toolbar props.
 * @returns {JSX.Element} Toolbar element.
 * @throws {never} This component does not throw.
 */
const MuiDataGridToolbar = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  onFilterClick,
  onColumnsClick,
  onDensityClick,
  onExportClick,
  filterLabel = "Filter",
  columnsLabel = "Columns",
  densityLabel = "Density",
  exportLabel = "Export",
  startActions,
  endActions,
  sx,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 0,
        py: 1,
        flexWrap: "wrap",
        ...sx,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
        <MuiSearchField
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          sx={{ minWidth: { xs: "100%", sm: 280 } }}
        />
        {startActions}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterListIcon fontSize="small" />}
          onClick={onFilterClick}
          disabled={!onFilterClick}
        >
          {filterLabel}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ViewColumnIcon fontSize="small" />}
          onClick={onColumnsClick}
          disabled={!onColumnsClick}
        >
          {columnsLabel}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DensityMediumIcon fontSize="small" />}
          onClick={onDensityClick}
          disabled={!onDensityClick}
        >
          {densityLabel}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={onExportClick}
          disabled={!onExportClick}
        >
          {exportLabel}
        </Button>
        {endActions}
      </Stack>
    </Box>
  );
};

MuiDataGridToolbar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  onFilterClick: PropTypes.func,
  onColumnsClick: PropTypes.func,
  onDensityClick: PropTypes.func,
  onExportClick: PropTypes.func,
  filterLabel: PropTypes.string,
  columnsLabel: PropTypes.string,
  densityLabel: PropTypes.string,
  exportLabel: PropTypes.string,
  startActions: PropTypes.node,
  endActions: PropTypes.node,
  sx: PropTypes.object,
};

export default memo(MuiDataGridToolbar);
