/**
 * @file Authentication hook backed by redux + RTK Query auth endpoints.
 */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCredentials,
  normalizeAuthUser,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionChecked,
  setCredentials,
} from "../redux/features";
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} from "../services/api";

/**
 * Provides canonical auth/session state and mutation helpers.
 *
 * @returns {{
 *   user: ReturnType<typeof normalizeAuthUser>;
 *   userId: string | null;
 *   userName: string;
 *   userRole: string;
 *   organizationName: string;
 *   departmentName: string;
 *   isAuthenticated: boolean;
 *   sessionChecked: boolean;
 *   isLoading: boolean;
 *   login: (payload: Record<string, unknown>) => Promise<unknown>;
 *   logout: () => Promise<void>;
 *   refreshSession: () => Promise<unknown>;
 * }} Auth API for guards and profile controls.
 * @throws {never} Hook initialization does not throw; async helpers may reject with API errors.
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionChecked = useSelector(selectSessionChecked);

  const [loginMutation, loginState] = useLoginMutation();
  const [logoutMutation, logoutState] = useLogoutMutation();
  const [refreshMutation, refreshState] = useRefreshTokenMutation();

  /**
   * Writes credentials from a backend payload.
   *
   * @param {unknown} payload - Raw backend payload.
   * @returns {boolean} True when user credentials were resolved.
   * @throws {never} This helper does not throw.
   */
  const setCredentialsFromPayload = useCallback(
    (payload) => {
      const normalizedUser = normalizeAuthUser(payload);
      if (normalizedUser) {
        dispatch(setCredentials(payload));
        return true;
      }

      dispatch(clearCredentials());
      return false;
    },
    [dispatch]
  );

  /**
   * Executes login mutation and writes session state.
   *
   * @param {Record<string, unknown>} payload - Login payload.
   * @returns {Promise<unknown>} Auth response payload.
   * @throws {unknown} Re-throws API errors from mutation.
   */
  const login = useCallback(
    async (payload) => {
      const response = await loginMutation(payload).unwrap();
      setCredentialsFromPayload(response);

      return response;
    },
    [loginMutation, setCredentialsFromPayload]
  );

  /**
   * Executes logout mutation and clears local auth state.
   *
   * @returns {Promise<void>} Resolves when logout flow completes.
   * @throws {never} API errors are swallowed to guarantee local state cleanup.
   */
  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Keep local cleanup deterministic even if API logout fails.
    } finally {
      dispatch(clearCredentials());
    }
  }, [dispatch, logoutMutation]);

  /**
   * Attempts refresh-token reauthentication and updates local session state.
   *
   * @returns {Promise<unknown>} Refresh response payload.
   * @throws {unknown} Re-throws API errors from mutation.
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshMutation().unwrap();
      setCredentialsFromPayload(response);

      return response;
    } catch (error) {
      dispatch(clearCredentials());
      throw error;
    }
  }, [dispatch, refreshMutation, setCredentialsFromPayload]);

  return {
    user,
    userId: user?.id || null,
    userName: user?.fullName || user?.firstName || "",
    userRole: user?.role || "",
    organizationName: user?.organizationName || "",
    departmentName: user?.departmentName || "",
    isAuthenticated,
    sessionChecked,
    isLoading: Boolean(
      loginState.isLoading || logoutState.isLoading || refreshState.isLoading
    ),
    login,
    logout,
    refreshSession,
  };
};

export default useAuth;
