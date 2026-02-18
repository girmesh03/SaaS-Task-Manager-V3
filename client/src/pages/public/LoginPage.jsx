import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
import { MuiLoading, MuiTextField } from "../../components/reusable";
import { useAuth } from "../../hooks";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { validators } from "../../utils/validators";

/**
 * Login page skeleton connected to canonical auth login endpoint.
 *
 * @returns {JSX.Element} Login page content.
 * @throws {never} This component does not throw.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
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
        sx={{ width: "100%", maxWidth: 480, p: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Log In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your workspace using your account credentials.
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
            label="Email"
            type="email"
            error={errors.email}
            autoComplete="email"
            reserveHelperTextSpace={false}
          />

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
            type="password"
            error={errors.password}
            autoComplete="current-password"
            reserveHelperTextSpace={false}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? "Logging In..." : "Log In"}
          </Button>

          {isLoading || isSubmitting ? (
            <MuiLoading message="Authenticating session..." />
          ) : null}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ gap: 1 }}
          >
            <Button component={Link} to="/forgot-password" size="small">
              Forgot Password?
            </Button>
            <Button component={Link} to="/verify-email" size="small">
              Verify Email
            </Button>
          </Stack>

          <Divider>OR</Divider>

          <Typography variant="body2" color="text.secondary">
            New to TaskManager?{" "}
            <Button component={Link} to="/register" size="small" sx={{ p: 0 }}>
              Sign Up
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
