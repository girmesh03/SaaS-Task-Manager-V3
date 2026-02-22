import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { toast } from "react-toastify";
import { MuiTextField } from "../../components/reusable";
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { validators } from "../../utils/validators";

/**
 * @typedef {"loading" | "success" | "error"} VerificationStatus
 */

/**
 * Verify-email page with automatic token extraction and submission flow.
 *
 * @returns {JSX.Element} Verify-email page content.
 * @throws {never} This component does not throw.
 */
const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const autoSubmitAttemptedRef = useRef(false);

  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification, resendState] = useResendVerificationMutation();
  const [status, setStatus] = useState(
    /** @type {VerificationStatus} */ (token ? "loading" : "error")
  );
  const [errorMessage, setErrorMessage] = useState(
    token
      ? ""
      : "Verification token is missing. Open the verification link from your email."
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (!token || autoSubmitAttemptedRef.current) {
      return;
    }

    autoSubmitAttemptedRef.current = true;

    verifyEmail({ token })
      .unwrap()
      .then(() => {
        setStatus("success");
        setErrorMessage("");
      })
      .catch((error) => {
        const fallbackMessage = "Verification failed. The link may be invalid or expired.";
        const message = error?.data?.message || error?.error || fallbackMessage;
        setStatus("error");
        setErrorMessage(String(message));
      });
  }, [token, verifyEmail]);

  /**
   * Handles resend verification email action.
   *
   * @param {{ email: string }} values - Resend payload.
   * @returns {Promise<void>} Resolves when resend completes.
   * @throws {never} Errors are surfaced via toast.
   */
  const handleResend = async (values) => {
    try {
      await resendVerification({ email: values.email }).unwrap();
      toast.success("Verification email sent. Check your inbox for a new link.");
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
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 560,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[8],
        }}
      >
        {status === "loading" ? (
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={44} thickness={4} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Verifying your account...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait a moment while we verify your email address and secure
              your workspace. This should not take long.
            </Typography>
            <Stack direction="row" spacing={0.75} justifyContent="center">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                }}
              />
            </Stack>
          </Stack>
        ) : null}

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
              <MarkEmailReadOutlinedIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Email Verified Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome email sent
            </Typography>
            <Button variant="contained" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </Stack>
        ) : null}

        {status === "error" ? (
          <Stack
            component="form"
            spacing={2}
            onSubmit={handleSubmit(handleResend)}
            alignItems="stretch"
          >
            <Button
              component={Link}
              to="/login"
              size="small"
              startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
              sx={{ alignSelf: "flex-start", p: 0, minWidth: "auto" }}
            >
              Back to Login
            </Button>

            <Stack spacing={1} alignItems="center" textAlign="center" sx={{ mt: -0.25 }}>
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
                Verification Failed
              </Typography>
              <Typography variant="body2" color="error.main">
                {errorMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email to resend a new verification link.
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

            <Button
              type="submit"
              variant="contained"
              disabled={resendState.isLoading || isSubmitting}
            >
              {resendState.isLoading || isSubmitting
                ? "Resending..."
                : "Resend Verification"}
            </Button>

            <Divider>OR</Divider>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Don&apos;t have an account?{" "}
              <Button component={Link} to="/register" size="small" sx={{ p: 0, minWidth: "auto" }}>
                Sign Up
              </Button>
            </Typography>
          </Stack>
        ) : null}
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;
