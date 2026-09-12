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

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
};

const getRequestMethod = (error: any): string => {
  const method = String(error?.config?.method ?? "").trim();
  return method ? method.toUpperCase() : "REQUEST";
};

const getRequestUrl = (error: any): string => {
  const baseURL = String(error?.config?.baseURL ?? "").replace(/\/+$/, "");
  const url = String(error?.config?.url ?? "").trim();

  if (!url) return baseURL || "unknown URL";
  if (/^https?:\/\//i.test(url)) return url;

  return `${baseURL}/${url.replace(/^\/+/, "")}`;
};

const getAxiosCode = (error: any): string => {
  const code = String(error?.code ?? "").trim();
  return code ? ` (${code})` : "";
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
    return errors.join("\n");56
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
  const method = getRequestMethod(requestError);
  const url = getRequestUrl(requestError);
  const message = String(requestError?.message ?? "").trim();
  const code = getAxiosCode(requestError);

  if (requestError?.response) {
    const status = requestError.response.status;
    const statusText = String(requestError.response.statusText ?? "").trim();
    const serverMessage = getApiErrorMessage(
      requestError.response.data,
      fallback,
    );
    const statusLabel = statusText ? `${statusText}` : ``;

    return `${serverMessage}\n\nHTTP ${statusLabel}`;
  }

  if (requestError?.request) {
    if (requestError?.code === "ECONNABORTED" || /timeout/i.test(message)) {
      return `The request timed out before the server responded.\n\n ${message || "timeout"}${code}`;
    }

    return [
      "The app sent the request, but the API did not return any HTTP response.",
      "",
      `${message || "Network Error"}${code}`,
      "",
      "This usually means the device could not reach the server, DNS/TLS failed, the connection was dropped, or the backend/proxy closed the request before sending headers.",
    ].join("\n");
  }

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
