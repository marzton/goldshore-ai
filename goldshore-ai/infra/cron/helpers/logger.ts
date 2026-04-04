function redactSensitive(value: any): any {
  if (typeof value !== "string") return value;

  let redacted = value;

  // Redact common bearer tokens, e.g., "Authorization: Bearer <token>" or "Bearer <token>"
  redacted = redacted.replace(/(Authorization:\s*Bearer\s+)([A-Za-z0-9\-\._~\+\/]+=*|\S+)/gi, "$1***");
  redacted = redacted.replace(/\b(Bearer\s+)([A-Za-z0-9\-\._~\+\/]+=*|\S+)/gi, "$1***");

  // Redact simple query-style secrets: api_key=..., token=..., secret=...
  redacted = redacted.replace(/\b(api_key|apikey|token|secret|passwd|password)=([^&\s]+)/gi, "$1=***");

  return redacted;
}

function sanitizeErrorArg(arg: any): any {
  if (arg instanceof Error) {
    const base = `${arg.name}: ${arg.message}`;
    const stack = arg.stack ? `\n${arg.stack}` : "";
    return redactSensitive(base + stack);
  }
  if (typeof arg === "string") {
    return redactSensitive(arg);
  }
  return arg;
}

export function createLogger(context: string) {
  const prefix = `[${context}]`;
  const format = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    // Use ISO string for timestamp, and standard level names
    return [`[${timestamp}] [${level}] ${prefix}`, ...args];
  };

  return {
    info: (...args: any[]) => console.log(...format("INFO", ...args)),
    warn: (...args: any[]) => console.warn(...format("WARN", ...args)),
    error: (...args: any[]) => {
      const safeArgs = args.map(sanitizeErrorArg);
      return console.error(...format("ERROR", ...safeArgs));
    },
  };
}
