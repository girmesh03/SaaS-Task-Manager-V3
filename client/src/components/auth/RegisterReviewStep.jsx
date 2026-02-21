/**
 * @file Register step: review and submit.
 */
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Review step summarizing registration payload before submit.
 *
 * @param {{
 *   getValues: import("react-hook-form").UseFormGetValues<any>;
 * }} props - Component props.
 * @returns {JSX.Element} Review section layout.
 * @throws {never} This component does not throw.
 */
const RegisterReviewStep = ({ getValues }) => {
  const organization = getValues("organization");
  const department = getValues("department");
  const user = getValues("user");

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Organization Details
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Company Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {organization?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Industry
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {organization?.industry || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Company Size
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {organization?.size || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Organization Email
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {organization?.email || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Department Setup
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Primary Department
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {department?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Department Description
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {department?.description || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Account Details
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Work Email
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.email || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                SuperAdmin
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Position
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.position || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default RegisterReviewStep;
