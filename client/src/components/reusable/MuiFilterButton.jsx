import { memo } from "react";
import PropTypes from "prop-types";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import FilterListIcon from "@mui/icons-material/FilterList";

/**
 * Filter trigger button with active-filter badge.
 *
 * @param {Record<string, unknown>} props - Filter button props.
 * @returns {JSX.Element} Filter button element.
 * @throws {never} This component does not throw.
 */
const MuiFilterButton = ({
  label = "Filter",
  activeCount = 0,
  onClick,
  disabled = false,
  iconOnlyOnMobile = false,
  sx,
}) => {
  return (
    <Tooltip title={label}>
      <span>
        <Badge badgeContent={activeCount} color="primary" invisible={!activeCount}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FilterListIcon fontSize="small" />}
            onClick={onClick}
            disabled={disabled}
            sx={{
              minWidth: "auto",
              px: 1.25,
              "& .MuiButton-startIcon": {
                mr: iconOnlyOnMobile ? 1 : 1,
                ...(iconOnlyOnMobile && {
                  "@media (max-width: 767.95px)": {
                    mr: 0,
                    ml: 0,
                  },
                }),
              },
              ...(iconOnlyOnMobile && {
                "@media (max-width: 767.95px)": {
                  minWidth: 34,
                  px: 0.75,
                },
              }),
              ...sx,
            }}
            aria-label={typeof label === "string" ? label : "Filter"}
          >
            <Box
              component="span"
              sx={{
                display: iconOnlyOnMobile ? "inline" : "inline",
                ...(iconOnlyOnMobile && {
                  "@media (max-width: 767.95px)": {
                    display: "none",
                  },
                }),
              }}
            >
              {label}
            </Box>
          </Button>
        </Badge>
      </span>
    </Tooltip>
  );
};

MuiFilterButton.propTypes = {
  label: PropTypes.string,
  activeCount: PropTypes.number,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  iconOnlyOnMobile: PropTypes.bool,
  sx: PropTypes.object,
};

export default memo(MuiFilterButton);
