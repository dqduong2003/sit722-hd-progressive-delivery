import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Edit,
  PhotoCamera,
} from "@mui/icons-material";
import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  deleteLecturer,
  getLecturers,
} from "../../services/lecturerService";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const LecturerList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lecturers, setLecturers] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [
    selectedLecturer,
    setSelectedLecturer,
  ] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadLecturers = async () => {
    try {
      setLoading(true);

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

  useEffect(() => {
    loadLecturers();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteLecturer(
        selectedLecturer.lecturer_id
      );

      toast.success(
        "Lecturer deleted successfully."
      );

      setSelectedLecturer(null);

      loadLecturers();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete lecturer."
        )
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageHeader
        title="Lecturers"
        buttonText="Add Lecturer"
        showButton={isAdmin}
        onButtonClick={() =>
          navigate("/lecturers/new")
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>
                Lecturer ID
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>
                School
              </TableCell>
              <TableCell>
                Designation
              </TableCell>
              <TableCell>Status</TableCell>

              {isAdmin && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {lecturers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  align="center"
                >
                  No lecturers found.
                </TableCell>
              </TableRow>
            ) : (
              lecturers.map((lecturer) => (
                <TableRow
                  key={lecturer.lecturer_id}
                  hover
                >
                  <TableCell>
                    <Avatar
                      src={
                        lecturer.profile_photo_url ||
                        undefined
                      }
                    >
                      {lecturer.first_name?.[0]}
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    {lecturer.lecturer_id}
                  </TableCell>

                  <TableCell>
                    {lecturer.first_name}{" "}
                    {lecturer.last_name}
                  </TableCell>

                  <TableCell>
                    {lecturer.email}
                  </TableCell>

                  <TableCell>
                    {lecturer.school}
                  </TableCell>

                  <TableCell>
                    {lecturer.designation}
                  </TableCell>

                  <TableCell>
                    {lecturer.employment_status}
                  </TableCell>

                  {isAdmin && (
                    <TableCell align="right">
                      <Box>
                        <Tooltip title="Upload photo">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/lecturers/${lecturer.lecturer_id}/photo`
                              )
                            }
                          >
                            <PhotoCamera />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/lecturers/${lecturer.lecturer_id}/edit`
                              )
                            }
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() =>
                              setSelectedLecturer(
                                lecturer
                              )
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={Boolean(selectedLecturer)}
        title="Delete Lecturer"
        message={`Delete lecturer ${selectedLecturer?.lecturer_id}?`}
        onCancel={() =>
          setSelectedLecturer(null)
        }
        onConfirm={handleDelete}
      />
    </>
  );
};

export default LecturerList;