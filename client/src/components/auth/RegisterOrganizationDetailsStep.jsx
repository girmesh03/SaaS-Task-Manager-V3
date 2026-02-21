/**
 * @file Register step: organization details.
 */
import { Controller } from "react-hook-form";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {
  MuiSelectAutocomplete,
  MuiTextField,
} from "../reusable";
import {
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_SIZES,
  VALIDATION_LIMITS,
} from "../../utils/constants";

/**
 * Organization details step fields.
 *
 * @param {{
 *   control: import("react-hook-form").Control<any>;
 *   register: import("react-hook-form").UseFormRegister<any>;
 *   errors: Record<string, any>;
 * }} props - Component props.
 * @returns {JSX.Element} Organization details fields.
 * @throws {never} This component does not throw.
 */
const RegisterOrganizationDetailsStep = ({ control, register, errors }) => {
  return (
    <Stack spacing={1.25}>
      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="organization.industry"
            control={control}
            rules={{ required: "Industry is required" }}
            render={({ field }) => (
              <MuiSelectAutocomplete
                value={field.value || null}
                onChange={(_event, value) => field.onChange(value || "")}
                label="Industry"
                options={ORGANIZATION_INDUSTRIES}
                error={errors.organization?.industry}
                helperText={errors.organization?.industry?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="organization.size"
            control={control}
            rules={{ required: "Organization size is required" }}
            render={({ field }) => (
              <MuiSelectAutocomplete
                value={field.value || null}
                onChange={(_event, value) => field.onChange(value || "")}
                label="Company Size"
                options={ORGANIZATION_SIZES}
                error={errors.organization?.size}
                helperText={errors.organization?.size?.message}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <MuiTextField
            {...register("organization.description", {
              maxLength: {
                value: VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX,
                message: "Maximum 1000 characters",
              },
            })}
            label="Description"
            placeholder="Briefly describe what your organization does..."
            multiline
            minRows={3}
            maxRows={5}
            error={errors.organization?.description}
            reserveHelperTextSpace={false}
          />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default RegisterOrganizationDetailsStep;
