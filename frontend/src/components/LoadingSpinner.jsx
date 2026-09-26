import {
  Box,
  CircularProgress,
} from "@mui/material";

const LoadingSpinner = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 250,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default LoadingSpinner;