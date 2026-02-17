import { memo } from "react";
import PropTypes from "prop-types";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MuiTextField from "./MuiTextField";

const MuiSearchField = ({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  clearable = true,
  onClear,
  fullWidth = true,
  size = "small",
  sx,
  ...muiProps
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <MuiTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      fullWidth={fullWidth}
      size={size}
      startAdornment={<SearchIcon fontSize="small" color="action" />}
      endAdornment={
        clearable && value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              aria-label="Clear search"
              onClick={handleClear}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null
      }
      sx={sx}
      {...muiProps}
    />
  );
};

MuiSearchField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  clearable: PropTypes.bool,
  onClear: PropTypes.func,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  sx: PropTypes.object,
};

export default memo(MuiSearchField);
