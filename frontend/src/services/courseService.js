import { courseApi } from "./apiClients";

export const getCourses = async () => {
  const response = await courseApi.get("/courses");
  return response.data;
};

export const getCourse = async (courseId) => {
  const response = await courseApi.get(
    `/courses/${courseId}`
  );

  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await courseApi.post(
    "/courses",
    courseData
  );

  return response.data;
};

export const updateCourse = async (
  courseId,
  courseData
) => {
  const response = await courseApi.put(
    `/courses/${courseId}`,
    courseData
  );

  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await courseApi.delete(
    `/courses/${courseId}`
  );

  return response.data;
};

export const assignLecturer = async (
  courseId,
  lecturerId
) => {
  const response = await courseApi.patch(
    `/courses/${courseId}/lecturer`,
    {
      lecturer_id: lecturerId,
    }
  );

  return response.data;
};

export const removeLecturer = async (courseId) => {
  const response = await courseApi.delete(
    `/courses/${courseId}/lecturer`
  );

  return response.data;
};

export const getLecturerCourses = async (
  lecturerId
) => {
  const response = await courseApi.get(
    `/courses/lecturer/${lecturerId}/assigned`
  );

  return response.data;
};