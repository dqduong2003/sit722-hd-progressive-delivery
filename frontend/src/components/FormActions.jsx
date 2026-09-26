import {
  Button,
  Stack,
} from "@mui/material";

const FormActions = ({
  saving = false,
  onCancel,
  saveText = "Save",
}) => {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ mt: 2 }}
    >
      <Button
        type="submit"
        variant="contained"
        disabled={saving}
      >
        {saving
          ? "Saving..."
          : saveText}
      </Button>

      <Button
        type="button"
        variant="outlined"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </Button>
    </Stack>
  );
};

export default FormActions;