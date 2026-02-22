import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiActionColumn } from "../reusable";
import { USER_ROLES, USER_STATUS } from "../../utils/constants";

/**
 * Renders a user row in list-card mode.
 *
 * @param {{
 *   row: Record<string, unknown>;
 *   can: (resource: string, operation: string, options?: Record<string, unknown>) => boolean;
 *   onView: () => void;
 *   onEdit: () => void;
 *   onDelete: () => void;
 *   onRestore: () => void;
 * }} props - Component props.
 * @returns {JSX.Element} User list card.
 * @throws {never} This component does not throw.
 */
const UserListCard = ({ row, can, onView, onEdit, onDelete, onRestore }) => {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.25} alignItems="center" textAlign="center">
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={row.profilePicture?.url || undefined}
              alt={row.fullName}
              sx={{ width: 72, height: 72 }}
            >
              {String(row.fullName || "U")
                .split(" ")
                .slice(0, 2)
                .map((token) => token.charAt(0))
                .join("")}
            </Avatar>
            <Box
              sx={{
                position: "absolute",
                right: 2,
                bottom: 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                bgcolor:
                  row.status === USER_STATUS.ACTIVE
                    ? "success.main"
                    : "grey.400",
                border: 2,
                borderColor: "background.paper",
              }}
            />
          </Box>

          <Stack spacing={0.25} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {row.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.position || "Team Member"}
            </Typography>
            <Chip
              size="small"
              label={row.role}
              color={
                row.role === USER_ROLES.ADMIN
                  ? "secondary"
                  : row.role === USER_ROLES.MANAGER
                    ? "primary"
                    : "default"
              }
            />
          </Stack>

          <Divider sx={{ width: "100%" }} />

          <Typography variant="body2" color="text.secondary">
            {row.department?.name || "N/A"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {row.email}
          </Typography>

          <MuiActionColumn
            row={row}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            canView={can("User", "read", {
              target: {
                organization: row.organization?.id,
                department: row.department?.id,
              },
              params: { userId: row.id },
            })}
            canUpdate={can("User", "update", {
              target: {
                id: row.id,
                organization: row.organization?.id,
                department: row.department?.id,
              },
              params: { userId: row.id },
            })}
            canDelete={can("User", "delete", {
              target: {
                organization: row.organization?.id,
                department: row.department?.id,
              },
              params: { userId: row.id },
            })}
            canRestore={can("User", "delete", {
              target: {
                organization: row.organization?.id,
                department: row.department?.id,
              },
              params: { userId: row.id },
            })}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

UserListCard.propTypes = {
  row: PropTypes.object.isRequired,
  can: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};

export default UserListCard;

