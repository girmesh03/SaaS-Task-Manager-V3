/**
 * @file Register step: organization basics.
 */
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { MuiTextField } from "../reusable";
import { VALIDATION_LIMITS } from "../../utils/constants";
import { validators } from "../../utils/validators";

/**
 * Organization basics step fields.
 *
 * @param {{
 *   register: import("react-hook-form").UseFormRegister<any>;
 *   errors: Record<string, any>;
 * }} props - Component props.
 * @returns {JSX.Element} Organization step form fields.
 * @throws {never} This component does not throw.
 */
const RegisterOrganizationStep = ({ register, errors }) => {
  return (
    <Stack spacing={1.25}>
      <Grid container spacing={1.25}>
        <Grid size={12}>
	          <MuiTextField
            {...register("organization.name", {
              required: "Organization name is required",
              minLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.NAME_MIN,
                message: "Minimum 2 characters",
              },
              maxLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.NAME_MAX,
                message: "Maximum 100 characters",
              },
              validate: (value) =>
	                validators.organizationName(value) ||
	                "Organization name format is invalid",
	            })}
	            placeholder="e.g. Acme Corp"
	            error={errors.organization?.name}
	            reserveHelperTextSpace={false}
	          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
	          <MuiTextField
            {...register("organization.email", {
              required: "Organization email is required",
              maxLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.EMAIL_MAX,
                message: "Maximum 100 characters",
              },
	              validate: (value) =>
	                validators.email(value) || "Organization email format is invalid",
	            })}
	            type="email"
	            placeholder="admin@company.com"
	            error={errors.organization?.email}
	            reserveHelperTextSpace={false}
	          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
	          <MuiTextField
            {...register("organization.phone", {
              required: "Organization phone is required",
              minLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.PHONE_MIN,
                message: "Minimum 10 characters",
              },
              maxLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.PHONE_MAX,
                message: "Maximum 15 characters",
              },
	              validate: (value) =>
	                validators.phone(value) || "Organization phone format is invalid",
	            })}
	            placeholder="+251913050675"
	            error={errors.organization?.phone}
	            reserveHelperTextSpace={false}
	          />
        </Grid>
        <Grid size={12}>
	          <MuiTextField
            {...register("organization.address", {
              required: "Organization address is required",
              minLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MIN,
                message: "Minimum 5 characters",
              },
              maxLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MAX,
                message: "Maximum 500 characters",
	              },
	            })}
	            placeholder="123 Business Rd, Suite 100"
	            error={errors.organization?.address}
	            reserveHelperTextSpace={false}
	          />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default RegisterOrganizationStep;
