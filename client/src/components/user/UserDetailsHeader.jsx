import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { useTimezone } from "../../hooks";

const USER_DETAILS_TABS = ["Overview", "Tasks", "Activity", "Performance"];

/**
 * User details header (identity + tabs).
 *
 * @param {{
 *   user: Record<string, unknown>;
 *   tab: string;
 *   onTabChange: (value: string) => void;
 *   canUpdateUser: boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Header section for user details.
 * @throws {never} This component does not throw.
 */
const UserDetailsHeader = ({ user, tab, onTabChange, canUpdateUser }) => {
  const { formatDateTime } = useTimezone();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={user.profilePicture?.url || undefined}
                alt={user.fullName}
                sx={{ width: 68, height: 68 }}
              >
                {String(user.fullName || "U")
                  .split(" ")
                  .slice(0, 2)
                  .map((token) => token.charAt(0))
                  .join("")}
              </Avatar>
              <Box
                sx={{
                  position: "absolute",
                  right: 2,
                  bottom: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: user.status === "ACTIVE" ? "success.main" : "grey.400",
                  border: 2,
                  borderColor: "background.paper",
                }}
              />
            </Box>
            <Stack spacing={0.35}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {user.fullName}
                </Typography>
                <Chip
                  size="small"
                  label={user.position || user.role}
                  color="primary"
                />
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <WorkOutlineOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {user.department?.name || "No Department"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Joined {user.joinedAt ? formatDateTime(user.joinedAt) : "N/A"}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>

          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlinedIcon fontSize="small" />}
            disabled={!canUpdateUser}
          >
            Edit Profile
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_event, nextValue) => onTabChange(nextValue)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {USER_DETAILS_TABS.map((entry) => (
            <Tab key={entry} value={entry} label={entry} />
          ))}
        </Tabs>
      </Stack>
    </Paper>
  );
};

UserDetailsHeader.propTypes = {
  user: PropTypes.object.isRequired,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  canUpdateUser: PropTypes.bool.isRequired,
};

export default UserDetailsHeader;

