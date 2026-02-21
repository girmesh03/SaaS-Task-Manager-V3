/**
 * @file Public route guard layout.
 */
import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { PublicLayout } from "../components/layout";
import { MuiLoading } from "../components/reusable";
import { useAuth } from "../hooks";
import { setSessionChecked } from "../redux/features";
import { STORAGE_KEYS } from "../utils/constants";
import {
  buildPathname,
  getStoredRoute,
  isSafeRedirectTarget,
} from "../utils/helpers";

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
 * Guards public routes so authenticated users can access only landing page (`/`).
 *
 * @returns {JSX.Element} Guarded public layout.
 * @throws {never} This component does not throw.
 */
const PublicRouteLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, sessionChecked, refreshSession } = useAuth();
  const refreshAttemptedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAttemptedRef.current = false;
      return;
    }

    if (refreshAttemptedRef.current) {
      return;
    }

    refreshAttemptedRef.current = true;
    if (sessionChecked) {
      dispatch(setSessionChecked(false));
    }
    refreshSession().catch(() => undefined);
  }, [dispatch, isAuthenticated, refreshSession, sessionChecked]);

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

  if (!sessionChecked) {
    return <MuiLoading fullScreen message="Checking session..." />;
  }

  if (isAuthenticated && location.pathname !== LANDING_PATH) {
    const currentRoute = buildPathname(location);
    const stateFromRoute = buildPathname(location.state?.from);
    const storedRoute = getStoredRoute(STORAGE_KEYS.LAST_ALLOWED_ROUTE, LANDING_PATH);
    const redirectTarget = [stateFromRoute, storedRoute, LANDING_PATH].find(
      (route) =>
        isSafeRedirectTarget(route, currentRoute, PUBLIC_PATHS, LANDING_PATH)
    );

    return <Navigate to={redirectTarget || LANDING_PATH} replace />;
  }

  return <PublicLayout />;
};

export default PublicRouteLayout;
