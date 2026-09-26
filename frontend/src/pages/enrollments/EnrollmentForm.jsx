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
  createEnrollment,
  getEnrollment,
  updateEnrollment,
} from "../../services/enrollmentService";
import { getStudents } from "../../services/studentService";
import { getCourses } from "../../services/courseService";
import { getErrorMessage } from "../../utils/errorMessage";

const initialForm = {
  student_id: "",
  course_id: "",
  enrollment_date: "",
  status: "enrolled",
  grade: "",
};

const EnrollmentForm = () => {
  const navigate = useNavigate();
  const { enrollmentId } = useParams();

  const isEdit = Boolean(enrollmentId);

  const [form, setForm] =
    useState(initialForm);
  const [students, setStudents] =
    useState([]);
  const [courses, setCourses] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          studentData,
          courseData,
        ] = await Promise.all([
          getStudents(),
          getCourses(),
        ]);

        setStudents(
          Array.isArray(studentData)
            ? studentData
            : []
        );

        setCourses(
          Array.isArray(courseData)
            ? courseData
            : []
        );

        if (isEdit) {
          const enrollment =
            await getEnrollment(
              enrollmentId
            );

          setForm({
            student_id:
              enrollment.student_id || "",
            course_id:
              enrollment.course_id || "",
            enrollment_date:
              enrollment.enrollment_date ||
              "",
            status:
              enrollment.status ||
              "enrolled",
            grade:
              enrollment.grade || "",
          });
        }
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load enrollment data."
          )
        );

        navigate("/enrollments");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    enrollmentId,
    isEdit,
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
        ...form,
        grade: form.grade || null,
      };

      if (isEdit) {
        await updateEnrollment(
          enrollmentId,
          payload
        );

        toast.success(
          "Enrollment updated successfully."
        );
      } else {
        await createEnrollment(payload);

        toast.success(
          "Enrollment created successfully."
        );
      }

      navigate("/enrollments");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to save enrollment."
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
          ? "Edit Enrollment"
          : "Add Enrollment"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Student"
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              disabled={isEdit}
              select
              required
              fullWidth
            >
              {students.map((student) => (
                <MenuItem
                  key={student.student_id}
                  value={student.student_id}
                >
                  {student.student_id} -{" "}
                  {student.first_name}{" "}
                  {student.last_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Course"
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              disabled={isEdit}
              select
              required
              fullWidth
            >
              {courses.map((course) => (
                <MenuItem
                  key={course.course_id}
                  value={course.course_id}
                >
                  {course.course_code} -{" "}
                  {course.course_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Enrollment Date"
              name="enrollment_date"
              type="date"
              value={form.enrollment_date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              required
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
              <MenuItem value="enrolled">
                Enrolled
              </MenuItem>

              <MenuItem value="completed">
                Completed
              </MenuItem>

              <MenuItem value="withdrawn">
                Withdrawn
              </MenuItem>

              <MenuItem value="failed">
                Failed
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Grade"
              name="grade"
              value={form.grade}
              onChange={handleChange}
              fullWidth
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
                navigate("/enrollments")
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

export default EnrollmentForm;