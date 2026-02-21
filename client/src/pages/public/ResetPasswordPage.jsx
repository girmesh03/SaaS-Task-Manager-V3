import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { MuiLoading, MuiTextField } from "../../components/reusable";
import { useResetPasswordMutation } from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

/**
 * @typedef {"form" | "success" | "error"} ResetStatus
 */

/**
 * Reset-password page skeleton connected to reset-password endpoint.
 *
 * @returns {JSX.Element} Reset-password page content.
 * @throws {never} This component does not throw.
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [resetPassword, resetState] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrengthValue, setPasswordStrengthValue] = useState(0);
  const [status, setStatus] = useState(
    /** @type {ResetStatus} */ (token ? "form" : "error")
  );
  const [errorMessage, setErrorMessage] = useState(
    token
      ? ""
      : "Reset token is missing. Use the password reset link from your email."
  );
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrengthValue >= 90) return "Strong";
    if (passwordStrengthValue >= 60) return "Good";
    if (passwordStrengthValue >= 35) return "Fair";
    return "Weak";
  }, [passwordStrengthValue]);

  /**
   * Submits password reset payload.
   *
   * @param {{ password: string; confirmPassword: string }} values - Reset payload.
   * @returns {Promise<void>} Resolves when request completes.
   * @throws {never} Errors are handled via toast.
   */
  const onSubmit = async (values) => {
    try {
      await resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      }).unwrap();
      setStatus("success");
      setErrorMessage("");
    } catch (error) {
      toastApiError(error);
      setStatus("error");
      setErrorMessage(
        error?.data?.message || "Reset failed. The reset link may be invalid, expired, or used."
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[8],
        }}
      >
        {status === "success" ? (
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: "success.50",
                color: "success.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleOutlineOutlinedIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Password Reset Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All sessions cleared
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login with your new password
            </Typography>
            <Button component={Link} to="/login" variant="contained">
              Go to Login
            </Button>
          </Stack>
        ) : null}

        {status === "error" ? (
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: "error.50",
                color: "error.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorOutlineOutlinedIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reset Failed
            </Typography>
            <Typography variant="body2" color="error.main">
              {errorMessage}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/forgot-password")}
              startIcon={<ReplayOutlinedIcon fontSize="small" />}
            >
              Request New Reset
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="text"
              startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
            >
              Back to Log In
            </Button>
          </Stack>
        ) : null}

        {status === "form" ? (
          <Stack component="form" spacing={2.25} onSubmit={handleSubmit(onSubmit)}>
            <Button
              component={Link}
              to="/login"
              size="small"
              startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
              sx={{ alignSelf: "flex-start", p: 0, minWidth: "auto" }}
            >
              Back to Login
            </Button>

            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your new password must be different from previous used passwords.
              </Typography>
            </Stack>

            <MuiTextField
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: VALIDATION_LIMITS.USER.PASSWORD_MIN,
                  message: "Password must be at least 8 characters",
                },
                maxLength: {
                  value: VALIDATION_LIMITS.USER.PASSWORD_MAX,
                  message: "Password cannot exceed 128 characters",
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
              label="New Password"
              type={showPassword ? "text" : "password"}
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
              error={errors.password}
              reserveHelperTextSpace={false}
            />

            <Stack spacing={0.5} sx={{ mt: -1 }}>
              <LinearProgress
                variant="determinate"
                value={passwordStrengthValue}
                sx={{
                  height: 6,
                  borderRadius: 999,
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

            <MuiTextField
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === getValues("password") || "Password confirmation does not match",
              })}
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
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
              error={errors.confirmPassword}
              reserveHelperTextSpace={false}
            />

            {resetState.isLoading || isSubmitting ? (
              <MuiLoading message="Submitting password reset..." />
            ) : null}

            <Button
              type="submit"
              variant="contained"
              disabled={resetState.isLoading || isSubmitting}
            >
              Reset Password
            </Button>
          </Stack>
        ) : null}
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
