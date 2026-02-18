import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
import { MuiDialog, MuiLoading, MuiTextField } from "../../components/reusable";
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { validators } from "../../utils/validators";

/**
 * Verify-email page skeleton with verify and resend actions.
 *
 * @returns {JSX.Element} Verify-email page content.
 * @throws {never} This component does not throw.
 */
const VerifyEmailPage = () => {
  const [verifyEmail, verifyState] = useVerifyEmailMutation();
  const [resendVerification, resendState] = useResendVerificationMutation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    getValues,
    clearErrors,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      token: "",
      email: "",
    },
  });

  /**
   * Handles verification-token submission.
   *
   * @param {{ token: string; email: string }} values - Verification form values.
   * @returns {Promise<void>} Resolves when verification flow completes.
   * @throws {never} Errors are surfaced via toast.
   */
  const onSubmit = async (values) => {
    try {
      await verifyEmail({ token: values.token }).unwrap();
      toast.success("Email verification request submitted.");
      setDialogOpen(true);
    } catch (error) {
      toastApiError(error);
    }
  };

  /**
   * Handles resend-verification submission.
   *
   * @param {string} email - Email address for resend flow.
   * @returns {Promise<void>} Resolves when resend flow completes.
   * @throws {never} Errors are surfaced via toast.
   */
  const onResend = async (email) => {
    try {
      await resendVerification({ email }).unwrap();
      toast.success("Verification email resend request submitted.");
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
        sx={{ width: "100%", maxWidth: 520, p: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Verify Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the verification token sent to your email address.
            </Typography>
          </Stack>

          <MuiTextField
            {...register("token", { required: "Verification token is required" })}
            label="Verification Token"
            error={errors.token}
            reserveHelperTextSpace={false}
          />

          <MuiTextField
            {...register("email", {
              maxLength: {
                value: VALIDATION_LIMITS.USER.EMAIL_MAX,
                message: "Maximum 100 characters",
              },
              validate: (value) =>
                !value ||
                validators.email(value) ||
                "Please enter a valid email address",
            })}
            label="Email"
            type="email"
            error={errors.email}
            reserveHelperTextSpace={false}
          />

          {verifyState.isLoading || resendState.isLoading || isSubmitting ? (
            <MuiLoading message="Processing verification..." />
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              type="submit"
              variant="contained"
              disabled={verifyState.isLoading || isSubmitting}
              fullWidth
            >
              Verify Email
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={async () => {
                const email = getValues("email");
                if (!email) {
                  setError("email", {
                    type: "required",
                    message: "Email is required for resend flow",
                  });
                  return;
                }

                if (!validators.email(email)) {
                  setError("email", {
                    type: "validate",
                    message: "Please enter a valid email address",
                  });
                  return;
                }

                clearErrors("email");
                await onResend(email);
              }}
              disabled={resendState.isLoading || isSubmitting}
              fullWidth
            >
              Resend Verification
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Back to{" "}
            <Button component={Link} to="/login" size="small" sx={{ p: 0 }}>
              Log In
            </Button>
          </Typography>
        </Stack>
      </Paper>

      <MuiDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Verification Submitted"
        actions={
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          If your token is valid, your account will be marked as verified and onboarding can
          continue.
        </Typography>
      </MuiDialog>
    </Box>
  );
};

export default VerifyEmailPage;
