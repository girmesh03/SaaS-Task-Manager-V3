import { memo } from "react";
import PropTypes from "prop-types";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MuiTextField from "./MuiTextField";

/**
 * Search-field wrapper built on top of `MuiTextField`.
 *
 * @param {{
 *   value?: string | number;
 *   onChange?: (event: { target: { value: string } }) => void;
 *   placeholder?: string;
 *   ariaLabel?: string;
 *   clearable?: boolean;
 *   onClear?: () => void;
 *   fullWidth?: boolean;
 *   size?: "small" | "medium";
 *   reserveHelperTextSpace?: boolean;
 *   sx?: import("@mui/system").SxProps<import("@mui/material/styles").Theme>;
 * }} props - Component props.
 * @returns {JSX.Element} Search input element.
 * @throws {never} This component does not throw.
 */
const MuiSearchField = ({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  clearable = true,
  onClear,
  fullWidth = true,
  size = "small",
  reserveHelperTextSpace = false,
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
      reserveHelperTextSpace={reserveHelperTextSpace}
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
  reserveHelperTextSpace: PropTypes.bool,
  sx: PropTypes.object,
};

export default memo(MuiSearchField);
