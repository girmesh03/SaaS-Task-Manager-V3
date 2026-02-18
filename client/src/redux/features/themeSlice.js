/**
 * @file Theme redux slice.
 */
import { createSlice } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../../utils/constants";

const getStoredThemeMode = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (!value) {
      return "system";
    }

    return value;
  } catch {
    return "system";
  }
};

const initialState = {
  mode: getStoredThemeMode(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action) => {
      state.mode = action.payload;
      try {
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, action.payload);
      } catch {
        // no-op in restricted storage contexts
      }
    },
  },
});

export const { setThemeMode } = themeSlice.actions;

export const selectThemeMode = (state) => state.theme.mode;

export default themeSlice.reducer;
