export const getErrorMessage = (
  error,
  fallbackMessage = "Something went wrong."
) => {
  const detail =
    error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.msg ||
          JSON.stringify(item)
        );
      })
      .join(", ");
  }

  if (
    error?.response?.data?.message
  ) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
};