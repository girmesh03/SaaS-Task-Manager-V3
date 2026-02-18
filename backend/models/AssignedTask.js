/**
 * @file AssignedTask discriminator model.
 */
import mongoose from "mongoose";
import { TASK_TYPE, VALIDATION_LIMITS } from "../utils/constants.js";
import Task from "./Task.js";

const { Schema } = mongoose;

const assignedTaskSchema = new Schema({
  assignees: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    required: [true, "At least one assignee is required"],
    validate: [
      {
        validator: (value) =>
          Array.isArray(value) &&
          value.length >= VALIDATION_LIMITS.TASK.ASSIGNEES_MIN &&
          value.length <= VALIDATION_LIMITS.TASK.ASSIGNEES_MAX,
        message: "Assigned tasks require between 1 and 50 assignees",
      },
      {
        validator: (value) => {
          if (!Array.isArray(value)) {
            return false;
          }

          const ids = value.map((item) => item.toString());
          return new Set(ids).size === ids.length;
        },
        message: "Assignees must be unique",
      },
    ],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required for assigned tasks"],
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required for assigned tasks"],
    validate: {
      validator: function isDueDateAfterStartDate(value) {
        if (!value || !this.startDate) {
          return true;
        }

        return value.getTime() > this.startDate.getTime();
      },
      message: "Due date must be after start date",
    },
  },
});

assignedTaskSchema.index({ organization: 1, department: 1, dueDate: 1 });
assignedTaskSchema.index({ assignees: 1 });

const existing = Task.discriminators?.[TASK_TYPE.ASSIGNED];
const AssignedTask = existing || Task.discriminator(TASK_TYPE.ASSIGNED, assignedTaskSchema);

export default AssignedTask;
