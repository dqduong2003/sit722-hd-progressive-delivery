import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ErrorBoundary from "../components/ErrorBoundary";

const BrokenComponent = () => {
  throw new Error("Test error");
};

describe("ErrorBoundary", () => {
  it("displays an error page", () => {
    const consoleError =
      vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(
        "Something went wrong"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "The application encountered an unexpected error."
      )
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("displays the reload button", () => {
    const consoleError =
      vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("button", {
        name: "Reload Application",
      })
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });
});