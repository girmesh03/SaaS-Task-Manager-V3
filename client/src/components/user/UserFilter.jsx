import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Controller } from "react-hook-form";
import { MuiDialog, MuiMultiSelect, MuiSelectAutocomplete, MuiTextField } from "../reusable";

/**
 * User filter dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} User filter dialog.
 * @throws {never} Component rendering does not throw.
 */
const UserFilter = ({
  open,
  onClose,
  listForm,
  roleOptions,
  statusOptions,
  departmentOptions,
  onClear,
  onApply,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title="Filter Users"
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="role"
            control={listForm.control}
	            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={roleOptions}
	                valueMode="id"
	                placeholder="Select role"
	              />
	            )}
	          />
        </Grid>
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
        <Grid size={{ xs: 12 }}>
          <Controller
            name="departmentIds"
            control={listForm.control}
	            render={({ field }) => (
	              <MuiMultiSelect
	                value={field.value || []}
                onChange={(_event, value) =>
                  field.onChange(
                    (value || []).map((item) =>
                      typeof item === "object" ? item.value : item,
                    ),
                  )
                }
                options={departmentOptions}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
	                isOptionEqualToValue={(option, value) =>
	                  option.value ===
	                  (typeof value === "object" ? value.value : value)
	                }
	                placeholder="Select one or more departments"
	              />
	            )}
	          />
        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("joinedFrom")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Joined from"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("joinedTo")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Joined to"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
	            name="includeInactive"
	            control={listForm.control}
	            render={({ field }) => (
	              <Stack direction="row" justifyContent="space-between" alignItems="center">
	                <Typography variant="body2" color="text.secondary">
	                  Include inactive users
	                </Typography>
	                <Switch
	                  checked={Boolean(field.value)}
	                  onChange={(event) => field.onChange(event.target.checked)}
	                  inputProps={{ "aria-label": "Include inactive users" }}
	                />
	              </Stack>
	            )}
	          />
	        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
	            name="includeDeleted"
	            control={listForm.control}
	            render={({ field }) => (
	              <Stack direction="row" justifyContent="space-between" alignItems="center">
	                <Typography variant="body2" color="text.secondary">
	                  Include deleted users
	                </Typography>
	                <Switch
	                  checked={Boolean(field.value)}
	                  onChange={(event) => field.onChange(event.target.checked)}
	                  inputProps={{ "aria-label": "Include deleted users" }}
	                />
	              </Stack>
	            )}
	          />
	        </Grid>
      </Grid>
    </MuiDialog>
  );
};

UserFilter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  listForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
  }).isRequired,
  roleOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  departmentOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClear: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default UserFilter;
