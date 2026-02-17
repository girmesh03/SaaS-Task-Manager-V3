/**
 * MuiBackdrop Component - Reusable Backdrop
 *
 */

import { forwardRef } from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Backdrop overlay wrapper.
 *
 * @param {Record<string, unknown>} props - Backdrop props.
 * @returns {JSX.Element} Backdrop element.
 * @throws {never} This component does not throw.
 */
const MuiBackdrop = forwardRef(
  (
    {
      open = false,
      onClick,
      loading = true,
      color = "inherit",
      zIndex,
      children,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Backdrop
        ref={ref}
        sx={{
          color: "common.white",
          zIndex: (theme) => zIndex || theme.zIndex.drawer + 1,
          ...sx,
        }}
        open={open}
        onClick={onClick}
        {...muiProps}
      >
        {loading && <CircularProgress color={color} />}
        {children}
      </Backdrop>
    );
  }
);

MuiBackdrop.displayName = "MuiBackdrop";

export default MuiBackdrop;
