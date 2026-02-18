/**
 * @file Timezone hook utility.
 */
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../utils/dateUtils";

/**
 * Resolves the active timezone context and Intl-based date formatters.
 *
 * @returns {{
 *   timezone: string;
 *   locale: string;
 *   formatDate: (date: string | number | Date | null | undefined) => string;
 *   formatDateTime: (date: string | number | Date | null | undefined) => string;
 * }} Timezone + formatting helpers.
 * @throws {never} This hook does not throw.
 */
export const useTimezone = () => {
  const user = useSelector(selectCurrentUser);
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const locale = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
  const userTimezone = user?.preferences?.appearance?.timezone || browserTimezone;

  const formatDate = useMemo(() => {
    return (date) =>
      formatDateForDisplay(date, locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: userTimezone,
      });
  }, [locale, userTimezone]);

  const formatDateTime = useMemo(() => {
    return (date) =>
      formatDateTimeForDisplay(date, {
        locale,
        timezone: userTimezone,
      });
  }, [locale, userTimezone]);

  return {
    timezone: userTimezone,
    locale,
    formatDate,
    formatDateTime,
  };
};

export default useTimezone;
