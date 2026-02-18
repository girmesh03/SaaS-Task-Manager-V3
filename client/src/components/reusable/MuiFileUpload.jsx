import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useDropzone } from "react-dropzone";
import { ATTACHMENT_EXTENSIONS } from "../../utils/constants";

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const getFileExtension = (filename = "") => {
  const parts = String(filename).toLowerCase().split(".");
  if (parts.length < 2) {
    return "";
  }

  return `.${parts.pop()}`;
};

const normalizeFiles = (files = []) => {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.filter(Boolean);
};

const bytesToMb = (value) => {
  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
};

/**
 * Reusable file-upload primitive with canonical extension and file-size guards.
 *
 * @param {{
 *   value?: File[];
 *   onChange?: (files: File[]) => void;
 *   label?: string;
 *   helperText?: string;
 *   allowedExtensions?: string[];
 *   maxSizeBytes?: number;
 *   multiple?: boolean;
 *   disabled?: boolean;
 *   error?: string;
 * }} props - Upload component props.
 * @returns {JSX.Element} File upload input primitive.
 * @throws {never} This component does not throw.
 */
const MuiFileUpload = ({
  value = [],
  onChange,
  label = "Upload files",
  helperText,
  allowedExtensions = ATTACHMENT_EXTENSIONS,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
  multiple = true,
  disabled = false,
  error,
}) => {
  const normalizedFiles = normalizeFiles(value);
  const normalizedExtensions = useMemo(() => {
    return allowedExtensions.map((item) => String(item).toLowerCase());
  }, [allowedExtensions]);

  const onDrop = (acceptedFiles) => {
    const filtered = acceptedFiles.filter((file) => {
      const extension = getFileExtension(file.name);
      const extensionAllowed =
        normalizedExtensions.length === 0 || normalizedExtensions.includes(extension);
      const sizeAllowed = file.size <= maxSizeBytes;
      return extensionAllowed && sizeAllowed;
    });

    const nextFiles = multiple
      ? [...normalizedFiles, ...filtered]
      : filtered.slice(0, 1);

    onChange?.(nextFiles);
  };

  const removeFile = (index) => {
    const nextFiles = normalizedFiles.filter((_, fileIndex) => fileIndex !== index);
    onChange?.(nextFiles);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled,
  });

  return (
    <Stack spacing={1.25}>
      <Box
        {...getRootProps()}
        sx={{
          border: "1px dashed",
          borderColor: error ? "error.main" : "divider",
          borderRadius: 2,
          p: 2,
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          transition: "all 0.2s ease-in-out",
        }}
      >
        <input {...getInputProps()} />
        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Allowed: {normalizedExtensions.join(", ")} | Max size: {bytesToMb(maxSizeBytes)}
          </Typography>
          {helperText ? (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          ) : null}
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon fontSize="small" />}
            onClick={open}
            disabled={disabled}
          >
            Select File{multiple ? "s" : ""}
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      ) : null}

      {normalizedFiles.length > 0 ? (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {normalizedFiles.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              label={`${file.name} (${bytesToMb(file.size)})`}
              onDelete={disabled ? undefined : () => removeFile(index)}
              size="small"
              variant="outlined"
              sx={{ maxWidth: "100%" }}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};

MuiFileUpload.propTypes = {
  value: PropTypes.arrayOf(PropTypes.instanceOf(File)),
  onChange: PropTypes.func,
  label: PropTypes.string,
  helperText: PropTypes.string,
  allowedExtensions: PropTypes.arrayOf(PropTypes.string),
  maxSizeBytes: PropTypes.number,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(MuiFileUpload);
