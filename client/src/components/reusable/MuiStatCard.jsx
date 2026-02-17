import { memo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

const MuiStatCard = ({
  title,
  value,
  subtitle,
  trendLabel,
  trendColor = "default",
  icon,
  onClick,
  sx,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s ease",
        "&:hover": onClick
          ? {
              boxShadow: (theme) => theme.shadows[4],
            }
          : undefined,
        ...sx,
      }}
    >
      <CardContent sx={{ display: "grid", gap: 1.25 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {icon || null}
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {trendLabel ? (
            <Chip size="small" color={trendColor} label={trendLabel} />
          ) : null}
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
};

MuiStatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trendLabel: PropTypes.string,
  trendColor: PropTypes.oneOf([
    "default",
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
  ]),
  icon: PropTypes.node,
  onClick: PropTypes.func,
  sx: PropTypes.object,
};

export default memo(MuiStatCard);
