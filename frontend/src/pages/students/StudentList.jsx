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
  deleteStudent,
  getStudents,
} from "../../services/studentService";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const StudentList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const isAdmin = user?.role === "admin";

  const loadStudents = async () => {
    try {
      setLoading(true);

      const data = await getStudents();

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to load students."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteStudent(
        selectedStudent.student_id
      );

      toast.success(
        "Student deleted successfully."
      );

      setSelectedStudent(null);

      loadStudents();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete student."
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
        title="Students"
        buttonText="Add Student"
        showButton={isAdmin}
        onButtonClick={() =>
          navigate("/students/new")
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Status</TableCell>

              {isAdmin && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  align="center"
                >
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.student_id}
                  hover
                >
                  <TableCell>
                    <Avatar
                      src={
                        student.profile_photo_url ||
                        undefined
                      }
                    >
                      {student.first_name?.[0]}
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    {student.student_id}
                  </TableCell>

                  <TableCell>
                    {student.first_name}{" "}
                    {student.last_name}
                  </TableCell>

                  <TableCell>
                    {student.email}
                  </TableCell>

                  <TableCell>
                    {student.program}
                  </TableCell>

                  <TableCell>
                    {student.year_level}
                  </TableCell>

                  <TableCell>
                    {student.status}
                  </TableCell>

                  {isAdmin && (
                    <TableCell align="right">
                      <Box>
                        <Tooltip title="Upload photo">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/students/${student.student_id}/photo`
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
                                `/students/${student.student_id}/edit`
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
                              setSelectedStudent(
                                student
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
        open={Boolean(selectedStudent)}
        title="Delete Student"
        message={`Delete student ${selectedStudent?.student_id}?`}
        onCancel={() =>
          setSelectedStudent(null)
        }
        onConfirm={handleDelete}
      />
    </>
  );
};

export default StudentList;