import { normalize } from "@sentry/core";
import isObject from "lodash-es/isObject";
import snakeCase from "lodash-es/snakeCase";

// https://github.com/getsentry/sentry-python/blob/8094c9e4462c7af4d73bfe3b6382791f9949e7f0/sentry_sdk/scrubber.py#L14
const DEFAULT_DENYLIST = [
  // stolen from relay
  "password",
  "passwd",
  "secret",
  "api_key",
  "apikey",
  "auth",
  "credentials",
  "mysql_pwd",
  "privatekey",
  "private_key",
  "token",
  "ip_address",
  "session",
  // django
  "csrftoken",
  "sessionid",
  // wsgi
  "remote_addr",
  "x_csrftoken",
  "x_forwarded_for",
  "set_cookie",
  "cookie",
  "authorization",
  "x_api_key",
  "x_forwarded_for",
  "x_real_ip",
  // other common names used in the wild
  "aiohttp_session", // aiohttp
  "connect.sid", // Express
  "csrf_token", // Pyramid
  "csrf", // (this is a cookie name used in accepted answers on stack overflow)
  "_csrf", // Express
  "_csrf_token", // Bottle
  "PHPSESSID", // PHP
  "_session", // Sanic
  "symfony", // Symfony
  "user_session", // Vue
  "_xsrf", // Tornado
  "XSRF-TOKEN", // Angular, Laravel
];

const SENTRY_DENYLIST = new Set(
  DEFAULT_DENYLIST
  // Custom denylist entries for this project can be added here
);

export const cleanSensitiveData = (data: Record<string, unknown>) => {
  const normalized = normalize(data);
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(normalized)) {
    if (SENTRY_DENYLIST.has(key) || SENTRY_DENYLIST.has(snakeCase(key))) {
      // skip this key
      continue;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) => (isObject(item) ? cleanSensitiveData(item as Record<string, unknown>) : item));
    } else if (isObject(value)) {
      cleaned[key] = cleanSensitiveData(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const cleanSentryPayload = <T extends object>(payload: T): T =>
  cleanSensitiveData(payload as Record<string, unknown>) as T;

/**
 * Sentry beforeSend hook - processes events before sending to Sentry
 * Logs events in development mode for debugging
 */
export const beforeSend = <T extends object>(event: T, hint: unknown): T => {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("Sentry event", event);
    // eslint-disable-next-line no-console
    console.log("Sentry hint", hint);
  }
  return cleanSentryPayload(event);
};

/**
 * Sentry beforeSendTransaction hook - processes transactions before sending to Sentry
 * Logs transactions in development mode for debugging
 */
export const beforeSendTransaction = <T extends object>(event: T, _hint?: unknown): T => cleanSentryPayload(event);

/**
 * Parses a sample rate env var, clamps to [0, 1], and returns 0 if not finite.
 * @param {string | undefined} value
 * @returns {number}
 */
export function parseSampleRate(value?: string): number {
  const n = Number.parseFloat(value ?? "");
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}
