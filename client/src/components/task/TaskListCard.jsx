import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiActionColumn, MuiAvatarStack, MuiChip } from "../reusable";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE,
} from "../../utils/constants";
import { useTimezone } from "../../hooks";

const resolveTypeLabel = (type) => {
  if (type === TASK_TYPE.PROJECT) return "Project Task";
  if (type === TASK_TYPE.ASSIGNED) return "Assigned Task";
  if (type === TASK_TYPE.ROUTINE) return "Routine Task";
  return type || "Task";
};

const toAvatarStackUsers = (users = []) => {
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
 * Renders a task row in list-card mode.
 *
 * @param {{
 *   row: Record<string, unknown>;
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   onView: () => void;
 *   onEdit: () => void;
 *   onDelete: () => void;
 *   onRestore: () => void;
 * }} props - Component props.
 * @returns {JSX.Element} Task list card.
 * @throws {never} This component does not throw.
 */
const TaskListCard = ({ row, can, onView, onEdit, onDelete, onRestore }) => {
  const { formatDateTime } = useTimezone();

  const dueLabel = row.dueDate || row.date ? formatDateTime(row.dueDate || row.date) : "N/A";
  const assignees = Array.isArray(row.assignees) ? row.assignees : [];
  const vendorName = row.vendor?.name || "";

  return (
    <Card variant="outlined" sx={{ height: "100%", opacity: row.isDeleted ? 0.7 : 1 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.25}>
          <Stack spacing={0.35}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {row.title || "Untitled task"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {resolveTypeLabel(row.type)} · {row.department?.name || "Department"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <MuiChip
              size="small"
              label={TASK_STATUS_LABELS[row.status] || row.status || "Status"}
              variant="filled"
            />
            <MuiChip
              size="small"
              label={TASK_PRIORITY_LABELS[row.priority] || row.priority || "Priority"}
              variant="outlined"
            />
            <MuiChip
              size="small"
              label={`Due ${dueLabel}`}
              variant="outlined"
            />
          </Stack>

          {vendorName ? (
            <Typography variant="body2" color="text.secondary">
              Vendor: {vendorName}
            </Typography>
          ) : null}

          {assignees.length ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Assignees
              </Typography>
              <MuiAvatarStack users={toAvatarStackUsers(assignees)} max={4} size={28} />
            </Stack>
          ) : null}

          <Divider />

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <MuiChip label={`Activities ${row.activitiesCount || 0}`} size="small" variant="outlined" />
            <MuiChip label={`Comments ${row.commentsCount || 0}`} size="small" variant="outlined" />
            <MuiChip label={`Files ${row.attachmentsCount || 0}`} size="small" variant="outlined" />
          </Stack>

          <Box>
            <MuiActionColumn
              row={row}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              canView={can("Task", "read", {
                resourceType: row.type,
                target: { department: row.department?.id || undefined },
                params: { taskId: row.id },
              })}
              canUpdate={can("Task", "update", {
                resourceType: row.type,
                target: { department: row.department?.id || undefined },
                params: { taskId: row.id },
              })}
              canDelete={can("Task", "delete", {
                resourceType: row.type,
                target: { department: row.department?.id || undefined },
                params: { taskId: row.id },
              })}
              canRestore={can("Task", "delete", {
                resourceType: row.type,
                target: { department: row.department?.id || undefined },
                params: { taskId: row.id },
              })}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

TaskListCard.propTypes = {
  row: PropTypes.object.isRequired,
  can: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};

export default TaskListCard;

