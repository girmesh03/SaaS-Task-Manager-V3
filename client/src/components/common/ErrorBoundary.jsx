/**
 * @file Global client-side error boundary wrapper.
 */
import PropTypes from "prop-types";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Boundary fallback content.
 *
 * @param {{ error: unknown; resetErrorBoundary: () => void }} props - Fallback props.
 * @returns {JSX.Element} Fallback UI.
 */
const Fallback = ({ error, resetErrorBoundary }) => {
  const message = error instanceof Error ? error.message : "Unexpected error";

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
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        <Button size="small" variant="contained" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </Stack>
    </Box>
  );
};

Fallback.propTypes = {
  error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.object]),
  resetErrorBoundary: PropTypes.func.isRequired,
};

/**
 * App-level error boundary component.
 *
 * @param {{ children: React.ReactNode }} props - Boundary children.
 * @returns {JSX.Element} Error boundary wrapper.
 */
const ErrorBoundary = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ReactErrorBoundary>
  );
};

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
