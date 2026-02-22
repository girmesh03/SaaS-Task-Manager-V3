import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { MuiLoading, MuiStatCard, MuiTextField } from "../reusable";
import { PERFORMANCE_RANGES } from "../../utils/constants";

/**
 * User details Performance tab.
 *
 * @param {{
 *   performance: Record<string, unknown>;
 *   isPerformanceFetching: boolean;
 *   performanceRange: string;
 *   onPerformanceRangeChange: (value: string) => void;
 * }} props - Component props.
 * @returns {JSX.Element} User performance tab.
 * @throws {never} This component does not throw.
 */
const UserPerformanceTab = ({
  performance,
  isPerformanceFetching,
  performanceRange,
  onPerformanceRangeChange,
}) => {
  if (isPerformanceFetching) {
    return <MuiLoading message="Loading performance metrics..." />;
  }

  return (
    <Stack spacing={2}>
	      <Stack direction="row" justifyContent="flex-end">
	        <MuiTextField
	          select
	          value={performanceRange}
	          onChange={(event) => onPerformanceRangeChange(event.target.value)}
	          startAdornment={<InsightsOutlinedIcon fontSize="small" />}
	          helperText="Range"
	          sx={{ minWidth: 220 }}
	          reserveHelperTextSpace={false}
	        >
          {PERFORMANCE_RANGES.map((entry) => (
            <MenuItem key={entry} value={entry}>
              {entry}
            </MenuItem>
          ))}
        </MuiTextField>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <MuiStatCard
            title="Completion Rate"
            value={`${performance.completionRate || 0}%`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <MuiStatCard
            title="Avg. Task Time"
            value={`${performance.avgTaskTimeHours || 0}h`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <MuiStatCard title="Tasks Completed" value={performance.throughput || 0} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 220 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Monthly Throughput
            </Typography>
            {(performance.series || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No throughput data available.
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {(performance.series || []).map((entry) => (
                  <Stack key={entry.label} spacing={0.3}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">{entry.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.completed}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: "primary.main",
                        width: `${Math.min((entry.completed || 0) * 10, 100)}%`,
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 220 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Efficiency vs. Team
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Comparison to department average: {performance.comparisonToDeptAvg || 0}%
            </Typography>
            <Box
              sx={{
                height: 120,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
              }}
            >
              Performance radar visualization placeholder
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

UserPerformanceTab.propTypes = {
  performance: PropTypes.object,
  isPerformanceFetching: PropTypes.bool,
  performanceRange: PropTypes.string.isRequired,
  onPerformanceRangeChange: PropTypes.func.isRequired,
};

UserPerformanceTab.defaultProps = {
  performance: {},
  isPerformanceFetching: false,
};

export default UserPerformanceTab;
