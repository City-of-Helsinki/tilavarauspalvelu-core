// @ts-check
import { z } from "zod";

// Coerces a string to true if it's "true" or "1", false if "false" or "0"
const coerceBoolean = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  // eslint-disable-next-line eqeqeq
  .transform((value) => value == "true" || value == "1");

const optionalUrl = z
  .url()
  .optional()
  .or(z.literal("").transform((_) => undefined));

// Same as UI envs, Azure has prefix on the server variables
const ServerSchema = z.object({
  ENABLE_CONSOLE_LOGGING: coerceBoolean,
  FEEDBACK_URL: optionalUrl,
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ENABLE_SOURCE_MAPS: coerceBoolean,
  SENTRY_ORG: z.string().optional(),
  SKIP_ENV_VALIDATION: coerceBoolean,
  RESERVATION_UNIT_PREVIEW_URL_PREFIX: optionalUrl,
  // mandatory because the SSR can't connect to the API without it
  // frontend SSR is running on a different host than the backend
  TILAVARAUS_API_URL: z.url(),
});

// NOTE if you add a new variable to client it will be fixed in the build
// and the same build image will be deployed to all environments
const ClientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string(),
  NEXT_PUBLIC_SOURCE_BRANCH_NAME: z.string().optional(),
  NEXT_PUBLIC_SOURCE_VERSION: z.string().optional(),
});

// Public settings that are read at runtime, so the same image runs in all environments.
// The server reads them from process.env.
// The browser reads them from window.__RUNTIME_CONFIG__, which _document renders.
// Do not add secrets here. All values are sent to the browser.
const RuntimeSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  SENTRY_TRACE_PROPAGATION_TARGETS: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

const RUNTIME_ENV_KEYS = RuntimeSchema.keyof().options;

function getRuntimeEnv() {
  if (typeof window !== "undefined") {
    return window.__RUNTIME_CONFIG__ ?? {};
  }
  return process.env;
}

function createEnv() {
  const skipValidation = coerceBoolean.parse(process.env.SKIP_ENV_VALIDATION);
  const isServer = typeof window === "undefined";

  const serverConfig = isServer
    ? skipValidation
      ? ServerSchema.partial().safeParse(process.env)
      : ServerSchema.safeParse(process.env)
    : null;

  if (isServer && !serverConfig?.success) {
    // eslint-disable-next-line no-console
    console.error("Server env validation failed", serverConfig?.error);
  }

  const clientSchema = skipValidation ? ClientSchema.partial() : ClientSchema;
  // NOTE NextJs does substitutions for process.env. Not using the full variable breaks it!
  const clientConfig = clientSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SOURCE_BRANCH_NAME: process.env.NEXT_PUBLIC_SOURCE_BRANCH_NAME,
    NEXT_PUBLIC_SOURCE_VERSION: process.env.NEXT_PUBLIC_SOURCE_VERSION,
  });

  if (!clientConfig.success) {
    // eslint-disable-next-line no-console
    console.error("Client env validation failed", clientConfig.error);
  }

  const runtimeConfig = RuntimeSchema.safeParse(getRuntimeEnv());
  if (!runtimeConfig.success) {
    // eslint-disable-next-line no-console
    console.error("Runtime env validation failed", runtimeConfig.error);
  }

  return {
    ...(isServer && serverConfig?.success ? serverConfig.data : {}),
    ...(clientConfig.success ? clientConfig.data : {}),
    ...(runtimeConfig.success ? runtimeConfig.data : {}),
    NEXT_ENV: process.env.NEXT_ENV,
  };
}

const env = createEnv();

export { env, RUNTIME_ENV_KEYS };
