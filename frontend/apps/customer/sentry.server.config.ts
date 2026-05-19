import * as Sentry from "@sentry/nextjs";
import { beforeSend, beforeSendTransaction, parseSampleRate } from "ui/src";
import { env } from "@/env.mjs";
import { getCustomerRelease } from "@/modules/baseUtils";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  const release = getCustomerRelease();

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    release,
    // Adjust this value in production, or use tracesSampler for greater control
    // @see https://develop.sentry.dev/sdk/performance/
    // To turn it off, remove the line
    // @see https://github.com/getsentry/sentry-javascript/discussions/4503#discussioncomment-2143116
    tracesSampleRate: parseSampleRate(env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
    normalizeDepth: 3,
    integrations: [Sentry.extraErrorDataIntegration({ depth: 3 })],
    beforeSend,
    beforeSendTransaction,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
