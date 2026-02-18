/**
 * @file Date formatting helper utilities.
 */

/**
 * Formats a date-like value for UI display using locale-sensitive options.
 *
 * @param {string | number | Date | null | undefined} date - Date-like input.
 * @param {string} [locale="en-US"] - BCP-47 locale string.
 * @param {Intl.DateTimeFormatOptions} [options] - Intl formatting options.
 * @returns {string} Formatted date string or empty string when date is absent.
 * @throws {RangeError} Throws when date value is invalid for `Date` construction.
 */
export const formatDateForDisplay = (
  date,
  locale = "en-US",
  options = { year: "numeric", month: "short", day: "2-digit" }
) => {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

/**
 * Formats date/time using timezone-aware Intl.DateTimeFormat.
 *
 * @param {string | number | Date | null | undefined} date - Date-like input.
 * @param {{
 *   locale?: string;
 *   timezone?: string;
 *   options?: Intl.DateTimeFormatOptions;
 * }} [config={}] - Formatter configuration.
 * @returns {string} Formatted date/time string or empty string when date is absent.
 * @throws {RangeError} Throws when date value is invalid.
 */
export const formatDateTimeForDisplay = (date, config = {}) => {
  if (!date) {
    return "";
  }

  const locale = config.locale || "en-US";
  const timezone = config.timezone || "UTC";
  const options = config.options || {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: timezone,
  }).format(new Date(date));
};

export default formatDateForDisplay;
