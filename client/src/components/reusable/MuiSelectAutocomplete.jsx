/**
 * MuiSelectAutocomplete Component - Reusable Autocomplete Component
 *
 * MuiSelectAutocomplete is a pure UI component that wraps MUI's Autocomplete.
 * It does not depend on react-hook-form's Controller internally.
 * It accepts standard controlled component props: value, onChange, error, helperText.
 *
 * Features:
 * - Single/multiple selection
 * - Async options loading with loading state
 * - Search/filter with custom filterOptions
 * - Grouping support
 * - Proper ref forwarding for integration
 * - Theme styling applied
 *
 */

import { forwardRef, memo, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

/**
 * MuiSelectAutocomplete Component
 *
 * @param {Object} props - Component props
 * @param {unknown} props.value - The selected value(s)
 * @param {(event: import("react").SyntheticEvent, value: unknown) => void} [props.onChange] - Handler for change events
 * @param {() => void} [props.onBlur] - Handler for blur events
 * @param {string} [props.name] - Field name
 * @param {string} [props.label] - Field label
 * @param {{ message?: string }} [props.error] - Error object
 * @param {string} [props.helperText] - Helper text to display
 * @param {unknown[]} [props.options] - Array of options
 * @param {boolean} [props.multiple=false] - Whether to allow multiple selection
 * @param {boolean} [props.isLoading=false] - Whether options are loading
 * @param {(option: unknown) => string} [props.getOptionLabel] - Function to get option label
 * @param {(option: unknown) => string | number} [props.getOptionValue] - Function to get option value
 * @param {(option: unknown, value: unknown) => boolean} [props.isOptionEqualToValue] - Function to compare options
 * @param {(options: unknown[], state: unknown) => unknown[]} [props.filterOptions] - Custom filter function
 * @param {(option: unknown) => string} [props.groupBy] - Function to group options
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.fullWidth=true] - Whether field takes full width
 * @param {"small" | "medium"} [props.size="small"] - Field size
 * @param {"outlined" | "filled" | "standard"} [props.variant="outlined"] - Field variant
 * @param {boolean} [props.freeSolo=false] - Whether to allow free text input
 * @param {boolean} [props.disableClearable=false] - Whether to disable clear button
 * @param {number} [props.limitTags=2] - Maximum number of tags to show
 * @param {string} [props.noOptionsText="No options"] - Text to show when no options available
 * @param {string} [props.loadingText="Loading..."] - Text to show while loading
 * @param {"id" | "object"} [props.valueMode="id"] - Controls whether values are emitted as object IDs or option objects
 * @param {boolean} [props.showSelectionChip=false] - Render selected values as chips instead of plain text
 * @returns {JSX.Element} Select-autocomplete element.
 * @throws {never} This component does not throw.
 */
const MuiSelectAutocomplete = forwardRef(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      label,
      error,
      helperText,
      options = [],
      multiple = false,
      isLoading = false,
      getOptionLabel = (option) =>
        option?.label || option?.name || option || "",
      getOptionValue = (option) => option?.value || option?._id || option,
      isOptionEqualToValue = (option, selectedValue) => {
        if (!option || !selectedValue) return false;
        return getOptionValue(option) === getOptionValue(selectedValue);
      },
      filterOptions,
      groupBy,
      startAdornment,
      placeholder = multiple
        ? "Select one or more options"
        : "Select an option",
      disabled = false,
      required = false,
      fullWidth = true,
      size = "small",
      variant = "outlined",
      freeSolo = false,
      disableClearable = false,
      limitTags = 2,
      noOptionsText = "No options",
      loadingText = "Loading...",
      valueMode = "id",
      showSelectionChip = false,
      ...otherProps
    },
    ref
  ) => {
    // Create a stable options map for O(1) lookups instead of O(n) find operations
    const optionsMap = useMemo(() => {
      const map = new Map();
      options.forEach((option) => {
        const key = String(getOptionValue(option));
        map.set(key, option);
      });
      return map;
    }, [options, getOptionValue]);

    const resolveOptionFromValue = useMemo(() => {
      return (rawValue) => {
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          return null;
        }

        if (typeof rawValue === "object") {
          return rawValue;
        }

        return optionsMap.get(String(rawValue)) || null;
      };
    }, [optionsMap]);

    const normalizedValue = useMemo(() => {
      if (multiple) {
        const nextValues = Array.isArray(value) ? value : [];
        return nextValues
          .map((entry) => resolveOptionFromValue(entry))
          .filter(Boolean);
      }

      return resolveOptionFromValue(value);
    }, [multiple, resolveOptionFromValue, value]);

    return (
      <Autocomplete
        value={normalizedValue || (multiple ? [] : null)}
        onChange={(event, newValue) => {
          if (!onChange) {
            return;
          }

          if (valueMode === "object") {
            onChange(event, newValue);
            return;
          }

          if (multiple) {
            const ids = (newValue || []).map((entry) => getOptionValue(entry));
            onChange(event, ids);
            return;
          }

          onChange(event, newValue ? getOptionValue(newValue) : "");
        }}
        onBlur={onBlur}
        ref={ref}
        options={options}
        multiple={multiple}
        loading={isLoading}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        filterOptions={filterOptions}
        groupBy={groupBy}
        disabled={disabled}
        freeSolo={freeSolo}
        disableClearable={disableClearable}
        limitTags={limitTags}
        noOptionsText={noOptionsText}
        loadingText={loadingText}
        size={size}
        fullWidth={fullWidth}
        renderValue={
          showSelectionChip
            ? (selectedValue, getItemProps) => {
                if (!selectedValue) {
                  return null;
                }

                if (Array.isArray(selectedValue)) {
                  return selectedValue.map((entry, index) => (
                    <Chip
                      {...getItemProps({ index })}
                      key={String(getOptionValue(entry))}
                      label={getOptionLabel(entry)}
                      size={size}
                    />
                  ));
                }

                return (
                  <Chip
                    {...getItemProps()}
                    label={getOptionLabel(selectedValue)}
                    size={size}
                  />
                );
              }
            : undefined
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label || undefined}
            placeholder={placeholder}
            required={required}
            error={!!error}
            helperText={error?.message || helperText}
            variant={variant}
            name={name}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: startAdornment ? (
                  <>
                    <InputAdornment position="start">
                      {startAdornment}
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ) : (
                  params.InputProps.startAdornment
                ),
                endAdornment: (
                  <>
                    {isLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
        {...otherProps}
      />
    );
  }
);

MuiSelectAutocomplete.displayName = "MuiSelectAutocomplete";

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(MuiSelectAutocomplete);
