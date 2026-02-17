/**
 * @file Authentication hook placeholder.
 */

/**
 * Returns the Phase 1 authentication context placeholder.
 *
 * @returns {{ isAuthenticated: false; user: null }} Placeholder auth state.
 * @throws {never} This hook does not throw.
 */
export const useAuth = () => {
  return {
    isAuthenticated: false,
    user: null,
  };
};

export default useAuth;
