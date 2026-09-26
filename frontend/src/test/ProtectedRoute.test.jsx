import {
  render,
  screen,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";

const renderProtectedRoute = () => {
  return render(
    <MemoryRouter
      initialEntries={["/protected"]}
    >
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<div>Login Page</div>}
          />

          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects unauthenticated users", () => {
    renderProtectedRoute();

    expect(
      screen.getByText("Login Page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Protected Content"
      )
    ).not.toBeInTheDocument();
  });

  it("allows authenticated users", () => {
    localStorage.setItem(
      "access_token",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiJ9.test"
    );

    renderProtectedRoute();

    expect(
      screen.getByText(
        "Protected Content"
      )
    ).toBeInTheDocument();
  });
});