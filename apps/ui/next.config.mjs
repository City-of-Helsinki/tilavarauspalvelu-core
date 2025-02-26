// @ts-check
import { join } from "node:path";
import * as url from "node:url";

import * as i18nconfig from "./next-i18next.config.cjs";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./env.mjs";
import { getVersion } from "./modules/baseUtils.mjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const { i18n } = i18nconfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["common"],
  // create a smaller bundle
  output: "standalone",
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: join(ROOT_PATH, "../../"),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
  i18n,
  basePath: env.NEXT_PUBLIC_BASE_URL,
  async rewrites() {
    return [
      {
        source: "/reservation/confirmation/:id",
        destination: "/reservations/:id/confirmation",
      },
      // old series/:reservation cancel url
      {
        // Old search url
        source: "/search/single",
        destination: "/search",
      },
      {
        source: "/applications/:id/view/:reservationId/cancel",
        destination: "/reservations/:reservationId/cancel",
      },
      {
        source: "/applications/:id/reservations/:reservationId/cancel",
        destination: "/reservations/:reservationId/cancel",
      },
    ];
  },
  // NOTE webpack.experimental.topLevelAwait breaks middleware (it hangs forever)
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "city-of-helsinki",
  project: "tilavarauspalvelu-ui",
  // project: "tilavaraus-ui",
  // only upload source maps to production sentry
  sentryUrl: "https://sentry.hel.fi/",
  // sentryUrl: "https://sentry.test.hel.ninja/",
  authToken: env.SENTRY_AUTH_TOKEN,
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },
  release: {
    name: getVersion().replace("/", "-"),
  },
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",
});
