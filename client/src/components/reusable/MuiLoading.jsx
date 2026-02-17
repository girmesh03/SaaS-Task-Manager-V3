/**
 * MuiLoading Component - Reusable Loading Spinner
 *
 * Enhanced loading component with multiple display modes.
 * Supports full-screen loading, and inline loading.
 *
 * Features:
 * - Circular progress spinner
 * - Full-screen overlay mode
 * - Inline loading mode
 * - Theme-based styling
 * - Customizable size and color
 * - Accessibility support
 *
 * @example
 * // Basic loading spinner
 * <MuiLoading message="Loading data..." />
 *
 * @example
 * // Full-screen loading
 * <MuiLoading fullScreen message="Please wait..." />
 *
 * @example
 * // Skeleton loading for text
 * <MuiLoading variant="skeleton" skeletonType="text" count={3} />
 *
 */

import { memo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

const MuiLoading = ({
  message = "Loading",
  size = 40,
  color = "primary",
  fullScreen = false,
  ...muiProps
}) => {
  // Render full-screen spinner
  if (fullScreen) {
    return (
      <Box
        role="progressbar"
        aria-label={message}
        aria-busy="true"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "background.default",
          zIndex: (theme) => theme.zIndex.modal + 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.95,
        }}
      >
        <CircularProgress
          size={size}
          color={color}
          disableShrink
          {...muiProps}
        />
        {message && (
          <Typography
            variant="h6"
            sx={{
              mt: 2,
              color: "text.secondary",
              fontWeight: (theme) => theme.typography.fontWeightMedium,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Render inline spinner
  return (
    <Box
      role="progressbar"
      aria-label={message}
      aria-busy="true"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        width: "100%",
        height: "100%",
        minHeight: 100,
      }}
    >
      <CircularProgress size={size} color={color} {...muiProps} />
      {message && (
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

MuiLoading.propTypes = {
  message: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
    "inherit",
  ]),
  fullScreen: PropTypes.bool,
};

export default memo(MuiLoading);
