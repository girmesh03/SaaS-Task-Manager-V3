import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import { MuiLoading, MuiTextField } from "../reusable";
import { useTimezone } from "../../hooks";
import { useGetTaskCommentsQuery } from "../../services/api";

const MAX_DEPTH = 5;

const toInitials = (user) => {
  const fullName = String(user?.fullName || "").trim();
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0))
    .join("")
    .toUpperCase();
};

const renderMentionedText = (text) => {
  const value = String(text || "");
  if (!value) {
    return "";
  }

  const parts = value.split(/(@[a-zA-Z0-9._-]+)/g);
  return parts.map((part, index) => {
    const isMention = part.startsWith("@") && part.length > 1;
    return (
      <Box
        key={`${part}-${index}`}
        component="span"
        sx={{
          color: isMention ? "primary.main" : "inherit",
          fontWeight: isMention ? 700 : 400,
        }}
      >
        {part}
      </Box>
    );
  });
};

/**
 * Threaded task comment renderer.
 *
 * @param {{
 *   taskId: string;
 *   comment: Record<string, unknown>;
 *   level?: number;
 *   onReply: (options: { parentId: string; comment: string }) => Promise<void> | void;
 *   onDelete: (comment: Record<string, unknown>) => void;
 *   onRestore: (comment: Record<string, unknown>) => void;
 *   canDelete: (comment: Record<string, unknown>) => boolean;
 *   canRestore: (comment: Record<string, unknown>) => boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Comment thread.
 * @throws {never} This component does not throw.
 */
const TaskCommentThread = ({
  taskId,
  comment,
  level,
  onReply,
  onDelete,
  onRestore,
  canDelete,
  canRestore,
}) => {
  const { formatDateTime } = useTimezone();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesOpen, setRepliesOpen] = useState(false);

  const commentId = comment?.id || comment?._id || "";
  const depth = Number(comment?.depth || 0);
  const isDeleted = Boolean(comment?.isDeleted);

  const {
    data: repliesResponse,
    isFetching: isRepliesFetching,
  } = useGetTaskCommentsQuery(
    {
      taskId,
      query: {
        page: 1,
        limit: 50,
        includeDeleted: false,
        parentModel: "TaskComment",
        parentId: commentId,
      },
    },
    { skip: !repliesOpen || !commentId },
  );

  const replies = useMemo(() => {
    return repliesResponse?.data?.comments || [];
  }, [repliesResponse]);

  const createdBy = comment?.createdBy || {};
  const timestamp = comment?.createdAt ? formatDateTime(comment.createdAt) : "";
  const canReply = !isDeleted && depth < MAX_DEPTH;

  return (
    <Stack spacing={1} sx={{ pl: level > 0 ? 3 : 0 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          opacity: isDeleted ? 0.65 : 1,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Avatar
            src={createdBy.profilePictureUrl || undefined}
            alt={createdBy.fullName || "User"}
            sx={{ width: 38, height: 38 }}
          >
            {toInitials(createdBy)}
          </Avatar>

          <Stack spacing={0.75} sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {createdBy.fullName || "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {timestamp}
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {isDeleted ? "Comment deleted." : renderMentionedText(comment?.comment)}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="text"
                startIcon={<ReplyOutlinedIcon fontSize="small" />}
                onClick={() => setReplyOpen((current) => !current)}
                disabled={!canReply}
              >
                Reply
              </Button>

              {repliesOpen ? (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ExpandLessOutlinedIcon fontSize="small" />}
                  onClick={() => setRepliesOpen(false)}
                  disabled={!commentId}
                >
                  Hide replies
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ExpandMoreOutlinedIcon fontSize="small" />}
                  onClick={() => setRepliesOpen(true)}
                  disabled={!commentId}
                >
                  View replies
                </Button>
              )}

              {isDeleted ? (
                <Button
                  size="small"
                  variant="text"
                  color="success"
                  startIcon={<RestoreOutlinedIcon fontSize="small" />}
                  onClick={() => onRestore(comment)}
                  disabled={!canRestore(comment)}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
                  onClick={() => onDelete(comment)}
                  disabled={!canDelete(comment)}
                >
                  Delete
                </Button>
              )}
            </Stack>

            {replyOpen ? (
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                <MuiTextField
                  placeholder="Write a reply... use @ to mention someone"
                  multiline
                  minRows={2}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  reserveHelperTextSpace={false}
                />
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setReplyOpen(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      const trimmed = String(replyText || "").trim();
                      if (!trimmed || !commentId) return;
                      await onReply({ parentId: commentId, comment: trimmed });
                      setReplyText("");
                      setReplyOpen(false);
                      setRepliesOpen(true);
                    }}
                    disabled={!String(replyText || "").trim() || !commentId}
                  >
                    Reply
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {repliesOpen ? (
        isRepliesFetching ? (
          <MuiLoading message="Loading replies..." />
        ) : replies.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
            No replies yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {replies.map((reply) => (
              <TaskCommentThread
                key={reply.id}
                taskId={taskId}
                comment={reply}
                level={level + 1}
                onReply={onReply}
                onDelete={onDelete}
                onRestore={onRestore}
                canDelete={canDelete}
                canRestore={canRestore}
              />
            ))}
          </Stack>
        )
      ) : null}
    </Stack>
  );
};

TaskCommentThread.propTypes = {
  taskId: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
  level: PropTypes.number,
  onReply: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  canDelete: PropTypes.func.isRequired,
  canRestore: PropTypes.func.isRequired,
};

TaskCommentThread.defaultProps = {
  level: 0,
};

export default TaskCommentThread;
