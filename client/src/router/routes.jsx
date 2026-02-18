/**
 * @file Application route map for public and dashboard placeholders.
 */
import { createBrowserRouter } from "react-router";
import { RootLayout } from "../components/layouts";
import { MuiLoading } from "../components/reusable";
import ProtectedDashboardLayout from "./ProtectedDashboardLayout";
import PublicRouteLayout from "./PublicRouteLayout";

/**
 * Wraps a lazy module loader in React Router `lazy` contract.
 *
 * @template TModule
 * @param {() => Promise<TModule & { default: React.ComponentType }>} loader - Dynamic import loader.
 * @returns {() => Promise<{ Component: React.ComponentType }>} Lazy route resolver.
 * @throws {Error} Propagates module-loading failures.
 */
const lazyPage = (loader) => {
  return async () => {
    const module = await loader();
    return { Component: module.default };
  };
};

const routes = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    HydrateFallback: MuiLoading,
    children: [
      {
        Component: PublicRouteLayout,
        children: [
          {
            index: true,
            lazy: lazyPage(() => import("../pages/public/LandingPage")),
          },
          {
            path: "login",
            lazy: lazyPage(() => import("../pages/public/LoginPage")),
          },
          {
            path: "register",
            lazy: lazyPage(() => import("../pages/public/RegisterPage")),
          },
          {
            path: "verify-email",
            lazy: lazyPage(() => import("../pages/public/VerifyEmailPage")),
          },
          {
            path: "forgot-password",
            lazy: lazyPage(() => import("../pages/public/ForgotPasswordPage")),
          },
          {
            path: "reset-password",
            lazy: lazyPage(() => import("../pages/public/ResetPasswordPage")),
          },
        ],
      },
      {
        path: "dashboard",
        Component: ProtectedDashboardLayout,
        children: [
          {
            index: true,
            lazy: lazyPage(() => import("../pages/dashboard/DashboardPage")),
          },
          {
            path: "tasks",
            lazy: lazyPage(() => import("../pages/dashboard/TasksPage")),
          },
          {
            path: "tasks/:taskId",
            lazy: lazyPage(() => import("../pages/dashboard/TaskDetailsPage")),
          },
          {
            path: "users",
            lazy: lazyPage(() => import("../pages/dashboard/UsersPage")),
          },
          {
            path: "users/:userId",
            lazy: lazyPage(() => import("../pages/dashboard/UserDetailsPage")),
          },
          {
            path: "departments",
            lazy: lazyPage(() => import("../pages/dashboard/DepartmentsPage")),
          },
          {
            path: "departments/:departmentId",
            lazy: lazyPage(() => import("../pages/dashboard/DepartmentDetailsPage")),
          },
          {
            path: "materials",
            lazy: lazyPage(() => import("../pages/dashboard/MaterialsPage")),
          },
          {
            path: "materials/:materialId",
            lazy: lazyPage(() => import("../pages/dashboard/MaterialDetailsPage")),
          },
          {
            path: "vendors",
            lazy: lazyPage(() => import("../pages/dashboard/VendorsPage")),
          },
          {
            path: "vendors/:vendorId",
            lazy: lazyPage(() => import("../pages/dashboard/VendorDetailsPage")),
          },
          {
            path: "settings",
            lazy: lazyPage(() => import("../pages/dashboard/SettingsPage")),
          },
        ],
      },
      {
        path: "*",
        lazy: lazyPage(() => import("../pages/dashboard/NotFound")),
      },
    ],
  },
]);

export default routes;
