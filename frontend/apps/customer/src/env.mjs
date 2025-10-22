// @ts-check
import { z } from "zod";

// Coerces a string to true if it's "true" or "1", false if "false" or "0"
const coerceBoolean = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  // eslint-disable-next-line eqeqeq
  .transform((value) => value == "true" || value == "1");

const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal("").transform((_) => undefined));

// Same as UI envs, Azure has prefix on the server variables
const ServerSchema = z.object({
  // Uploading sourcemaps to Sentry requires an auth token - Required on CI
  SENTRY_AUTH_TOKEN: z.string().optional(),
  // Sentry DSN is used for error tracking - Required during runtime
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_ENABLE_SOURCE_MAPS: coerceBoolean,
  SKIP_ENV_VALIDATION: coerceBoolean,
  HOTJAR_ENABLED: coerceBoolean,
  MATOMO_ENABLED: coerceBoolean,
  PROFILE_UI_URL: optionalUrl,
  // mandatory because the SSR can't connect to the API without it
  // frontend SSR is running on a different host than the backend
  TILAVARAUS_API_URL: z.string().url(),
  EMAIL_VARAAMO_EXT_LINK: optionalUrl,
});

// NOTE if you add a new variable to client it will be fixed in the build
// and the same build image will be deployed to all environments
const ClientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_SOURCE_BRANCH_NAME: z.string().optional(),
  NEXT_PUBLIC_SOURCE_VERSION: z.string().optional(),
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

  return {
    ...(isServer && serverConfig?.success ? serverConfig.data : {}),
    ...(clientConfig.success ? clientConfig.data : {}),
  };
}

const env = createEnv();

export { env };
