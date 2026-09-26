import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const RoleRoute = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuth();

  if (
    !user ||
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/forbidden"
        replace
      />
    );
  }

  return children;
};

export default RoleRoute;