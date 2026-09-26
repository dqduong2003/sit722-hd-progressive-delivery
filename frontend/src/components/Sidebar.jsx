import {
  Dashboard,
  Group,
  MenuBook,
  Person,
  School,
  HowToReg,
} from "@mui/icons-material";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <Dashboard />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Users",
      path: "/users",
      icon: <Group />,
      roles: ["admin"],
    },
    {
      title: "Students",
      path: "/students",
      icon: <School />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Lecturers",
      path: "/lecturers",
      icon: <Person />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Courses",
      path: "/courses",
      icon: <MenuBook />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
    {
      title: "Enrollments",
      path: "/enrollments",
      icon: <HowToReg />,
      roles: [
        "admin",
        "lecturer",
        "student",
      ],
    },
  ];

  const visibleMenuItems =
    menuItems.filter((item) =>
      item.roles.includes(user?.role)
    );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight:
            "1px solid rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Toolbar />

      <List sx={{ px: 1 }}>
        {visibleMenuItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={
              location.pathname === item.path ||
              location.pathname.startsWith(
                `${item.path}/`
              )
            }
            sx={{
              borderRadius: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.title}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;