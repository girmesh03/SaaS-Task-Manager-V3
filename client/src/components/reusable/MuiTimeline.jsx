import { memo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

/**
 * Timeline feed renderer for activity-like data.
 *
 * @param {Record<string, unknown>} props - Timeline props.
 * @returns {JSX.Element} Timeline element.
 * @throws {never} This component does not throw.
 */
const MuiTimeline = ({
  items = [],
  dense = false,
  showOpposite = true,
  emptyMessage = "No timeline items",
  onItemClick,
  sx,
}) => {
  if (!items.length) {
    return (
      <Box sx={{ py: 3, textAlign: "center", ...sx }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Timeline
      position={showOpposite ? "right" : "alternate"}
      sx={{
        m: 0,
        p: 0,
        ...(dense && {
          "& .MuiTimelineItem-root": { minHeight: 64 },
        }),
        ...sx,
      }}
    >
      {items.map((item, index) => {
        const dotColor = item.color || "primary";

        return (
          <TimelineItem key={item.id || `${item.title}-${index}`}>
            {showOpposite && (
              <TimelineOppositeContent
                sx={{
                  flex: 0.3,
                  minWidth: 110,
                  color: "text.secondary",
                  fontSize: "0.75rem",
                }}
              >
                {item.timestamp || ""}
              </TimelineOppositeContent>
            )}

            <TimelineSeparator>
              <TimelineDot color={dotColor} variant={item.variant || "filled"}>
                {item.icon || null}
              </TimelineDot>
              {index < items.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              sx={{
                cursor: onItemClick ? "pointer" : "default",
                py: 0.5,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
              {item.subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {item.subtitle}
                </Typography>
              )}
              {item.description && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {item.description}
                </Typography>
              )}
              {item.meta && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.25, display: "block" }}
                >
                  {item.meta}
                </Typography>
              )}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};

MuiTimeline.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      timestamp: PropTypes.string,
      icon: PropTypes.node,
      color: PropTypes.oneOf([
        "primary",
        "secondary",
        "error",
        "info",
        "success",
        "warning",
        "grey",
      ]),
      variant: PropTypes.oneOf(["filled", "outlined"]),
      meta: PropTypes.string,
    })
  ),
  dense: PropTypes.bool,
  showOpposite: PropTypes.bool,
  emptyMessage: PropTypes.string,
  onItemClick: PropTypes.func,
  sx: PropTypes.object,
};

export default memo(MuiTimeline);
