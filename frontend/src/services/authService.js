import { userApi } from "./apiClients";

export const login = async (credentials) => {
  const formData = new URLSearchParams();

  formData.append(
    "username",
    credentials.username
  );

  formData.append(
    "password",
    credentials.password
  );

  const response = await userApi.post(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await userApi.get(
    "/auth/me"
  );

  return response.data;
};