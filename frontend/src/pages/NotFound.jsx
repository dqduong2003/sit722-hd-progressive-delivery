import {
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Paper
      sx={{
        p: 5,
        maxWidth: 600,
        mx: "auto",
        mt: 8,
        textAlign: "center",
      }}
    >
      <Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={700}
        >
          404
        </Typography>

        <Typography variant="h4">
          Page Not Found
        </Typography>

        <Typography color="text.secondary">
          The page you requested does not exist.
        </Typography>

        <Button
          variant="contained"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Return to Dashboard
        </Button>
      </Stack>
    </Paper>
  );
};

export default NotFound;