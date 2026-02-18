/**
 * @file Protected dashboard layout guard.
 */
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { DashboardLayout } from "../components/layouts";
import { MuiLoading } from "../components/reusable";
import { useAuth } from "../hooks";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Builds a canonical route string from a location-like object.
 *
 * @param {{ pathname?: string; search?: string; hash?: string }} location - Router location.
 * @returns {string} Canonical app route with query/hash.
 * @throws {never} This helper does not throw.
 */
const buildPathname = (location) => {
  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}`;
};

/**
 * Guards dashboard routes behind authenticated session state.
 *
 * @returns {JSX.Element} Guarded dashboard content.
 * @throws {never} This component does not throw.
 */
const ProtectedDashboardLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, sessionChecked, refreshSession } = useAuth();

  useEffect(() => {
    if (!sessionChecked) {
      refreshSession().catch(() => undefined);
    }
  }, [refreshSession, sessionChecked]);

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) {
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <DashboardLayout />;
};

export default ProtectedDashboardLayout;
