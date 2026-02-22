/**
 * @file Notification badge redux slice (Phase 4 realtime).
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  unreadCount: 0,
};

const notificationBadgeSlice = createSlice({
  name: "notificationBadge",
  initialState,
  reducers: {
    incrementUnreadCount: (state, action) => {
      const amount = Number(action.payload ?? 1);
      if (!Number.isFinite(amount) || amount <= 0) {
        state.unreadCount += 1;
        return;
      }

      state.unreadCount += amount;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action) => {
      const next = Number(action.payload ?? 0);
      state.unreadCount = Number.isFinite(next) && next >= 0 ? next : 0;
    },
  },
});

export const { incrementUnreadCount, resetUnreadCount, setUnreadCount } =
  notificationBadgeSlice.actions;

export const selectNotificationUnreadCount = (state) =>
  state.notificationBadge.unreadCount;

export default notificationBadgeSlice.reducer;

