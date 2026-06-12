// @ts-check
import { join } from "node:path";
import * as url from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { CSP_HEADER } from "@ui/modules/baseUtils";
import { getCustomerRelease } from "@/modules/baseUtils";
import i18nconfig from "./next-i18next.config.cjs";
import { env } from "./src/env.mjs";

// NOTE required for next-i18next to find the config file (when not .js)
// required to be cjs because they don't support esm
process.env.I18NEXT_DEFAULT_CONFIG_PATH = "./next-i18next.config.cjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));
const HDS_COOKIE_CONSENT_IMPORT = "hds-core/lib/components/cookie-consent/cookieConsent";
const HDS_COOKIE_CONSENT_TARGET = "hds-core/lib/components/cookie-consent/cookieConsent.ts";

const { i18n } = i18nconfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ui", "hds-core", "hds-react"],
  // create a smaller bundle
  output: "standalone",
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: join(ROOT_PATH, "../../"),
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: {
      [HDS_COOKIE_CONSENT_IMPORT]: HDS_COOKIE_CONSENT_TARGET,
    },
  },
  sassOptions: {
    includePaths: [join(ROOT_PATH, "src")],
    silenceDeprecations: ["legacy-js-api"],
  },
  i18n,
  basePath: env.NEXT_PUBLIC_BASE_URL,
  // eslint-disable-next-line require-await
  async redirects() {
    return [
      {
        // Old search url
        source: "/search/single",
        destination: "/search",
        permanent: true,
      },
    ];
  },
  // eslint-disable-next-line require-await
  async rewrites() {
    return [
      {
        // webstore callback
        source: "/reservation/cancel",
        destination: "/callbacks/webstore/cancel",
      },
      {
        // webstore callback
        source: "/success",
        destination: "/callbacks/webstore/success",
      },
      {
        source: "/reservation/confirmation/:id",
        destination: "/reservations/:id/confirmation",
      },
      {
        source: "/applications/:id/view/:reservationId/cancel",
        destination: "/reservations/:reservationId/cancel",
      },
      {
        source: "/applications/:id/reservations/:reservationId/cancel",
        destination: "/reservations/:reservationId/cancel",
      },
      // healthcheck should be a simple 200 response with no resource loading
      {
        source: "/healthcheck",
        destination: "/api/healthcheck",
      },
    ];
  },
  // oxlint-disable-next-line require-await
  async headers() {
    // path-to-regex has some weird matching for the base path
    return ["/", "/(.*)"].map((source) => ({
      source,
      headers: [
        {
          key: "Content-Security-Policy",
          value: CSP_HEADER.replaceAll(/\n|\r/g, ""),
        },
      ],
    }));
  },
  // Sentry upload options don't fully control all emitted chunk sourcemaps.
  // In this app, sourcemap generation is controlled via Next.js/Turbopack config.
  productionBrowserSourceMaps: env.SENTRY_ENABLE_SOURCE_MAPS,
  webpack: (
    config: { devtool: string; resolve?: { alias?: Record<string, string> } },
    { isServer }: { isServer: boolean }
  ) => {
    if (isServer && env.SENTRY_ENABLE_SOURCE_MAPS) {
      // oxlint-disable-next-line no-console
      console.log("Adding sourcemaps to server build");
      config.devtool = "source-map";
    }
    // Fix HDS 6 import resolution issue with hds-core
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias[HDS_COOKIE_CONSENT_IMPORT] = HDS_COOKIE_CONSENT_TARGET;
    return config;
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
  // org and project are injected via SENTRY_ORG and SENTRY_PROJECT env variables in CI/CD workflows.
  // Do not hard-code them here to avoid mismatches between build and deployment.

  // Suppress all logs from SentryWebpackPlugin during local builds. In CI, logs are enabled for troubleshooting.
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },
  release: {
    name: getCustomerRelease(),
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
