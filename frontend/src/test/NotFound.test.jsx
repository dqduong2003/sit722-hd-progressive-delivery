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

import NotFound from "../pages/NotFound";

const renderNotFound = () => {
  return render(
    <MemoryRouter
      initialEntries={["/unknown"]}
    >
      <Routes>
        <Route
          path="/unknown"
          element={<NotFound />}
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

describe("NotFound page", () => {
  it("displays the page not found message", () => {
    renderNotFound();

    expect(
      screen.getByText("404")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Page Not Found"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "The page you requested does not exist."
      )
    ).toBeInTheDocument();
  });

  it("returns to the dashboard", () => {
    renderNotFound();

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