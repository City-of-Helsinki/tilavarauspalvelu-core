// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env.mjs";
import { getVersion } from "@/helpers/serverUtils";

const { SENTRY_ENVIRONMENT } = env;
const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-admin-ui";

const config = {
  tracesSampleRate: 0.2,
  debug: false,
  release: `${APP_NAME}@${VERSION}`,
};

Sentry.init({
  ...config,
  dsn: "",
  environment: SENTRY_ENVIRONMENT,
});

/// updateSentryConfig
/// @param dsn string
/// @param environment string
/// @returns void
/// @description Since client has no access to env variables (outside of build time), we need to set the dns during runtime.
export function updateSentryConfig(dsn: string, environment: string) {
  Sentry.init({
    ...config,
    dsn,
    environment,
  });
}
