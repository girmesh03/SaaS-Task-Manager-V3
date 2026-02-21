import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Controller } from "react-hook-form";
import { MuiDialog, MuiSelectAutocomplete, MuiTextField } from "../reusable";
import { VALIDATION_LIMITS } from "../../utils/constants";

/**
 * Department create/update dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} Department form dialog.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentFormDialog = ({
  open,
  onClose,
  editingDepartment,
  departmentForm,
  managerOptions,
  onSubmit,
  isMutating,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={editingDepartment ? "Update Department" : "Create New Department"}
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={departmentForm.handleSubmit(onSubmit)}
            disabled={isMutating}
          >
            {editingDepartment ? "Update Department" : "Create Department"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {editingDepartment
            ? "Update department details for your organization."
            : "Add a new department to your organization."}
        </Typography>
        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: 7 }}>
            <MuiTextField
              label="Department Name"
              {...departmentForm.register("name", {
                required: "Department name is required",
              })}
              placeholder="e.g. Engineering"
              startAdornment={<ApartmentOutlinedIcon fontSize="small" />}
              error={departmentForm.formState.errors.name}
              reserveHelperTextSpace={false}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Controller
              name="managerId"
              control={departmentForm.control}
              render={({ field }) => (
                <MuiSelectAutocomplete
                  value={field.value || ""}
                  onChange={(_event, value) => field.onChange(value || "")}
                  options={managerOptions}
                  valueMode="id"
                  label="Manager (HOD)"
                  placeholder="Select manager"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MuiTextField
              label="Description"
              multiline
              minRows={3}
              {...departmentForm.register("description", {
                required: "Description is required",
                maxLength: {
                  value: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX,
                  message: "Description cannot exceed 500 characters",
                },
              })}
              placeholder="Briefly describe the responsibilities of this department..."
              startAdornment={<DescriptionOutlinedIcon fontSize="small" />}
              error={departmentForm.formState.errors.description}
              reserveHelperTextSpace={false}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">
              Keep it short and descriptive.
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </MuiDialog>
  );
};

DepartmentFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editingDepartment: PropTypes.object,
  departmentForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    formState: PropTypes.shape({
      errors: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  managerOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isMutating: PropTypes.bool.isRequired,
};

export default DepartmentFormDialog;
