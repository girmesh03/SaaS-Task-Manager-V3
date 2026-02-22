/**
 * @file Socket lifecycle hook (Phase 4).
 */
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { api } from "../services/api";
import { socketEvents, socketService } from "../services";
import { incrementUnreadCount, resetUnreadCount } from "../redux/features";

/**
 * Connects Socket.IO when enabled and wires baseline cache invalidation.
 *
 * @param {{ enabled?: boolean }} options - Hook options.
 * @returns {void} This hook returns nothing.
 * @throws {never} Hook initialization does not throw.
 */
const useSocket = ({ enabled = true } = {}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) {
      socketService.disconnect();
      dispatch(resetUnreadCount());
      return undefined;
    }

    const socket = socketService.connect();

    const handleTaskCreated = () => {
      dispatch(api.util.invalidateTags(["Task"]));
    };

    const handleTaskDeleted = () => {
      dispatch(api.util.invalidateTags(["Task"]));
    };

    const handleTaskUpdated = (payload) => {
      const taskId = payload?.taskId;
      if (taskId) {
        dispatch(api.util.invalidateTags([{ type: "Task", id: taskId }, "Task"]));
        return;
      }

      dispatch(api.util.invalidateTags(["Task"]));
    };

    const handleNotificationCreated = () => {
      dispatch(incrementUnreadCount(1));
      dispatch(api.util.invalidateTags(["Notification"]));
    };

    socket.on(socketEvents.TASK_CREATED, handleTaskCreated);
    socket.on(socketEvents.TASK_DELETED, handleTaskDeleted);
    socket.on(socketEvents.TASK_UPDATED, handleTaskUpdated);
    socket.on(socketEvents.NOTIFICATION_CREATED, handleNotificationCreated);

    return () => {
      socket.off(socketEvents.TASK_CREATED, handleTaskCreated);
      socket.off(socketEvents.TASK_DELETED, handleTaskDeleted);
      socket.off(socketEvents.TASK_UPDATED, handleTaskUpdated);
      socket.off(socketEvents.NOTIFICATION_CREATED, handleNotificationCreated);
      socketService.disconnect();
    };
  }, [dispatch, enabled]);
};

export default useSocket;

