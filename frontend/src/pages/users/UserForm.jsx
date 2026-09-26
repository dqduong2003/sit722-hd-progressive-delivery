import {
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import LoadingSpinner from "../../components/LoadingSpinner";
import {
  createUser,
  getUser,
  updateUser,
} from "../../services/userService";
import { getErrorMessage } from "../../utils/errorMessage";

const initialForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "student",
  is_active: true,
};

const UserForm = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const isEdit = Boolean(userId);

  const [form, setForm] =
    useState(initialForm);
  const [loading, setLoading] =
    useState(isEdit);
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    const loadUser = async () => {
      try {
        const data = await getUser(userId);

        setForm({
          first_name:
            data.first_name || "",
          last_name:
            data.last_name || "",
          email: data.email || "",
          password: "",
          role: data.role || "student",
          is_active:
            data.is_active ?? true,
        });
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load user."
          )
        );

        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [isEdit, navigate, userId]);

  const handleChange = (event) => {
    const {
      name,
      value,
      checked,
      type,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
      };

      if (isEdit && !payload.password) {
        delete payload.password;
      }

      if (isEdit) {
        await updateUser(userId, payload);

        toast.success(
          "User updated successfully."
        );
      } else {
        await createUser(payload);

        toast.success(
          "User created successfully."
        );
      }

      navigate("/users");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to save user."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3 }}
      >
        {isEdit
          ? "Edit User"
          : "Add User"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>

          <Grid item xs={12} md={6}> 
            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="username" 
            /> 
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label={
                isEdit
                  ? "New Password"
                  : "Password"
              }
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              select
              required
              fullWidth
            >
              <MenuItem value="admin">
                Admin
              </MenuItem>

              <MenuItem value="lecturer">
                Lecturer
              </MenuItem>

              <MenuItem value="student">
                Student
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
              }
              label="Active User"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ mr: 2 }}
            >
              {saving
                ? "Saving..."
                : "Save"}
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                navigate("/users")
              }
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default UserForm;