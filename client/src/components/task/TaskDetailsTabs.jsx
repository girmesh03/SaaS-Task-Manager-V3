import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

const TASK_DETAILS_TABS = Object.freeze([
  "Overview",
  "Activities",
  "Comments",
  "Files",
]);

/**
 * Task details tab bar.
 *
 * @param {{
 *   tab: string;
 *   onTabChange: (value: string) => void;
 }} props - Component props.
 * @returns {JSX.Element} Tabs renderer.
 * @throws {never} This component does not throw.
 */
const TaskDetailsTabs = ({ tab, onTabChange }) => {
  return (
    <Paper variant="outlined">
      <Tabs
        value={tab}
        onChange={(_event, nextValue) => onTabChange(nextValue)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {TASK_DETAILS_TABS.map((entry) => (
          <Tab key={entry} value={entry} label={entry} />
        ))}
      </Tabs>
    </Paper>
  );
};

TaskDetailsTabs.propTypes = {
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default TaskDetailsTabs;

