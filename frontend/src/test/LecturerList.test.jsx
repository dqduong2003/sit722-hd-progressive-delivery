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

import LecturerList from "../pages/lecturers/LecturerList";
import { AuthProvider } from "../context/AuthContext";
import * as lecturerService from "../services/lecturerService";

vi.mock("../services/lecturerService");

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

const renderLecturerList = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LecturerList />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("LecturerList", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "access_token",
      createAdminToken()
    );

    vi.clearAllMocks();
  });

  it("displays lecturers returned by the API", async () => {
    lecturerService.getLecturers.mockResolvedValue([
      {
        lecturer_id: "L001",
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@test.com",
        phone: null,
        school: "Computer Science",
        designation: "Cloud Computing",
        office_location: null,
        employment_status: "active",
        profile_photo_url: null,
      },
    ]);

    renderLecturerList();

    await waitFor(() => {
      expect(
        screen.getByText("L001")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Jane Smith")
    ).toBeInTheDocument();

    expect(
      screen.getByText("jane@test.com")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Computer Science")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cloud Computing")
    ).toBeInTheDocument();

    expect(
      screen.getByText("active")
    ).toBeInTheDocument();
  });

  it("displays a message when no lecturers exist", async () => {
    lecturerService.getLecturers.mockResolvedValue(
      []
    );

    renderLecturerList();

    expect(
      await screen.findByText(
        "No lecturers found."
      )
    ).toBeInTheDocument();
  });
});