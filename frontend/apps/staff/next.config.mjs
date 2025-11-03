// @ts-check
import { withSentryConfig } from "@sentry/nextjs";
import { join } from "node:path";
import * as url from "node:url";
import { env } from "./src/env.mjs";
import { getVersion } from "./src/modules/baseUtils.mjs";

// NOTE required for next-i18next to find the config file (when not .js)
// required to be cjs because they don't support esm
process.env.I18NEXT_DEFAULT_CONFIG_PATH = "./next-i18next.config.cjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["ui"],
  // create a smaller bundle
  output: "standalone",
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: join(ROOT_PATH, "../../"),
  // don't block builds use a separate CI step for this
  typescript: {
    ignoreBuildErrors: true,
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
        source: "/units/:id/reservation-units/new",
        destination: "/reservation-units/new?id=:id",
      },
      // secondary route when accessed through unit pages
      {
        source: "/units/:id/reservation-units/:any*",
        destination: "/reservation-units/:any*",
      },
      // old notifications route
      {
        source: "/messaging/notifications/:any*",
        destination: "/notifications/:any*",
      },
      // old all reservations route
      {
        source: "/reservations/all",
        destination: "/reservations",
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
      // healthcheck should be a simple 200 response with no resource loading
      {
        source: "/healthcheck",
        destination: "/api/healthcheck",
      },
    ];
  },
  // NOTE sentry/nextjs doesn't have options to bundle static/chunks
  // widenClientFileUpload should enable them but it doesn't
  // the only option is custom webpack configuration to add SSR sourcemaps
  productionBrowserSourceMaps: env.SENTRY_ENABLE_SOURCE_MAPS,
  webpack: (config, { isServer }) => {
    if (isServer && env.SENTRY_ENABLE_SOURCE_MAPS) {
      // oxlint-disable-next-line no-console
      console.log("Server build: adding sourcemaps");
      config.devtool = "source-map";
    }
    return config;
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
  // Disable sourcemaps because we use nextjs configuration for it
  sourcemaps: {
    disable: true,
  },
});
