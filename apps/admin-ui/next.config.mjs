// @ts-check
import { join } from "node:path";
import * as url from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/env.mjs";
import { getVersion } from "./src/modules/baseUtils.mjs";

// NOTE required for next-i18next to find the config file (when not .js)
// required to be cjs because they don't support esm
process.env.I18NEXT_DEFAULT_CONFIG_PATH = "./next-i18next.config.cjs";

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
  // eslint-disable-next-line require-await
  async rewrites() {
    return [
      {
        source: "/units/:id/reservation-unit/:any*",
        destination: "/reservation-units/:any*",
      },
      {
        source: "/messaging/notifications/:any*",
        destination: "/notifications/:any*",
      },
      // Fix missing 's' in resources and spaces
      {
        source: "/units/:id/resource/:any*",
        destination: "/units/:id/resources/:any*",
      },
      {
        source: "/units/:id/space/:any*",
        destination: "/units/:id/spaces/:any*",
      },
    ];
  },
  basePath: env.NEXT_PUBLIC_BASE_URL,
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

export default withSentryConfig(config, {
  org: "city-of-helsinki",
  project: "tilavarauspalvelu-admin-ui",
  sentryUrl: "",
  authToken: "",
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
