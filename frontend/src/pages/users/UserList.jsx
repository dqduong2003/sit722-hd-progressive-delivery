import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Edit,
} from "@mui/icons-material";
import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  deleteUser,
  getUsers,
} from "../../services/userService";
import { getErrorMessage } from "../../utils/errorMessage";

const UserList = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [selectedUser, setSelectedUser] =
    useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to load users."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getUserId = (user) =>
    user.id ?? user.user_id;

  const getUserName = (user) => {
    const fullName = [
      user.first_name,
      user.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || user.username || "-";
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await deleteUser(
        getUserId(selectedUser)
      );

      toast.success(
        "User deleted successfully."
      );

      setSelectedUser(null);

      loadUsers();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete user."
        )
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageHeader
        title="Users"
        buttonText="Add User"
        onButtonClick={() =>
          navigate("/users/new")
        }
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const userId =
                  getUserId(user);

                return (
                  <TableRow
                    key={userId}
                    hover
                  >
                    <TableCell>
                      {userId}
                    </TableCell>

                    <TableCell>
                      {user.username || "-"}
                    </TableCell>

                    <TableCell>
                      {getUserName(user)}
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={
                          user.role === "admin"
                            ? "error"
                            : user.role ===
                              "lecturer"
                              ? "primary"
                              : "success"
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          user.is_active
                            ? "Active"
                            : "Inactive"
                        }
                        size="small"
                        color={
                          user.is_active
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() =>
                              navigate(
                                `/users/${userId}/edit`
                              )
                            }
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() =>
                              setSelectedUser(
                                user
                              )
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={Boolean(selectedUser)}
        title="Delete User"
        message={`Delete user ${selectedUser?.username ||
          selectedUser?.email ||
          ""
          }?`}
        onCancel={() =>
          setSelectedUser(null)
        }
        onConfirm={handleDelete}
      />
    </>
  );
};

export default UserList;
