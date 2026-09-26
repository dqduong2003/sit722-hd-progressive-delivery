import {
  jwtDecode,
} from "jwt-decode";

const TOKEN_KEY = "access_token";

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const saveToken = (token) => {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    if (
      decoded.exp &&
      decoded.exp * 1000 < Date.now()
    ) {
      removeToken();

      return null;
    }

    return {
      ...decoded,
      email:
        decoded.email ||
        decoded.sub ||
        "",
      role:
        decoded.role ||
        decoded.user_role ||
        "",
    };
  } catch {
    removeToken();

    return null;
  }
};