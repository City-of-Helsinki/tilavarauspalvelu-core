// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env.mjs";
import { getVersion } from "@/modules/baseUtils.mjs";

const { SENTRY_ENVIRONMENT } = env;
const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-admin-ui";

const isBrowser = typeof window !== "undefined";
const config = {
  tracesSampleRate: 0.2,
  debug: false,
  release: `${APP_NAME}@${VERSION}`,
  // NOTE for some reason this file is imported on the server side also
  // replay is client side exclusive
  integrations: isBrowser ? [Sentry.replayIntegration()] : [],
  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,
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
