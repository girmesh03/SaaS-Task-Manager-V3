/**
 * @file Protected dashboard layout guard.
 */
import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { DashboardLayout } from "../components/layout";
import { MuiLoading } from "../components/reusable";
import { useAuth, useSocket } from "../hooks";
import { setSessionChecked } from "../redux/features";
import { STORAGE_KEYS } from "../utils/constants";
import { buildPathname } from "../utils/helpers";

/**
 * Guards dashboard routes behind authenticated session state.
 *
 * @returns {JSX.Element} Guarded dashboard content.
 * @throws {never} This component does not throw.
 */
const ProtectedDashboardLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, sessionChecked, refreshSession } = useAuth();
  const refreshAttemptedRef = useRef(false);

  useSocket({ enabled: isAuthenticated && sessionChecked });

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

  if (!sessionChecked) {
    return <MuiLoading fullScreen message="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <DashboardLayout />;
};

export default ProtectedDashboardLayout;
