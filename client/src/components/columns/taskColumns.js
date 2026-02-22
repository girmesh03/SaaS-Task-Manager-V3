/**
 * @file Task domain DataGrid column definitions.
 */

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiActionColumn, MuiAvatarStack, MuiChip } from "../reusable";
import {
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_TYPE,
} from "../../utils/constants";

const resolveTaskTypeLabel = (type) => {
  if (type === TASK_TYPE.PROJECT) return "Project";
  if (type === TASK_TYPE.ASSIGNED) return "Assigned";
  if (type === TASK_TYPE.ROUTINE) return "Routine";
  return type || "Task";
};

const resolveStatusColor = (status) => {
  if (status === TASK_STATUS.COMPLETED) return "success";
  if (status === TASK_STATUS.IN_PROGRESS) return "info";
  if (status === TASK_STATUS.PENDING) return "warning";
  return "default";
};

const resolvePriorityColor = (priority) => {
  if (priority === TASK_PRIORITY.URGENT) return "error";
  if (priority === TASK_PRIORITY.HIGH) return "warning";
  if (priority === TASK_PRIORITY.MEDIUM) return "info";
  return "default";
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
 * Builds task-list DataGrid columns.
 *
 * @param {{
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   formatDateTime: (value: string | Date | number) => string;
 *   navigate: (to: string) => void;
 *   openEditDialog: (row: Record<string, unknown>) => void;
 *   openConfirmDialog: (mode: "delete" | "restore", row: Record<string, unknown>) => void;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} Task columns.
 * @throws {never} This helper does not throw.
 */
export const createTasksColumns = ({
  can,
  formatDateTime,
  navigate,
  openEditDialog,
  openConfirmDialog,
}) => {
  return [
    {
      field: "title",
      headerName: "Task",
      flex: 1.6,
      maxWidth: 520,
      renderCell: ({ row }) =>
        React.createElement(
          Stack,
          { spacing: 0.15, sx: { minWidth: 0, py: 0.5 } },
          React.createElement(Typography, {
            variant: "body2",
            sx: {
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            children: row.title || "Untitled task",
          }),
          React.createElement(
            Stack,
            { direction: "row", spacing: 0.75, alignItems: "center" },
            React.createElement(Typography, {
              variant: "caption",
              color: "text.secondary",
              sx: { whiteSpace: "nowrap" },
              children: resolveTaskTypeLabel(row.type),
            }),
            React.createElement(Box, {
              sx: {
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "divider",
              },
            }),
            React.createElement(Typography, {
              variant: "caption",
              color: "text.secondary",
              sx: {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              children: row.department?.name || "Department",
            }),
          ),
        ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.75,
      maxWidth: 180,
      renderCell: ({ row }) =>
        React.createElement(MuiChip, {
          label: TASK_STATUS_LABELS[row.status] || row.status || "Status",
          color: resolveStatusColor(row.status),
          size: "small",
          sx: { fontWeight: 600 },
        }),
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 0.75,
      maxWidth: 180,
      renderCell: ({ row }) =>
        React.createElement(MuiChip, {
          label: TASK_PRIORITY_LABELS[row.priority] || row.priority || "Priority",
          color: resolvePriorityColor(row.priority),
          size: "small",
          sx: { fontWeight: 600 },
        }),
    },
    {
      field: "dueDate",
      headerName: "Due / Date",
      flex: 0.95,
      maxWidth: 240,
      valueGetter: (_value, row) => {
        const raw = row.dueDate || row.date || "";
        return raw ? formatDateTime(raw) : "";
      },
    },
    {
      field: "assignees",
      headerName: "Assignees",
      flex: 0.9,
      maxWidth: 220,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const assignees = Array.isArray(row.assignees) ? row.assignees : [];
        if (assignees.length === 0) {
          return React.createElement(Typography, {
            variant: "body2",
            color: "text.secondary",
            children: "-",
          });
        }

        return React.createElement(MuiAvatarStack, {
          users: toAvatarStackUsers(assignees),
          max: 3,
          size: 28,
        });
      },
    },
    {
      field: "counts",
      headerName: "Updates",
      flex: 0.85,
      maxWidth: 240,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        React.createElement(
          Stack,
          { direction: "row", spacing: 0.75, alignItems: "center" },
          React.createElement(MuiChip, {
            label: `A ${row.activitiesCount || 0}`,
            size: "small",
            variant: "outlined",
          }),
          React.createElement(MuiChip, {
            label: `C ${row.commentsCount || 0}`,
            size: "small",
            variant: "outlined",
          }),
          React.createElement(MuiChip, {
            label: `F ${row.attachmentsCount || 0}`,
            size: "small",
            variant: "outlined",
          }),
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.85,
      maxWidth: 210,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        React.createElement(MuiActionColumn, {
          row,
          onView: () => navigate(`/dashboard/tasks/${row.id}`),
          onEdit: () => openEditDialog(row),
          onDelete: () => openConfirmDialog("delete", row),
          onRestore: () => openConfirmDialog("restore", row),
          canView: can("Task", "read", {
            resourceType: row.type,
            target: row,
            params: { taskId: row.id },
          }),
          canUpdate: can("Task", "update", {
            resourceType: row.type,
            target: row,
            params: { taskId: row.id },
          }),
          canDelete: can("Task", "delete", {
            resourceType: row.type,
            target: row,
            params: { taskId: row.id },
          }),
          canRestore: can("Task", "delete", {
            resourceType: row.type,
            target: row,
            params: { taskId: row.id },
          }),
        }),
    },
  ];
};

export default {
  createTasksColumns,
};
