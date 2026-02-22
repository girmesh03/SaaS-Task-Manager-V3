import { memo } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { MuiSelectAutocomplete } from "../reusable";

/**
 * Isolated manager field component to prevent re-renders from other form fields.
 * This component is memoized and only re-renders when its own props change.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} Manager select field.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentManagerField = ({ control, managerOptions }) => {
  return (
    <Controller
      name="managerId"
      control={control}
      render={({ field }) => (
        <MuiSelectAutocomplete
          {...field}
          value={field.value || ""}
          onChange={(_event, value) => field.onChange(value || "")}
          options={managerOptions}
          valueMode="id"
          placeholder="Select manager"
        />
      )}
    />
  );
};

DepartmentManagerField.propTypes = {
  control: PropTypes.object.isRequired,
  managerOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
};

// Memoize to prevent re-renders when parent form state changes
export default memo(DepartmentManagerField);
