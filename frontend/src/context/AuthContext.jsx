import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getUser,
  removeToken,
  saveToken,
} from "../utils/token";

const AuthContext = createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] = useState(
    () => getUser()
  );

  const login = (token) => {
    saveToken(token);
    setUser(getUser());
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      authenticated: Boolean(user),
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};