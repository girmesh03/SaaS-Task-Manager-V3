/**
 * @file Debounce hook for delayed value commits.
 */
import { useEffect, useState } from "react";

/**
 * Debounces a value by waiting for inactivity before publishing updates.
 *
 * @template TValue
 * @param {TValue} value - Input value.
 * @param {number} [delayMs=300] - Debounce delay in milliseconds.
 * @returns {TValue} Debounced value.
 * @throws {never} This hook does not throw.
 */
export const useDebounce = (value, delayMs = 300) => {
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
