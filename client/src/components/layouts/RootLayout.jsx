/**
 * @file Root layout that mounts shared providers and toast container.
 */
import { Outlet } from "react-router";
import Box from "@mui/material/Box";
import { ToastContainer } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import "react-toastify/dist/ReactToastify.css";

/**
 * Root route layout.
 *
 * @returns {JSX.Element} Root layout element.
 * @throws {never} This component does not throw.
 */
const RootLayout = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Outlet />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode === "dark" ? "dark" : "light"}
      />
    </Box>
  );
};

export default RootLayout;
