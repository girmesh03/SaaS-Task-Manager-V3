/**
 * @file Responsive breakpoint hook utility.
 */
import { useMemo } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

/**
 * Resolves breakpoint and device-mode booleans from the active MUI theme.
 *
 * @returns {{
 *   isXs: boolean;
 *   isSm: boolean;
 *   isMd: boolean;
 *   isLg: boolean;
 *   isXl: boolean;
 *   isMobile: boolean;
 *   isTablet: boolean;
 *   isDesktop: boolean;
 * }} Responsive state object.
 * @throws {never} This hook does not throw.
 */
const useResponsive = () => {
  const theme = useTheme();

  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const isLg = useMediaQuery(theme.breakpoints.only("lg"));
  const isXl = useMediaQuery(theme.breakpoints.only("xl"));

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return useMemo(
    () => ({
      isXs,
      isSm,
      isMd,
      isLg,
      isXl,
      isMobile,
      isTablet,
      isDesktop,
    }),
    [isXs, isSm, isMd, isLg, isXl, isMobile, isTablet, isDesktop]
  );
};

export default useResponsive;
