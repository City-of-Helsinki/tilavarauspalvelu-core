import { z } from "zod";

// Coerces a string to true if it's "true" or "1", false if "false" or "0"
export const coerceBoolean = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  // eslint-disable-next-line eqeqeq
  .transform((value) => value == "true" || value == "1");

// Same as UI envs, Azure has prefix on the server variables
const ServerSchema = z.object({
  OIDC_CLIENT_ID: z.string(),
  OIDC_CLIENT_SECRET: z.string(),
  OIDC_URL: z.string(),
  OIDC_TOKEN_URL: z.string(),
  OIDC_ACCESS_TOKEN_URL: z.string(),
  OIDC_SCOPE: z.string(),
  OIDC_CALLBACK_URL: z.string(),
  OIDC_PROFILE_API_SCOPE: z.string(),
  OIDC_TILAVARAUS_API_SCOPE: z.string(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  // TODO enum?
  SENTRY_ENVIRONMENT: z.string().optional(),
  NEXT_ENV: z.enum(["development", "test", "production"]).optional(),
});

const ClientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string(),
  // used for graphql client
  NEXT_PUBLIC_TILAVARAUS_API_URL: z.string(),
  // used for logout page
  NEXT_PUBLIC_TUNNISTAMO_URL: z.string(),
  // Used
  NEXT_PUBLIC_RESERVATION_UNIT_PREVIEW_URL_PREFIX: z.string().optional(),
  // TODO these are copies from ui check which ones are used by admin-ui (remove unused)
  NEXT_PUBLIC_COOKIEHUB_ENABLED: coerceBoolean.optional(),
  NEXT_PUBLIC_HOTJAR_ENABLED: coerceBoolean.optional(),
});

/* eslint-disable-next-line import/no-mutable-exports */
let { env } = process;
if (!process.env.SKIP_ENV_VALIDATION) {
  const isServer = typeof window === "undefined";

  // TODO replace with safe parse, print errors to console
  // Don't throw because it crashes the server (and has zero logging)
  const serverConfig = isServer ? ServerSchema.safeParse(process.env) : null;

  if (isServer && serverConfig.error) {
    // eslint-disable-next-line no-console
    console.error("Server env validation failed", serverConfig.error);
  }

  // NOTE NextJs does substitutions for process.env. Not using the full variable breaks it!
  const clientConfig = ClientSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_TILAVARAUS_API_URL: process.env.NEXT_PUBLIC_TILAVARAUS_API_URL,
    NEXT_PUBLIC_TUNNISTAMO_URL: process.env.NEXT_PUBLIC_TUNNISTAMO_URL,
    NEXT_PUBLIC_COOKIEHUB_ENABLED: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED,
    NEXT_PUBLIC_HOTJAR_ENABLED: process.env.NEXT_PUBLIC_HOTJAR_ENABLED,
  });

  if (clientConfig.error) {
    // eslint-disable-next-line no-console
    console.error("Client env validation failed", clientConfig.error);
  }

  env = {
    ...(isServer && serverConfig.success ? serverConfig.data : {}),
    ...(clientConfig.success ? clientConfig.data : {}),
  };
}

export { env };
