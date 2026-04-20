type LogLevel = "error" | "warn" | "info";

type ServerLogMeta = Record<string, unknown>;

type SerializedError = {
  name?: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
};

const safeSerializeError = (error: unknown, depth = 0): SerializedError => {
  if (error instanceof Error) {
    const serialized: SerializedError = {
      name: error.name,
      message: error.message,
      stack: typeof error.stack === "string" ? error.stack : undefined,
    };

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause && depth < 2) {
      serialized.cause = safeSerializeError(cause, depth + 1);
    }

    return serialized;
  }

  if (typeof error === "string") {
    return { message: error };
  }

  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
};

const safePathname = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const emit = (level: LogLevel, message: string, meta: ServerLogMeta | undefined) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
};

export const logServerError = (message: string, error: unknown, meta?: ServerLogMeta) => {
  emit("error", message, {
    ...meta,
    error: safeSerializeError(error),
  });
};

export const logServerWarn = (message: string, meta?: ServerLogMeta) => {
  emit("warn", message, meta);
};

export const logServerInfo = (message: string, meta?: ServerLogMeta) => {
  emit("info", message, meta);
};

export const getRequestLogMeta = (request: Request) => {
  return {
    method: request.method,
    path: safePathname(request.url),
  };
};
