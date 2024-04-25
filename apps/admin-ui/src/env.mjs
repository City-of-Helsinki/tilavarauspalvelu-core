import { z } from "zod";

// Coerces a string to true if it's "true" or "1", false if "false" or "0"
export const coerceBoolean = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  // eslint-disable-next-line eqeqeq
  .transform((value) => value == "true" || value == "1");

// Same as UI envs, Azure has prefix on the server variables
const ServerSchema = z.object({
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  // TODO enum?
  SENTRY_ENVIRONMENT: z.string().optional(),
  ENABLE_FETCH_HACK: coerceBoolean,
  TUNNISTAMO_URL: z.string().optional(),
  RESERVATION_UNIT_PREVIEW_URL_PREFIX: z.string().optional(),
  // mandatory because the SSR can't connect to the API without it
  // frontend SSR is running on a different host than the backend
  TILAVARAUS_API_URL: z.string().url(),
});

// NOTE if you add a new variable to client it will be fixed in the build
// and the same build image will be deployed to all environments
const ClientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string(),
});

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
    console.error("Server env validation failed", serverConfig.error);
  }

  const clientSchema = skipValidation ? ClientSchema.partial() : ClientSchema;
  // NOTE NextJs does substitutions for process.env. Not using the full variable breaks it!
  const clientConfig = clientSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!clientConfig.success) {
    // eslint-disable-next-line no-console
    console.error("Client env validation failed", clientConfig.error);
  }

  return {
    ...(isServer && serverConfig?.success ? serverConfig.data : {}),
    ...(clientConfig.success ? clientConfig.data : {}),
  };
}

const env = createEnv();

export { env };
