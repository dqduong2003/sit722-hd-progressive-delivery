import {
  Button,
  MenuItem,
  Paper,
  Stack,
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
import { assignLecturer } from "../../services/courseService";
import { getLecturers } from "../../services/lecturerService";
import { getErrorMessage } from "../../utils/errorMessage";

const AssignLecturer = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [lecturers, setLecturers] = useState([]);
  const [lecturerId, setLecturerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadLecturers = async () => {
      try {
        const data = await getLecturers();

        setLecturers(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load lecturers."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadLecturers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await assignLecturer(
        courseId,
        lecturerId
      );

      toast.success(
        "Lecturer assigned successfully."
      );

      navigate("/courses");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to assign lecturer."
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
    <Paper
      sx={{
        p: 3,
        maxWidth: 600,
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 3 }}
      >
        Assign Lecturer
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography>
            Course ID: {courseId}
          </Typography>

          <TextField
            label="Lecturer"
            value={lecturerId}
            onChange={(event) =>
              setLecturerId(event.target.value)
            }
            select
            required
            fullWidth
          >
            {lecturers.map((lecturer) => (
              <MenuItem
                key={lecturer.lecturer_id}
                value={lecturer.lecturer_id}
              >
                {lecturer.lecturer_id} -{" "}
                {lecturer.first_name}{" "}
                {lecturer.last_name}
              </MenuItem>
            ))}
          </TextField>

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={!lecturerId || saving}
            >
              {saving
                ? "Assigning..."
                : "Assign"}
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                navigate("/courses")
              }
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};

export default AssignLecturer;