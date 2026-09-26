import { Chip } from "@mui/material";

const statusColours = {
  active: "success",
  enrolled: "success",
  completed: "primary",
  inactive: "default",
  withdrawn: "warning",
  cancelled: "error",
  failed: "error",
};

const StatusChip = ({ status }) => {
  const value = status || "unknown";

  return (
    <Chip
      label={value}
      size="small"
      color={
        statusColours[value.toLowerCase()] ||
        "default"
      }
      sx={{
        textTransform: "capitalize",
      }}
    />
  );
};

export default StatusChip;