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

import EnrollmentList from "../pages/enrollments/EnrollmentList";
import { AuthProvider } from "../context/AuthContext";
import * as enrollmentService from "../services/enrollmentService";

vi.mock("../services/enrollmentService");

const createLecturerToken = () => {
  const header = btoa(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const payload = btoa(
    JSON.stringify({
      sub: "lecturer@test.com",
      role: "lecturer",
    })
  );

  return `${header}.${payload}.signature`;
};

const renderEnrollmentList = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <EnrollmentList />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("EnrollmentList", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "access_token",
      createLecturerToken()
    );

    vi.clearAllMocks();
  });

  it("displays enrollments returned by the API", async () => {
    enrollmentService.getEnrollments.mockResolvedValue([
      {
        enrollment_id: "E001",
        student_id: "S001",
        course_id: "C001",
        enrollment_date: "2026-07-20",
        status: "enrolled",
        grade: null,
      },
    ]);

    renderEnrollmentList();

    await waitFor(() => {
      expect(
        screen.getByText("E001")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("S001")
    ).toBeInTheDocument();

    expect(
      screen.getByText("C001")
    ).toBeInTheDocument();

    expect(
      screen.getByText("2026-07-20")
    ).toBeInTheDocument();

    expect(
      screen.getByText("enrolled")
    ).toBeInTheDocument();
  });

  it("displays a message when no enrollments exist", async () => {
    enrollmentService.getEnrollments.mockResolvedValue(
      []
    );

    renderEnrollmentList();

    expect(
      await screen.findByText(
        "No enrollments found."
      )
    ).toBeInTheDocument();
  });
});