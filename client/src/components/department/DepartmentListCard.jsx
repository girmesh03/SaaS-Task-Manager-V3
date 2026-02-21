import { memo, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import { MuiAvatarStack } from "../reusable";

const DEPARTMENT_VISUALS = [
  {
    match: /engineer|develop/i,
    Icon: CodeRoundedIcon,
    paletteColor: "primary",
  },
  {
    match: /design|product/i,
    Icon: PaletteRoundedIcon,
    paletteColor: "secondary",
  },
  {
    match: /market|brand|content/i,
    Icon: CampaignRoundedIcon,
    paletteColor: "warning",
  },
  {
    match: /sales|growth|business/i,
    Icon: TrendingUpRoundedIcon,
    paletteColor: "success",
  },
  {
    match: /human|resource|people|hr/i,
    Icon: Groups2RoundedIcon,
    paletteColor: "error",
  },
  {
    match: /operations|logistics|process/i,
    Icon: SettingsSuggestRoundedIcon,
    paletteColor: "info",
  },
];

/**
 * Resolves deterministic department card accent style.
 *
 * @param {string} departmentName - Department name.
 * @returns {{
 *   Icon: import("@mui/icons-material").SvgIconComponent;
 *   paletteColor: "primary" | "secondary" | "warning" | "success" | "error" | "info";
 * }} Visual style metadata.
 * @throws {never} This helper does not throw.
 */
const getDepartmentVisual = (departmentName) => {
  const normalizedName = String(departmentName || "");
  const direct = DEPARTMENT_VISUALS.find((item) => item.match.test(normalizedName));
  if (direct) {
    return direct;
  }

  return {
    Icon: ApartmentRoundedIcon,
    paletteColor: "primary",
  };
};

/**
 * Builds compact initials from a label.
 *
 * @param {string} label - Name-like label.
 * @returns {string} Initials.
 * @throws {never} This helper does not throw.
 */
const getInitials = (label) =>
  String(label || "U")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

/**
 * Builds synthetic team avatars when the backend does not return team preview members.
 *
 * @param {{
 *   id?: string;
 *   name?: string;
 *   manager?: { id?: string; fullName?: string; avatarUrl?: string; profilePicture?: string } | null;
 *   memberCount?: number;
 * }} row - Department row.
 * @returns {Array<{ id: string; name: string; avatarUrl?: string; profilePicture?: string }>} Team preview.
 * @throws {never} This helper does not throw.
 */
const buildTeamPreview = (row) => {
  const users = [];
  const rowId = String(row?.id || row?._id || row?.name || "department");
  const memberCount = Number(row?.memberCount || 0);

  if (row?.manager?.fullName) {
    users.push({
      id: String(row.manager.id || `${rowId}-manager`),
      name: row.manager.fullName,
      avatarUrl: row.manager.avatarUrl,
      profilePicture: row.manager.profilePicture,
    });
  }

  if (memberCount > users.length) {
    users.push({
      id: `${rowId}-team-a`,
      name: `${row?.name || "Dept"} Team`,
    });
  }

  if (memberCount > users.length) {
    users.push({
      id: `${rowId}-team-b`,
      name: "Member",
    });
  }

  return users;
};

/**
 * Department card renderer for list-view screen parity.
 *
 * @param {{
 *   row: {
 *     id: string;
 *     name: string;
 *     description?: string;
 *     manager?: { fullName?: string; avatarUrl?: string; profilePicture?: string } | null;
 *     memberCount?: number;
 *     taskCount?: number;
 *     activeTaskCount?: number;
 *     isDeleted?: boolean;
 *   };
 *   onView?: () => void;
 *   onEdit?: () => void;
 *   onDelete?: () => void;
 *   onRestore?: () => void;
 *   canView?: boolean;
 *   canUpdate?: boolean;
 *   canDelete?: boolean;
 *   canRestore?: boolean;
 * }} props - Card props.
 * @returns {JSX.Element} Department list card.
 * @throws {never} This component does not throw.
 */
const DepartmentListCard = ({
  row,
  onView,
  onEdit,
  onDelete,
  onRestore,
  canView = true,
  canUpdate = true,
  canDelete = true,
  canRestore = true,
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const visual = useMemo(() => getDepartmentVisual(row?.name), [row?.name]);
  const teamPreview = useMemo(() => buildTeamPreview(row), [row]);
  const managerName = row?.manager?.fullName || "Unassigned";
  const activeTasks = Number(row?.activeTaskCount ?? row?.taskCount ?? 0);
  const totalTasks = Math.max(Number(row?.taskCount || 0), 1);
  const progressValue = Math.max(
    0,
    Math.min(100, Math.round((activeTasks / totalTasks) * 100)),
  );
  const extraTeamCount = Math.max(
    Number(row?.memberCount || 0) - teamPreview.length,
    0,
  );

  const closeMenu = () => setMenuAnchor(null);
  const openMenu = (event) => setMenuAnchor(event.currentTarget);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          borderRadius: 2,
          borderColor: "divider",
          bgcolor: "background.paper",
          opacity: row?.isDeleted ? 0.65 : 1,
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.5,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: (theme) =>
                      alpha(theme.palette[visual.paletteColor].main, 0.12),
                    color: (theme) => theme.palette[visual.paletteColor].main,
                    flexShrink: 0,
                  }}
                >
                <visual.Icon fontSize="small" />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row?.name || "Department"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {row?.description || "No department summary provided."}
                </Typography>
              </Box>

              <IconButton
                size="small"
                aria-label="Department actions"
                onClick={openMenu}
                sx={{ mt: -0.25 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: 62,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {row?.description || "No description provided for this department."}
            </Typography>

            <Divider sx={{ borderStyle: "dashed", borderColor: "divider" }} />

            <Stack direction="row" spacing={1.25}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.66rem" }}
                >
                  MANAGER
                </Typography>
                <Stack direction="row" spacing={0.9} alignItems="center" sx={{ mt: 0.6 }}>
                  <Avatar
                    src={row?.manager?.avatarUrl || row?.manager?.profilePicture || undefined}
                    alt={managerName}
                    sx={{ width: 26, height: 26, fontSize: "0.75rem" }}
                  >
                    {getInitials(managerName)}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {managerName}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.66rem" }}
                >
                  TEAM
                </Typography>
                <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.6 }}>
                  <MuiAvatarStack users={teamPreview} size={28} max={3} />
                  {extraTeamCount > 0 ? (
                    <Box
                      sx={{
                        px: 0.9,
                        py: 0.2,
                        borderRadius: 999,
                        bgcolor: "grey.100",
                        color: "text.secondary",
                        fontWeight: 700,
                        fontSize: "0.74rem",
                        lineHeight: 1.4,
                      }}
                    >
                      +{extraTeamCount}
                    </Box>
                  ) : null}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ borderStyle: "dashed", borderColor: "divider" }} />

            <Stack spacing={0.7}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.72rem" }}
                >
                  Tasks Progress
                </Typography>
                <Stack direction="row" spacing={0.55} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: `${visual.paletteColor}.main`,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {activeTasks} Active
                  </Typography>
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    bgcolor: `${visual.paletteColor}.main`,
                  },
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {canView ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onView?.();
            }}
          >
            View
          </MenuItem>
        ) : null}
        {!row?.isDeleted && canUpdate ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit?.();
            }}
          >
            Edit
          </MenuItem>
        ) : null}
        {!row?.isDeleted && canDelete ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete?.();
            }}
          >
            Delete
          </MenuItem>
        ) : null}
        {row?.isDeleted && canRestore ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onRestore?.();
            }}
          >
            Restore
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
};

DepartmentListCard.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    manager: PropTypes.shape({
      id: PropTypes.string,
      fullName: PropTypes.string,
      avatarUrl: PropTypes.string,
      profilePicture: PropTypes.string,
    }),
    memberCount: PropTypes.number,
    taskCount: PropTypes.number,
    activeTaskCount: PropTypes.number,
    isDeleted: PropTypes.bool,
  }).isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRestore: PropTypes.func,
  canView: PropTypes.bool,
  canUpdate: PropTypes.bool,
  canDelete: PropTypes.bool,
  canRestore: PropTypes.bool,
};

export default memo(DepartmentListCard);
