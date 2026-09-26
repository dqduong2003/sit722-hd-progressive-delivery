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
  PersonAdd,
  PersonRemove,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  deleteCourse,
  getCourses,
  removeLecturer,
} from "../../services/courseService";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const CourseList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadCourses = async () => {
    try {
      setLoading(true);

      const data = await getCourses();

      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to load courses."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteCourse(selectedCourse.course_id);

      toast.success("Course deleted successfully.");

      setSelectedCourse(null);

      loadCourses();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete course."
        )
      );
    }
  };

  const handleRemoveLecturer = async (courseId) => {
    try {
      await removeLecturer(courseId);

      toast.success("Lecturer removed successfully.");

      loadCourses();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to remove lecturer."
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
        title="Courses"
        buttonText="Add Course"
        showButton={isAdmin}
        onButtonClick={() =>
          navigate("/courses/new")
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course ID</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Lecturer</TableCell>
              <TableCell>Status</TableCell>

              {isAdmin && (
                <TableCell align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  align="center"
                >
                  No courses found.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow
                  key={course.course_id}
                  hover
                >
                  <TableCell>
                    {course.course_id}
                  </TableCell>

                  <TableCell>
                    {course.course_code}
                  </TableCell>

                  <TableCell>
                    {course.course_name}
                  </TableCell>

                  <TableCell>
                    {course.department}
                  </TableCell>

                  <TableCell>
                    {course.credits}
                  </TableCell>

                  <TableCell>
                    {course.lecturer_id || "Not assigned"}
                  </TableCell>

                  <TableCell>
                    {course.status}
                  </TableCell>

                  {isAdmin && (
                    <TableCell align="right">
                      <Box>
                        <Tooltip title="Assign lecturer">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/courses/${course.course_id}/assign-lecturer`
                              )
                            }
                          >
                            <PersonAdd />
                          </IconButton>
                        </Tooltip>

                        {course.lecturer_id && (
                          <Tooltip title="Remove lecturer">
                            <IconButton
                              onClick={() =>
                                handleRemoveLecturer(
                                  course.course_id
                                )
                              }
                            >
                              <PersonRemove />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/courses/${course.course_id}/edit`
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
                              setSelectedCourse(course)
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
        open={Boolean(selectedCourse)}
        title="Delete Course"
        message={`Delete course ${selectedCourse?.course_code}?`}
        onCancel={() =>
          setSelectedCourse(null)
        }
        onConfirm={handleDelete}
      />
    </>
  );
};

export default CourseList;