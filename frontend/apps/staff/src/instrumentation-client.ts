// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import { thirdPartyErrorFilterIntegration } from "@sentry/core";
import * as Sentry from "@sentry/nextjs";
import { captureRouterTransitionStart } from "@sentry/nextjs";
import { beforeSend, beforeSendTransaction, parseSampleRate } from "ui/src";
import { env } from "@/env.mjs";
import { getStaffRelease } from "./modules/baseUtils";

if (env.SENTRY_DSN) {
  const release = getStaffRelease();

  Sentry.init({
    beforeSend,
    beforeSendTransaction,
    normalizeDepth: 3,
    // Session replay is forbidden in the City's Sentry organisation. Do not add replayIntegration.
    integrations: [
      Sentry.extraErrorDataIntegration({ depth: 3 }),
      thirdPartyErrorFilterIntegration({
        filterKeys: env.SENTRY_PROJECT ? [env.SENTRY_PROJECT] : [],
        behaviour: "drop-error-if-contains-third-party-frames",
      }),
    ],
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release,
    ignoreErrors: [
      "ResizeObserver loop completed with undelivered notifications",
      "ResizeObserver loop limit exceeded",
    ],
    tracesSampleRate: parseSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
    tracePropagationTargets: env.SENTRY_TRACE_PROPAGATION_TARGETS
      ? env.SENTRY_TRACE_PROPAGATION_TARGETS.split(",")
          .map((target) => target.trim())
          .filter(Boolean)
      : [],
    debug: false,
  });
}

export const onRouterTransitionStart = captureRouterTransitionStart;
