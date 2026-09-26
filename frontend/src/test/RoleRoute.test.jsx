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

import RoleRoute from "../components/RoleRoute";
import { AuthProvider } from "../context/AuthContext";

const createToken = (role) => {
  const header = btoa(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const payload = btoa(
    JSON.stringify({
      sub: `${role}@test.com`,
      role,
    })
  );

  return `${header}.${payload}.signature`;
};

const renderRoleRoute = (
  allowedRoles
) => {
  return render(
    <MemoryRouter
      initialEntries={["/admin"]}
    >
      <AuthProvider>
        <Routes>
          <Route
            path="/forbidden"
            element={
              <div>Forbidden Page</div>
            }
          />

          <Route
            path="/admin"
            element={
              <RoleRoute
                allowedRoles={allowedRoles}
              >
                <div>Admin Content</div>
              </RoleRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("RoleRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("allows users with the correct role", () => {
    localStorage.setItem(
      "access_token",
      createToken("admin")
    );

    renderRoleRoute(["admin"]);

    expect(
      screen.getByText("Admin Content")
    ).toBeInTheDocument();
  });

  it("redirects users without permission", () => {
    localStorage.setItem(
      "access_token",
      createToken("student")
    );

    renderRoleRoute(["admin"]);

    expect(
      screen.getByText("Forbidden Page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Admin Content"
      )
    ).not.toBeInTheDocument();
  });
});