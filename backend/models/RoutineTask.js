/**
 * @file RoutineTask discriminator model.
 */
import mongoose from "mongoose";
import { TASK_TYPE, VALIDATION_LIMITS } from "../utils/constants.js";
import Task from "./Task.js";

const { Schema } = mongoose;

const routineMaterialSchema = new Schema(
  {
    material: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material reference is required when adding materials"],
    },
    quantity: {
      type: Number,
      required: [true, "Material quantity is required when adding materials"],
      min: [VALIDATION_LIMITS.MATERIAL.UNIT_MIN, "Material quantity must be greater than 0"],
    },
  },
  {
    _id: false,
  }
);

const routineTaskSchema = new Schema({
  date: {
    type: Date,
    required: [true, "Date is required for routine tasks"],
    index: true,
  },
  materials: {
    type: [routineMaterialSchema],
    default: [],
    validate: [
      {
        validator: (value) =>
          Array.isArray(value) && value.length <= VALIDATION_LIMITS.TASK.MATERIALS_MAX,
        message: "Routine task materials cannot exceed 20 entries",
      },
      {
        validator: (value) => {
          if (!Array.isArray(value)) {
            return false;
          }

          const ids = value.map((item) => item.material.toString());
          return new Set(ids).size === ids.length;
        },
        message: "Routine task materials must be unique",
      },
    ],
  },
});

routineTaskSchema.index({ organization: 1, department: 1, date: 1 });

const existing = Task.discriminators?.[TASK_TYPE.ROUTINE];
const RoutineTask = existing || Task.discriminator(TASK_TYPE.ROUTINE, routineTaskSchema);

export default RoutineTask;
