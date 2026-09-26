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
  createStudent,
  getStudent,
  updateStudent,
} from "../../services/studentService";
import { getErrorMessage } from "../../utils/errorMessage";

const initialForm = {
  student_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  program: "",
  year_level: 1,
  status: "active",
};

const StudentForm = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const isEdit = Boolean(studentId);

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

    const loadStudent = async () => {
      try {
        const data = await getStudent(studentId);

        setForm({
          student_id: data.student_id,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          date_of_birth:
            data.date_of_birth || "",
          program: data.program || "",
          year_level:
            data.year_level || 1,
          status: data.status || "active",
        });
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load student."
          )
        );

        navigate("/students");
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [isEdit, navigate, studentId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "year_level"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        phone: form.phone || null,
        date_of_birth:
          form.date_of_birth || null,
      };

      if (isEdit) {
        const {
          student_id,
          ...updatePayload
        } = payload;

        await updateStudent(
          studentId,
          updatePayload
        );

        toast.success(
          "Student updated successfully."
        );
      } else {
        await createStudent(payload);

        toast.success(
          "Student created successfully."
        );
      }

      navigate("/students");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to save student."
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
          ? "Edit Student"
          : "Add Student"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Student ID"
              name="student_id"
              value={form.student_id}
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
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Program"
              name="program"
              value={form.program}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Year Level"
              name="year_level"
              type="number"
              value={form.year_level}
              onChange={handleChange}
              inputProps={{
                min: 1,
                max: 10,
              }}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              select
              fullWidth
            >
              <MenuItem value="active">
                Active
              </MenuItem>

              <MenuItem value="inactive">
                Inactive
              </MenuItem>

              <MenuItem value="graduated">
                Graduated
              </MenuItem>

              <MenuItem value="suspended">
                Suspended
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
              onClick={() =>
                navigate("/students")
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

export default StudentForm;