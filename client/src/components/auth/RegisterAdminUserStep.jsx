/**
 * @file Register step: admin user credentials.
 */
import { useMemo, useState } from "react";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrengthValue, setPasswordStrengthValue] = useState(0);
  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrengthValue >= 90) return "Strong";
    if (passwordStrengthValue >= 60) return "Good";
    if (passwordStrengthValue >= 35) return "Fair";
    return "Weak";
  }, [passwordStrengthValue]);

  return (
    <Stack spacing={1.25}>
      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, sm: 6 }}>
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
            placeholder="First name"
            error={errors.user?.firstName}
            reserveHelperTextSpace={false}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
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
            placeholder="Last name"
            error={errors.user?.lastName}
            reserveHelperTextSpace={false}
          />
        </Grid>
        <Grid size={12}>
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
            label="Position / Job Title"
            placeholder="Position / Job Title"
            startAdornment={<WorkOutlineOutlinedIcon fontSize="small" />}
            error={errors.user?.position}
            reserveHelperTextSpace={false}
          />
        </Grid>
        <Grid size={12}>
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
            label="Email Address"
            type="email"
            placeholder="Email Address"
            startAdornment={<EmailOutlinedIcon fontSize="small" />}
            error={errors.user?.email}
            reserveHelperTextSpace={false}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
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
              onChange: (event) => {
                const value = String(event.target.value || "");
                const hasLower = /[a-z]/.test(value) ? 1 : 0;
                const hasUpper = /[A-Z]/.test(value) ? 1 : 0;
                const hasNumber = /\d/.test(value) ? 1 : 0;
                const hasSymbol = /[^a-zA-Z0-9]/.test(value) ? 1 : 0;
                const lengthScore = Math.min(value.length / 12, 1);
                const score =
                  (lengthScore * 0.55 + (hasLower + hasUpper + hasNumber + hasSymbol) * 0.1125) *
                  100;
                setPasswordStrengthValue(Math.min(Math.round(score), 100));
              },
            })}
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            startAdornment={<LockOutlinedIcon fontSize="small" />}
            endAdornment={
              <IconButton
                size="small"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            }
            error={errors.user?.password}
            reserveHelperTextSpace={false}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("user.confirmPassword", {
              required: "Password confirmation is required",
              validate: (value) =>
                value === getValues("user.password") ||
                "Password confirmation does not match",
            })}
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            startAdornment={<LockOutlinedIcon fontSize="small" />}
            endAdornment={
              <IconButton
                size="small"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            }
            error={errors.user?.confirmPassword}
            reserveHelperTextSpace={false}
          />
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary">
        Min. 8 characters
      </Typography>
      <LinearProgress
        variant="determinate"
        value={passwordStrengthValue}
        sx={{
          height: 6,
          borderRadius: 999,
          mt: -0.5,
        }}
      />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {passwordStrengthLabel}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RegisterAdminUserStep;
