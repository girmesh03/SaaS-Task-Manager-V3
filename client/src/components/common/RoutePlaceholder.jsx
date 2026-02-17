/**
 * @file Generic route placeholder component.
 */
import { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MuiDialog, MuiEmptyState } from "../reusable";

/**
 * Standardized placeholder block for routes deferred to later phases.
 *
 * @param {{ title: string; description: string; routePath: string }} props - Component props.
 * @returns {JSX.Element} Placeholder element.
 * @throws {never} This component does not throw.
 */
const RoutePlaceholder = ({ title, description, routePath }) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Route: {routePath}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => setOpen(true)}>
            Open Dialog Pattern
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <MuiEmptyState
          message={`${title} is not connected yet`}
          secondaryMessage="Phase One placeholder content. API and feature wiring starts in the next phases."
        />
      </Paper>

      <MuiDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${title} dialog recipe`}
        actions={
          <Button variant="contained" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          This placeholder confirms canonical dialog behavior, including full-screen
          rendering on mobile devices.
        </Typography>
      </MuiDialog>
    </Stack>
  );
};

RoutePlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  routePath: PropTypes.string.isRequired,
};

export default RoutePlaceholder;
