export type LogContext = Record<string, unknown>;

export type Logger = {
  info: (event: string, context?: LogContext) => void;
  warn: (event: string, context?: LogContext) => void;
  error: (event: string, context?: LogContext) => void;
};

export function createLogger(functionName: string): Logger {
  const emit = (
    level: "info" | "warn" | "error",
    event: string,
    context?: LogContext,
  ) => {
    const entry = {
      level,
      function: functionName,
      event,
      timestamp: new Date().toISOString(),
      ...(context ?? {}),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else console.log(line);
  };
  return {
    info: (event, ctx) => emit("info", event, ctx),
    warn: (event, ctx) => emit("warn", event, ctx),
    error: (event, ctx) => emit("error", event, ctx),
  };
}
