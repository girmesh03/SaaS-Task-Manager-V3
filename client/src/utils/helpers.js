/**
 * @file Shared frontend helper utilities.
 */

/**
 * Returns true when a value should be treated as a non-empty filter value.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} True when value is present.
 * @throws {never} This helper does not throw.
 */
export const hasValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && value !== "";
};

/**
 * Counts active filter entries and optionally includes deleted-toggle state.
 *
 * @param {Record<string, unknown>} filters - Filters object.
 * @param {boolean} [includeDeleted=false] - Include deleted-toggle in count.
 * @param {string[]} [booleanKeys=[]] - Keys that should count only when value is true.
 * @returns {number} Active filter count.
 * @throws {never} This helper does not throw.
 */
export const countActiveFilters = (
  filters,
  includeDeleted = false,
  booleanKeys = []
) => {
  let total = includeDeleted ? 1 : 0;

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (booleanKeys.includes(key)) {
      if (value === true) {
        total += 1;
      }
      return;
    }

    if (hasValue(value)) {
      total += 1;
    }
  });

  return total;
};

/**
 * Builds a canonical route string from a location-like object.
 *
 * @param {{ pathname?: string; search?: string; hash?: string } | null | undefined} location - Router location.
 * @returns {string} Canonical route path.
 * @throws {never} This helper does not throw.
 */
export const buildPathname = (location) => {
  if (!location || typeof location !== "object") {
    return "";
  }

  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}`;
};

/**
 * Resolves a route from session storage with fallback handling.
 *
 * @param {string} storageKey - Session storage key.
 * @param {string} [fallback="/"] - Fallback route.
 * @returns {string} Stored route or fallback.
 * @throws {never} Storage access errors are swallowed.
 */
export const getStoredRoute = (storageKey, fallback = "/") => {
  try {
    const route = window.sessionStorage.getItem(storageKey);
    if (route && route.startsWith("/")) {
      return route;
    }
  } catch {
    // no-op when storage is unavailable
  }

  return fallback;
};

/**
 * Checks whether a redirect candidate avoids route-loop conditions.
 *
 * @param {string} route - Candidate route.
 * @param {string} currentRoute - Current route.
 * @param {Set<string>} publicPaths - Public-route path set.
 * @param {string} [landingPath="/"] - Landing path.
 * @returns {boolean} True when redirect target is safe.
 * @throws {never} This helper does not throw.
 */
export const isSafeRedirectTarget = (
  route,
  currentRoute,
  publicPaths,
  landingPath = "/"
) => {
  if (!route || !route.startsWith("/") || route === currentRoute) {
    return false;
  }

  const [pathname] = route.split(/[?#]/);
  return pathname === landingPath || !publicPaths.has(pathname);
};

/**
 * Capitalizes the first character of a display string.
 *
 * @param {unknown} value - Input value.
 * @returns {string} Capitalized text.
 * @throws {never} This helper does not throw.
 */
export const capitalizeFirstCharacter = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

export default {
  hasValue,
  countActiveFilters,
  buildPathname,
  getStoredRoute,
  isSafeRedirectTarget,
  capitalizeFirstCharacter,
};
