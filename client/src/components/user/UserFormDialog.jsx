import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { Controller } from "react-hook-form";
import { MuiDialog, MuiSelectAutocomplete, MuiTextField } from "../reusable";
import { USER_IMMUTABLE_FIELDS, USER_ROLES, USER_STATUS } from "../../utils/constants";

/**
 * User create/update dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} User form dialog.
 * @throws {never} Component rendering does not throw.
 */
const UserFormDialog = ({
  open,
  onClose,
  editingUser,
  immutableTarget,
  userForm,
  isMutating,
  onSubmit,
  departmentOptions,
  roleOptions,
  statusOptions,
  profileSkills,
  skillInput,
  onSkillInputChange,
  onSkillAdd,
  onSkillRemove,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={editingUser ? "Update User" : "Create New User"}
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={userForm.handleSubmit(onSubmit)}
            disabled={isMutating}
          >
            {editingUser ? "Update User" : "Create User"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {editingUser
            ? "Update user information and permissions."
            : "Add a new member to your organization."}
        </Typography>

        {editingUser && immutableTarget ? (
          <Typography variant="caption" color="text.secondary">
            Immutable fields for this target role are locked:{" "}
            {USER_IMMUTABLE_FIELDS.join(", ")}.
          </Typography>
        ) : null}

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            1. Personal Info
          </Typography>
	          <Grid container spacing={1.25}>
	            <Grid size={{ xs: 12, sm: 6 }}>
	              <MuiTextField
	                placeholder="e.g. Sarah"
	                {...userForm.register("firstName", {
	                  required: "First name is required",
	                })}
                startAdornment={<BadgeOutlinedIcon fontSize="small" />}
                error={userForm.formState.errors.firstName}
                reserveHelperTextSpace={false}
              />
	            </Grid>
	            <Grid size={{ xs: 12, sm: 6 }}>
	              <MuiTextField
	                placeholder="e.g. Connor"
	                {...userForm.register("lastName", {
	                  required: "Last name is required",
	                })}
                startAdornment={<BadgeOutlinedIcon fontSize="small" />}
                error={userForm.formState.errors.lastName}
                reserveHelperTextSpace={false}
              />
	            </Grid>
	            <Grid size={{ xs: 12, sm: 6 }}>
	              <MuiTextField
	                type="email"
	                placeholder="sarah@company.com"
	                {...userForm.register("email", { required: "Email is required" })}
	                startAdornment={<EmailOutlinedIcon fontSize="small" />}
                error={userForm.formState.errors.email}
                reserveHelperTextSpace={false}
              />
	            </Grid>
	            <Grid size={{ xs: 12, sm: 6 }}>
	              <MuiTextField
	                placeholder="+1 (555) 000-0000"
	                {...userForm.register("phone")}
	                startAdornment={<PhoneOutlinedIcon fontSize="small" />}
                error={userForm.formState.errors.phone}
                reserveHelperTextSpace={false}
              />
	            </Grid>
	            <Grid size={12}>
	              <MuiTextField
	                placeholder="Position / Job Title"
	                {...userForm.register("position", {
	                  required: "Position is required",
	                })}
                startAdornment={<WorkOutlineOutlinedIcon fontSize="small" />}
                error={userForm.formState.errors.position}
                reserveHelperTextSpace={false}
              />
            </Grid>
	            {!editingUser ? (
	              <Grid size={12}>
	                <MuiTextField
	                  type="password"
	                  placeholder="Create password"
	                  {...userForm.register("password", {
	                    required: "Password is required",
	                  })}
	                  startAdornment={<LockOutlinedIcon fontSize="small" />}
                  error={userForm.formState.errors.password}
                  reserveHelperTextSpace={false}
                />
              </Grid>
            ) : null}
          </Grid>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            2. Role & Department
          </Typography>
          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="departmentId"
                control={userForm.control}
                rules={{ required: "Department is required" }}
	                render={({ field }) => (
	                  <MuiSelectAutocomplete
	                    value={field.value || ""}
	                    onChange={(_event, value) => field.onChange(value || "")}
	                    options={departmentOptions}
	                    valueMode="id"
	                    placeholder="Select department"
	                    disabled={editingUser ? immutableTarget : false}
	                    error={userForm.formState.errors.departmentId}
                    helperText={userForm.formState.errors.departmentId?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="role"
                control={userForm.control}
                rules={{ required: "Role is required" }}
	                render={({ field }) => (
	                  <MuiSelectAutocomplete
	                    value={field.value || USER_ROLES.USER}
	                    onChange={(_event, value) => field.onChange(value || "")}
	                    options={roleOptions}
	                    valueMode="id"
	                    placeholder="Select role"
	                    disabled={editingUser ? immutableTarget : false}
	                    error={userForm.formState.errors.role}
                    helperText={userForm.formState.errors.role?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={userForm.control}
	                render={({ field }) => (
	                  <MuiSelectAutocomplete
	                    value={field.value || USER_STATUS.ACTIVE}
	                    onChange={(_event, value) => field.onChange(value || "")}
	                    options={statusOptions}
	                    valueMode="id"
	                    placeholder="Select status"
	                    error={userForm.formState.errors.status}
	                    helperText={userForm.formState.errors.status?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
	                name="isHod"
	                control={userForm.control}
	                render={({ field }) => (
	                  <Stack
	                    direction="row"
	                    justifyContent="space-between"
	                    alignItems="center"
	                    sx={{ height: "100%" }}
	                  >
	                    <Typography variant="body2" color="text.secondary">
	                      Head of Department
	                    </Typography>
	                    <Switch
	                      checked={Boolean(field.value)}
	                      onChange={(event) => field.onChange(event.target.checked)}
	                      disabled={editingUser ? immutableTarget : false}
	                      inputProps={{ "aria-label": "Head of Department" }}
	                    />
	                  </Stack>
	                )}
	              />
	            </Grid>
          </Grid>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            3. Profile Details
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {profileSkills.map((skill) => (
              <Chip
                key={skill}
                size="small"
                label={skill}
                onDelete={() => onSkillRemove(skill)}
              />
            ))}
	          </Stack>
	          <MuiTextField
	            placeholder="Type a skill and press Enter"
	            value={skillInput}
	            onChange={(event) => onSkillInputChange(event.target.value)}
	            startAdornment={<GroupsOutlinedIcon fontSize="small" />}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onSkillAdd();
            }}
            reserveHelperTextSpace={false}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 40, height: 40 }}>
              {String(userForm.getValues("firstName") || "U")
                .slice(0, 1)
                .toUpperCase()}
            </Avatar>
            <Button size="small" variant="outlined" component="label">
              Change
              <input type="file" hidden />
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </MuiDialog>
  );
};

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editingUser: PropTypes.object,
  immutableTarget: PropTypes.bool.isRequired,
  userForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    getValues: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    formState: PropTypes.shape({
      errors: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  isMutating: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  departmentOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  roleOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  profileSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  skillInput: PropTypes.string.isRequired,
  onSkillInputChange: PropTypes.func.isRequired,
  onSkillAdd: PropTypes.func.isRequired,
  onSkillRemove: PropTypes.func.isRequired,
};

export default UserFormDialog;
