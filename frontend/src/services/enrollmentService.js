import { enrollmentApi } from "./apiClients";

export const getEnrollments = async () => {
  const response = await enrollmentApi.get(
    "/enrollments"
  );

  return response.data;
};

export const getEnrollment = async (
  enrollmentId
) => {
  const response = await enrollmentApi.get(
    `/enrollments/${enrollmentId}`
  );

  return response.data;
};

export const createEnrollment = async (
  enrollmentData
) => {
  const response = await enrollmentApi.post(
    "/enrollments",
    enrollmentData
  );

  return response.data;
};

export const updateEnrollment = async (
  enrollmentId,
  enrollmentData
) => {
  const response = await enrollmentApi.put(
    `/enrollments/${enrollmentId}`,
    enrollmentData
  );

  return response.data;
};

export const deleteEnrollment = async (
  enrollmentId
) => {
  const response = await enrollmentApi.delete(
    `/enrollments/${enrollmentId}`
  );

  return response.data;
};

export const getStudentEnrollments = async (
  studentId
) => {
  const response = await enrollmentApi.get(
    `/enrollments/student/${studentId}`
  );

  return response.data;
};

export const getCourseEnrollments = async (
  courseId
) => {
  const response = await enrollmentApi.get(
    `/enrollments/course/${courseId}`
  );

  return response.data;
};