import {
  fireEvent,
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

import Login from "../pages/Login";
import { AuthProvider } from "../context/AuthContext";
import * as authService from "../services/authService";

vi.mock("../services/authService");

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("displays the login form", () => {
    renderLogin();

    expect(
      screen.getByText(
        "KoalaTech University"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /username/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/password/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /login/i,
      })
    ).toBeInTheDocument();
  });

  it("submits username and password", async () => {
    authService.login.mockResolvedValue({
      access_token:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiJ9.test",
    });

    renderLogin();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /username/i,
      }),
      {
        target: {
          value: "admin",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/password/i),
      {
        target: {
          value: "password123",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    await waitFor(() => {
      expect(
        authService.login
      ).toHaveBeenCalledWith({
        username: "admin",
        password: "password123",
      });
    });
  });

  it("displays an error when login fails", async () => {
    authService.login.mockRejectedValue({
      response: {
        data: {
          detail: "Invalid credentials",
        },
      },
    });

    renderLogin();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /username/i,
      }),
      {
        target: {
          value: "wronguser",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/password/i),
      {
        target: {
          value: "wrongpassword",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByText(
        "Invalid credentials"
      )
    ).toBeInTheDocument();
  });
});