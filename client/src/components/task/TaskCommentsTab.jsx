import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
import { MuiDialogConfirm, MuiEmptyState, MuiLoading } from "../reusable";
import TaskCommentComposer from "./TaskCommentComposer";
import TaskCommentThread from "./TaskCommentThread";
import { useAuthorization } from "../../hooks";
import {
  useCreateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useGetTaskCommentsQuery,
  useRestoreTaskCommentMutation,
} from "../../services/api";
import { toastApiError } from "../../utils/errorHandling";

/**
 * Task comments tab (threaded comments + mentions).
 *
 * @param {{ taskId: string }} props - Component props.
 * @returns {JSX.Element} Comments tab.
 * @throws {never} This component does not throw.
 */
const TaskCommentsTab = ({ taskId }) => {
  const { can } = useAuthorization();
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    comment: null,
  });

  const {
    data: commentsResponse,
    isFetching: isCommentsFetching,
    error: commentsError,
  } = useGetTaskCommentsQuery(
    { taskId, query: { page: 1, limit: 50, includeDeleted: false } },
    { skip: !taskId },
  );

  const comments = commentsResponse?.data?.comments || [];

  const [createComment, createState] = useCreateTaskCommentMutation();
  const [deleteComment, deleteState] = useDeleteTaskCommentMutation();
  const [restoreComment, restoreState] = useRestoreTaskCommentMutation();

  const isMutating = createState.isLoading || deleteState.isLoading || restoreState.isLoading;

  const canDeleteComment = useMemo(() => {
    return (comment) =>
      can("TaskComment", "delete", {
        target: comment,
        params: { taskId, commentId: comment?.id },
      });
  }, [can, taskId]);

  const canRestoreComment = useMemo(() => {
    return (comment) =>
      can("TaskComment", "delete", {
        target: comment,
        params: { taskId, commentId: comment?.id },
      });
  }, [can, taskId]);

  useEffect(() => {
    if (commentsError) {
      toastApiError(commentsError);
    }
  }, [commentsError]);

  const handleCreateRoot = async (value) => {
    try {
      await createComment({
        taskId,
        body: {
          comment: value,
        },
      }).unwrap();
      toast.success("Comment posted");
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleCreateReply = async ({ parentId, comment }) => {
    try {
      await createComment({
        taskId,
        body: {
          comment,
          parentModel: "TaskComment",
          parentId,
        },
      }).unwrap();
      toast.success("Reply posted");
    } catch (error) {
      toastApiError(error);
    }
  };

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, mode: "delete", comment: null });
  };

  const handleConfirm = async () => {
    const comment = confirmState.comment;
    if (!comment?.id) return;

    try {
      if (confirmState.mode === "restore") {
        await restoreComment({ taskId, commentId: comment.id }).unwrap();
        toast.success("Comment restored");
      } else {
        await deleteComment({ taskId, commentId: comment.id }).unwrap();
        toast.success("Comment deleted");
      }
      closeConfirmDialog();
    } catch (error) {
      toastApiError(error);
    }
  };

  const isInitialLoading = isCommentsFetching && !commentsResponse;

  return (
    <Stack spacing={2}>
      <Stack spacing={0.25}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Comments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Threaded discussion with @mentions (resolved server-side).
        </Typography>
      </Stack>

      <TaskCommentComposer onSubmit={handleCreateRoot} isSubmitting={createState.isLoading} />

      {isInitialLoading ? (
        <MuiLoading message="Loading comments..." />
      ) : comments.length === 0 ? (
        <MuiEmptyState
          message="No comments yet"
          secondaryMessage="Start the discussion by posting the first comment."
        />
      ) : (
        <Stack spacing={1.5}>
          {comments.map((comment) => (
            <TaskCommentThread
              key={comment.id}
              taskId={taskId}
              comment={comment}
              onReply={handleCreateReply}
              onDelete={(selected) =>
                setConfirmState({ open: true, mode: "delete", comment: selected })
              }
              onRestore={(selected) =>
                setConfirmState({ open: true, mode: "restore", comment: selected })
              }
              canDelete={canDeleteComment}
              canRestore={canRestoreComment}
            />
          ))}
        </Stack>
      )}

      <MuiDialogConfirm
        open={confirmState.open}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmState.mode === "restore" ? "Restore Comment" : "Delete Comment"}
        message={
          confirmState.mode === "restore"
            ? "Restore this comment and its descendant replies?"
            : "Soft delete this comment and cascade linked replies?"
        }
        confirmText={confirmState.mode === "restore" ? "Restore" : "Delete"}
        confirmColor={confirmState.mode === "restore" ? "success" : "error"}
        isLoading={isMutating}
      />
    </Stack>
  );
};

TaskCommentsTab.propTypes = {
  taskId: PropTypes.string.isRequired,
};

export default TaskCommentsTab;
