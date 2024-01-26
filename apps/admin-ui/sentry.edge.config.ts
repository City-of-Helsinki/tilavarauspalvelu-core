// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env.mjs";
import { getVersion } from "@/helpers/serverUtils";

const SENTRY_DSN = env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = env.SENTRY_ENVIRONMENT;
const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-admin-ui";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: `${APP_NAME}@${VERSION}`,
    tracesSampleRate: 0.2,
    debug: false,
  });
}
