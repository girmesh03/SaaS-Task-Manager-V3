import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import { Controller } from "react-hook-form";
import {
  MuiDialog,
  MuiMultiSelect,
  MuiSelectAutocomplete,
  MuiTextField,
} from "../reusable";
import { VendorSelectAutocomplete } from "../vendor";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
} from "../../utils/constants";

const TYPE_OPTIONS = Object.values(TASK_TYPE).map((value) => ({
  label: value,
  value,
}));
const STATUS_OPTIONS = Object.values(TASK_STATUS).map((value) => ({
  label: value,
  value,
}));
const PRIORITY_OPTIONS = Object.values(TASK_PRIORITY).map((value) => ({
  label: value,
  value,
}));

/**
 * Task filter dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} Task filter dialog.
 * @throws {never} Component rendering does not throw.
 */
const TaskFilterDialog = ({
  open,
  onClose,
  listForm,
  userOptions,
  vendorOptions,
  materialOptions,
  departmentOptions,
  showDepartmentFilter,
  onClear,
  onApply,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title="Filter Tasks"
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
            name="type"
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
                options={TYPE_OPTIONS}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value ===
                  (typeof value === "object" ? value.value : value)
                }
                placeholder="Select task types"
                startAdornment={<WidgetsOutlinedIcon fontSize="small" />}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="status"
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
                options={STATUS_OPTIONS}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value ===
                  (typeof value === "object" ? value.value : value)
                }
                placeholder="Select status"
                startAdornment={<FilterAltOutlinedIcon fontSize="small" />}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="priority"
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
                options={PRIORITY_OPTIONS}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value ===
                  (typeof value === "object" ? value.value : value)
                }
                placeholder="Select priorities"
                startAdornment={<FilterAltOutlinedIcon fontSize="small" />}
              />
            )}
          />
        </Grid>

        {showDepartmentFilter ? (
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
            name="assigneeId"
            control={listForm.control}
            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={userOptions}
	                valueMode="id"
	                placeholder="Select assignee"
	                startAdornment={<PeopleAltOutlinedIcon fontSize="small" />}
	              />
	            )}
	          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="createdById"
            control={listForm.control}
            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={userOptions}
	                valueMode="id"
	                placeholder="Select creator"
	                startAdornment={<PeopleAltOutlinedIcon fontSize="small" />}
	              />
	            )}
	          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="watcherId"
            control={listForm.control}
            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={userOptions}
	                valueMode="id"
	                placeholder="Select watcher"
	                startAdornment={<PeopleAltOutlinedIcon fontSize="small" />}
	              />
	            )}
	          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="vendorId"
            control={listForm.control}
            render={({ field }) => (
              <VendorSelectAutocomplete
                value={field.value || ""}
                onChange={(value) => field.onChange(value || "")}
                options={vendorOptions}
              />
            )}
          />
        </Grid>

	        <Grid size={{ xs: 12, md: 6 }}>
	          <Controller
	            name="materialId"
	            control={listForm.control}
	            render={({ field }) => (
	              <MuiSelectAutocomplete
	                value={field.value || ""}
	                onChange={(_event, value) => field.onChange(value || "")}
	                options={materialOptions}
	                valueMode="id"
	                placeholder="Select material"
	                startAdornment={<StyleOutlinedIcon fontSize="small" />}
	              />
	            )}
	          />
	        </Grid>

	        <Grid size={{ xs: 12 }}>
	          <MuiTextField
	            placeholder="e.g. urgent, safety"
	            {...listForm.register("tags")}
	            reserveHelperTextSpace={false}
	          />
	        </Grid>

	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("startFrom")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Start from"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("startTo")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Start to"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>

	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("dueFrom")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Due from"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>
	        <Grid size={{ xs: 12, md: 6 }}>
	          <MuiTextField
	            type="date"
	            {...listForm.register("dueTo")}
	            startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
	            helperText="Due to"
	            reserveHelperTextSpace={false}
	          />
	        </Grid>

	        <Grid size={{ xs: 12 }}>
	          <Controller
	            name="includeDeleted"
	            control={listForm.control}
	            render={({ field }) => (
	              <Stack direction="row" justifyContent="space-between" alignItems="center">
	                <Typography variant="body2" color="text.secondary">
	                  Include deleted tasks
	                </Typography>
	                <Switch
	                  checked={Boolean(field.value)}
	                  onChange={(event) => field.onChange(event.target.checked)}
	                  inputProps={{ "aria-label": "Include deleted tasks" }}
	                />
	              </Stack>
	            )}
	          />
	        </Grid>
      </Grid>
    </MuiDialog>
  );
};

TaskFilterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  listForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
  }).isRequired,
  userOptions: PropTypes.arrayOf(PropTypes.object),
  vendorOptions: PropTypes.arrayOf(PropTypes.object),
  materialOptions: PropTypes.arrayOf(PropTypes.object),
  departmentOptions: PropTypes.arrayOf(PropTypes.object),
  showDepartmentFilter: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

TaskFilterDialog.defaultProps = {
  userOptions: [],
  vendorOptions: [],
  materialOptions: [],
  departmentOptions: [],
  showDepartmentFilter: false,
};

export default TaskFilterDialog;
