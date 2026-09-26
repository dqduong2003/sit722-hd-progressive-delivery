import { Component } from "react";
import {
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: 5,
              mt: 10,
              textAlign: "center",
            }}
          >
            <Stack spacing={2}>
              <Typography
                variant="h4"
                fontWeight={600}
              >
                Something went wrong
              </Typography>

              <Typography color="text.secondary">
                The application encountered an
                unexpected error.
              </Typography>

              <Button
                variant="contained"
                onClick={this.handleReload}
              >
                Reload Application
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;