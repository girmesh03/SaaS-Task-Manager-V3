/**
 * @file Debounce hook for search/filter commit behavior.
 */
import { useEffect, useState } from "react";
import { API_DEFAULTS } from "../utils/constants";

/**
 * Debounces a value by waiting for inactivity before publishing updates.
 *
 * @template TValue
 * @param {TValue} value - Input value.
 * @param {number} [delayMs=API_DEFAULTS.SEARCH_DEBOUNCE_MS] - Debounce delay in milliseconds.
 * @returns {TValue} Debounced value.
 * @throws {never} This hook does not throw.
 */
export const useDebounce = (
  value,
  delayMs = API_DEFAULTS.SEARCH_DEBOUNCE_MS
) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debouncedValue;
};

export default useDebounce;
