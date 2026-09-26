import {
  Group,
  HowToReg,
  MenuBook,
  Person,
  School,
} from "@mui/icons-material";
import {
  Grid,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import {
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { getCourses } from "../services/courseService";
import { getEnrollments } from "../services/enrollmentService";
import { getLecturers } from "../services/lecturerService";
import { getStudents } from "../services/studentService";
import { getUsers } from "../services/userService";
import { getErrorMessage } from "../utils/errorMessage";

const Dashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [counts, setCounts] = useState({
    users: 0,
    students: 0,
    lecturers: 0,
    courses: 0,
    enrollments: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const requests = [
          getStudents(),
          getLecturers(),
          getCourses(),
          getEnrollments(),
        ];

        if (user?.role === "admin") {
          requests.unshift(getUsers());
        }

        const results =
          await Promise.all(requests);

        if (user?.role === "admin") {
          const [
            users,
            students,
            lecturers,
            courses,
            enrollments,
          ] = results;

          setCounts({
            users: Array.isArray(users)
              ? users.length
              : 0,
            students:
              Array.isArray(students)
                ? students.length
                : 0,
            lecturers:
              Array.isArray(lecturers)
                ? lecturers.length
                : 0,
            courses:
              Array.isArray(courses)
                ? courses.length
                : 0,
            enrollments:
              Array.isArray(enrollments)
                ? enrollments.length
                : 0,
          });
        } else {
          const [
            students,
            lecturers,
            courses,
            enrollments,
          ] = results;

          setCounts({
            users: 0,
            students:
              Array.isArray(students)
                ? students.length
                : 0,
            lecturers:
              Array.isArray(lecturers)
                ? lecturers.length
                : 0,
            courses:
              Array.isArray(courses)
                ? courses.length
                : 0,
            enrollments:
              Array.isArray(enrollments)
                ? enrollments.length
                : 0,
          });
        }
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load dashboard."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.role]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const cards = [
    {
      title: "Users",
      value: counts.users,
      icon: <Group fontSize="large" />,
      roles: ["admin"],
    },
    {
      title: "Students",
      value: counts.students,
      icon: <School fontSize="large" />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Lecturers",
      value: counts.lecturers,
      icon: <Person fontSize="large" />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Courses",
      value: counts.courses,
      icon: <MenuBook fontSize="large" />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Enrollments",
      value: counts.enrollments,
      icon: <HowToReg fontSize="large" />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
  ];

  const visibleCards = cards.filter(
    (card) =>
      card.roles.includes(user?.role)
  );

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={600}
        >
          Dashboard
        </Typography>

        <Typography color="text.secondary">
          Welcome to KoalaTech University
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {visibleCards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={card.title}
          >
            <Paper
              sx={{
                p: 3,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                minHeight: 140,
              }}
            >
              <Box>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h3"
                  fontWeight={600}
                >
                  {card.value}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor:
                    "primary.main",
                  color: "white",
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Dashboard;