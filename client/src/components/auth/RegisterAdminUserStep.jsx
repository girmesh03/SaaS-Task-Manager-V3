/**
 * @file Register step: admin user credentials.
 */
import Stack from "@mui/material/Stack";
import { MuiTextField } from "../reusable";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { validators } from "../../utils/validators";

/**
 * Initial admin-user step fields.
 *
 * @param {{
 *   register: import("react-hook-form").UseFormRegister<any>;
 *   errors: Record<string, any>;
 *   getValues: import("react-hook-form").UseFormGetValues<any>;
 * }} props - Component props.
 * @returns {JSX.Element} Admin user fields.
 * @throws {never} This component does not throw.
 */
const RegisterAdminUserStep = ({ register, errors, getValues }) => {
  return (
    <Stack spacing={1.25}>
      <MuiTextField
        {...register("user.firstName", {
          required: "First name is required",
          minLength: {
            value: VALIDATION_LIMITS.USER.FIRST_NAME_MIN,
            message: "Minimum 2 characters",
          },
          maxLength: {
            value: VALIDATION_LIMITS.USER.FIRST_NAME_MAX,
            message: "Maximum 50 characters",
          },
          validate: (value) =>
            validators.personName(value) || "First name format is invalid",
        })}
        label="First Name"
        error={errors.user?.firstName}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("user.lastName", {
          required: "Last name is required",
          minLength: {
            value: VALIDATION_LIMITS.USER.LAST_NAME_MIN,
            message: "Minimum 2 characters",
          },
          maxLength: {
            value: VALIDATION_LIMITS.USER.LAST_NAME_MAX,
            message: "Maximum 50 characters",
          },
          validate: (value) =>
            validators.personName(value) || "Last name format is invalid",
        })}
        label="Last Name"
        error={errors.user?.lastName}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("user.position", {
          required: "Position is required",
          minLength: {
            value: VALIDATION_LIMITS.USER.POSITION_MIN,
            message: "Minimum 2 characters",
          },
          maxLength: {
            value: VALIDATION_LIMITS.USER.POSITION_MAX,
            message: "Maximum 100 characters",
          },
          validate: (value) =>
            validators.personName(value) || "Position format is invalid",
        })}
        label="Position"
        error={errors.user?.position}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("user.email", {
          required: "User email is required",
          maxLength: {
            value: VALIDATION_LIMITS.USER.EMAIL_MAX,
            message: "Maximum 100 characters",
          },
          validate: (value) =>
            validators.email(value) || "User email format is invalid",
        })}
        label="Admin Email"
        type="email"
        error={errors.user?.email}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("user.password", {
          required: "Password is required",
          minLength: {
            value: VALIDATION_LIMITS.USER.PASSWORD_MIN,
            message: "Minimum 8 characters",
          },
          maxLength: {
            value: VALIDATION_LIMITS.USER.PASSWORD_MAX,
            message: "Maximum 128 characters",
          },
        })}
        label="Password"
        type="password"
        error={errors.user?.password}
        reserveHelperTextSpace={false}
      />

      <MuiTextField
        {...register("user.confirmPassword", {
          required: "Password confirmation is required",
          validate: (value) =>
            value === getValues("user.password") ||
            "Password confirmation does not match",
        })}
        label="Confirm Password"
        type="password"
        error={errors.user?.confirmPassword}
        reserveHelperTextSpace={false}
      />
    </Stack>
  );
};

export default RegisterAdminUserStep;
