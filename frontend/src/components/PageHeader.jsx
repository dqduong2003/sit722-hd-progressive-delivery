import {
  Box,
  Button,
  Typography,
} from "@mui/material";

const PageHeader = ({
  title,
  buttonText,
  onButtonClick,
  showButton = true,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography variant="h4">
        {title}
      </Typography>

      {showButton && (
        <Button
          variant="contained"
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default PageHeader;