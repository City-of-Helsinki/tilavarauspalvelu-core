// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env.mjs";
import { getVersion } from "@/modules/serverUtils";

const { SENTRY_DSN, SENTRY_ENVIRONMENT } = env;
const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-ui";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: `${APP_NAME}@${VERSION}`,
    tracesSampleRate: 0.2,
    debug: false,
  });
}
