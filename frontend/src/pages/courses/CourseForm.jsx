import {
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import LoadingSpinner from "../../components/LoadingSpinner";
import {
  createCourse,
  getCourse,
  updateCourse,
} from "../../services/courseService";
import { getErrorMessage } from "../../utils/errorMessage";

const initialForm = {
  course_id: "",
  course_code: "",
  course_name: "",
  description: "",
  department: "",
  credits: 3,
  capacity: 30,
  semester: "",
  academic_year: "",
  status: "active",
};

const CourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const isEdit = Boolean(courseId);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    const loadCourse = async () => {
      try {
        const data = await getCourse(courseId);

        setForm({
          course_id: data.course_id || "",
          course_code: data.course_code || "",
          course_name: data.course_name || "",
          description: data.description || "",
          department: data.department || "",
          credits: data.credits || 3,
          capacity: data.capacity || 30,
          semester: data.semester || "",
          academic_year: data.academic_year || "",
          status: data.status || "active",
        });
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load course."
          )
        );

        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, isEdit, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "credits" || name === "capacity"
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
        description: form.description || null,
        semester: form.semester || null,
      };

      if (isEdit) {
        const {
          course_id,
          ...updatePayload
        } = payload;

        await updateCourse(
          courseId,
          updatePayload
        );

        toast.success(
          "Course updated successfully."
        );
      } else {
        await createCourse(payload);

        toast.success(
          "Course created successfully."
        );
      }

      navigate("/courses");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to save course."
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
          ? "Edit Course"
          : "Add Course"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Course ID"
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              disabled={isEdit}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Course Code"
              name="course_code"
              value={form.course_code}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Course Name"
              name="course_name"
              value={form.course_name}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Credits"
              name="credits"
              type="number"
              value={form.credits}
              onChange={handleChange}
              inputProps={{
                min: 1,
              }}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Academic Year"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Capacity"
              name="capacity"
              type="number"
              value={form.capacity}
              onChange={handleChange}
              inputProps={{
                min: 1,
              }}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Semester"
              name="semester"
              value={form.semester}
              onChange={handleChange}
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

              <MenuItem value="completed">
                Completed
              </MenuItem>

              <MenuItem value="cancelled">
                Cancelled
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
                navigate("/courses")
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

export default CourseForm;