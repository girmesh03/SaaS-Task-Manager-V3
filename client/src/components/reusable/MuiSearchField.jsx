import { memo, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
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
 *   onDebouncedChange?: (event: { target: { value: string } }) => void;
 *   debounceMs?: number;
 *   loading?: boolean;
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
  value = "",
  onChange,
  onDebouncedChange,
  debounceMs = 500,
  loading = false,
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
  const normalizedValue = String(value ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(normalizedValue);
  const isDebouncedMode = typeof onDebouncedChange === "function";

  useEffect(() => {
    setDebouncedSearch(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!isDebouncedMode) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (debouncedSearch !== normalizedValue) {
        onDebouncedChange({ target: { value: debouncedSearch } });
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    debounceMs,
    debouncedSearch,
    isDebouncedMode,
    normalizedValue,
    onDebouncedChange,
  ]);

  const displayedValue = isDebouncedMode ? debouncedSearch : normalizedValue;
  const isSearchPending = loading || (isDebouncedMode && debouncedSearch !== normalizedValue);

  const handleInputChange = (event) => {
    if (isDebouncedMode) {
      setDebouncedSearch(event.target.value);
      return;
    }

    onChange?.(event);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    if (isDebouncedMode) {
      setDebouncedSearch("");
      return;
    }

    if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  const defaultSx = useMemo(
    () => ({
      mb: 0,
      flex: { xs: 1, sm: "none" },
      width: { xs: "auto", sm: 260 },
      "& .MuiOutlinedInput-root": {
        bgcolor: "background.paper",
        pr: 1,
      },
    }),
    []
  );

  return (
    <MuiTextField
      value={displayedValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      fullWidth={fullWidth}
      size={size}
      reserveHelperTextSpace={reserveHelperTextSpace}
      startAdornment={<SearchIcon fontSize="small" color="action" />}
      endAdornment={
        isSearchPending ? (
          <CircularProgress size={20} color="inherit" />
        ) : clearable && displayedValue ? (
          <IconButton
            size="small"
            aria-label="Clear search"
            onClick={handleClear}
            edge="end"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        ) : null
      }
      sx={[defaultSx, sx]}
      {...muiProps}
    />
  );
};

MuiSearchField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onDebouncedChange: PropTypes.func,
  debounceMs: PropTypes.number,
  loading: PropTypes.bool,
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
