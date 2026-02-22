import PropTypes from "prop-types";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { MuiLoading, MuiTextField, MuiTimeline } from "../reusable";

const USER_ACTIVITY_FILTERS = ["All", "Tasks", "Comments", "Files"];

/**
 * User details Activity tab.
 *
 * @param {{
 *   isActivityFetching: boolean;
 *   activityFilter: string;
 *   onActivityFilterChange: (value: string) => void;
 *   timelineItems: Array<Record<string, unknown>>;
 * }} props - Component props.
 * @returns {JSX.Element} User activity tab.
 * @throws {never} This component does not throw.
 */
const UserActivityTab = ({
  isActivityFetching,
  activityFilter,
  onActivityFilterChange,
  timelineItems,
}) => {
  if (isActivityFetching) {
    return <MuiLoading message="Loading user activity..." />;
  }

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recent Activity
        </Typography>
	        <MuiTextField
	          select
	          size="small"
	          value={activityFilter}
	          onChange={(event) => onActivityFilterChange(event.target.value)}
	          startAdornment={<FilterAltOutlinedIcon fontSize="small" />}
	          helperText="Activity type"
	          sx={{ minWidth: 180 }}
	          reserveHelperTextSpace={false}
	        >
          {USER_ACTIVITY_FILTERS.map((entry) => (
            <MenuItem key={entry} value={entry}>
              {entry}
            </MenuItem>
          ))}
        </MuiTextField>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
        <MuiTimeline items={timelineItems} emptyMessage="No activity found." />
      </Paper>
    </Stack>
  );
};

UserActivityTab.propTypes = {
  isActivityFetching: PropTypes.bool,
  activityFilter: PropTypes.string.isRequired,
  onActivityFilterChange: PropTypes.func.isRequired,
  timelineItems: PropTypes.arrayOf(PropTypes.object),
};

UserActivityTab.defaultProps = {
  isActivityFetching: false,
  timelineItems: [],
};

export default UserActivityTab;
