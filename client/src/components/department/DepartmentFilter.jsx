import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Controller } from "react-hook-form";
import { MuiDialog, MuiSelectAutocomplete, MuiTextField } from "../reusable";

/**
 * Department filter dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} Department filter dialog.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentFilter = ({
  open,
  onClose,
  listForm,
  canUseDepartmentSwitcher,
  departmentOptions,
  statusOptions,
  managerOptions,
  canFilterByOrganization,
  onClear,
  onApply,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title="Filter Departments"
      actions={
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Button size="small" variant="text" onClick={onClear}>
            Clear All
          </Button>
          <Button size="small" variant="contained" onClick={onApply}>
            Apply Filters
          </Button>
        </Stack>
      }
    >
      <Grid container spacing={1.25}>
        {canUseDepartmentSwitcher ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="departmentId"
              control={listForm.control}
	              render={({ field }) => (
	                <MuiSelectAutocomplete
	                  value={field.value || ""}
	                  onChange={(_event, value) => field.onChange(value || "")}
	                  options={departmentOptions}
	                  valueMode="id"
	                  placeholder="Select department"
	                />
	              )}
	            />
	          </Grid>
	        ) : null}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="status"
            control={listForm.control}
	            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={statusOptions}
	                valueMode="id"
	                placeholder="Select status"
	              />
	            )}
	          />
	        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="managerId"
            control={listForm.control}
	            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={managerOptions}
	                valueMode="id"
	                placeholder="Select manager"
	              />
	            )}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
	          <MuiTextField
	            type="number"
	            placeholder="Min members"
	            {...listForm.register("memberCountMin")}
	            startAdornment={<GroupsOutlinedIcon fontSize="small" />}
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
	          <MuiTextField
	            type="number"
	            placeholder="Max members"
	            {...listForm.register("memberCountMax")}
	            startAdornment={<GroupsOutlinedIcon fontSize="small" />}
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("createdFrom")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Created from"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("createdTo")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Created to"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        {canFilterByOrganization ? (
	          <Grid size={{ xs: 12, md: 6 }}>
	            <MuiTextField
	              placeholder="Organization ID"
	              {...listForm.register("organizationId")}
	              startAdornment={<BusinessOutlinedIcon fontSize="small" />}
	              reserveHelperTextSpace={false}
	            />
	          </Grid>
	        ) : null}
	        <Grid size={{ xs: 12 }}>
	          <Controller
	            name="includeDeleted"
	            control={listForm.control}
	            render={({ field }) => (
	              <Stack direction="row" justifyContent="space-between" alignItems="center">
	                <Typography variant="body2" color="text.secondary">
	                  Include deleted departments
	                </Typography>
	                <Switch
	                  checked={Boolean(field.value)}
	                  onChange={(event) => field.onChange(event.target.checked)}
	                  inputProps={{ "aria-label": "Include deleted departments" }}
	                />
	              </Stack>
	            )}
	          />
	        </Grid>
      </Grid>
    </MuiDialog>
  );
};

DepartmentFilter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  listForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
  }).isRequired,
  canUseDepartmentSwitcher: PropTypes.bool.isRequired,
  departmentOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  managerOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  canFilterByOrganization: PropTypes.bool.isRequired,
  onClear: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default DepartmentFilter;
