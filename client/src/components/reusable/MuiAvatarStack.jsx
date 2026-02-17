import { memo } from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Tooltip from "@mui/material/Tooltip";

const MuiAvatarStack = ({
  users = [],
  max = 3,
  size = 32,
  spacing = "small",
  sx,
}) => {
  return (
    <AvatarGroup
      max={max}
      spacing={spacing}
      sx={{
        "& .MuiAvatar-root": {
          width: size,
          height: size,
          fontSize: size * 0.38,
          border: (theme) => `2px solid ${theme.palette.background.paper}`,
        },
        ...sx,
      }}
    >
      {users.map((user) => {
        const key = user.id || user._id || user.email || user.name;
        const label = user.name || user.fullName || user.email || "User";

        return (
          <Tooltip key={key} title={label} arrow>
            <Avatar
              src={user.avatarUrl || user.profilePicture || undefined}
              alt={label}
            >
              {label?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </Tooltip>
        );
      })}
    </AvatarGroup>
  );
};

MuiAvatarStack.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      fullName: PropTypes.string,
      email: PropTypes.string,
      avatarUrl: PropTypes.string,
      profilePicture: PropTypes.string,
    })
  ),
  max: PropTypes.number,
  size: PropTypes.number,
  spacing: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sx: PropTypes.object,
};

export default memo(MuiAvatarStack);
