/**
 * @file Public application layout shell.
 */

import { useState } from "react";
import { Link, Outlet } from "react-router";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { MuiAppIconLogo, MuiThemeDropDown } from "../reusable";
import useResponsive from "../../hooks/useResponsive";
import { LAYOUT_DIMENSIONS } from "../../utils/constants";

const navItems = [
  { label: "Product", href: "#" },
  { label: "Features", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Contact", href: "#" },
];

/**
 * Public route layout with app bar and responsive navigation drawer.
 *
 * @returns {JSX.Element} Public layout element.
 * @throws {never} This component does not throw.
 */
const PublicLayout = () => {
  const { isXs } = useResponsive();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * Toggles the mobile navigation drawer visibility.
   *
   * @returns {void} Updates local drawer state.
   * @throws {never} This handler does not throw.
   */
  const handleToggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawerContent = (
    <Box
      sx={{ width: LAYOUT_DIMENSIONS.PUBLIC_DRAWER_WIDTH_PX }}
      role="presentation"
      onClick={handleToggleMobileMenu}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 2 }}>
        <MuiAppIconLogo />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          TaskManager
        </Typography>
      </Stack>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Button component={Link} to="/login" variant="outlined">
          Log In
        </Button>
        <Button component={Link} to="/register" variant="contained">
          Sign Up
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Toolbar sx={{ minHeight: `${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem` }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
            <MuiAppIconLogo />
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                textDecoration: "none",
              }}
            >
              TaskManager
            </Typography>
          </Stack>

          {!isXs && (
            <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
              {navItems.map((item) => (
                <Button key={item.label} color="inherit" size="small" href={item.href}>
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <MuiThemeDropDown />
            {!isXs ? (
              <>
                <Button component={Link} to="/login" variant="text" size="small">
                  Log In
                </Button>
                <Button component={Link} to="/register" variant="contained" size="small">
                  Sign Up
                </Button>
              </>
            ) : (
              <IconButton onClick={handleToggleMobileMenu} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleToggleMobileMenu}
        sx={{ display: { xs: "block", sm: "none" } }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          height: `calc(100vh - ${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem)`,
          maxHeight: `calc(100vh - ${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem)`,
          overflowY: "auto",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default PublicLayout;
