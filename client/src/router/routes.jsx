import { createBrowserRouter } from "react-router";
import { RootLayout } from "../components/layouts";
import { MuiLoading } from "../components/reusable";

const routes = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    HydrateFallback: MuiLoading,
    ErrorBoundary: () => <div> Error </div>,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import("../pages/Home");
          return { Component: module.default };
        },
      },
      {
        path: "*",
        lazy: async () => {
          const module = await import("../pages/NotFound");
          return { Component: module.default };
        },
      },
    ],
  },
]);

export default routes;
