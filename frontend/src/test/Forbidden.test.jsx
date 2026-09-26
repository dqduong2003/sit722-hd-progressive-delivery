import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import Forbidden from "../pages/Forbidden";

const renderForbidden = () => {
  return render(
    <MemoryRouter
      initialEntries={["/forbidden"]}
    >
      <Routes>
        <Route
          path="/forbidden"
          element={<Forbidden />}
        />

        <Route
          path="/dashboard"
          element={
            <div>Dashboard Page</div>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("Forbidden page", () => {
  it("displays the access denied message", () => {
    renderForbidden();

    expect(
      screen.getByText("403")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Access Denied")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You do not have permission to access this page."
      )
    ).toBeInTheDocument();
  });

  it("returns to the dashboard", () => {
    renderForbidden();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Return to Dashboard",
      })
    );

    expect(
      screen.getByText("Dashboard Page")
    ).toBeInTheDocument();
  });
});