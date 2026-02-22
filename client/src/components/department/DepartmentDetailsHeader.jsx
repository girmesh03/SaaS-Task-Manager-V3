import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import { useAuthorization } from "../../hooks";
import { TASK_TYPE } from "../../utils/constants";

const TOP_LEVEL_TABS = ["Overview", "Members", "Tasks"];

/**
 * Department details header (identity + tabs).
 *
 * @param {{
 *   department: Record<string, unknown>;
 *   tab: string;
 *   onTabChange: (value: string) => void;
 *   totalUsers: number;
 *   activeTasks: number;
 * }} props - Component props.
 * @returns {JSX.Element} Header section for department details.
 * @throws {never} This component does not throw.
 */
const DepartmentDetailsHeader = ({
  department,
  tab,
  onTabChange,
  totalUsers,
  activeTasks,
}) => {
  const { can } = useAuthorization();
  const canCreateTask =
    can("Task", "create", { resourceType: TASK_TYPE.PROJECT }) ||
    can("Task", "create", { resourceType: TASK_TYPE.ASSIGNED }) ||
    can("Task", "create", { resourceType: TASK_TYPE.ROUTINE });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 1.5,
                bgcolor: "primary.50",
                color: "primary.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ApartmentRoundedIcon />
            </Box>
            <Stack spacing={0.35}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {department.name}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  label={`Managed by ${department.manager?.fullName || "N/A"}`}
                />
                <Chip size="small" label={`${totalUsers} Total Users`} />
                <Chip size="small" label={`${activeTasks} Active Tasks`} />
              </Stack>
            </Stack>
          </Stack>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            disabled={!canCreateTask}
          >
            {tab === "Members" ? "Add User" : "Add New Task"}
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_event, nextValue) => onTabChange(nextValue)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {TOP_LEVEL_TABS.map((entry) => (
            <Tab key={entry} value={entry} label={entry} />
          ))}
        </Tabs>
      </Stack>
    </Paper>
  );
};

DepartmentDetailsHeader.propTypes = {
  department: PropTypes.object.isRequired,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  totalUsers: PropTypes.number.isRequired,
  activeTasks: PropTypes.number.isRequired,
};

export default DepartmentDetailsHeader;
