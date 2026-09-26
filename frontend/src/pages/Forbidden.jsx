import {
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Forbidden = () => {
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
          403
        </Typography>

        <Typography variant="h4">
          Access Denied
        </Typography>

        <Typography color="text.secondary">
          You do not have permission to access
          this page.
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

export default Forbidden;