// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { getVersion } from "@/modules/serverUtils";

const VERSION = getVersion();
const APP_NAME = "tilavarauspalvelu-ui";

const config = {
  tracesSampleRate: 0.2,
  debug: false,
  release: `${APP_NAME}@${VERSION}`,
  // FIXME replay doesn't work (requires different import / plugin)
  // integrations: isBrowser ? [Sentry.replayIntegration()] : [],
  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1,
};

/// @name updateSentryConfig
/// @description client has no access to env variables (outside of build time), we need to set the dns during runtime.
/// @param {string} [dsn] sentry dns
/// @param {string} [environment] environment we are running in
/// @returns {void}
export function updateSentryConfig(dsn: string, environment: string) {
  if (!Sentry.isInitialized()) {
    Sentry.init({
      ...config,
      dsn,
      environment,
    });
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
