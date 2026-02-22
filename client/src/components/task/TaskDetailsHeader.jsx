import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import { MuiAvatarStack, MuiChip } from "../reusable";
import { useTimezone } from "../../hooks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE,
} from "../../utils/constants";
import TaskDetailsTabs from "./TaskDetailsTabs";

const resolveTaskTypeLabel = (type) => {
  if (type === TASK_TYPE.PROJECT) return "Project";
  if (type === TASK_TYPE.ASSIGNED) return "Assigned";
  if (type === TASK_TYPE.ROUTINE) return "Routine";
  return type || "Task";
};

const toAvatarUsers = (users = []) => {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter(Boolean)
    .map((user) => ({
      id: user.id || user._id,
      name: user.fullName || user.name || "",
      avatarUrl: user.profilePictureUrl || user.avatarUrl || "",
    }));
};

/**
 * Task details header (title + chips + actions + tabs).
 *
 * @param {{
 *   task: Record<string, unknown>;
 *   tab: string;
 *   onTabChange: (value: string) => void;
 *   canEdit: boolean;
 *   canDelete: boolean;
 *   canRestore: boolean;
 *   onShare: () => void;
 *   onEdit: () => void;
 *   onDelete: () => void;
 *   onRestore: () => void;
 * }} props - Component props.
 * @returns {JSX.Element} Header renderer.
 * @throws {never} This component does not throw.
 */
const TaskDetailsHeader = ({
  task,
  tab,
  onTabChange,
  canEdit,
  canDelete,
  canRestore,
  onShare,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const { formatDateTime } = useTimezone();

  const isDeleted = Boolean(task?.isDeleted);
  const watchers = Array.isArray(task?.watchers) ? task.watchers : [];
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];

  const collaboratorUsers =
    watchers.length > 0 ? watchers : assignees.length > 0 ? assignees : [];

  const dateLabel =
    task?.type === TASK_TYPE.ROUTINE ? "Date" : task?.type ? "Due Date" : "Due";
  const dateValue =
    task?.type === TASK_TYPE.ROUTINE ? task?.date : task?.dueDate || "";

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={1.5}>
        <Typography variant="caption" color="text.secondary">
          Dashboard / Tasks / {task?.id || ""}
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: { xs: "normal", md: "nowrap" },
              }}
            >
              {task?.title || "Task"}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={resolveTaskTypeLabel(task?.type)}
                variant="outlined"
              />
              <MuiChip
                size="small"
                label={TASK_STATUS_LABELS[task?.status] || task?.status || "Status"}
                status={task?.status}
                sx={{ fontWeight: 600 }}
              />
              <MuiChip
                size="small"
                label={
                  TASK_PRIORITY_LABELS[task?.priority] || task?.priority || "Priority"
                }
                priority={task?.priority}
                sx={{ fontWeight: 600 }}
              />
              {isDeleted ? (
                <MuiChip
                  size="small"
                  label="Deleted"
                  color="error"
                  variant="outlined"
                />
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {dateLabel}: {dateValue ? formatDateTime(dateValue) : "N/A"}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ApartmentOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {task?.department?.name || "Department"}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              {collaboratorUsers.length > 0 ? (
                <MuiAvatarStack users={toAvatarUsers(collaboratorUsers)} max={4} />
              ) : (
                <Avatar sx={{ width: 30, height: 30 }}>
                  {String(task?.createdBy?.fullName || "U").charAt(0)}
                </Avatar>
              )}
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography variant="caption" color="text.secondary">
                  {watchers.length > 0
                    ? `${watchers.length} watcher${watchers.length === 1 ? "" : "s"}`
                    : assignees.length > 0
                      ? `${assignees.length} assignee${assignees.length === 1 ? "" : "s"}`
                      : ""}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShareOutlinedIcon fontSize="small" />}
                onClick={onShare}
              >
                Share
              </Button>

              {isDeleted ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<RestoreOutlinedIcon fontSize="small" />}
                  onClick={onRestore}
                  disabled={!canRestore}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EditOutlinedIcon fontSize="small" />}
                  onClick={onEdit}
                  disabled={!canEdit}
                >
                  Edit Task
                </Button>
              )}

              {!isDeleted ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
                  onClick={onDelete}
                  disabled={!canDelete}
                >
                  Delete
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Stack>

        <TaskDetailsTabs tab={tab} onTabChange={onTabChange} />
      </Stack>
    </Paper>
  );
};

TaskDetailsHeader.propTypes = {
  task: PropTypes.object.isRequired,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  canRestore: PropTypes.bool.isRequired,
  onShare: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};

export default TaskDetailsHeader;

