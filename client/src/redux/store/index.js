/**
 * @file Redux store configuration for phase 2 state architecture.
 */
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  authReducer,
  notificationBadgeReducer,
  resourceViewReducer,
  themeReducer,
} from "../features";
import { api } from "../../services/api";

/**
 * Builds the application Redux store.
 *
 * @returns {import("@reduxjs/toolkit").EnhancedStore} Configured Redux store.
 * @throws {never} This helper does not throw.
 */
export const createAppStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
      notificationBadge: notificationBadgeReducer,
      resourceView: resourceViewReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            "persist/PERSIST",
            "persist/REHYDRATE",
            "persist/PAUSE",
            "persist/PURGE",
            "persist/REGISTER",
            "persist/FLUSH",
          ],
        },
      }).concat(api.middleware),
  });

  setupListeners(store.dispatch);
  return store;
};

/**
 * Singleton store instance for app bootstrap.
 *
 * @type {import("@reduxjs/toolkit").EnhancedStore}
 */
export const store = createAppStore();

export default store;
