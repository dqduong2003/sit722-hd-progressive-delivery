import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MemoryRouter } from "react-router-dom";

import StudentList from "../pages/students/StudentList";
import { AuthProvider } from "../context/AuthContext";
import * as studentService from "../services/studentService";

vi.mock("../services/studentService");

const createAdminToken = () => {
  const header = btoa(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const payload = btoa(
    JSON.stringify({
      sub: "admin@test.com",
      role: "admin",
    })
  );

  return `${header}.${payload}.signature`;
};

const renderStudentList = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <StudentList />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("StudentList", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "access_token",
      createAdminToken()
    );

    vi.clearAllMocks();
  });

  it("displays students returned by the API", async () => {
    studentService.getStudents.mockResolvedValue([
      {
        student_id: "S001",
        first_name: "John",
        last_name: "Smith",
        email: "john@test.com",
        department:
          "Information Technology",
        status: "active",
      },
    ]);

    renderStudentList();

    await waitFor(() => {
      expect(
        screen.getByText("S001")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("John Smith")
    ).toBeInTheDocument();

    expect(
      screen.getByText("john@test.com")
    ).toBeInTheDocument();
  });

  it("displays a message when no students exist", async () => {
    studentService.getStudents.mockResolvedValue(
      []
    );

    renderStudentList();

    expect(
      await screen.findByText(
        "No students found."
      )
    ).toBeInTheDocument();
  });
});