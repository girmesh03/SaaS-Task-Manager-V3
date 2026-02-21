/**
 * @file Department domain DataGrid column definitions.
 */

import React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiActionColumn, MuiAvatarStack, MuiChip } from "../reusable";

/**
 * Resolves compact department code fallback.
 *
 * @param {Record<string, unknown>} row - Department row.
 * @returns {string} Displayable department code.
 * @throws {never} This helper does not throw.
 */
const getDepartmentCode = (row) => {
  if (row.departmentCode) {
    return String(row.departmentCode);
  }

  const rawId = String(row.id || row._id || "");
  if (!rawId) {
    return "DEP-000";
  }

  return `DEP-${rawId.slice(-3).toUpperCase()}`;
};

/**
 * Builds member-preview list for avatar-stack rendering.
 *
 * @param {Record<string, unknown>} row - Department row.
 * @returns {Array<Record<string, unknown>>} Preview members.
 * @throws {never} This helper does not throw.
 */
const getMemberPreview = (row) => {
  if (Array.isArray(row.membersPreview) && row.membersPreview.length) {
    return row.membersPreview;
  }

  if (Array.isArray(row.members) && row.members.length) {
    return row.members;
  }

  if (Array.isArray(row.users) && row.users.length) {
    return row.users;
  }

  return row.manager ? [row.manager] : [];
};

/**
 * Builds Departments list DataGrid columns.
 *
 * @param {{
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   formatDateTime: (value: string | Date | number) => string;
 *   navigate: (to: string) => void;
 *   openEditDialog: (row: Record<string, unknown>) => void;
 *   openConfirmDialog: (mode: "delete" | "restore", row: Record<string, unknown>) => void;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} Department columns.
 * @throws {never} This helper does not throw.
 */
export const createDepartmentsColumns = ({
  can,
  formatDateTime,
  navigate,
  openEditDialog,
  openConfirmDialog,
}) => {
  return [
    {
      field: "name",
      headerName: "Name",
      flex: 1.25,
      maxWidth: 350,
      renderCell: ({ row }) =>
        React.createElement(
          Stack,
          {
            direction: "row",
            spacing: 1.25,
            alignItems: "center",
            sx: { minWidth: 0, py: 0.5 },
          },
          React.createElement(Box, {
            sx: {
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "uppercase",
            },
            children: String(row.name || "DP")
              .split(" ")
              .slice(0, 2)
              .map((token) => token.charAt(0))
              .join(""),
          }),
          React.createElement(
            Box,
            { sx: { minWidth: 0 } },
            React.createElement(Typography, {
              variant: "body2",
              sx: {
                fontWeight: 600,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              children: row.name || "Department",
            }),
            React.createElement(Typography, {
              variant: "caption",
              color: "text.secondary",
              sx: {
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              },
              children: `ID: ${getDepartmentCode(row)}`,
            })
          )
        ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.35,
      maxWidth: 420,
      renderCell: ({ row }) =>
        React.createElement(Typography, {
          variant: "body2",
          color: "text.secondary",
          sx: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          children: row.description || "-",
        }),
    },
    {
      field: "managerName",
      headerName: "Manager",
      flex: 0.95,
      maxWidth: 260,
      valueGetter: (_value, row) => row.manager?.fullName || "N/A",
      renderCell: ({ row }) =>
        row.manager
          ? React.createElement(
              Stack,
              { direction: "row", spacing: 1, alignItems: "center", sx: { minWidth: 0 } },
              React.createElement(Avatar, {
                src: row.manager.avatarUrl || row.manager.profilePicture || undefined,
                alt: row.manager.fullName || "Manager",
                sx: { width: 28, height: 28, fontSize: "0.75rem" },
                children: String(row.manager.fullName || "M")
                  .split(" ")
                  .slice(0, 2)
                  .map((token) => token.charAt(0))
                  .join(""),
              }),
              React.createElement(Typography, {
                variant: "body2",
                sx: {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontWeight: 500,
                },
                children: row.manager.fullName,
              })
            )
          : React.createElement(Typography, {
              variant: "body2",
              color: "text.secondary",
              children: "Unassigned",
            }),
    },
    {
      field: "memberCount",
      headerName: "Users",
      flex: 0.95,
      maxWidth: 210,
      renderCell: ({ row }) =>
        React.createElement(
          Stack,
          { direction: "row", spacing: 1, alignItems: "center" },
          React.createElement(MuiAvatarStack, {
            users: getMemberPreview(row),
            max: 3,
            size: 28,
          }),
          React.createElement(Typography, {
            variant: "body2",
            color: "text.secondary",
            children: row.memberCount || 0,
          })
        ),
    },
    {
      field: "taskCount",
      headerName: "Tasks",
      flex: 0.6,
      maxWidth: 140,
      renderCell: ({ row }) =>
        React.createElement(MuiChip, {
          label: `${row.taskCount || 0} Open`,
          color: Number(row.taskCount || 0) > 0 ? "info" : "default",
          size: "small",
          sx: { fontWeight: 600 },
        }),
    },
    {
      field: "createdAt",
      headerName: "Created Date",
      flex: 0.9,
      maxWidth: 220,
      valueGetter: (_value, row) =>
        row.createdAt ? formatDateTime(row.createdAt) : "",
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
          onView: () => navigate(`/dashboard/departments/${row.id}`),
          onEdit: () => openEditDialog(row),
          onDelete: () => openConfirmDialog("delete", row),
          onRestore: () => openConfirmDialog("restore", row),
          canView: can("Department", "read", {
            target: { organization: row.organization?.id, department: row.id },
          }),
          canUpdate: can("Department", "update", {
            target: { organization: row.organization?.id, department: row.id },
          }),
          canDelete: can("Department", "delete", {
            target: { organization: row.organization?.id, department: row.id },
          }),
          canRestore: can("Department", "delete", {
            target: { organization: row.organization?.id, department: row.id },
          }),
        }),
    },
  ];
};

/**
 * Builds department details member table columns.
 *
 * @param {{
 *   formatDateTime: (value: string | Date | number) => string;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} Member columns.
 * @throws {never} This helper does not throw.
 */
export const createDepartmentMemberColumns = ({ formatDateTime }) => {
  return [
    { field: "fullName", headerName: "Member", flex: 1.1, maxWidth: 320 },
    { field: "email", headerName: "Email", flex: 1.2, maxWidth: 360 },
    { field: "role", headerName: "Role", flex: 0.8, maxWidth: 190 },
    { field: "status", headerName: "Status", flex: 0.75, maxWidth: 170 },
    {
      field: "joinedAt",
      headerName: "Joined",
      flex: 0.9,
      maxWidth: 220,
      valueGetter: (_value, row) =>
        row.joinedAt ? formatDateTime(row.joinedAt) : "",
    },
  ];
};

/**
 * Builds department details task table columns.
 *
 * @param {{
 *   formatDateTime: (value: string | Date | number) => string;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} Task columns.
 * @throws {never} This helper does not throw.
 */
export const createDepartmentTaskColumns = ({ formatDateTime }) => {
  return [
    { field: "title", headerName: "Task", flex: 1.2, maxWidth: 380 },
    { field: "type", headerName: "Type", flex: 0.8, maxWidth: 200 },
    { field: "priority", headerName: "Priority", flex: 0.8, maxWidth: 200 },
    { field: "status", headerName: "Status", flex: 0.8, maxWidth: 200 },
    {
      field: "updatedAt",
      headerName: "Updated",
      flex: 0.9,
      maxWidth: 240,
      valueGetter: (_value, row) =>
        row.updatedAt ? formatDateTime(row.updatedAt) : "",
    },
  ];
};

export default {
  createDepartmentsColumns,
  createDepartmentMemberColumns,
  createDepartmentTaskColumns,
};
