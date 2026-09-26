import {
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
  deleteEnrollment,
  getEnrollments,
} from "../../services/enrollmentService";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const EnrollmentList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrollments, setEnrollments] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [
    selectedEnrollment,
    setSelectedEnrollment,
  ] = useState(null);

  const canManage =
    user?.role === "admin" ||
    user?.role === "lecturer";

  const loadEnrollments = async () => {
    try {
      setLoading(true);

      const data = await getEnrollments();

      setEnrollments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to load enrollments."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteEnrollment(
        selectedEnrollment.enrollment_id
      );

      toast.success(
        "Enrollment deleted successfully."
      );

      setSelectedEnrollment(null);

      loadEnrollments();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete enrollment."
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
        title="Enrollments"
        buttonText="Add Enrollment"
        showButton={canManage}
        onButtonClick={() =>
          navigate("/enrollments/new")
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Enrollment ID
              </TableCell>
              <TableCell>
                Student ID
              </TableCell>
              <TableCell>
                Course ID
              </TableCell>
              <TableCell>
                Enrollment Date
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Grade</TableCell>

              {canManage && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 7 : 6}
                  align="center"
                >
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map(
                (enrollment) => (
                  <TableRow
                    key={
                      enrollment.enrollment_id
                    }
                    hover
                  >
                    <TableCell>
                      {
                        enrollment.enrollment_id
                      }
                    </TableCell>

                    <TableCell>
                      {enrollment.student_id}
                    </TableCell>

                    <TableCell>
                      {enrollment.course_id}
                    </TableCell>

                    <TableCell>
                      {enrollment.enrollment_date}
                    </TableCell>

                    <TableCell>
                      {enrollment.status}
                    </TableCell>

                    <TableCell>
                      {enrollment.grade || "-"}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() =>
                                navigate(
                                  `/enrollments/${enrollment.enrollment_id}/edit`
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
                                setSelectedEnrollment(
                                  enrollment
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
                )
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={Boolean(
          selectedEnrollment
        )}
        title="Delete Enrollment"
        message={`Delete enrollment ${selectedEnrollment?.enrollment_id}?`}
        onCancel={() =>
          setSelectedEnrollment(null)
        }
        onConfirm={handleDelete}
      />
    </>
  );
};

export default EnrollmentList;