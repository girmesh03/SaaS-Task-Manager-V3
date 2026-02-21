/**
 * @file User domain DataGrid column definitions.
 */

import React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiActionColumn, MuiChip } from "../reusable";
import { USER_ROLES, USER_STATUS } from "../../utils/constants";

/**
 * Returns avatar initials from user identity.
 *
 * @param {Record<string, unknown>} row - User row.
 * @returns {string} Initials fallback.
 * @throws {never} This helper does not throw.
 */
const getUserInitials = (row) => {
  const label = String(row?.fullName || row?.email || "U");
  return label
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");
};

/**
 * Resolves role chip color.
 *
 * @param {string} role - User role.
 * @returns {"default" | "primary" | "secondary"} MUI color token.
 * @throws {never} This helper does not throw.
 */
const getRoleColor = (role) => {
  if (role === USER_ROLES.ADMIN) {
    return "secondary";
  }

  if (role === USER_ROLES.MANAGER) {
    return "primary";
  }

  return "default";
};

/**
 * Builds Users list DataGrid columns.
 *
 * @param {{
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   formatDateTime: (value: string | Date | number) => string;
 *   navigate: (to: string) => void;
 *   openEditDialog: (row: Record<string, unknown>) => void;
 *   openConfirmDialog: (mode: "delete" | "restore", row: Record<string, unknown>) => void;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} Users columns.
 * @throws {never} This helper does not throw.
 */
export const createUsersColumns = ({
  can,
  formatDateTime,
  navigate,
  openEditDialog,
  openConfirmDialog,
}) => {
  return [
    {
      field: "fullName",
      headerName: "User",
      flex: 1.45,
      maxWidth: 420,
      renderCell: ({ row }) =>
        React.createElement(
          Stack,
          {
            direction: "row",
            spacing: 1.25,
            alignItems: "center",
            sx: { minWidth: 0, py: 0.5 },
          },
          React.createElement(Avatar, {
            src: row.avatarUrl || row.profilePicture || undefined,
            alt: row.fullName || "User",
            sx: { width: 34, height: 34, fontSize: "0.85rem" },
            children: getUserInitials(row),
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
              children: row.fullName || "Unknown user",
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
              children: row.email || "-",
            })
          )
        ),
    },
    {
      field: "position",
      headerName: "Position",
      flex: 1,
      maxWidth: 260,
      valueGetter: (_value, row) => row.position || "-",
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      maxWidth: 180,
      renderCell: ({ row }) =>
        React.createElement(MuiChip, {
          label: row.role || USER_ROLES.USER,
          color: getRoleColor(row.role),
          size: "small",
          variant: "filled",
          sx: { fontWeight: 600 },
        }),
    },
    {
      field: "departmentName",
      headerName: "Department",
      flex: 1,
      maxWidth: 260,
      valueGetter: (_value, row) => row.department?.name || "",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.75,
      maxWidth: 160,
      renderCell: ({ row }) => {
        const isActive = row.status === USER_STATUS.ACTIVE;
        return React.createElement(
          Stack,
          { direction: "row", spacing: 0.75, alignItems: "center" },
          React.createElement(Box, {
            sx: {
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: isActive ? "success.main" : "grey.400",
            },
          }),
          React.createElement(Typography, {
            variant: "body2",
            color: "text.secondary",
            children: isActive ? "Active" : "Inactive",
          })
        );
      },
    },
    {
      field: "joinedAt",
      headerName: "Joined Date",
      flex: 0.95,
      maxWidth: 220,
      valueGetter: (_value, row) =>
        row.joinedAt ? formatDateTime(row.joinedAt) : "",
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
          onView: () => navigate(`/dashboard/users/${row.id}`),
          onEdit: () => openEditDialog(row),
          onDelete: () => openConfirmDialog("delete", row),
          onRestore: () => openConfirmDialog("restore", row),
          canView: can("User", "read", {
            target: {
              organization: row.organization?.id,
              department: row.department?.id,
            },
            params: { userId: row.id },
          }),
          canUpdate: can("User", "update", {
            target: {
              id: row.id,
              organization: row.organization?.id,
              department: row.department?.id,
            },
            params: { userId: row.id },
          }),
          canDelete: can("User", "delete", {
            target: {
              organization: row.organization?.id,
              department: row.department?.id,
            },
            params: { userId: row.id },
          }),
          canRestore: can("User", "delete", {
            target: {
              organization: row.organization?.id,
              department: row.department?.id,
            },
            params: { userId: row.id },
          }),
        }),
    },
  ];
};

/**
 * Builds user-details task table columns.
 *
 * @param {{
 *   formatDateTime: (value: string | Date | number) => string;
 * }} dependencies - Column dependency bundle.
 * @returns {import("@mui/x-data-grid").GridColDef[]} User task columns.
 * @throws {never} This helper does not throw.
 */
export const createUserTaskColumns = ({ formatDateTime }) => {
  return [
    { field: "title", headerName: "Task", flex: 1.2, maxWidth: 380 },
    { field: "type", headerName: "Type", flex: 0.8, maxWidth: 200 },
    { field: "status", headerName: "Status", flex: 0.8, maxWidth: 200 },
    { field: "priority", headerName: "Priority", flex: 0.8, maxWidth: 200 },
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
  createUsersColumns,
  createUserTaskColumns,
};
