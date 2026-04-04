// Simple redaction of potentially sensitive values (for example, secrets in process.env)
function getSensitiveEnvValues(): string[] {
  const sensitiveKeys = Object.keys(process.env).filter((key) =>
    /TOKEN|SECRET|KEY|PASSWORD|PWD/i.test(key)
  );
  const values = sensitiveKeys
    .map((key) => process.env[key])
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  return values;
}

const SENSITIVE_ENV_VALUES = getSensitiveEnvValues();
const REDACTED = "[REDACTED]";

function redactString(input: string): string {
  let out = input;
  for (const secret of SENSITIVE_ENV_VALUES) {
    if (!secret) continue;
    out = out.split(secret).join(REDACTED);
  }
  return out;
}

function redactValue(value: any): any {
  if (value == null) return value;
  if (typeof value === "string") {
    return redactString(value);
  }
  if (value instanceof Error) {
    const safe: any = new Error(redactString(String(value.message)));
    // Preserve stack if present, but redact it as well.
    if (value.stack) {
      safe.stack = redactString(String(value.stack));
    }
    return safe;
  }
  try {
    const asString = typeof value === "object" ? JSON.stringify(value) : String(value);
    return redactString(asString);
  } catch {
    return value;
  }
}

function redactArgs(args: any[]): any[] {
  return args.map((arg) => redactValue(arg));
}

export function createLogger(context: string) {
  const prefix = `[${context}]`;
  const format = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    // Use ISO string for timestamp, and standard level names
    const safeArgs = redactArgs(args);
    return [`[${timestamp}] [${level}] ${prefix}`, ...safeArgs];
  };

  return {
    info: (...args: any[]) => console.log(...format("INFO", ...args)),
    warn: (...args: any[]) => console.warn(...format("WARN", ...args)),
    error: (...args: any[]) => console.error(...format("ERROR", ...args)),
  };
}
