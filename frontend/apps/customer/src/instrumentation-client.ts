// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import type { IntegrationFn } from "@sentry/core";
import { thirdPartyErrorFilterIntegration } from "@sentry/core";
import * as Sentry from "@sentry/nextjs";
import { captureRouterTransitionStart, replayIntegration } from "@sentry/nextjs";
import { beforeSend, beforeSendTransaction, parseSampleRate } from "ui/src";
import { env } from "@/env.mjs";
import { getCustomerRelease } from "@/modules/baseUtils";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  const release = getCustomerRelease();

  Sentry.init({
    beforeSend,
    beforeSendTransaction,
    normalizeDepth: 3,
    integrations: [
      replayIntegration(),
      Sentry.extraErrorDataIntegration({ depth: 3 }),
      thirdPartyErrorFilterIntegration({
        filterKeys: env.NEXT_PUBLIC_SENTRY_PROJECT ? [env.NEXT_PUBLIC_SENTRY_PROJECT] : [],
        behaviour: "drop-error-if-contains-third-party-frames",
      }) as IntegrationFn,
    ],
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    release,
    ignoreErrors: [
      "ResizeObserver loop completed with undelivered notifications",
      "ResizeObserver loop limit exceeded",
    ],
    tracesSampleRate: parseSampleRate(env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
    tracePropagationTargets: env.NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS
      ? env.NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS.split(",")
          .map((target) => target.trim())
          .filter(Boolean)
      : [],
    replaysSessionSampleRate: parseSampleRate(env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE),
    replaysOnErrorSampleRate: parseSampleRate(env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE),
    debug: false,
  });
}

export const onRouterTransitionStart = captureRouterTransitionStart;
