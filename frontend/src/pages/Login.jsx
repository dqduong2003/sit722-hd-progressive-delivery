import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { login as loginRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errorMessage";

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    authenticated,
  } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  if (authenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginRequest(form);

      const token =
        data.access_token || data.token;

      if (!token) {
        throw new Error(
          "Access token was not returned."
        );
      }

      login(token);

      navigate("/dashboard");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Login failed."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Card sx={{ mt: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
          >
            KoalaTech University
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Sign in to continue
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              autoComplete="username"
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading
                ? "Signing in..."
                : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
