// @ts-check
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
  ENABLE_FETCH_HACK: coerceBoolean.optional(),
  SKIP_ENV_VALIDATION : coerceBoolean.optional(),
});

const ClientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_TILAVARAUS_API_URL: z.string(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_COOKIEHUB_ENABLED: coerceBoolean.optional(),
  NEXT_PUBLIC_HOTJAR_ENABLED: coerceBoolean,
  NEXT_PUBLIC_MATOMO_ENABLED: coerceBoolean,
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
});

const createEnv = () => {
  // TODO this causes type issues for example booleans are typed as strings
  /* eslint-disable-next-line import/no-mutable-exports */
  // let { env } = process;
  const skipValidation = coerceBoolean.parse(process.env.SKIP_ENV_VALIDATION);
  const isServer = typeof window === "undefined";

  const serverConfig = isServer ?
    skipValidation ? ServerSchema.partial().safeParse(process.env) :
      ServerSchema.safeParse(process.env) : null;
    if (isServer && !serverConfig?.success) {
      // eslint-disable-next-line no-console
      console.error("Server env validation failed", serverConfig?.error);
    }

  const clientSchema = skipValidation ? ClientSchema.partial() : ClientSchema;

  // NOTE NextJs does substitutions for process.env. Not using the full variable breaks it!
  const clientConfig = clientSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_TILAVARAUS_API_URL: process.env.NEXT_PUBLIC_TILAVARAUS_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_COOKIEHUB_ENABLED: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED,
    NEXT_PUBLIC_HOTJAR_ENABLED: process.env.NEXT_PUBLIC_HOTJAR_ENABLED,
    NEXT_PUBLIC_MATOMO_ENABLED: process.env.NEXT_PUBLIC_MATOMO_ENABLED,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
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
