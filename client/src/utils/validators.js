/**
 * @file Frontend validator helpers.
 * @throws {never} Module initialization does not throw.
 */

/**
 * Reusable primitive validator functions.
 * @type {{ required: (value: unknown) => boolean }}
 */
export const validators = {
  required: (value) => value !== undefined && value !== null && value !== "",
};

export default validators;
