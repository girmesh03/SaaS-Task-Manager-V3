/**
 * @file Auth redux slice.
 */
import { createSlice } from "@reduxjs/toolkit";

/**
 * Normalizes backend auth payloads into a canonical frontend user shape.
 *
 * @param {unknown} payload - Raw auth payload or user-like object.
 * @returns {null | {
 *   id: string | null;
 *   firstName: string;
 *   lastName: string;
 *   fullName: string;
 *   email: string;
 *   role: string;
 *   status: string;
 *   isPlatformOrgUser: boolean;
 *   organization: unknown;
 *   organizationName: string;
 *   department: unknown;
 *   departmentName: string;
 *   avatarUrl: string;
 *   preferences: Record<string, unknown> | null;
 *   security: Record<string, unknown> | null;
 *   raw: Record<string, unknown>;
 * }} Normalized user object.
 * @throws {never} This helper does not throw.
 */
export const normalizeAuthUser = (payload) => {
  if (!payload) {
    return null;
  }

  const resolveUserCandidate = (value) => {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (value.user && typeof value.user === "object") {
      return value.user;
    }

    if (value.data && typeof value.data === "object") {
      if (value.data.user && typeof value.data.user === "object") {
        return value.data.user;
      }

      if (value.data.profile && typeof value.data.profile === "object") {
        return value.data.profile;
      }
    }

    if (value.profile && typeof value.profile === "object") {
      return value.profile;
    }

    const isApiEnvelope =
      Object.prototype.hasOwnProperty.call(value, "success") ||
      Object.prototype.hasOwnProperty.call(value, "message") ||
      Object.prototype.hasOwnProperty.call(value, "meta") ||
      Object.prototype.hasOwnProperty.call(value, "error");

    if (isApiEnvelope) {
      return null;
    }

    return value;
  };

  const userCandidate = resolveUserCandidate(payload);

  if (!userCandidate || typeof userCandidate !== "object") {
    return null;
  }

  const hasIdentity =
    Boolean(userCandidate._id || userCandidate.id) ||
    Boolean(String(userCandidate.email || "").trim()) ||
    Boolean(String(userCandidate.role || "").trim()) ||
    Boolean(String(userCandidate.firstName || "").trim()) ||
    Boolean(String(userCandidate.lastName || "").trim()) ||
    Boolean(String(userCandidate.fullName || "").trim()) ||
    Boolean(String(userCandidate.name || "").trim());

  if (!hasIdentity) {
    return null;
  }

  const firstName = String(userCandidate.firstName || "").trim();
  const lastName = String(userCandidate.lastName || "").trim();
  const organizationValue = userCandidate.organization || userCandidate.organizationId || null;
  const departmentValue = userCandidate.department || userCandidate.departmentId || null;

  return {
    id: userCandidate._id || userCandidate.id || null,
    firstName,
    lastName,
    fullName:
      String(userCandidate.fullName || "").trim() ||
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      String(userCandidate.name || "").trim(),
    email: String(userCandidate.email || "").trim(),
    role: String(userCandidate.role || "").trim(),
    status: String(userCandidate.status || "").trim(),
    isPlatformOrgUser: Boolean(userCandidate.isPlatformOrgUser),
    organization: organizationValue,
    organizationName:
      organizationValue?.name || userCandidate.organizationName || "",
    department: departmentValue,
    departmentName: departmentValue?.name || userCandidate.departmentName || "",
    avatarUrl:
      userCandidate.profilePicture?.url ||
      userCandidate.avatarUrl ||
      "",
    preferences: userCandidate.preferences || null,
    security: userCandidate.security || null,
    raw: userCandidate,
  };
};

const initialState = {
  user: null,
  isAuthenticated: false,
  sessionChecked: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const normalizedUser = normalizeAuthUser(action.payload);
      state.user = normalizedUser;
      state.isAuthenticated = Boolean(normalizedUser);
      state.sessionChecked = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionChecked = true;
    },
    setSessionChecked: (state, action) => {
      state.sessionChecked = Boolean(action.payload);
    },
  },
});

export const { setCredentials, clearCredentials, setSessionChecked } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectSessionChecked = (state) => state.auth.sessionChecked;

export default authSlice.reducer;
