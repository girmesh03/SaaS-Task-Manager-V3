/**
 * @file Public route guard layout.
 */
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { PublicLayout } from "../components/layouts";
import { MuiLoading } from "../components/reusable";
import { useAuth } from "../hooks";
import { STORAGE_KEYS } from "../utils/constants";

const LANDING_PATH = "/";
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

/**
 * Builds a canonical route string from a location-like object.
 *
 * @param {{ pathname?: string; search?: string; hash?: string } | null | undefined} location - Router location.
 * @returns {string} Canonical app route with query/hash.
 * @throws {never} This helper does not throw.
 */
const buildPathname = (location) => {
  if (!location || typeof location !== "object") {
    return "";
  }

  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}`;
};

/**
 * Resolves a stored route fallback for authenticated public-route redirects.
 *
 * @returns {string} Restored route or landing path fallback.
 * @throws {never} Storage errors are swallowed.
 */
const getStoredAllowedRoute = () => {
  try {
    const route = window.sessionStorage.getItem(STORAGE_KEYS.LAST_ALLOWED_ROUTE);
    if (route && route.startsWith("/")) {
      return route;
    }
  } catch {
    // no-op when storage is unavailable
  }

  return LANDING_PATH;
};

/**
 * Checks whether a redirect candidate avoids public-route loops.
 *
 * @param {string} route - Candidate route.
 * @param {string} currentRoute - Current route string.
 * @returns {boolean} True when route can be used safely as redirect target.
 * @throws {never} This helper does not throw.
 */
const isSafeRedirectTarget = (route, currentRoute) => {
  if (!route || !route.startsWith("/") || route === currentRoute) {
    return false;
  }

  const [pathname] = route.split(/[?#]/);
  return pathname === LANDING_PATH || !PUBLIC_PATHS.has(pathname);
};

/**
 * Guards public routes so authenticated users can access only landing page (`/`).
 *
 * @returns {JSX.Element} Guarded public layout.
 * @throws {never} This component does not throw.
 */
const PublicRouteLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, sessionChecked, refreshSession } = useAuth();

  useEffect(() => {
    if (!sessionChecked) {
      refreshSession().catch(() => undefined);
    }
  }, [refreshSession, sessionChecked]);

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated || location.pathname !== LANDING_PATH) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        STORAGE_KEYS.LAST_ALLOWED_ROUTE,
        buildPathname(location)
      );
    } catch {
      // no-op when storage is unavailable
    }
  }, [isAuthenticated, location, sessionChecked]);

  if (!sessionChecked || isLoading) {
    return <MuiLoading fullScreen message="Checking session..." />;
  }

  if (isAuthenticated && location.pathname !== LANDING_PATH) {
    const currentRoute = buildPathname(location);
    const stateFromRoute = buildPathname(location.state?.from);
    const storedRoute = getStoredAllowedRoute();
    const redirectTarget = [stateFromRoute, storedRoute, LANDING_PATH].find(
      (route) => isSafeRedirectTarget(route, currentRoute)
    );

    return <Navigate to={redirectTarget || LANDING_PATH} replace />;
  }

  return <PublicLayout />;
};

export default PublicRouteLayout;
