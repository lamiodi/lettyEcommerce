/**
 * Structured logger built on pino.
 * In serverless / Edge contexts where pino transports are unsupported,
 * logs are emitted as JSON to stdout — Vercel & most providers parse these.
 */
import pino from "pino";
import { env } from "@/lib/env";

const isEdge = typeof EdgeRuntime !== "undefined";

const baseOptions = {
  level: env().LOG_LEVEL,
  base: {
    service: "letty-backend",
    env: env().NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.password_hash",
      "*.token",
      "*.secret",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
};

export const logger = isEdge
  ? // Edge runtime fallback: a minimal logger that mirrors pino's API.
    createEdgeLogger(env().LOG_LEVEL)
  : pino(baseOptions);

/* ------------------------------------------------------------------ */
/*  Edge logger                                                          */
/* ------------------------------------------------------------------ */

/**
 * Normalize a log payload. Pino accepts `logger.error(err)` and
 * `logger.error({ ...obj }, "msg")`. We support both, plus the legacy
 * `logger.error("msg")` form.
 *
 * Rules:
 *  - obj is a string → use as msg; ignore any explicit msg arg
 *  - obj is an Error → spread { name, message, stack?, ...rest } + msg
 *  - obj is a plain object → spread + msg
 */
function buildPayload(obj: unknown, msg: string | undefined, bindings: Record<string, unknown>) {
  if (typeof obj === "string") {
    return { ...bindings, msg: obj };
  }
  if (obj instanceof Error) {
    return {
      ...bindings,
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
      ...(obj as unknown as Record<string, unknown>),
      msg: msg ?? (obj as Error).message,
    };
  }
  if (obj && typeof obj === "object") {
    return { ...bindings, ...(obj as Record<string, unknown>), ...(msg ? { msg } : {}) };
  }
  return { ...bindings, ...(msg ? { msg } : {}), value: obj };
}

function createEdgeLogger(level: string) {
  const order = ["trace", "debug", "info", "warn", "error", "fatal"];
  const min = order.indexOf(level);
  const make = (lvl: string) => (obj: unknown, msg?: string) => {
    if (order.indexOf(lvl) < min) return;
    const payload = buildPayload(obj, msg, {});
    // eslint-disable-next-line no-console
    console[lvl === "fatal" ? "error" : lvl](JSON.stringify(payload));
  };
  const child = (bindings: Record<string, unknown>) => {
    const c = (lvl: string) => (obj: unknown, msg?: string) => {
      if (order.indexOf(lvl) < min) return;
      const payload = buildPayload(obj, msg, bindings);
      // eslint-disable-next-line no-console
      console[lvl === "fatal" ? "error" : lvl](JSON.stringify(payload));
    };
    return {
      trace: c("trace"),
      debug: c("debug"),
      info: c("info"),
      warn: c("warn"),
      error: c("error"),
      fatal: c("fatal"),
      child,
    };
  };
  return {
    trace: make("trace"),
    debug: make("debug"),
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
    fatal: make("fatal"),
    child,
  } as unknown as pino.Logger;
}
