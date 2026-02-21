/**
 * @file Route-level error component.
 */
import { isRouteErrorResponse, useRouteError } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Route-level error renderer.
 *
 * @returns {JSX.Element} Route error UI.
 */
const RouteError = () => {
  const error = useRouteError();

  const details = isRouteErrorResponse(error)
    ? {
        title: `${error.status} ${error.statusText}`.trim(),
        message: error.data?.message || error.data || "Route request failed.",
      }
    : {
        title: "Unexpected error",
        message:
          error instanceof Error ? error.message : "Route rendering failed.",
      };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {details.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {String(details.message)}
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={() => window.location.assign("/")}
        >
          Go Home
        </Button>
      </Stack>
    </Box>
  );
};

export default RouteError;
