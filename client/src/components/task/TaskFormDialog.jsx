import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import TitleOutlinedIcon from "@mui/icons-material/TitleOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import { Controller } from "react-hook-form";
import {
  MuiDialog,
  MuiMultiSelect,
  MuiSelectAutocomplete,
  MuiTextField,
  MuiToggleButton,
} from "../reusable";
import { MaterialSelectAutocomplete } from "../material";
import { VendorSelectAutocomplete } from "../vendor";
import {
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_TYPE,
} from "../../utils/constants";

const TYPE_OPTIONS = [
  { value: TASK_TYPE.PROJECT, label: "Project" },
  { value: TASK_TYPE.ASSIGNED, label: "Assigned" },
  { value: TASK_TYPE.ROUTINE, label: "Routine" },
];

const STATUS_OPTIONS = Object.values(TASK_STATUS).map((value) => ({
  label: TASK_STATUS_LABELS[value] || value,
  value,
}));

const PRIORITY_OPTIONS = Object.values(TASK_PRIORITY).map((value) => ({
  label: TASK_PRIORITY_LABELS[value] || value,
  value,
}));

const normalizeTag = (value) => String(value || "").trim().toLowerCase();

/**
 * Task create/update dialog.
 *
 * @param {object} props - Component props.
 * @returns {JSX.Element} Task form dialog.
 * @throws {never} Component rendering does not throw.
 */
const TaskFormDialog = ({
  open,
  onClose,
  isEditing,
  taskType,
  onTaskTypeChange,
  typeOptions,
  taskForm,
  isMutating,
  onSubmit,
  userOptions,
  vendorOptions,
  materialOptions,
}) => {
  const [tagInput, setTagInput] = useState("");

  const materialMap = useMemo(() => {
    const map = new Map();
    materialOptions.forEach((entry) => {
      map.set(entry.value, entry);
    });
    return map;
  }, [materialOptions]);

  const canChangeType = !isEditing;
  const resolvedTypeOptions = Array.isArray(typeOptions) && typeOptions.length
    ? typeOptions
    : TYPE_OPTIONS;

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Update Task" : "Create New Task"}
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={taskForm.handleSubmit((values) =>
              onSubmit({
                ...values,
                type: taskType,
              }),
            )}
            disabled={isMutating}
          >
            {isEditing ? "Update Task" : "Create Task"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {isEditing
            ? "Update task information and workflow state."
            : "Create a new task for your department."}
        </Typography>

        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Task Type
          </Typography>
          <MuiToggleButton
            value={taskType}
            onChange={(_event, nextValue) => {
              if (!nextValue || !canChangeType) return;
              onTaskTypeChange?.(nextValue);
            }}
            options={resolvedTypeOptions.map((option) => ({
              ...option,
              disabled: Boolean(option.disabled) || !canChangeType,
            }))}
            size="small"
            color="primary"
          />
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Core Details
          </Typography>
            <Grid container spacing={1.25}>
            <Grid size={{ xs: 12 }}>
              <MuiTextField
                placeholder="e.g. Boiler maintenance"
                {...taskForm.register("title", { required: "Task title is required" })}
                startAdornment={<TitleOutlinedIcon fontSize="small" />}
                error={taskForm.formState.errors.title}
                reserveHelperTextSpace={false}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MuiTextField
                placeholder="Describe the task requirements..."
                multiline
                minRows={3}
                {...taskForm.register("description", {
                  required: "Task description is required",
                })}
                error={taskForm.formState.errors.description}
                reserveHelperTextSpace={false}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={taskForm.control}
                render={({ field }) => (
                  <MuiSelectAutocomplete
                    value={field.value || TASK_STATUS.TODO}
                    onChange={(_event, value) => field.onChange(value || "")}
                    options={STATUS_OPTIONS}
                    valueMode="id"
                    placeholder="Select status"
                    startAdornment={<WidgetsOutlinedIcon fontSize="small" />}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="priority"
                control={taskForm.control}
                rules={{ required: "Priority is required" }}
                render={({ field }) => (
                  <MuiSelectAutocomplete
                    value={field.value || ""}
                    onChange={(_event, value) => field.onChange(value || "")}
                    options={PRIORITY_OPTIONS}
                    valueMode="id"
                    placeholder="Select priority"
                    startAdornment={<WidgetsOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.priority}
                    helperText={taskForm.formState.errors.priority?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Tags
          </Typography>
          <Controller
            name="tags"
            control={taskForm.control}
            render={({ field }) => {
              const tags = Array.isArray(field.value) ? field.value : [];
              const addTag = () => {
                const value = normalizeTag(tagInput);
                if (!value) return;
                if (tags.includes(value) || tags.length >= 5) {
                  return;
                }
                field.onChange([...tags, value]);
                setTagInput("");
              };
              const removeTag = (value) => {
                field.onChange(tags.filter((entry) => entry !== value));
              };

              return (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        size="small"
                        label={tag}
                        onDelete={() => removeTag(tag)}
                      />
                    ))}
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <MuiTextField
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Add tag"
                      startAdornment={<SellOutlinedIcon fontSize="small" />}
                      reserveHelperTextSpace={false}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
                      onClick={addTag}
                      disabled={!tagInput || tags.length >= 5}
                      sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                    >
                      Add
                    </Button>
                  </Stack>
                </Stack>
              );
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Max 5 tags. Tags are normalized to lowercase.
          </Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Watchers
          </Typography>
          <Controller
            name="watchers"
            control={taskForm.control}
            render={({ field }) => (
              <MuiMultiSelect
                value={field.value || []}
                onChange={(_event, value) =>
                  field.onChange(
                    (value || []).map((item) =>
                      typeof item === "object" ? item.value : item,
                    ),
                  )
                }
                options={userOptions}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value ===
                  (typeof value === "object" ? value.value : value)
                }
                placeholder="Select watchers"
                startAdornment={<PeopleAltOutlinedIcon fontSize="small" />}
              />
            )}
          />
        </Stack>

        {taskType === TASK_TYPE.PROJECT ? (
          <>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Project Details
              </Typography>
              <Grid container spacing={1.25}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="vendorId"
                    control={taskForm.control}
                    rules={{ required: "vendorId is required for project tasks" }}
                    render={({ field }) => (
                      <VendorSelectAutocomplete
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value || "")}
                        options={vendorOptions}
                        error={taskForm.formState.errors.vendorId}
                        helperText={taskForm.formState.errors.vendorId?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MuiTextField
                    type="date"
                    {...taskForm.register("startDate", {
                      required: "startDate is required for project tasks",
                    })}
                    startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.startDate}
                    helperText="Start date"
                    reserveHelperTextSpace={false}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MuiTextField
                    type="date"
                    {...taskForm.register("dueDate", {
                      required: "dueDate is required for project tasks",
                      validate: (value) => {
                        const startDate = taskForm.getValues("startDate");
                        if (!startDate || !value) {
                          return true;
                        }

                        if (new Date(value).getTime() <= new Date(startDate).getTime()) {
                          return "dueDate must be after startDate";
                        }

                        return true;
                      },
                    })}
                    startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.dueDate}
                    helperText="Due date"
                    reserveHelperTextSpace={false}
                  />
                </Grid>
              </Grid>
            </Stack>
          </>
        ) : null}

        {taskType === TASK_TYPE.ASSIGNED ? (
          <>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Assignment
              </Typography>
              <Controller
                name="assigneeIds"
                control={taskForm.control}
                rules={{
                  validate: (value) =>
                    Array.isArray(value) && value.length > 0
                      ? true
                      : "assigneeIds are required for assigned tasks",
                }}
                render={({ field }) => (
                  <MuiMultiSelect
                    value={field.value || []}
                    onChange={(_event, value) =>
                      field.onChange(
                        (value || []).map((item) =>
                          typeof item === "object" ? item.value : item,
                        ),
                      )
                    }
                    options={userOptions}
                    getOptionValue={(option) => option.value}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value ===
                      (typeof value === "object" ? value.value : value)
                    }
                    placeholder="Select assignees"
                    startAdornment={<PeopleAltOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.assigneeIds}
                    helperText={taskForm.formState.errors.assigneeIds?.message}
                  />
                )}
              />
              <Grid container spacing={1.25}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MuiTextField
                    type="date"
                    {...taskForm.register("startDate", {
                      required: "startDate is required for assigned tasks",
                    })}
                    startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.startDate}
                    helperText="Start date"
                    reserveHelperTextSpace={false}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MuiTextField
                    type="date"
                    {...taskForm.register("dueDate", {
                      required: "dueDate is required for assigned tasks",
                      validate: (value) => {
                        const startDate = taskForm.getValues("startDate");
                        if (!startDate || !value) {
                          return true;
                        }

                        if (new Date(value).getTime() <= new Date(startDate).getTime()) {
                          return "dueDate must be after startDate";
                        }

                        return true;
                      },
                    })}
                    startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
                    error={taskForm.formState.errors.dueDate}
                    helperText="Due date"
                    reserveHelperTextSpace={false}
                  />
                </Grid>
              </Grid>
            </Stack>
          </>
        ) : null}

        {taskType === TASK_TYPE.ROUTINE ? (
          <>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Routine Details
              </Typography>
              <MuiTextField
                type="date"
                {...taskForm.register("date", {
                  required: "date is required for routine tasks",
                })}
                startAdornment={<CalendarMonthOutlinedIcon fontSize="small" />}
                error={taskForm.formState.errors.date}
                helperText="Date"
                reserveHelperTextSpace={false}
              />

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Materials
                  </Typography>

                  <Controller
                    name="materials"
                    control={taskForm.control}
                    render={({ field }) => {
                      const materials = Array.isArray(field.value) ? field.value : [];
                      const selectedMaterialIds = materials
                        .map((entry) => String(entry?.materialId || ""))
                        .filter(Boolean);

                      return (
                        <Stack spacing={1}>
                          <MaterialSelectAutocomplete
                            value={selectedMaterialIds}
                            onChange={(nextIds) => {
                              const uniqueIds = Array.from(
                                new Set((Array.isArray(nextIds) ? nextIds : []).filter(Boolean)),
                              );

                              const nextMaterials = uniqueIds.map((materialId) => {
                                const existing = materials.find(
                                  (entry) => entry.materialId === materialId,
                                );
                                if (existing) {
                                  return existing;
                                }

                                return { materialId, quantity: 1 };
                              });

                              field.onChange(nextMaterials);
                            }}
                            options={materialOptions}
                          />

                          {materials.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              No materials selected. Inventory deltas apply when materials are set.
                            </Typography>
                          ) : (
                            <Stack spacing={0.75}>
                              {materials.map((entry) => {
                                const materialMeta = materialMap.get(entry.materialId);
                                const quantityValue = Number(entry?.quantity || 0);
                                return (
                                  <Stack
                                    key={entry.materialId}
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    alignItems={{ xs: "stretch", sm: "center" }}
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {materialMeta?.label || entry.materialId}
                                    </Typography>
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      alignItems="center"
                                    >
                                      <MuiTextField
                                        type="number"
                                        value={Number.isFinite(quantityValue) ? quantityValue : 0}
                                        onChange={(event) => {
                                          const raw = Number(event.target.value || 0);
                                          const nextQuantity = Number.isFinite(raw) && raw > 0 ? raw : 1;
                                          field.onChange(
                                            materials.map((row) =>
                                              row.materialId === entry.materialId
                                                ? { ...row, quantity: nextQuantity }
                                                : row,
                                            ),
                                          );
                                        }}
                                        placeholder="Qty"
                                        inputProps={{ min: 1 }}
                                        reserveHelperTextSpace={false}
                                        sx={{ width: { xs: "100%", sm: 120 } }}
                                      />
                                      <IconButton
                                        size="small"
                                        aria-label="Remove material"
                                        onClick={() =>
                                          field.onChange(
                                            materials.filter(
                                              (row) => row.materialId !== entry.materialId,
                                            ),
                                          )
                                        }
                                      >
                                        <CloseOutlinedIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </Stack>
                                );
                              })}
                            </Stack>
                          )}
                        </Stack>
                      );
                    }}
                  />
                </Stack>
              </Paper>
            </Stack>
          </>
        ) : null}
      </Stack>
    </MuiDialog>
  );
};

TaskFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  taskType: PropTypes.string.isRequired,
  onTaskTypeChange: PropTypes.func.isRequired,
  typeOptions: PropTypes.arrayOf(PropTypes.object),
  taskForm: PropTypes.shape({
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    formState: PropTypes.object.isRequired,
  }).isRequired,
  isMutating: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  userOptions: PropTypes.arrayOf(PropTypes.object),
  vendorOptions: PropTypes.arrayOf(PropTypes.object),
  materialOptions: PropTypes.arrayOf(PropTypes.object),
};

TaskFormDialog.defaultProps = {
  isEditing: false,
  typeOptions: null,
  isMutating: false,
  userOptions: [],
  vendorOptions: [],
  materialOptions: [],
};

export default TaskFormDialog;
