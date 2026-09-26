const requiredVariables = [
  "VITE_USER_SERVICE_URL",
  "VITE_STUDENT_SERVICE_URL",
  "VITE_LECTURER_SERVICE_URL",
  "VITE_COURSE_SERVICE_URL",
  "VITE_ENROLLMENT_SERVICE_URL",
];

requiredVariables.forEach((variable) => {
  if (!import.meta.env[variable]) {
    throw new Error(
      `Missing environment variable: ${variable}`
    );
  }
});

export const serviceUrls = {
  users:
    import.meta.env
      .VITE_USER_SERVICE_URL,

  students:
    import.meta.env
      .VITE_STUDENT_SERVICE_URL,

  lecturers:
    import.meta.env
      .VITE_LECTURER_SERVICE_URL,

  courses:
    import.meta.env
      .VITE_COURSE_SERVICE_URL,

  enrollments:
    import.meta.env
      .VITE_ENROLLMENT_SERVICE_URL,
};