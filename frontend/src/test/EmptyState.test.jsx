import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import EmptyState from "../components/EmptyState";

describe("EmptyState", () => {
  it("displays the default message", () => {
    render(<EmptyState />);

    expect(
      screen.getByText("No data found.")
    ).toBeInTheDocument();
  });

  it("displays a custom message", () => {
    render(
      <EmptyState message="No courses found." />
    );

    expect(
      screen.getByText(
        "No courses found."
      )
    ).toBeInTheDocument();
  });
});