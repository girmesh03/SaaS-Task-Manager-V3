import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { MuiStatCard, MuiTextField, MuiTimeline } from "../reusable";

/**
 * User details Overview tab.
 *
 * @param {{
 *   user: Record<string, unknown>;
 *   overview: Record<string, unknown>;
 *   timelineItems: Array<Record<string, unknown>>;
 *   canUpdateUser: boolean;
 * }} props - Component props.
 * @returns {JSX.Element} User overview tab.
 * @throws {never} This component does not throw.
 */
const UserOverviewTab = ({ user, overview, timelineItems, canUpdateUser }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Personal Information
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={<EditOutlinedIcon fontSize="small" />}
                disabled={!canUpdateUser}
              >
                Edit
              </Button>
            </Stack>
            <Grid container spacing={1.25}>
	              <Grid size={{ xs: 12, sm: 6 }}>
	                <MuiTextField
	                  value={user.fullName || ""}
	                  startAdornment={<BadgeOutlinedIcon fontSize="small" />}
	                  InputProps={{ readOnly: true }}
	                  helperText="Full name"
	                  reserveHelperTextSpace={false}
	                />
	              </Grid>
	              <Grid size={{ xs: 12, sm: 6 }}>
	                <MuiTextField
	                  value={user.email || ""}
	                  startAdornment={<MailOutlineOutlinedIcon fontSize="small" />}
	                  InputProps={{ readOnly: true }}
	                  helperText="Email address"
	                  reserveHelperTextSpace={false}
	                />
	              </Grid>
	              <Grid size={{ xs: 12, sm: 6 }}>
	                <MuiTextField
	                  value={user.phone || "N/A"}
	                  startAdornment={<PhoneOutlinedIcon fontSize="small" />}
	                  InputProps={{ readOnly: true }}
	                  helperText="Phone number"
	                  reserveHelperTextSpace={false}
	                />
	              </Grid>
	              <Grid size={{ xs: 12, sm: 6 }}>
	                <MuiTextField
	                  value={user.role || ""}
	                  startAdornment={<WorkOutlineOutlinedIcon fontSize="small" />}
	                  InputProps={{ readOnly: true }}
	                  helperText="Role"
	                  reserveHelperTextSpace={false}
	                />
	              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Recent Activity
            </Typography>
            <MuiTimeline
              items={timelineItems.slice(0, 3)}
              emptyMessage="No recent activity available."
            />
          </Paper>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={1.5}>
          <Grid container spacing={1.5}>
            <Grid size={6}>
              <MuiStatCard title="Total Tasks" value={overview.totalTasks || 0} />
            </Grid>
            <Grid size={6}>
              <MuiStatCard
                title="Completed"
                value={overview.completedTasks || 0}
              />
            </Grid>
          </Grid>
          <MuiStatCard
            title="Pending Review"
            value={overview.activeTasks || 0}
            subtitle="Open and in-progress tasks"
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Skills
            </Typography>
            {(user.skills || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No skills added yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {(user.skills || []).map((skill) => (
                  <Stack key={skill} spacing={0.4}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {skill}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        100%
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        bgcolor: "primary.main",
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );
};

UserOverviewTab.propTypes = {
  user: PropTypes.object.isRequired,
  overview: PropTypes.object,
  timelineItems: PropTypes.arrayOf(PropTypes.object),
  canUpdateUser: PropTypes.bool.isRequired,
};

UserOverviewTab.defaultProps = {
  overview: {},
  timelineItems: [],
};

export default UserOverviewTab;
