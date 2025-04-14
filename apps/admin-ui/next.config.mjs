// @ts-check
import { join } from "node:path";
import * as url from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/env.mjs";
import { getVersion } from "./src/modules/baseUtils.mjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["common"],
  // create a smaller bundle
  output: "standalone",
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: join(ROOT_PATH, "../../"),
  // don't block builds use a separate CI step for this
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  sassOptions: {
    includePaths: [join(ROOT_PATH, "src")],
    silenceDeprecations: ["legacy-js-api"],
  },
  i18n: {
    locales: ["fi"],
    defaultLocale: "fi",
  },
  basePath: env.NEXT_PUBLIC_BASE_URL,
  // eslint-disable-next-line require-await
  async rewrites() {
    return [
      // Do not rewrite API routes
      {
        source: "/api/:any*",
        destination: "/api/:any*",
      },
      {
        source: "/auth/logout/:any*",
        destination: "/auth/logout/:any*",
      },
      // Do not rewrite sentry tunnel
      {
        source: "/monitoring/:any*",
        destination: "/monitoring/:any*",
      },
      // Rewrite everything else to use `pages/index`
      {
        source: "/:any*",
        destination: "/",
      },
    ];
  },
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

export default withSentryConfig(config, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "city-of-helsinki",
  project: "tilavarauspalvelu-admin-ui",
  // only upload source maps to production sentry
  sentryUrl: env.SENTRY_ENABLE_SOURCE_MAPS ? "https://sentry.hel.fi/" : "",
  authToken: env.SENTRY_ENABLE_SOURCE_MAPS ? env.SENTRY_AUTH_TOKEN : "",
  silent: !process.env.CI,
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
  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: false,
  sourcemaps: {
    disable: !env.SENTRY_ENABLE_SOURCE_MAPS,
  },
});
