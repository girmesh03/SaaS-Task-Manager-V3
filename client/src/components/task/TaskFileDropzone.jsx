import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { MuiFileUpload } from "../reusable";

/**
 * Task files upload section (dropzone + actions).
 *
 * @param {{
 *   files: File[];
 *   onFilesChange: (files: File[]) => void;
 *   onUpload: () => void;
 *   onClear: () => void;
 *   disabled: boolean;
 *   helperText?: string;
 *   isUploading: boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Dropzone section.
 * @throws {never} This component does not throw.
 */
const TaskFileDropzone = ({
  files,
  onFilesChange,
  onUpload,
  onClear,
  disabled,
  helperText,
  isUploading,
}) => {
  return (
    <Stack spacing={1.25}>
      <MuiFileUpload
        value={files}
        onChange={onFilesChange}
        label="Click to upload or drag and drop"
        helperText={helperText}
        disabled={disabled}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="flex-end"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        {helperText ? (
          <Typography
            variant="caption"
            color={disabled ? "text.secondary" : "text.primary"}
            sx={{ flexGrow: 1 }}
          >
            {helperText}
          </Typography>
        ) : null}

        <Button
          size="small"
          variant="outlined"
          startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          onClick={onClear}
          disabled={disabled || files.length === 0 || isUploading}
        >
          Clear
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<CloudUploadOutlinedIcon fontSize="small" />}
          onClick={onUpload}
          disabled={disabled || files.length === 0 || isUploading}
        >
          Upload
        </Button>
      </Stack>
    </Stack>
  );
};

TaskFileDropzone.propTypes = {
  files: PropTypes.arrayOf(PropTypes.instanceOf(File)),
  onFilesChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
  isUploading: PropTypes.bool,
};

TaskFileDropzone.defaultProps = {
  files: [],
  disabled: false,
  helperText: null,
  isUploading: false,
};

export default TaskFileDropzone;

