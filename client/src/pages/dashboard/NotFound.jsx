import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { MuiEmptyState } from "../../components/reusable";

/**
 * Route fallback page for unknown paths.
 *
 * @returns {JSX.Element} Not-found page element.
 * @throws {never} This component does not throw.
 */
const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Page not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The route you requested does not exist in the current placeholder map.
        </Typography>
      </Box>
      <MuiEmptyState
        message="404"
        secondaryMessage="Use the navigation menu to continue exploring available routes."
      />
    </Container>
  );
};

export default NotFound;
