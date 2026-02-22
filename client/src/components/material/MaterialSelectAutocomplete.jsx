import PropTypes from "prop-types";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import { MuiMultiSelect } from "../reusable";

/**
 * Material multi-select autocomplete (Phase 4 - task dialogs).
 *
 * @param {{
 *   value: string[];
 *   onChange: (value: string[]) => void;
 *   options: Array<{ value: string; label: string }>;
 *   placeholder?: string;
 *   disabled?: boolean;
 *   error?: unknown;
 *   helperText?: string;
 * }} props - Component props.
 * @returns {JSX.Element} Material selector.
 * @throws {never} This component does not throw.
 */
const MaterialSelectAutocomplete = ({
  value,
  onChange,
  options,
  placeholder = "Select materials",
  disabled = false,
  error,
  helperText,
}) => {
  return (
    <MuiMultiSelect
      value={Array.isArray(value) ? value : []}
      onChange={(_event, nextValue) =>
        onChange(Array.isArray(nextValue) ? nextValue : [])
      }
      options={options}
      valueMode="id"
      placeholder={placeholder}
      disabled={disabled}
      startAdornment={<StyleOutlinedIcon fontSize="small" />}
      error={error}
      helperText={helperText}
    />
  );
};

MaterialSelectAutocomplete.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.any,
  helperText: PropTypes.string,
};

MaterialSelectAutocomplete.defaultProps = {
  value: [],
  options: [],
  placeholder: "Select materials",
  disabled: false,
  error: null,
  helperText: "",
};

export default MaterialSelectAutocomplete;
