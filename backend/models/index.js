/**
 * @file Model export surface for phase 2 data contracts.
 * @throws {never} Module initialization does not throw.
 */
import Organization from "./Organization.js";
import Department from "./Department.js";
import User from "./User.js";
import Task from "./Task.js";
import ProjectTask from "./ProjectTask.js";
import AssignedTask from "./AssignedTask.js";
import RoutineTask from "./RoutineTask.js";
import TaskActivity from "./TaskActivity.js";
import TaskComment from "./TaskComment.js";
import Material from "./Material.js";
import Vendor from "./Vendor.js";
import Attachment from "./Attachment.js";
import Notification from "./Notification.js";

/**
 * Current model-layer implementation phase marker.
 * @type {"PHASE_2_SCAFFOLD"}
 */
export const MODEL_LAYER_PHASE = "PHASE_2_SCAFFOLD";

export {
  Organization,
  Department,
  User,
  Task,
  ProjectTask,
  AssignedTask,
  RoutineTask,
  TaskActivity,
  TaskComment,
  Material,
  Vendor,
  Attachment,
  Notification,
};
