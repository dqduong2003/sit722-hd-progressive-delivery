import {
  Box,
  Toolbar,
} from "@mui/material";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Header />

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minWidth: 0,
          backgroundColor:
            "background.default",
        }}
      >
        <Toolbar />

        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;