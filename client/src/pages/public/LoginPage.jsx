import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { toast } from "react-toastify";
import { MuiLoading, MuiTextField } from "../../components/reusable";
import { useAuth } from "../../hooks";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { validators } from "../../utils/validators";
import { useState } from "react";

/**
 * Login page skeleton connected to canonical auth login endpoint.
 *
 * @returns {JSX.Element} Login page content.
 * @throws {never} This component does not throw.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handles login form submission.
   *
   * @param {{ email: string; password: string }} values - Login payload.
   * @returns {Promise<void>} Resolves when submit flow completes.
   * @throws {never} Errors are surfaced via toast messages.
   */
  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      toastApiError(error);
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
        component="form"
        variant="outlined"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          width: "100%",
          maxWidth: 460,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[8],
        }}
      >
        <Stack spacing={2.25}>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "primary.50",
                color: "primary.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Stack>

          <MuiTextField
            {...register("email", {
              required: "Email is required",
              maxLength: {
                value: VALIDATION_LIMITS.USER.EMAIL_MAX,
                message: "Maximum 100 characters",
              },
              validate: (value) =>
                validators.email(value) || "Please enter a valid email address",
            })}
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            startAdornment={<EmailOutlinedIcon fontSize="small" />}
            error={errors.email}
            autoComplete="email"
            reserveHelperTextSpace={false}
          />

          <Box sx={{ mt: -1 }}>
            <Button
              component={Link}
              to="/forgot-password"
              size="small"
              sx={{ p: 0, minWidth: "auto" }}
            >
              Forgot password?
            </Button>
          </Box>

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
            })}
            label="Password"
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
            autoComplete="current-password"
            reserveHelperTextSpace={false}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          {isLoading || isSubmitting ? (
            <MuiLoading message="Authenticating session..." />
          ) : null}

          <Divider>OR</Divider>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Don&apos;t have an account?{" "}
            <Button component={Link} to="/register" size="small" sx={{ p: 0, minWidth: "auto" }}>
              Sign Up
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
