/**
 * @file Task realtime hook (Phase 4).
 */
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { api } from "../../services/api";
import { socketEvents, socketService } from "../../services";

/**
 * Joins/leaves the task room and invalidates task-domain caches on events.
 *
 * @param {{ taskId?: string | null }} options - Hook options.
 * @returns {void} This hook returns nothing.
 * @throws {never} Hook initialization does not throw.
 */
export const useTaskRealtime = ({ taskId } = {}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!taskId) {
      return undefined;
    }

    const socket = socketService.connect();
    socket.emit("join:task", { taskId });

    const invalidateTask = () => {
      dispatch(api.util.invalidateTags([{ type: "Task", id: taskId }, "Task"]));
    };

    const handleActivityAdded = () => {
      dispatch(api.util.invalidateTags([{ type: "TaskActivity", id: taskId }]));
      invalidateTask();
    };

    const handleCommentAdded = () => {
      dispatch(api.util.invalidateTags([{ type: "TaskComment", id: taskId }]));
      invalidateTask();
    };

    const handleFileAdded = () => {
      invalidateTask();
    };

    socket.on(socketEvents.TASK_ACTIVITY_ADDED, handleActivityAdded);
    socket.on(socketEvents.TASK_COMMENT_ADDED, handleCommentAdded);
    socket.on(socketEvents.TASK_FILE_ADDED, handleFileAdded);
    socket.on(socketEvents.TASK_UPDATED, invalidateTask);

    return () => {
      socket.emit("leave:task", { taskId });
      socket.off(socketEvents.TASK_ACTIVITY_ADDED, handleActivityAdded);
      socket.off(socketEvents.TASK_COMMENT_ADDED, handleCommentAdded);
      socket.off(socketEvents.TASK_FILE_ADDED, handleFileAdded);
      socket.off(socketEvents.TASK_UPDATED, invalidateTask);
    };
  }, [dispatch, taskId]);
};

export default useTaskRealtime;

