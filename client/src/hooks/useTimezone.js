/**
 * @file Timezone hook utility.
 */

/**
 * Resolves the current browser timezone.
 *
 * @returns {{ timezone: string }} Browser timezone descriptor.
 * @throws {never} This hook does not throw.
 */
export const useTimezone = () => {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
};

export default useTimezone;
