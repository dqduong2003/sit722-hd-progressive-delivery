import {
  describe,
  expect,
  it,
} from "vitest";

import { serviceUrls } from "../config/serviceUrls";

describe("serviceUrls", () => {
  it("contains the user service URL", () => {
    expect(serviceUrls.users).toBeTruthy();
  });

  it("contains the student service URL", () => {
    expect(serviceUrls.students).toBeTruthy();
  });

  it("contains the lecturer service URL", () => {
    expect(serviceUrls.lecturers).toBeTruthy();
  });

  it("contains the course service URL", () => {
    expect(serviceUrls.courses).toBeTruthy();
  });

  it("contains the enrollment service URL", () => {
    expect(
      serviceUrls.enrollments
    ).toBeTruthy();
  });
});