/**
 * MuiActionColumn Component
 * Reusable action column for data grids with View, Edit, Delete, and Restore actions
 *
 * Features:
 * - View action (navigates to detail page)
 * - Edit action (opens edit dialog)
 * - Delete action (soft delete with confirmation)
 * - Restore action (restore soft-deleted resource)
 * - Permission-based visibility
 * - Conditional rendering based on isDeleted state
 * - Accessible with ARIA labels
 * - Theme-based styling
 *
 */

import { memo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";

/**
 * MuiActionColumn Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.row - Row data object
 * @param {Function} props.onView - View handler (optional)
 * @param {Function} props.onEdit - Edit handler (optional)
 * @param {Function} props.onDelete - Delete handler (optional)
 * @param {Function} props.onRestore - Restore handler (optional)
 * @param {boolean} props.canView - Can view permission
 * @param {boolean} props.canUpdate - Can update permission
 * @param {boolean} props.canDelete - Can delete permission
 * @param {boolean} props.canRestore - Can restore permission
 * @param {boolean} props.showView - Show view button
 * @param {boolean} props.showEdit - Show edit button
 * @param {boolean} props.showDelete - Show delete button
 * @param {boolean} props.showRestore - Show restore button
 */
const MuiActionColumn = ({
  row,
  onView,
  onEdit,
  onDelete,
  onRestore,
  canView = true,
  canUpdate = true,
  canDelete = true,
  canRestore = true,
  showView = true,
  showEdit = true,
  showDelete = true,
  showRestore = true,
}) => {
  const isDeleted = row?.isDeleted || false;

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {/* View Button */}
      {showView && canView && onView && (
        <Tooltip title="View" arrow>
          <IconButton
            size="small"
            onClick={() => onView(row)}
            aria-label="View"
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Edit Button - Only show if not deleted */}
      {showEdit && canUpdate && !isDeleted && onEdit && (
        <Tooltip title="Edit" arrow>
          <IconButton
            size="small"
            onClick={() => onEdit(row)}
            aria-label="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Button - Only show if not deleted */}
      {showDelete && canDelete && !isDeleted && onDelete && (
        <Tooltip title="Delete" arrow>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(row)}
            aria-label="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Restore Button - Only show if deleted */}
      {showRestore && canRestore && isDeleted && onRestore && (
        <Tooltip title="Restore" arrow>
          <IconButton
            size="small"
            color="success"
            onClick={() => onRestore(row)}
            aria-label="Restore"
          >
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

MuiActionColumn.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRestore: PropTypes.func,
  canView: PropTypes.bool,
  canUpdate: PropTypes.bool,
  canDelete: PropTypes.bool,
  canRestore: PropTypes.bool,
  showView: PropTypes.bool,
  showEdit: PropTypes.bool,
  showDelete: PropTypes.bool,
  showRestore: PropTypes.bool,
};

export default memo(MuiActionColumn);
