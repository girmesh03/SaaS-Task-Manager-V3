/**
 * @file ProjectTask discriminator model.
 */
import mongoose from "mongoose";
import { TASK_TYPE } from "../utils/constants.js";
import Task from "./Task.js";

const { Schema } = mongoose;

const projectTaskSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: [true, "Vendor is required for project tasks"],
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required for project tasks"],
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required for project tasks"],
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

projectTaskSchema.index({ organization: 1, department: 1, dueDate: 1 });

const existing = Task.discriminators?.[TASK_TYPE.PROJECT];
const ProjectTask = existing || Task.discriminator(TASK_TYPE.PROJECT, projectTaskSchema);

export default ProjectTask;
