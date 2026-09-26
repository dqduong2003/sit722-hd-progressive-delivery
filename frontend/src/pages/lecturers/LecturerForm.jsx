import {
  Button,
  Grid,
  MenuItem,
  Paper,
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
  createLecturer,
  getLecturer,
  updateLecturer,
} from "../../services/lecturerService";
import { getErrorMessage } from "../../utils/errorMessage";

const initialForm = {
  lecturer_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department: "",
  school: "",
  designation: "",
  specialisation: "",
  status: "active",
};

const LecturerForm = () => {
  const navigate = useNavigate();
  const { lecturerId } = useParams();

  const isEdit = Boolean(lecturerId);

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

    const loadLecturer = async () => {
      try {
        const data =
          await getLecturer(lecturerId);

        setForm({
          lecturer_id:
            data.lecturer_id || "",
          first_name:
            data.first_name || "",
          last_name:
            data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          department:
            data.department || "",
          school: data.school || "",
          designation:
            data.designation || "",
          specialisation:
            data.specialisation || "",
          status: data.status || "active",
        });
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load lecturer."
          )
        );

        navigate("/lecturers");
      } finally {
        setLoading(false);
      }
    };

    loadLecturer();
  }, [
    isEdit,
    lecturerId,
    navigate,
  ]);

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
      setSaving(true);

      const payload = {
        lecturer_id:
          form.lecturer_id.trim(),
        first_name:
          form.first_name.trim(),
        last_name:
          form.last_name.trim(),
        email: form.email.trim(),
        phone:
          form.phone.trim() || null,
        department:
          form.department.trim(),
        school: form.school.trim(),
        designation:
          form.designation.trim(),
        specialisation:
          form.specialisation.trim() ||
          null,
        status: form.status,
      };

      if (isEdit) {
        const {
          lecturer_id,
          ...updatePayload
        } = payload;

        await updateLecturer(
          lecturerId,
          updatePayload
        );

        toast.success(
          "Lecturer updated successfully."
        );
      } else {
        await createLecturer(payload);

        toast.success(
          "Lecturer created successfully."
        );
      }

      navigate("/lecturers");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to save lecturer."
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
          ? "Edit Lecturer"
          : "Add Lecturer"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Lecturer ID"
              name="lecturer_id"
              value={form.lecturer_id}
              onChange={handleChange}
              disabled={isEdit}
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
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="School"
              name="school"
              value={form.school}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              label="Specialisation"
              name="specialisation"
              value={form.specialisation}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              select
              required
              fullWidth
            >
              <MenuItem value="active">
                Active
              </MenuItem>

              <MenuItem value="inactive">
                Inactive
              </MenuItem>

              <MenuItem value="on_leave">
                On Leave
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ mr: 2 }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="outlined"
              disabled={saving}
              onClick={() =>
                navigate("/lecturers")
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

export default LecturerForm;