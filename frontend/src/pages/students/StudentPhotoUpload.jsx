import {
  Avatar,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import { uploadStudentPhoto } from "../../services/studentService";
import { getErrorMessage } from "../../utils/errorMessage";

const StudentPhotoUpload = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] =
    useState(false);

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setPreview(
      URL.createObjectURL(selectedFile)
    );
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an image.");
      return;
    }

    try {
      setUploading(true);

      await uploadStudentPhoto(
        studentId,
        file
      );

      toast.success(
        "Student photo uploaded successfully."
      );

      navigate("/students");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to upload student photo."
        )
      );
    } finally {
      setUploading(false);
    }
  };

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
        Upload Student Photo
      </Typography>

      <Stack spacing={3}>
        <Typography>
          Student ID: {studentId}
        </Typography>

        <Avatar
          src={preview || undefined}
          sx={{
            width: 140,
            height: 140,
          }}
        />

        <Button
          component="label"
          variant="outlined"
        >
          Select Image

          <input
            hidden
            accept="image/*"
            type="file"
            onChange={handleFileChange}
          />
        </Button>

        <Stack
          direction="row"
          spacing={2}
        >
          <Button
            variant="contained"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading
              ? "Uploading..."
              : "Upload"}
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate("/students")
            }
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default StudentPhotoUpload;