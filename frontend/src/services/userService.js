import { userApi } from "./apiClients";

export const getUsers = async () => {
  const response = await userApi.get("/users");

  return response.data;
};

export const getUser = async (userId) => {
  const response = await userApi.get(
    `/users/${userId}`
  );

  return response.data;
};

export const createUser = async (
  userData
) => {
  const response = await userApi.post(
    "/users",
    userData
  );

  return response.data;
};

export const updateUser = async (
  userId,
  userData
) => {
  const response = await userApi.put(
    `/users/${userId}`,
    userData
  );

  return response.data;
};

export const deleteUser = async (
  userId
) => {
  const response = await userApi.delete(
    `/users/${userId}`
  );

  return response.data;
};