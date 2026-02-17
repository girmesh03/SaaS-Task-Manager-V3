import { Link } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const features = [
  {
    title: "Task Management",
    description:
      "Create, assign, and prioritize work with clear ownership across teams.",
  },
  {
    title: "Real-time Collaboration",
    description:
      "Track progress instantly with live updates, comments, and activity streams.",
  },
  {
    title: "Department Organization",
    description:
      "Group work by departments and keep responsibilities cleanly scoped.",
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor project health with status breakdowns and deadline awareness.",
  },
  {
    title: "Vendor Management",
    description:
      "Organize vendors and partner contacts alongside your project lifecycle.",
  },
  {
    title: "Detailed Analytics",
    description:
      "Turn operational data into actionable insights with dashboard summaries.",
  },
];

/**
 * Public landing page placeholder aligned with Phase 1 shell requirements.
 *
 * @returns {JSX.Element} Landing page content.
 * @throws {never} This component does not throw.
 */
const LandingPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={8}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Chip label="6.2x more done" color="primary" size="small" />
          <Typography
            variant="h2"
            sx={{
              maxWidth: 720,
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            Streamline your team&apos;s workflow
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Manage tasks, collaborate in real-time, and track progress effortlessly
            with our all-in-one platform for modern teams.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={Link} to="/register" variant="contained" size="large">
              Start Free Trial
            </Button>
            <Button component={Link} to="/login" variant="outlined" color="inherit" size="large">
              Watch Demo
            </Button>
          </Stack>
        </Stack>

        <Box>
          <Typography variant="h4" textAlign="center" sx={{ fontWeight: 700, mb: 1 }}>
            Key Features
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
            Everything you need to manage your organization effectively, all in one place.
          </Typography>
          <Grid container spacing={2}>
            {features.map((feature) => (
              <Grid key={feature.title} size={{ xs: 12, md: 6, lg: 4 }}>
                <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Ready to boost your productivity?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Join teams using TaskManager to deliver projects on time, every time.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button component={Link} to="/register" variant="contained">
              Get Started Now
            </Button>
            <Button variant="outlined" color="inherit">
              Contact Sales
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default LandingPage;
