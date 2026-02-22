import { useMemo } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Controller, useForm } from "react-hook-form";
import { MaterialSelectAutocomplete } from "../material";
import { MuiDialog, MuiTextField } from "../reusable";

const DEFAULT_VALUES = Object.freeze({
  activity: "",
  materials: [],
});

/**
 * Dialog for adding a task activity note.
 *
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onSubmit: (values: { activity: string; materials: Array<{ materialId: string; quantity: number }> }) => void;
 *   isMutating: boolean;
 *   materialOptions: Array<{ value: string; label: string }>;
 * }} props - Component props.
 * @returns {JSX.Element} Dialog renderer.
 * @throws {never} This component does not throw.
 */
const TaskAddActivityDialog = ({
  open,
  onClose,
  onSubmit,
  isMutating,
  materialOptions,
}) => {
  const form = useForm({ defaultValues: DEFAULT_VALUES });

  const materialMap = useMemo(() => {
    const map = new Map();
    (materialOptions || []).forEach((entry) => map.set(entry.value, entry));
    return map;
  }, [materialOptions]);

  return (
    <MuiDialog
      open={open}
      onClose={() => {
        form.reset(DEFAULT_VALUES);
        onClose();
      }}
      title="Add Note"
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              form.reset(DEFAULT_VALUES);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={isMutating}
            onClick={form.handleSubmit((values) => onSubmit(values))}
          >
            Add Note
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        <MuiTextField
          placeholder="Describe the update..."
          multiline
          minRows={3}
          {...form.register("activity", {
            required: "Activity description is required",
            minLength: { value: 2, message: "Activity must be at least 2 characters" },
            maxLength: { value: 1000, message: "Activity must be under 1000 characters" },
          })}
          error={form.formState.errors.activity}
          helperText={form.formState.errors.activity?.message}
        />

        <Divider />

        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Materials Used (Optional)
            </Typography>

            <Controller
              name="materials"
              control={form.control}
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
                        Material stock is validated and updated by the backend.
                      </Typography>
                    ) : (
                      <Stack spacing={0.75}>
                        {materials.map((entry) => {
                          const meta = materialMap.get(entry.materialId);
                          const quantityValue = Number(entry?.quantity || 0);
                          return (
                            <Stack
                              key={entry.materialId}
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ xs: "stretch", sm: "center" }}
                              justifyContent="space-between"
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {meta?.label || entry.materialId}
                              </Typography>
                              <Stack direction="row" spacing={0.75} alignItems="center">
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
    </MuiDialog>
  );
};

TaskAddActivityDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isMutating: PropTypes.bool,
  materialOptions: PropTypes.arrayOf(PropTypes.object),
};

TaskAddActivityDialog.defaultProps = {
  isMutating: false,
  materialOptions: [],
};

export default TaskAddActivityDialog;
