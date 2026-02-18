/**
 * @file Public register page.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
import {
  RegisterAdminUserStep,
  RegisterDepartmentStep,
  RegisterOrganizationDetailsStep,
  RegisterOrganizationStep,
} from "../../components/auth";
import {
  MuiDialog,
  MuiLoading,
  MuiProgress,
} from "../../components/reusable";
import useResponsive from "../../hooks/useResponsive";
import { useRegisterAuthMutation } from "../../services/api";
import { toastApiError } from "../../utils/errorHandling";

const REGISTRATION_STEPS = Object.freeze([
  {
    label: "Organization",
    fields: [
      "organization.name",
      "organization.email",
      "organization.phone",
      "organization.address",
    ],
  },
  {
    label: "Organization Details",
    fields: ["organization.industry", "organization.size", "organization.description"],
  },
  {
    label: "Department",
    fields: ["department.name", "department.description"],
  },
  {
    label: "Admin User",
    fields: [
      "user.firstName",
      "user.lastName",
      "user.position",
      "user.email",
      "user.password",
      "user.confirmPassword",
    ],
  },
]);

/**
 * Register page implementing the canonical 4-step onboarding wizard.
 *
 * @returns {JSX.Element} Register page content.
 * @throws {never} This component does not throw.
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { isXs } = useResponsive();
  const [activeStep, setActiveStep] = useState(0);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [registerAuth, registerState] = useRegisterAuthMutation();

  const {
    control,
    register,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      organization: {
        name: "",
        email: "",
        phone: "",
        address: "",
        industry: "",
        size: "",
        description: "",
      },
      department: {
        name: "",
        description: "",
      },
      user: {
        firstName: "",
        lastName: "",
        position: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
    },
    mode: "onBlur",
  });

  const isLastStep = activeStep === REGISTRATION_STEPS.length - 1;
  const progressValue = ((activeStep + 1) / REGISTRATION_STEPS.length) * 100;

  const title = useMemo(() => {
    return `Sign Up - Step ${activeStep + 1} of ${REGISTRATION_STEPS.length}`;
  }, [activeStep]);

  /**
   * Advances to next step if all current-step fields are valid.
   *
   * @returns {Promise<void>} Resolves after validation and step update.
   * @throws {never} Validation failures are represented in form state.
   */
  const handleNext = async () => {
    const stepFields = REGISTRATION_STEPS[activeStep]?.fields || [];
    const valid = await trigger(stepFields);
    if (valid) {
      setActiveStep((prev) => Math.min(prev + 1, REGISTRATION_STEPS.length - 1));
    }
  };

  /**
   * Moves back one step.
   *
   * @returns {void} Updates step index.
   * @throws {never} This helper does not throw.
   */
  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  /**
   * Submits registration payload.
   *
   * @param {{
   *   organization: Record<string, unknown>;
   *   department: Record<string, unknown>;
   *   user: Record<string, unknown>;
   * }} values - Registration payload.
   * @returns {Promise<void>} Resolves when submit flow completes.
   * @throws {never} Errors are surfaced through toast.
   */
  const onSubmit = async (values) => {
    try {
      await registerAuth(values).unwrap();
      toast.success("Registration submitted. Verify email to continue.");
      setSuccessDialogOpen(true);
    } catch (error) {
      toastApiError(error);
    }
  };

  /**
   * Renders step-specific fields.
   *
   * @returns {JSX.Element | null} Step fields.
   * @throws {never} This helper does not throw.
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <RegisterOrganizationStep register={register} errors={errors} />;
      case 1:
        return (
          <RegisterOrganizationDetailsStep
            control={control}
            register={register}
            errors={errors}
          />
        );
      case 2:
        return <RegisterDepartmentStep register={register} errors={errors} />;
      case 3:
        return (
          <RegisterAdminUserStep
            register={register}
            errors={errors}
            getValues={getValues}
          />
        );
      default:
        return null;
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
        sx={{ width: "100%", maxWidth: 760, p: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your organization, department, and initial SuperAdmin account.
            </Typography>
          </Stack>

          {isXs ? (
            <Stack spacing={0.75}>
              <MuiProgress
                type="linear"
                variant="determinate"
                value={progressValue}
                showLabel
              />
              <Typography variant="caption" color="text.secondary">
                {REGISTRATION_STEPS[activeStep]?.label}
              </Typography>
            </Stack>
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel sx={{ pb: 1 }}>
              {REGISTRATION_STEPS.map((step) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {renderStepContent()}

          {registerState.isLoading || isSubmitting ? (
            <MuiLoading message="Submitting registration..." />
          ) : null}

          <Stack direction="row" justifyContent="space-between">
            <Button
              type="button"
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>

            {isLastStep ? (
              <Button
                type="submit"
                variant="contained"
                disabled={registerState.isLoading || isSubmitting}
              >
                Sign Up
              </Button>
            ) : (
              <Button type="button" variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Button component={Link} to="/login" size="small" sx={{ p: 0 }}>
              Log In
            </Button>
          </Typography>
        </Stack>
      </Paper>

      <MuiDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        title="Registration Submitted"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setSuccessDialogOpen(false);
                navigate("/verify-email");
              }}
            >
              Continue
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2" color="text.secondary">
          Your onboarding payload has been sent. Continue to email verification to activate your
          organization.
        </Typography>
      </MuiDialog>
    </Box>
  );
};

export default RegisterPage;
