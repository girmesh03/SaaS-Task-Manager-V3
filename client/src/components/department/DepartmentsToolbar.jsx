import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import { MuiFilterButton, MuiViewToggle } from "../reusable";
import { VIEW_MODE } from "../../utils/constants";

/**
 * Departments list toolbar with view toggle, filter trigger, and create CTA.
 *
 * @param {{
 *   viewMode: string;
 *   onViewModeChange: (nextView: string) => void;
 *   filterActiveCount?: number;
 *   onFilterClick?: () => void;
 *   canCreate?: boolean;
 *   onCreate?: () => void;
 * }} props - Component props.
 * @returns {JSX.Element} Departments toolbar.
 * @throws {never} This component does not throw.
 */
const DepartmentsToolbar = ({
  viewMode,
  onViewModeChange,
  filterActiveCount = 0,
  onFilterClick,
  canCreate = false,
  onCreate,
}) => {
  const isBelow768 = useMediaQuery("(max-width:767.95px)");
  const resolvedViewMode = viewMode || VIEW_MODE.GRID;
  const isGridView = resolvedViewMode === VIEW_MODE.GRID;

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent="flex-end"
      sx={{ width: "100%", flexWrap: "wrap" }}
    >
      <MuiViewToggle
        value={resolvedViewMode}
        onChange={(_event, nextView) => {
          if (!nextView) return;
          onViewModeChange?.(nextView);
        }}
        sx={{
          "& .MuiToggleButton-root": {
            minWidth: 34,
            height: 34,
            px: 0.75,
          },
        }}
      />

      {!isGridView ? (
        <MuiFilterButton
          activeCount={filterActiveCount}
          onClick={onFilterClick}
          iconOnlyOnMobile
          sx={{ px: { xs: 0.75, sm: 1.25 } }}
        />
      ) : null}

      {!isBelow768 ? (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={onCreate}
          disabled={!canCreate}
          startIcon={<AddIcon fontSize="small" />}
          sx={{ minWidth: "auto", px: 1.5 }}
          aria-label="Add department"
        >
          <Box component="span">Add Department</Box>
        </Button>
      ) : canCreate ? (
        <Tooltip title="Add Department">
          <IconButton
            size="small"
            onClick={onCreate}
            aria-label="Add department"
            sx={{
              width: 34,
              height: 34,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
};

DepartmentsToolbar.propTypes = {
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  filterActiveCount: PropTypes.number,
  onFilterClick: PropTypes.func,
  canCreate: PropTypes.bool,
  onCreate: PropTypes.func,
};

export default DepartmentsToolbar;

