/**
 * @file Register step: organization details.
 */
import { Controller } from "react-hook-form";
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

      <Controller
        name="organization.size"
        control={control}
        rules={{ required: "Organization size is required" }}
        render={({ field }) => (
          <MuiSelectAutocomplete
            value={field.value || null}
            onChange={(_event, value) => field.onChange(value || "")}
            label="Organization Size"
            options={ORGANIZATION_SIZES}
            error={errors.organization?.size}
            helperText={errors.organization?.size?.message}
          />
        )}
      />

      <MuiTextField
        {...register("organization.description", {
          maxLength: {
            value: VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX,
            message: "Maximum 1000 characters",
          },
        })}
        label="Organization Description"
        multiline
        minRows={3}
        maxRows={5}
        error={errors.organization?.description}
        reserveHelperTextSpace={false}
      />
    </Stack>
  );
};

export default RegisterOrganizationDetailsStep;
