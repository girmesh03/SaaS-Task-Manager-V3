import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { MuiLoading, MuiTextField } from "../../components/reusable";
import { useForgotPasswordMutation } from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { validators } from "../../utils/validators";

/**
 * Forgot-password page skeleton connected to forgot-password endpoint.
 *
 * @returns {JSX.Element} Forgot-password page content.
 * @throws {never} This component does not throw.
 */
const ForgotPasswordPage = () => {
  const [forgotPassword, forgotState] = useForgotPasswordMutation();
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  /**
   * Submits forgot-password request.
   *
   * @param {{ email: string }} values - Forgot-password payload.
   * @returns {Promise<void>} Resolves when request completes.
   * @throws {never} Errors are handled via toast.
   */
  const onSubmit = async (values) => {
    try {
      await forgotPassword(values).unwrap();
    } catch {
      // Always resolve to success state to prevent account enumeration.
    } finally {
      setSubmittedEmail(values.email);
      setRequestSubmitted(true);
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
          maxWidth: 460,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[8],
        }}
      >
        {!requestSubmitted ? (
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
                <LockResetOutlinedIcon fontSize="small" />
              </Box>

              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Forgot Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter the email address associated with your account and
                we&apos;ll send you a link to reset your password.
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
	              type="email"
	              placeholder="name@company.com"
	              startAdornment={<EmailOutlinedIcon fontSize="small" />}
	              error={errors.email}
	              reserveHelperTextSpace={false}
	            />

            {forgotState.isLoading || isSubmitting ? (
              <MuiLoading message="Submitting reset request..." />
            ) : null}

            <Button
              type="submit"
              variant="contained"
              disabled={forgotState.isLoading || isSubmitting}
            >
              Request Reset
            </Button>

            <Divider>OR</Divider>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Don&apos;t have an account?{" "}
              <Button component={Link} to="/register" size="small" sx={{ p: 0, minWidth: "auto" }}>
                Sign Up
              </Button>
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "success.50",
                color: "success.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MarkEmailReadOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Check Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We sent a password reset link to <strong>{submittedEmail || "your email"}</strong>.
              Please check your inbox and follow the instructions.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Didn&apos;t receive the email?{" "}
              <Button
                size="small"
                onClick={() => {
                  setRequestSubmitted(false);
                  if (submittedEmail) {
                    setValue("email", submittedEmail);
                  }
                }}
                sx={{ p: 0, minWidth: "auto" }}
              >
                Click to resend
              </Button>
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
            >
              Back to Login
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
