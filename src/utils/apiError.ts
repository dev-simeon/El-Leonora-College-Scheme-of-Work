const toErrorMessages = (value: unknown): string[] => {
  if (typeof value === "string") {
    const message = value.trim();
    return message ? [message] : [];
  }

  if (!Array.isArray(value) && (!value || typeof value !== "object")) return [];

  if (!Array.isArray(value)) {
    return Object.values(value as Record<string, unknown>)
      .flatMap(toErrorMessages)
      .filter(Boolean);
  }

  return value.flatMap(toErrorMessages).filter(Boolean);
};

export const getApiErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === "string") {
    const message = data.trim();
    return message || fallback;
  }

  const body = data as any;
  const errors = toErrorMessages(
    body?.errors ?? body?.Errors ?? body?.error ?? body?.Error,
  );

  if (errors.length > 0) {
    return errors.join("\n");
  }

  const message = String(
    body?.message ??
      body?.Message ??
      body?.title ??
      body?.Title ??
      body?.detail ??
      body?.Detail ??
      "",
  ).trim();
  return message || fallback;
};

export const getRequestErrorDetails = (
  error: unknown,
  fallback: string,
): string => {
  const requestError = error as any;

  if (requestError?.response) {
    const serverMessage = getApiErrorMessage(
      requestError.response.data,
      fallback,
    );

    return serverMessage;
  }

  if (requestError?.request) {
    if (
      requestError?.code === "ECONNABORTED" ||
      /timeout/i.test(String(requestError?.message ?? ""))
    ) {
      return "The request took too long. Please check your connection and try again.";
    }

    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  const message = String(requestError?.message ?? "").trim();
  return message || fallback;
};

export const getRequestErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const requestError = error as any;
  const status = requestError?.response?.status;

  if (status >= 500) {
    return getRequestErrorDetails(
      error,
      "Something went wrong on our server. Please try again later.",
    );
  }

  return getRequestErrorDetails(error, fallback);
};
