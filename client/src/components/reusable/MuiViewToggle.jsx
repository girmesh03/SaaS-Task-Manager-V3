import { memo } from "react";
import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import MuiToggleButton from "./MuiToggleButton";

const MuiViewToggle = ({
  value,
  onChange,
  gridLabel = "Grid view",
  listLabel = "List view",
  sx,
}) => {
  const options = [
    {
      value: "grid",
      label: "",
      icon: (
        <Tooltip title={gridLabel} arrow>
          <ViewModuleIcon fontSize="small" />
        </Tooltip>
      ),
      ariaLabel: gridLabel,
    },
    {
      value: "list",
      label: "",
      icon: (
        <Tooltip title={listLabel} arrow>
          <ViewListIcon fontSize="small" />
        </Tooltip>
      ),
      ariaLabel: listLabel,
    },
  ];

  return (
    <MuiToggleButton
      value={value}
      onChange={onChange}
      options={options}
      size="small"
      sx={sx}
    />
  );
};

MuiViewToggle.propTypes = {
  value: PropTypes.oneOf(["grid", "list"]).isRequired,
  onChange: PropTypes.func.isRequired,
  gridLabel: PropTypes.string,
  listLabel: PropTypes.string,
  sx: PropTypes.object,
};

export default memo(MuiViewToggle);
