import { studentApi } from "./apiClients";

export const getStudents = async () => {
  const response = await studentApi.get("/students");
  return response.data;
};

export const getStudent = async (studentId) => {
  const response = await studentApi.get(
    `/students/${studentId}`
  );

  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await studentApi.post(
    "/students",
    studentData
  );

  return response.data;
};

export const updateStudent = async (
  studentId,
  studentData
) => {
  const response = await studentApi.put(
    `/students/${studentId}`,
    studentData
  );

  return response.data;
};

export const deleteStudent = async (studentId) => {
  const response = await studentApi.delete(
    `/students/${studentId}`
  );

  return response.data;
};

export const uploadStudentPhoto = async (
  studentId,
  file
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await studentApi.post(
    `/students/${studentId}/profile-photo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};