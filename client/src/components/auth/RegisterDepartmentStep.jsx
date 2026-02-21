/**
 * @file Register step: department details.
 */
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiTextField } from "../reusable";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { validators } from "../../utils/validators";

/**
 * Department step fields.
 *
 * @param {{
 *   register: import("react-hook-form").UseFormRegister<any>;
 *   errors: Record<string, any>;
 * }} props - Component props.
 * @returns {JSX.Element} Department fields.
 * @throws {never} This component does not throw.
 */
const RegisterDepartmentStep = ({ register, errors }) => {
  return (
    <Stack spacing={1.25}>
      <MuiTextField
        {...register("department.name", {
          required: "Department name is required",
          minLength: {
            value: VALIDATION_LIMITS.DEPARTMENT.NAME_MIN,
            message: "Minimum 2 characters",
          },
          maxLength: {
            value: VALIDATION_LIMITS.DEPARTMENT.NAME_MAX,
            message: "Maximum 100 characters",
          },
          validate: (value) =>
            validators.organizationName(value) ||
            "Department name format is invalid",
        })}
        label="Department Name"
        placeholder="e.g. Engineering, Marketing HQ"
        error={errors.department?.name}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("department.description", {
          required: "Department description is required",
          minLength: {
            value: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MIN,
            message: "Minimum 1 character",
          },
          maxLength: {
            value: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX,
            message: "Maximum 500 characters",
          },
        })}
        label="Department Description"
        placeholder="Briefly describe the purpose of this department..."
        multiline
        minRows={3}
        maxRows={5}
        error={errors.department?.description}
        reserveHelperTextSpace={false}
      />
      <Typography variant="caption" color="text.secondary">
        This will be visible to all members invited to this department.
      </Typography>
    </Stack>
  );
};

export default RegisterDepartmentStep;
