import * as Sentry from "@sentry/nextjs";
import { beforeSend, beforeSendTransaction, createServerTracesSampler, parseSampleRate } from "ui/src";
import { env } from "@/env.mjs";
import { getCustomerRelease } from "@/modules/baseUtils";

if (env.SENTRY_DSN) {
  const release = getCustomerRelease();

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release,
    // Samples all post login requests and uses SENTRY_TRACES_SAMPLE_RATE for the rest.
    // A rate of 0 turns tracing off.
    tracesSampler: createServerTracesSampler(parseSampleRate(env.SENTRY_TRACES_SAMPLE_RATE)),
    normalizeDepth: 3,
    integrations: [Sentry.extraErrorDataIntegration({ depth: 3 })],
    beforeSend,
    beforeSendTransaction,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
