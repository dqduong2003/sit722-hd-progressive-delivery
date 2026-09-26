import {
  getUser,
  isLoggedIn,
} from "./token";

export const isAuthenticated = () => {
  return isLoggedIn();
};

export const getRole = () => {
  const user = getUser();

  return user?.role || "";
};

export const isAdmin = () => {
  return getRole() === "admin";
};

export const isLecturer = () => {
  return getRole() === "lecturer";
};

export const isStudent = () => {
  return getRole() === "student";
};