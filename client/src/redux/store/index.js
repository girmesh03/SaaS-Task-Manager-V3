/**
 * @file Phase 1 Redux store placeholder.
 */

/**
 * Returns the Phase 1 store placeholder descriptor.
 *
 * @returns {{ initialized: false; message: string }} Placeholder store metadata.
 * @throws {never} This helper does not throw.
 */
export const createStorePlaceholder = () => {
  return {
    initialized: false,
    message: "Store wiring starts in Phase 2.",
  };
};

export default createStorePlaceholder;
