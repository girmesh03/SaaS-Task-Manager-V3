/**
 * @file Dashboard application layout shell.
 */

import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AddIcon from "@mui/icons-material/Add";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  MuiAppIconLogo,
  MuiBottomNavigation,
  MuiDialog,
  MuiFAB,
  MuiPagination,
  MuiSearchField,
  MuiSelectAutocomplete,
  MuiThemeDropDown,
} from "../reusable";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import useAuthorization from "../../hooks/useAuthorization";
import { LAYOUT_DIMENSIONS, UI_PLACEHOLDERS } from "../../utils/constants";
import { useGetOrganizationsQuery } from "../../services/api";
import { capitalizeFirstCharacter } from "../../utils/helpers";

const workspaceLinks = [
  { label: "Dashboard", to: "/dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Tasks", to: "/dashboard/tasks", icon: <TaskAltOutlinedIcon /> },
  { label: "Users", to: "/dashboard/users", icon: <PeopleAltOutlinedIcon /> },
];

const manageLinks = [
  {
    label: "Departments",
    to: "/dashboard/departments",
    icon: <ApartmentOutlinedIcon />,
  },
  {
    label: "Materials",
    to: "/dashboard/materials",
    icon: <Inventory2OutlinedIcon />,
  },
  {
    label: "Vendors",
    to: "/dashboard/vendors",
    icon: <LocalShippingOutlinedIcon />,
  },
];

const configurationLinks = [
  {
    label: "Settings",
    to: "/dashboard/settings",
    icon: <SettingsOutlinedIcon />,
  },
];

const bottomNavActions = [
  {
    value: "dashboard",
    label: "Dashboard",
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    value: "tasks",
    label: "Tasks",
    icon: <TaskAltOutlinedIcon fontSize="small" />,
  },
  {
    value: "users",
    label: "Users",
    icon: <PeopleAltOutlinedIcon fontSize="small" />,
  },
  {
    value: "profile",
    label: "Profile",
    icon: <AccountCircleOutlinedIcon fontSize="small" />,
  },
];

const pageTitleMatchers = [
  { match: /^\/dashboard$/, title: "Dashboard" },
  { match: /^\/dashboard\/tasks/, title: "Tasks" },
  { match: /^\/dashboard\/users/, title: "Users" },
  { match: /^\/dashboard\/departments/, title: "Departments" },
  { match: /^\/dashboard\/materials/, title: "Materials" },
  { match: /^\/dashboard\/vendors/, title: "Vendors" },
  { match: /^\/dashboard\/settings/, title: "Settings" },
];

/**
 * Resolves page title from route path.
 *
 * @param {string} pathname - Current browser pathname.
 * @returns {string} Matching page title.
 * @throws {never} This resolver does not throw.
 */
const getPageTitle = (pathname) => {
  const match = pageTitleMatchers.find((entry) => entry.match.test(pathname));
  return match ? match.title : "Dashboard";
};

/**
 * Resolves active bottom-navigation value from current route.
 *
 * @param {string} pathname - Current browser pathname.
 * @returns {"dashboard" | "tasks" | "users" | "profile"} Active bottom-nav key.
 * @throws {never} This resolver does not throw.
 */
const getBottomNavValue = (pathname) => {
  if (pathname.startsWith("/dashboard/tasks")) {
    return "tasks";
  }

  if (pathname.startsWith("/dashboard/users")) {
    return "users";
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard?")) {
    return "dashboard";
  }

  return "profile";
};

/**
 * Dashboard route layout with app bar, drawer, and mobile bottom navigation.
 *
 * @returns {JSX.Element} Dashboard layout element.
 * @throws {never} This component does not throw.
 */
const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = useAuthorization();
  const { isXs, isDesktop } = useResponsive();
  const isBelow768 = useMediaQuery("(max-width:767.95px)");

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [fabAnchorEl, setFabAnchorEl] = useState(null);
  const [organizationPage, setOrganizationPage] = useState(1);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [organizationSelectorOpen, setOrganizationSelectorOpen] =
    useState(false);

  const currentUser = useMemo(
    () => ({
      name: user?.fullName || user?.firstName || "User",
      role: user?.role || "Member",
      organization: capitalizeFirstCharacter(
        user?.organizationName || user?.organization?.name || "Organization"
      ),
      organizationId:
        user?.organization?.id ||
        user?.organization?._id ||
        (typeof user?.organization === "string" ? user.organization : ""),
      department: capitalizeFirstCharacter(
        user?.departmentName || user?.department?.name || "Department"
      ),
      isPlatformOrgUser: Boolean(user?.isPlatformOrgUser),
    }),
    [user]
  );

  const pageTitle = getPageTitle(location.pathname);
  const bottomNavValue = getBottomNavValue(location.pathname);
  const organizationPageSize =
    UI_PLACEHOLDERS.ORGANIZATION_SWITCHER_PAGE_SIZE || 5;
  const globalSearchGroups = useMemo(() => {
    const filterText = String(globalSearch || "")
      .trim()
      .toLowerCase();
    const groupSamples = {
      Departments: ["Engineering", "Housekeeping", "Administration"],
      Users: ["Girmachew Zewdie", "Ashenafi Abeje", "Seble Tefera"],
      Tasks: ["Boiler maintenance", "Fire safety inspection"],
      Materials: ["Copper pipe", "Cleaning detergent"],
      Vendors: ["Elilly Supplies", "Capital Engineering Partner"],
    };
    const sourceGroups = (UI_PLACEHOLDERS.GLOBAL_SEARCH_GROUPS || []).map(
      (groupName) => ({
        name: groupName,
        items: groupSamples[groupName] || [],
      })
    );

    return sourceGroups
      .map((group) => ({
        ...group,
        items: filterText
          ? group.items.filter((item) =>
              item.toLowerCase().includes(filterText)
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [globalSearch]);
  const canSwitchOrganization = useMemo(() => {
    return can("Organization", "read", {
      target: { organization: "__cross_organization__" },
    });
  }, [can]);
  const { data: organizationsResponse, isFetching: isOrganizationsFetching } =
    useGetOrganizationsQuery(
      {
        page: organizationPage,
        limit: organizationPageSize,
        includeDeleted: false,
        sortBy: "name",
        sortOrder: "asc",
      },
      {
        skip: !canSwitchOrganization || !organizationSelectorOpen,
      }
    );
  const organizationOptions = useMemo(() => {
    const organizations = organizationsResponse?.data?.organizations || [];
    return organizations.map((organization) => ({
      value: organization.id,
      name: capitalizeFirstCharacter(organization.name),
    }));
  }, [organizationsResponse?.data?.organizations]);
  const organizationPagination = organizationsResponse?.data?.pagination || {};
  const activeOrganizationId =
    selectedOrganizationId || currentUser.organizationId || "";
  const activeOrganizationName = useMemo(() => {
    if (!activeOrganizationId) {
      return currentUser.organization;
    }

    const selectedOption = organizationOptions.find(
      (option) => String(option.value) === String(activeOrganizationId)
    );
    return selectedOption?.name || currentUser.organization;
  }, [activeOrganizationId, currentUser.organization, organizationOptions]);

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen((prev) => !prev);
  };

  const handleNavigationClick = () => {
    if (!isDesktop) {
      setMobileDrawerOpen(false);
    }
  };

  const openProfileMenu = (target) => {
    setProfileAnchorEl(target);
  };

  const closeProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  const openFabMenu = (target) => {
    setFabAnchorEl(target);
  };

  const closeFabMenu = () => {
    setFabAnchorEl(null);
  };

  const handleBottomNavigationChange = (event, nextValue) => {
    if (nextValue === "profile") {
      const trigger = event.target?.closest?.("button") || event.currentTarget;
      openProfileMenu(trigger);
      return;
    }

    const pathMap = {
      dashboard: "/dashboard",
      tasks: "/dashboard/tasks",
      users: "/dashboard/users",
    };

    const destination = pathMap[nextValue];
    if (destination) {
      navigate(destination);
    }
  };

  const handleProfileMenuNavigation = (path) => {
    navigate(path);
    closeProfileMenu();
  };

  const renderNavSection = (title, items, options = {}) => {
    return (
      <List
        dense
        subheader={
          <ListSubheader component="div" disableSticky>
            {title}
          </ListSubheader>
        }
      >
        {items.map((item) => {
          const isSelected =
            item.to === "/dashboard"
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

          const showTaskBadge = Boolean(
            options.showTaskBadge && item.label === "Tasks"
          );

          return (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                selected={isSelected}
                onClick={handleNavigationClick}
                sx={{ borderRadius: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" component="span">
                        {item.label}
                      </Typography>
                      {showTaskBadge ? (
                        <Box
                          component="span"
                          sx={{
                            px: 0.75,
                            py: 0.125,
                            borderRadius: 999,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          {UI_PLACEHOLDERS.TASK_BADGE_COUNT}
                        </Box>
                      ) : null}
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    );
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ px: 2, py: 2.5 }}
      >
        <MuiAppIconLogo />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          TaskManager
        </Typography>
      </Stack>

      <Box sx={{ px: 2, pb: 2 }}>
        {canSwitchOrganization ? (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Organization
            </Typography>
            {!organizationSelectorOpen ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOrganizationSelectorOpen(true)}
                sx={{ mt: 1, width: "100%", justifyContent: "flex-start" }}
              >
                {activeOrganizationName}
              </Button>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <MuiSelectAutocomplete
                  value={activeOrganizationId}
                  onOpen={() => setOrganizationSelectorOpen(true)}
                  onClose={() => setOrganizationSelectorOpen(false)}
                  onChange={(_event, value) =>
                    setSelectedOrganizationId(String(value || ""))
                  }
                  options={organizationOptions}
                  valueMode="id"
                  placeholder={
                    currentUser.organization || "Select organization"
                  }
                  isLoading={isOrganizationsFetching}
                  showSelectionChip={false}
                  fullWidth
                />
                {Number(organizationPagination.totalPages || 1) > 1 ? (
                  <Stack direction="row" justifyContent="center">
                    <MuiPagination
                      count={organizationPagination.totalPages || 1}
                      page={organizationPagination.page || organizationPage}
                      onChange={(_event, pageValue) =>
                        setOrganizationPage(pageValue)
                      }
                    />
                  </Stack>
                ) : null}
              </Stack>
            )}
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {currentUser.organization}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser.department}
            </Typography>
          </Paper>
        )}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
        {renderNavSection("Workspace", workspaceLinks, { showTaskBadge: true })}
        {renderNavSection("Manage", manageLinks)}
        {renderNavSection("Configuration", configurationLinks)}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          height: LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_PX,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          width: {
            md: `calc(100% - ${LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX}px)`,
          },
          ml: { md: `${LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX}px` },
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem`,
            gap: 1.5,
          }}
        >
          <IconButton
            edge="start"
            onClick={toggleMobileDrawer}
            aria-label="Open sidebar"
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, minWidth: 120, flexGrow: 1 }}
          >
            {pageTitle}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {isBelow768 ? (
            <Tooltip title="Global Search">
              <IconButton
                size="small"
                aria-label="Open global search"
                onClick={() => setGlobalSearchOpen(true)}
              >
                <SearchOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<SearchOutlinedIcon fontSize="small" />}
              onClick={() => setGlobalSearchOpen(true)}
            >
              Global Search
            </Button>
          )}

          <MuiThemeDropDown />

          <IconButton aria-label="Notifications">
            <Badge
              color="error"
              badgeContent={UI_PLACEHOLDERS.NOTIFICATION_BADGE_COUNT}
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>

          <IconButton
            aria-label="Open user menu"
            onClick={(event) => openProfileMenu(event.currentTarget)}
          >
            <Avatar sx={{ width: 30, height: 30 }}>
              {currentUser.name.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={toggleMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            backgroundImage: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { md: `${LAYOUT_DIMENSIONS.DASHBOARD_DRAWER_WIDTH_PX}px` },
          mt: `${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem`,
          height: `calc(100vh - ${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem)`,
          maxHeight: `calc(100vh - ${LAYOUT_DIMENSIONS.APP_BAR_HEIGHT_REM}rem)`,
          overflowY: "auto",
          px: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            pt: 2,
            pb: {
              xs: LAYOUT_DIMENSIONS.MOBILE_BOTTOM_NAV_HEIGHT_PX + 24,
              md: 3,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {isXs ? (
        <>
          <MuiBottomNavigation
            value={bottomNavValue}
            onChange={handleBottomNavigationChange}
            actions={bottomNavActions}
            showLabels
            sx={{ minHeight: LAYOUT_DIMENSIONS.MOBILE_BOTTOM_NAV_HEIGHT_PX }}
          />
          <MuiFAB
            aria-label="Create new item"
            onClick={(event) => openFabMenu(event.currentTarget)}
            size="small"
            sx={{
              position: "fixed",
              left: "45%",
              transform: "translateX(-50%)",
              bottom:
                (LAYOUT_DIMENSIONS.MOBILE_BOTTOM_NAV_HEIGHT_PX -
                  LAYOUT_DIMENSIONS.MOBILE_FAB_SIZE_PX +
                  56) /
                2,
              zIndex: (theme) => theme.zIndex.modal,
            }}
          >
            <AddIcon />
          </MuiFAB>
        </>
      ) : null}

      <MuiDialog
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        title="Global Search"
        maxWidth={isBelow768 ? "xl" : "md"}
        fullWidth
        fullScreen={isBelow768}
      >
        <Stack spacing={1.5}>
          <MuiSearchField
            value={globalSearch}
            onDebouncedChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search departments, users, tasks, materials, and vendors..."
            ariaLabel="Global search"
            size="small"
            reserveHelperTextSpace={false}
            autoFocus
          />

          {globalSearchGroups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No results found in placeholder groups.
            </Typography>
          ) : (
            globalSearchGroups.map((group) => (
              <Accordion key={group.name} disableGutters defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">{group.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {group.items.map((item) => (
                      <Typography
                        key={`${group.name}-${item}`}
                        variant="body2"
                        color="text.secondary"
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Stack>
      </MuiDialog>

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={closeProfileMenu}
      >
        <MenuItem
          onClick={() => handleProfileMenuNavigation("/dashboard/departments")}
        >
          Departments
        </MenuItem>
        <MenuItem
          onClick={() => handleProfileMenuNavigation("/dashboard/materials")}
        >
          Materials
        </MenuItem>
        <MenuItem
          onClick={() => handleProfileMenuNavigation("/dashboard/vendors")}
        >
          Vendors
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleProfileMenuNavigation("/dashboard/settings")}
        >
          Settings
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={fabAnchorEl}
        open={Boolean(fabAnchorEl)}
        onClose={closeFabMenu}
      >
        <MenuItem onClick={closeFabMenu}>Create Task</MenuItem>
        <MenuItem onClick={closeFabMenu}>Create User</MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;
