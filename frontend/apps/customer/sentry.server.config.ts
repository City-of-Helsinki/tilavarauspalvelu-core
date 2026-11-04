import * as Sentry from "@sentry/nextjs";
import { beforeSend, beforeSendTransaction, createServerTracesSampler, parseSampleRate } from "ui/src";
import { NON_PAGE_PATH, PUBLIC_FILE_PATH } from "ui/src/middlewareHelpers";
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
    // Drop the server transactions that only add noise. These match on the path, not on the name,
    // because the names do not contain the path.
    // The SDK already drops the transactions for /_next/static/ files.
    ignoreSpans: [
      // The proxy runs on every request. Its transaction is named "middleware GET" for every path.
      { name: /^middleware /, attributes: { "http.target": NON_PAGE_PATH } },
      // Public files, such as /favicon.svg. Their transaction is named "GET /*".
      { op: "http.server", attributes: { "http.target": PUBLIC_FILE_PATH } },
    ],
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
