import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";

import UserList from "./pages/users/UserList";
import UserForm from "./pages/users/UserForm";

import StudentList from "./pages/students/StudentList";
import StudentForm from "./pages/students/StudentForm";
import StudentPhotoUpload from "./pages/students/StudentPhotoUpload";

import LecturerList from "./pages/lecturers/LecturerList";
import LecturerForm from "./pages/lecturers/LecturerForm";
import LecturerPhotoUpload from "./pages/lecturers/LecturerPhotoUpload";

import CourseList from "./pages/courses/CourseList";
import CourseForm from "./pages/courses/CourseForm";
import AssignLecturer from "./pages/courses/AssignLecturer";

import EnrollmentList from "./pages/enrollments/EnrollmentList";
import EnrollmentForm from "./pages/enrollments/EnrollmentForm";

const ProtectedLayout = ({
  children,
}) => {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
};

const AdminPage = ({ children }) => {
  return (
    <ProtectedLayout>
      <RoleRoute
        allowedRoles={["admin"]}
      >
        {children}
      </RoleRoute>
    </ProtectedLayout>
  );
};

const ManagementPage = ({
  children,
}) => {
  return (
    <ProtectedLayout>
      <RoleRoute
        allowedRoles={[
          "admin",
          "lecturer",
        ]}
      >
        {children}
      </RoleRoute>
    </ProtectedLayout>
  );
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      <Route
        path="/forbidden"
        element={
          <ProtectedLayout>
            <Forbidden />
          </ProtectedLayout>
        }
      />

      <Route
        path="/users"
        element={
          <AdminPage>
            <UserList />
          </AdminPage>
        }
      />

      <Route
        path="/users/new"
        element={
          <AdminPage>
            <UserForm />
          </AdminPage>
        }
      />

      <Route
        path="/users/:userId/edit"
        element={
          <AdminPage>
            <UserForm />
          </AdminPage>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedLayout>
            <StudentList />
          </ProtectedLayout>
        }
      />

      <Route
        path="/students/new"
        element={
          <AdminPage>
            <StudentForm />
          </AdminPage>
        }
      />

      <Route
        path="/students/:studentId/edit"
        element={
          <AdminPage>
            <StudentForm />
          </AdminPage>
        }
      />

      <Route
        path="/students/:studentId/photo"
        element={
          <AdminPage>
            <StudentPhotoUpload />
          </AdminPage>
        }
      />

      <Route
        path="/lecturers"
        element={
          <ProtectedLayout>
            <LecturerList />
          </ProtectedLayout>
        }
      />

      <Route
        path="/lecturers/new"
        element={
          <AdminPage>
            <LecturerForm />
          </AdminPage>
        }
      />

      <Route
        path="/lecturers/:lecturerId/edit"
        element={
          <AdminPage>
            <LecturerForm />
          </AdminPage>
        }
      />

      <Route
        path="/lecturers/:lecturerId/photo"
        element={
          <AdminPage>
            <LecturerPhotoUpload />
          </AdminPage>
        }
      />

      <Route
        path="/courses"
        element={
          <ProtectedLayout>
            <CourseList />
          </ProtectedLayout>
        }
      />

      <Route
        path="/courses/new"
        element={
          <AdminPage>
            <CourseForm />
          </AdminPage>
        }
      />

      <Route
        path="/courses/:courseId/edit"
        element={
          <AdminPage>
            <CourseForm />
          </AdminPage>
        }
      />

      <Route
        path="/courses/:courseId/assign-lecturer"
        element={
          <AdminPage>
            <AssignLecturer />
          </AdminPage>
        }
      />

      <Route
        path="/enrollments"
        element={
          <ProtectedLayout>
            <EnrollmentList />
          </ProtectedLayout>
        }
      />

      <Route
        path="/enrollments/new"
        element={
          <ManagementPage>
            <EnrollmentForm />
          </ManagementPage>
        }
      />

      <Route
        path="/enrollments/:enrollmentId/edit"
        element={
          <ManagementPage>
            <EnrollmentForm />
          </ManagementPage>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedLayout>
            <NotFound />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default App;