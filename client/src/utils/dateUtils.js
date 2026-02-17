/**
 * @file Date formatting helper utilities.
 */

/**
 * Formats a date-like value for UI display using locale-sensitive options.
 *
 * @param {string | number | Date | null | undefined} date - Date-like input.
 * @param {string} [locale="en-US"] - BCP-47 locale string.
 * @returns {string} Formatted date string or empty string when date is absent.
 * @throws {RangeError} Throws when date value is invalid for `Date` construction.
 */
export const formatDateForDisplay = (date, locale = "en-US") => {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
};

export default formatDateForDisplay;
