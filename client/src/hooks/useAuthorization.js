/**
 * @file Authorization hook powered by canonical matrix evaluation.
 */
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features";
import { hasPermission } from "../utils/authorizationHelper";

/**
 * Returns memoized authorization helpers for route and component guards.
 *
 * @returns {{
 *   user: unknown;
 *   can: (
 *     resource: string,
 *     operation: string,
 *     options?: {
 *       target?: Record<string, unknown> | null;
 *       resourceType?: string | null;
 *       params?: Record<string, unknown>;
 *     }
 *   ) => boolean;
 *   cannot: (
 *     resource: string,
 *     operation: string,
 *     options?: {
 *       target?: Record<string, unknown> | null;
 *       resourceType?: string | null;
 *       params?: Record<string, unknown>;
 *     }
 *   ) => boolean;
 * }} Authorization hook API.
 * @throws {never} Hook initialization does not throw.
 */
export const useAuthorization = () => {
  const user = useSelector(selectCurrentUser);

  /**
   * Returns true when current user can perform the operation.
   *
   * @param {string} resource - Matrix resource key.
   * @param {string} operation - Matrix operation key.
   * @param {{
   *   target?: Record<string, unknown> | null;
   *   resourceType?: string | null;
   *   params?: Record<string, unknown>;
   * }} [options={}] - Authorization context.
   * @returns {boolean} Permission check result.
   * @throws {never} This helper does not throw.
   */
  const can = useCallback(
    (resource, operation, options = {}) => {
      return hasPermission(user, resource, operation, options);
    },
    [user]
  );

  /**
   * Returns true when current user cannot perform the operation.
   *
   * @param {string} resource - Matrix resource key.
   * @param {string} operation - Matrix operation key.
   * @param {{
   *   target?: Record<string, unknown> | null;
   *   resourceType?: string | null;
   *   params?: Record<string, unknown>;
   * }} [options={}] - Authorization context.
   * @returns {boolean} Inverse permission check result.
   * @throws {never} This helper does not throw.
   */
  const cannot = useCallback(
    (resource, operation, options = {}) => {
      return !can(resource, operation, options);
    },
    [can]
  );

  return {
    user,
    can,
    cannot,
  };
};

export default useAuthorization;
