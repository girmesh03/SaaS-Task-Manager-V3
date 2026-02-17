import { memo } from "react";
import PropTypes from "prop-types";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import FilterListIcon from "@mui/icons-material/FilterList";

const MuiFilterButton = ({
  label = "Filter",
  activeCount = 0,
  onClick,
  disabled = false,
  sx,
}) => {
  return (
    <Badge badgeContent={activeCount} color="primary" invisible={!activeCount}>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon fontSize="small" />}
        onClick={onClick}
        disabled={disabled}
        sx={sx}
      >
        {label}
      </Button>
    </Badge>
  );
};

MuiFilterButton.propTypes = {
  label: PropTypes.string,
  activeCount: PropTypes.number,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  sx: PropTypes.object,
};

export default memo(MuiFilterButton);
