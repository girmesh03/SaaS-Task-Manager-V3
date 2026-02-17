/**
 * @file Authorization hook placeholder.
 */

/**
 * Returns the Phase 1 authorization context placeholder.
 *
 * @returns {{ can: () => false; cannot: () => true }} Placeholder authorization API.
 * @throws {never} This hook does not throw.
 */
export const useAuthorization = () => {
  return {
    can: () => false,
    cannot: () => true,
  };
};

export default useAuthorization;
