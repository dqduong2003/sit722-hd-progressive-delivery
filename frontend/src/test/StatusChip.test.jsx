import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import StatusChip from "../components/StatusChip";

describe("StatusChip", () => {
  it("displays the supplied status", () => {
    render(
      <StatusChip status="active" />
    );

    expect(
      screen.getByText("active")
    ).toBeInTheDocument();
  });

  it("displays unknown when status is missing", () => {
    render(<StatusChip />);

    expect(
      screen.getByText("unknown")
    ).toBeInTheDocument();
  });
});