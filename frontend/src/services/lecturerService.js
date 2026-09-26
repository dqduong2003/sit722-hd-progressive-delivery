import { lecturerApi } from "./apiClients";

export const getLecturers = async () => {
  const response = await lecturerApi.get("/lecturers");
  return response.data;
};

export const getLecturer = async (lecturerId) => {
  const response = await lecturerApi.get(
    `/lecturers/${lecturerId}`
  );

  return response.data;
};

export const createLecturer = async (
  lecturerData
) => {
  const response = await lecturerApi.post(
    "/lecturers",
    lecturerData
  );

  return response.data;
};

export const updateLecturer = async (
  lecturerId,
  lecturerData
) => {
  const response = await lecturerApi.put(
    `/lecturers/${lecturerId}`,
    lecturerData
  );

  return response.data;
};

export const deleteLecturer = async (
  lecturerId
) => {
  const response = await lecturerApi.delete(
    `/lecturers/${lecturerId}`
  );

  return response.data;
};

export const uploadLecturerPhoto = async (
  lecturerId,
  file
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await lecturerApi.post(
    `/lecturers/${lecturerId}/profile-photo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};