import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiChip, MuiDataGrid, MuiEmptyState, MuiTimeline } from "../reusable";
import { useTimezone } from "../../hooks";
import {
  MATERIAL_STATUS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_TYPE,
} from "../../utils/constants";

const completionForStatus = (status) => {
  if (status === TASK_STATUS.COMPLETED) return 100;
  if (status === TASK_STATUS.PENDING) return 75;
  if (status === TASK_STATUS.IN_PROGRESS) return 45;
  return 10;
};

/**
 * Task overview tab.
 *
 * @param {{
 *   task: Record<string, unknown>;
 *   overview: Record<string, unknown>;
 *   statusHistoryItems: Array<Record<string, unknown>>;
 * }} props - Component props.
 * @returns {JSX.Element} Overview renderer.
 * @throws {never} This component does not throw.
 */
const TaskOverviewTab = ({ task, overview, statusHistoryItems }) => {
  const { formatDateTime } = useTimezone();
  const tags = Array.isArray(task?.tags) ? task.tags : [];
  const materials = Array.isArray(overview?.materials) ? overview.materials : [];

  const completionPercent = completionForStatus(task?.status);

  const materialRows = materials.map((entry) => ({
    id: entry?.material?.id || "",
    name: entry?.material?.name || "",
    quantity: Number(entry?.quantity || 0),
    status: entry?.material?.status || "",
    unit: entry?.material?.unit || "",
    cost: Number(entry?.cost || 0),
  }));

  const materialColumns = [
    { field: "name", headerName: "Item Name", flex: 1.4, minWidth: 180 },
    {
      field: "quantity",
      headerName: "Quantity",
      flex: 0.5,
      minWidth: 120,
      valueGetter: (_value, row) => `${row.quantity} ${row.unit || ""}`.trim(),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      minWidth: 140,
      renderCell: ({ row }) => (
        <MuiChip
          size="small"
          label={row.status || "UNKNOWN"}
          color={row.status === MATERIAL_STATUS.ACTIVE ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "cost",
      headerName: "Cost",
      flex: 0.6,
      minWidth: 120,
      valueGetter: (_value, row) => `$${Number(row.cost || 0).toFixed(2)}`,
    },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={2}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {task?.description || "No description provided."}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Tags
              </Typography>
              {tags.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tags
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {tags.map((tag) => (
                    <Chip key={tag} size="small" label={tag} variant="outlined" />
                  ))}
                </Stack>
              )}
            </Stack>

            {task?.type === TASK_TYPE.ROUTINE ? (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Required Materials
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inventory usage is enforced by the backend.
                    </Typography>
                  </Stack>

                  {materialRows.length === 0 ? (
                    <MuiEmptyState
                      message="No materials"
                      secondaryMessage="Routine tasks track inventory usage when materials are added."
                    />
                  ) : (
                    <MuiDataGrid
                      autoHeight
                      rows={materialRows}
                      columns={materialColumns}
                      getRowId={(row) => row.id}
                      hideFooterPagination
                    />
                  )}
                </Stack>
              </>
            ) : null}
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Details
              </Typography>

              {task?.type === TASK_TYPE.ASSIGNED ? (
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Assignees
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Array.isArray(task.assignees) && task.assignees.length > 0
                      ? task.assignees.map((user) => user.fullName).join(", ")
                      : "Unassigned"}
                  </Typography>
                </Stack>
              ) : null}

              {task?.type === TASK_TYPE.PROJECT ? (
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {task?.vendor?.name || "No vendor"}
                  </Typography>
                </Stack>
              ) : null}

              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {task?.startDate ? formatDateTime(task.startDate) : "N/A"}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {task?.dueDate ? formatDateTime(task.dueDate) : "N/A"}
                </Typography>
              </Stack>

              {task?.type === TASK_TYPE.ROUTINE ? (
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {task?.date ? formatDateTime(task.date) : "N/A"}
                  </Typography>
                </Stack>
              ) : null}

              <Divider />

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Completion
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={completionPercent}
                  sx={{ height: 7, borderRadius: 999 }}
                />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {completionPercent}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {TASK_STATUS_LABELS[task?.status] || task?.status || ""}
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Status History
              </Typography>
              <MuiTimeline
                items={statusHistoryItems}
                dense
                emptyMessage="No status history available yet."
                showOpposite={false}
              />
            </Stack>
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );
};

TaskOverviewTab.propTypes = {
  task: PropTypes.object.isRequired,
  overview: PropTypes.object,
  statusHistoryItems: PropTypes.arrayOf(PropTypes.object),
};

TaskOverviewTab.defaultProps = {
  overview: null,
  statusHistoryItems: [],
};

export default TaskOverviewTab;

