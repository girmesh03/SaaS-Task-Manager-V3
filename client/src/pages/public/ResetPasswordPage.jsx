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
import { useResetPasswordMutation } from "../../services/api";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

/**
 * Reset-password page skeleton connected to reset-password endpoint.
 *
 * @returns {JSX.Element} Reset-password page content.
 * @throws {never} This component does not throw.
 */
const ResetPasswordPage = () => {
  const [resetPassword, resetState] = useResetPasswordMutation();
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Submits password reset payload.
   *
   * @param {{ token: string; password: string; confirmPassword: string }} values - Reset payload.
   * @returns {Promise<void>} Resolves when request completes.
   * @throws {never} Errors are handled via toast.
   */
  const onSubmit = async (values) => {
    try {
      await resetPassword(values).unwrap();
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
        sx={{ width: "100%", maxWidth: 520, p: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your reset token and choose a new password.
            </Typography>
          </Stack>

          <MuiTextField
            {...register("token", { required: "Reset token is required" })}
            label="Reset Token"
            error={errors.token}
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
            label="New Password"
            type="password"
            error={errors.password}
            reserveHelperTextSpace={false}
          />

          <MuiTextField
            {...register("confirmPassword", {
              required: "Confirm password is required",
              validate: (value) =>
                value === getValues("password") || "Password confirmation does not match",
            })}
            label="Confirm New Password"
            type="password"
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
        title="Reset Submitted"
        actions={
          <Button variant="contained" onClick={() => setSuccessDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          If the token is valid, your password will be updated. Continue to login with your new
          credentials.
        </Typography>
      </MuiDialog>
    </Box>
  );
};

export default ResetPasswordPage;
