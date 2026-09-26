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

import UserList from "../pages/users/UserList";
import { AuthProvider } from "../context/AuthContext";
import * as userService from "../services/userService";

vi.mock("../services/userService");

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

const renderUserList = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserList />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("UserList", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "access_token",
      createAdminToken()
    );

    vi.clearAllMocks();
  });

  it("displays users returned by the API", async () => {
    userService.getUsers.mockResolvedValue([
      {
        user_id: "U001",
        first_name: "Admin",
        last_name: "User",
        email: "admin@test.com",
        role: "admin",
        is_active: true,
      },
    ]);

    renderUserList();

    await waitFor(() => {
      expect(
        screen.getByText("U001")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Admin User")
    ).toBeInTheDocument();

    expect(
      screen.getByText("admin@test.com")
    ).toBeInTheDocument();

    expect(
      screen.getByText("admin")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Active")
    ).toBeInTheDocument();
  });

  it("displays a message when no users exist", async () => {
    userService.getUsers.mockResolvedValue(
      []
    );

    renderUserList();

    expect(
      await screen.findByText(
        "No users found."
      )
    ).toBeInTheDocument();
  });
});