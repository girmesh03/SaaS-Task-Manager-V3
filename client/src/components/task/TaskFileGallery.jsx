import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useTimezone } from "../../hooks";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg"]);

const bytesToSize = (value = 0) => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(0)}KB`;
};

const getExtension = (filename = "") => {
  const parts = String(filename).toLowerCase().split(".");
  if (parts.length < 2) return "";
  return `.${parts.pop()}`;
};

const resolveFileIcon = (filename = "", fileType = "") => {
  const extension = getExtension(filename);
  const type = String(fileType || "").toLowerCase();

  if (extension === ".pdf") return PictureAsPdfOutlinedIcon;
  if (extension === ".doc" || extension === ".docx" || type === "document")
    return DescriptionOutlinedIcon;
  if (extension === ".xls" || extension === ".xlsx") return GridOnOutlinedIcon;
  if (type === "audio") return AudiotrackOutlinedIcon;
  if (type === "video") return MovieOutlinedIcon;
  return InsertDriveFileOutlinedIcon;
};

/**
 * Task attachments gallery.
 *
 * @param {{
 *   files: Array<Record<string, unknown>>;
 *   onDelete: (file: Record<string, unknown>) => void;
 *   onRestore: (file: Record<string, unknown>) => void;
 *   canDelete: (file: Record<string, unknown>) => boolean;
 *   canRestore: (file: Record<string, unknown>) => boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Gallery renderer.
 * @throws {never} This component does not throw.
 */
const TaskFileGallery = ({ files, onDelete, onRestore, canDelete, canRestore }) => {
  const { formatDateTime } = useTimezone();

  return (
    <Grid container spacing={2}>
      {(files || []).map((file) => {
        const filename = file.filename || "file";
        const fileUrl = file.fileUrl || "";
        const extension = getExtension(filename);
        const isImage = IMAGE_EXTENSIONS.has(extension);
        const isDeleted = Boolean(file.isDeleted);
        const Icon = resolveFileIcon(filename, file.fileType);

        return (
          <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                opacity: isDeleted ? 0.6 : 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {isImage ? (
                <CardMedia
                  component="img"
                  height="150"
                  image={fileUrl}
                  alt={filename}
                  sx={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <Icon fontSize="large" color="action" />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={0.35}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={filename}
                  >
                    {filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bytesToSize(file.fileSize)} •{" "}
                    {file.createdAt ? formatDateTime(file.createdAt) : "N/A"}
                  </Typography>
                  {file.uploadedBy?.fullName ? (
                    <Typography variant="caption" color="text.secondary">
                      Uploaded by {file.uploadedBy.fullName}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewOutlinedIcon fontSize="small" />}
                    onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
                    disabled={!fileUrl}
                    sx={{ flex: 1 }}
                  >
                    Open
                  </Button>

                  {isDeleted ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<RestoreOutlinedIcon fontSize="small" />}
                      onClick={() => onRestore(file)}
                      disabled={!canRestore(file)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
                      onClick={() => onDelete(file)}
                      disabled={!canDelete(file)}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

TaskFileGallery.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object),
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  canDelete: PropTypes.func.isRequired,
  canRestore: PropTypes.func.isRequired,
};

TaskFileGallery.defaultProps = {
  files: [],
};

export default TaskFileGallery;

