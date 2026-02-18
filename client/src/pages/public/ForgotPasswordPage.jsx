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
import { useForgotPasswordMutation } from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { validators } from "../../utils/validators";

/**
 * Forgot-password page skeleton connected to forgot-password endpoint.
 *
 * @returns {JSX.Element} Forgot-password page content.
 * @throws {never} This component does not throw.
 */
const ForgotPasswordPage = () => {
  const [forgotPassword, forgotState] = useForgotPasswordMutation();
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const {
    register,
    handleSubmit,
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
      toast.success("Password reset request submitted.");
      setSuccessDialogOpen(true);
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
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your account email to request a password reset token.
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

          <Typography variant="body2" color="text.secondary">
            Return to{" "}
            <Button component={Link} to="/login" size="small" sx={{ p: 0 }}>
              Log In
            </Button>
          </Typography>
        </Stack>
      </Paper>

      <MuiDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        title="Reset Requested"
        actions={
          <Button variant="contained" onClick={() => setSuccessDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          If the email exists, a reset token or reset link will be sent. Continue with reset
          using the token from your mailbox.
        </Typography>
      </MuiDialog>
    </Box>
  );
};

export default ForgotPasswordPage;
