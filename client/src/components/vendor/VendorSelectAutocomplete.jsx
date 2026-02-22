import PropTypes from "prop-types";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { MuiSelectAutocomplete } from "../reusable";

/**
 * Vendor selector autocomplete (Phase 4 - task dialogs).
 *
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   options: Array<{ value: string; label: string }>;
 *   placeholder?: string;
 *   disabled?: boolean;
 *   error?: unknown;
 *   helperText?: string;
 * }} props - Component props.
 * @returns {JSX.Element} Vendor selector.
 * @throws {never} This component does not throw.
 */
const VendorSelectAutocomplete = ({
  value,
  onChange,
  options,
  placeholder = "Select vendor",
  disabled = false,
  error,
  helperText,
}) => {
  return (
    <MuiSelectAutocomplete
      value={value || ""}
      onChange={(_event, nextValue) => onChange(nextValue || "")}
      options={options}
      valueMode="id"
      placeholder={placeholder}
      disabled={disabled}
      startAdornment={<LocalShippingOutlinedIcon fontSize="small" />}
      error={error}
      helperText={helperText}
    />
  );
};

VendorSelectAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.any,
  helperText: PropTypes.string,
};

VendorSelectAutocomplete.defaultProps = {
  value: "",
  options: [],
  placeholder: "Select vendor",
  disabled: false,
  error: null,
  helperText: "",
};

export default VendorSelectAutocomplete;
