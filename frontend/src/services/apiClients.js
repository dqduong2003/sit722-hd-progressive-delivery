import { serviceUrls } from "../config/serviceUrls";
import { createApiClient } from "./api";

export const userApi =
  createApiClient(serviceUrls.users);

export const studentApi =
  createApiClient(serviceUrls.students);

export const lecturerApi =
  createApiClient(serviceUrls.lecturers);

export const courseApi =
  createApiClient(serviceUrls.courses);

export const enrollmentApi =
  createApiClient(
    serviceUrls.enrollments
  );