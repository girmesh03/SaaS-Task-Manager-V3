import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { toast } from "react-toastify";
import { MuiEmptyState, MuiLoading } from "../reusable";
import TaskAddActivityDialog from "./TaskAddActivityDialog";
import { useTimezone } from "../../hooks";
import { useCreateTaskActivityMutation, useGetMaterialsQuery } from "../../services/api";
import { TASK_TYPE } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

const toUserInitials = (user) => {
  const fullName = String(user?.fullName || "").trim();
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0))
    .join("")
    .toUpperCase();
};

/**
 * Task activities tab.
 *
 * @param {{
 *   taskId: string;
 *   taskType: string;
 *   activities: Array<Record<string, unknown>>;
 *   isLoading: boolean;
 *   canCreateActivity: boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Activities tab renderer.
 * @throws {never} This component does not throw.
 */
const TaskActivitiesTab = ({
  taskId,
  taskType,
  activities,
  isLoading,
  canCreateActivity,
}) => {
  const { formatDateTime } = useTimezone();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [createActivity, createState] = useCreateTaskActivityMutation();

  const { data: materialsResponse } = useGetMaterialsQuery(
    { page: 1, limit: 100, includeDeleted: false, status: "ACTIVE" },
    { skip: !dialogOpen },
  );

  const materialOptions = useMemo(() => {
    const materials = materialsResponse?.data?.materials || [];
    return materials.map((entry) => ({ value: entry.id, label: entry.name }));
  }, [materialsResponse]);

  useEffect(() => {
    if (!createState.error) return;
    toastApiError(createState.error);
  }, [createState.error]);

  const addDisabled = taskType === TASK_TYPE.ROUTINE || !canCreateActivity;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Activity Log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updates and notes recorded against this task.
          </Typography>
        </Stack>

        <Button
          size="small"
          variant="contained"
          startIcon={<AddOutlinedIcon fontSize="small" />}
          onClick={() => setDialogOpen(true)}
          disabled={addDisabled}
        >
          Add Note
        </Button>
      </Stack>

      {taskType === TASK_TYPE.ROUTINE ? (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <MuiEmptyState
            message="Routine tasks do not support activities"
            secondaryMessage="Use task updates and files to track routine work."
          />
        </Paper>
      ) : null}

      {isLoading ? (
        <MuiLoading message="Loading activities..." />
      ) : activities.length === 0 ? (
        <MuiEmptyState
          message="No activity yet"
          secondaryMessage="Add a note to start tracking progress."
        />
      ) : (
        <Stack spacing={1.5}>
          {activities.map((activity) => {
            const createdBy = activity.createdBy || {};
            const timestamp = activity.createdAt ? formatDateTime(activity.createdAt) : "";
            const attachments = Array.isArray(activity.attachments)
              ? activity.attachments
              : [];
            const materials = Array.isArray(activity.materials) ? activity.materials : [];

            return (
              <Paper
                key={activity.id}
                variant="outlined"
                sx={{ p: { xs: 1.75, md: 2 } }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Avatar
                      src={createdBy.profilePictureUrl || undefined}
                      alt={createdBy.fullName || "User"}
                      sx={{ width: 40, height: 40 }}
                    >
                      {toUserInitials(createdBy)}
                    </Avatar>

                    <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {createdBy.fullName || "User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timestamp}
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {activity.activity || ""}
                      </Typography>
                    </Stack>
                  </Stack>

                  {materials.length > 0 ? (
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Inventory2OutlinedIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Materials used
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {materials.map((entry) => (
                          <Chip
                            key={`${entry.material?.id || entry.materialId}-${entry.quantity}`}
                            size="small"
                            variant="outlined"
                            label={`${entry.material?.name || "Material"} · ${entry.quantity}`}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ) : null}

                  {attachments.length > 0 ? (
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AttachFileOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Attachments
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {attachments.map((file) => (
                          <Chip
                            key={file.id}
                            size="small"
                            variant="outlined"
                            label={file.filename || "file"}
                            onClick={() => window.open(file.fileUrl, "_blank", "noopener,noreferrer")}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <TaskAddActivityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        materialOptions={materialOptions}
        isMutating={createState.isLoading}
        onSubmit={async (values) => {
          try {
            await createActivity({
              taskId,
              body: {
                activity: values.activity,
                materials: values.materials || [],
              },
            }).unwrap();
            toast.success("Activity added");
            setDialogOpen(false);
          } catch (error) {
            toastApiError(error);
          }
        }}
      />
    </Stack>
  );
};

TaskActivitiesTab.propTypes = {
  taskId: PropTypes.string.isRequired,
  taskType: PropTypes.string.isRequired,
  activities: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  canCreateActivity: PropTypes.bool,
};

TaskActivitiesTab.defaultProps = {
  activities: [],
  isLoading: false,
  canCreateActivity: false,
};

export default TaskActivitiesTab;

