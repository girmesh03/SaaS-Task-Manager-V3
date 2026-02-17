import Box from "@mui/material/Box";
import CheckIcon from "@mui/icons-material/Check";

export const MuiAppIconLogo = () => {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "common.white",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        boxShadow: "0 4px 10px rgba(37, 99, 235, 0.35)",
      }}
    >
      <CheckIcon sx={{ fontSize: 20 }} />
    </Box>
  );
};
