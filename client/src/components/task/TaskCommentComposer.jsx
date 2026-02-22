import { useState } from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { MuiTextField } from "../reusable";
import { useAuth } from "../../hooks";

/**
 * Comment composer for task comments.
 *
 * @param {{
 *   onSubmit: (comment: string) => Promise<void> | void;
 *   isSubmitting: boolean;
 *   placeholder?: string;
 * }} props - Component props.
 * @returns {JSX.Element} Comment composer.
 * @throws {never} This component does not throw.
 */
const TaskCommentComposer = ({ onSubmit, isSubmitting, placeholder }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const initials = String(user?.fullName || user?.firstName || "U")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0))
    .join("")
    .toUpperCase();

  const handleSubmit = async () => {
    const trimmed = String(comment || "").trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    setComment("");
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 } }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar
          src={user?.avatarUrl || undefined}
          alt={user?.fullName || "User"}
          sx={{ width: 40, height: 40 }}
        >
          {initials}
        </Avatar>

        <Stack spacing={1} sx={{ flexGrow: 1 }}>
          <MuiTextField
            placeholder={placeholder}
            multiline
            minRows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            reserveHelperTextSpace={false}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || !String(comment || "").trim()}
            >
              Post Comment
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

TaskCommentComposer.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  placeholder: PropTypes.string,
};

TaskCommentComposer.defaultProps = {
  isSubmitting: false,
  placeholder: "Write a comment... use @ to mention someone",
};

export default TaskCommentComposer;
