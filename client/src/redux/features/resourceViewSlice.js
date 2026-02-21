/**
 * @file Resource view-state redux slice.
 */
import { createSlice } from "@reduxjs/toolkit";
import { PAGINATION_DEFAULTS, VIEW_MODE } from "../../utils/constants";

const createDefaultResourceState = () => ({
  viewMode: VIEW_MODE.GRID,
  page: PAGINATION_DEFAULTS.PAGE,
  limit: PAGINATION_DEFAULTS.LIMIT,
  sortBy: PAGINATION_DEFAULTS.SORT_BY,
  sortOrder: PAGINATION_DEFAULTS.SORT_ORDER,
  includeDeleted: PAGINATION_DEFAULTS.INCLUDE_DELETED,
  filters: {},
  dialog: {
    isOpen: false,
    type: null,
    payload: null,
  },
});

const DEFAULT_RESOURCE_STATE = createDefaultResourceState();

const resourceViewSlice = createSlice({
  name: "resourceView",
  initialState: {
    byResource: {},
  },
  reducers: {
    setResourceViewState: (state, action) => {
      const { resource, changes } = action.payload;
      if (!resource) {
        return;
      }

      const current = state.byResource[resource] || createDefaultResourceState();
      state.byResource[resource] = {
        ...current,
        ...changes,
      };
    },
    resetResourceViewState: (state, action) => {
      const resource = action.payload;
      if (!resource) {
        return;
      }

      state.byResource[resource] = createDefaultResourceState();
    },
    setResourceDialogState: (state, action) => {
      const { resource, dialog } = action.payload;
      if (!resource) {
        return;
      }

      const current = state.byResource[resource] || createDefaultResourceState();
      state.byResource[resource] = {
        ...current,
        dialog: {
          ...current.dialog,
          ...dialog,
        },
      };
    },
  },
});

export const {
  setResourceViewState,
  resetResourceViewState,
  setResourceDialogState,
} = resourceViewSlice.actions;

export const selectResourceViewState = (resource) => (state) => {
  return state.resourceView.byResource[resource] || DEFAULT_RESOURCE_STATE;
};

export default resourceViewSlice.reducer;
