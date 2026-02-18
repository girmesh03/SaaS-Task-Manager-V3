/**
 * @file Frontend validator helpers.
 * @throws {never} Module initialization does not throw.
 */
import {
  EMAIL_REGEX,
  ORGANIZATION_NAME_REGEX,
  PERSON_NAME_REGEX,
  PHONE_REGEX,
  SKU_REGEX,
} from "./constants";

/**
 * Reusable primitive validator functions.
 * @type {{
 *   required: (value: unknown) => boolean;
 *   email: (value: string) => boolean;
 *   phone: (value: string) => boolean;
 *   organizationName: (value: string) => boolean;
 *   personName: (value: string) => boolean;
 *   sku: (value: string) => boolean;
 * }}
 */
export const validators = {
  required: (value) => value !== undefined && value !== null && value !== "",
  email: (value) => EMAIL_REGEX.test(String(value || "")),
  phone: (value) => PHONE_REGEX.test(String(value || "")),
  organizationName: (value) => ORGANIZATION_NAME_REGEX.test(String(value || "")),
  personName: (value) => PERSON_NAME_REGEX.test(String(value || "")),
  sku: (value) => SKU_REGEX.test(String(value || "").toUpperCase()),
};

export default validators;
