// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { getVersion } from "@/modules/baseUtils";

const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-admin-ui";

const config = {
  tracesSampleRate: 0.2,
  debug: false,
  release: `${APP_NAME}@${VERSION}`,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
};

/// @name updateSentryConfig
/// @description client has no access to env variables (outside of build time), we need to set the dns during runtime.
/// @param {string} [dsn] sentry dns
/// @param {string} [environment] environment we are running in
/// @returns {void}
export function updateSentryConfig(dsn: string, environment: string): void {
  if (!Sentry.isInitialized()) {
    Sentry.init({
      ...config,
      dsn,
      environment,
    });
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
