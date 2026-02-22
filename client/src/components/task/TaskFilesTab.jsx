import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
import { MuiDialogConfirm, MuiEmptyState, MuiLoading } from "../reusable";
import TaskFileDropzone from "./TaskFileDropzone";
import TaskFileGallery from "./TaskFileGallery";
import { useAuthorization } from "../../hooks";
import {
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useRestoreAttachmentMutation,
} from "../../services/api";
import { ATTACHMENT_FILE_TYPES } from "../../utils/constants";
import { uploadFileToCloudinary, isCloudinaryConfigured } from "../../utils/cloudinaryUpload";
import { toastApiError } from "../../utils/errorHandling";

const resolveAttachmentFileType = (file) => {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("image/")) return ATTACHMENT_FILE_TYPES[0]; // Image
  if (mime.startsWith("video/")) return ATTACHMENT_FILE_TYPES[1]; // Video
  if (mime.startsWith("audio/")) return ATTACHMENT_FILE_TYPES[3]; // Audio

  const name = String(file?.name || "").toLowerCase();
  if (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".txt")
  ) {
    return ATTACHMENT_FILE_TYPES[2]; // Document
  }

  return ATTACHMENT_FILE_TYPES[4]; // Other
};

/**
 * Task files tab (upload + gallery).
 *
 * @param {{
 *   taskId: string;
 *   files: Array<Record<string, unknown>>;
 *   isLoading: boolean;
 *   isTaskDeleted: boolean;
 *   onRefresh?: () => void;
 * }} props - Component props.
 * @returns {JSX.Element} Files tab.
 * @throws {never} This component does not throw.
 */
const TaskFilesTab = ({ taskId, files, isLoading, isTaskDeleted, onRefresh }) => {
  const { can } = useAuthorization();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    file: null,
  });

  const [createAttachment, createState] = useCreateAttachmentMutation();
  const [deleteAttachment, deleteState] = useDeleteAttachmentMutation();
  const [restoreAttachment, restoreState] = useRestoreAttachmentMutation();

  const isMutating =
    createState.isLoading || deleteState.isLoading || restoreState.isLoading;

  const canUpload = useMemo(() => {
    return can("Attachment", "create", { params: { taskId } });
  }, [can, taskId]);

  const canDeleteFile = useMemo(() => {
    return (file) =>
      can("Attachment", "delete", {
        target: file,
        params: { attachmentId: file?.id },
      });
  }, [can]);

  const canRestoreFile = useMemo(() => {
    return (file) =>
      can("Attachment", "delete", {
        target: file,
        params: { attachmentId: file?.id },
      });
  }, [can]);

  const uploadsConfigured = isCloudinaryConfigured();
  const uploadDisabled = !uploadsConfigured || !canUpload || isTaskDeleted;

  useEffect(() => {
    const error = createState.error || deleteState.error || restoreState.error;
    if (!error) return;
    toastApiError(error);
  }, [createState.error, deleteState.error, restoreState.error]);

  const helperText = !uploadsConfigured
    ? "Uploads are disabled. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
    : isTaskDeleted
      ? "Uploads are disabled while the task is deleted."
      : "SVG, PNG, JPG, or GIF. PDF and DOCX documents supported.";

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", file: null });
  };

  const handleConfirm = async () => {
    const file = confirmState.file;
    if (!file?.id) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreAttachment(file.id).unwrap();
        toast.success("File restored");
      } else {
        await deleteAttachment(file.id).unwrap();
        toast.success("File deleted");
      }

      closeConfirmDialog();
      onRefresh?.();
    } catch (error) {
      toastApiError(error);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={0.25}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Files
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload and manage attachments for this task. No hard deletes.
        </Typography>
      </Stack>

      <TaskFileDropzone
        files={selectedFiles}
        onFilesChange={setSelectedFiles}
        onClear={() => setSelectedFiles([])}
        disabled={uploadDisabled}
        helperText={helperText}
        isUploading={createState.isLoading}
        onUpload={async () => {
          try {
            for (const file of selectedFiles) {
              const uploadResult = await uploadFileToCloudinary({ file });
              const fileType = resolveAttachmentFileType(file);

              await createAttachment({
                filename: file.name,
                fileUrl: uploadResult.secureUrl,
                fileType,
                fileSize: file.size,
                parent: taskId,
                parentModel: "Task",
              }).unwrap();
            }

            toast.success("Files uploaded");
            setSelectedFiles([]);
            onRefresh?.();
          } catch (error) {
            toastApiError(error);
          }
        }}
      />

      {isLoading ? (
        <MuiLoading message="Loading files..." />
      ) : (files || []).length === 0 ? (
        <MuiEmptyState
          message="No files uploaded"
          secondaryMessage="Upload a file to get started."
        />
      ) : (
        <TaskFileGallery
          files={files}
          onDelete={(file) => setConfirmState({ open: true, mode: "delete", file })}
          onRestore={(file) =>
            setConfirmState({ open: true, mode: "restore", file })
          }
          canDelete={canDeleteFile}
          canRestore={canRestoreFile}
        />
      )}

      <MuiDialogConfirm
        open={confirmState.open}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmState.mode === "restore" ? "Restore File" : "Delete File"}
        message={
          confirmState.mode === "restore"
            ? "Restore this attachment?"
            : "Soft delete this attachment?"
        }
        confirmText={confirmState.mode === "restore" ? "Restore" : "Delete"}
        confirmColor={confirmState.mode === "restore" ? "success" : "error"}
        isLoading={isMutating}
      />
    </Stack>
  );
};

TaskFilesTab.propTypes = {
  taskId: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  isTaskDeleted: PropTypes.bool,
  onRefresh: PropTypes.func,
};

TaskFilesTab.defaultProps = {
  files: [],
  isLoading: false,
  isTaskDeleted: false,
  onRefresh: null,
};

export default TaskFilesTab;
