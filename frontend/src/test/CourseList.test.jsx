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

import CourseList from "../pages/courses/CourseList";
import { AuthProvider } from "../context/AuthContext";
import * as courseService from "../services/courseService";

vi.mock("../services/courseService");

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

const renderCourseList = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CourseList />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("CourseList", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "access_token",
      createAdminToken()
    );

    vi.clearAllMocks();
  });

  it("displays courses returned by the API", async () => {
    courseService.getCourses.mockResolvedValue([
      {
        course_id: "C001",
        course_code: "ICT101",
        course_name: "Introduction to IT",
        department: "Information Technology",
        credits: 3,
        lecturer_id: "L001",
        status: "active",
      },
    ]);

    renderCourseList();

    await waitFor(() => {
      expect(
        screen.getByText("ICT101")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Introduction to IT")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Information Technology"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("L001")
    ).toBeInTheDocument();
  });

  it("displays a message when no courses exist", async () => {
    courseService.getCourses.mockResolvedValue(
      []
    );

    renderCourseList();

    expect(
      await screen.findByText(
        "No courses found."
      )
    ).toBeInTheDocument();
  });
});