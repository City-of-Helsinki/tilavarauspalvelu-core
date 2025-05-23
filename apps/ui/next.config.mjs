// @ts-check
import { join } from "node:path";
import * as url from "node:url";
import i18nconfig from "./next-i18next.config.cjs";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./env.mjs";
import { getVersion } from "./modules/baseUtils.mjs";

// NOTE required for next-i18next to find the config file (when not .js)
// required to be cjs because they don't support esm
process.env.I18NEXT_DEFAULT_CONFIG_PATH = "./next-i18next.config.cjs";

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
  // eslint-disable-next-line require-await
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
  org: "city-of-helsinki",
  project: "tilavarauspalvelu-ui",
  sentryUrl: "",
  authToken: "",
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
  sourcemaps: {
    disable: !env.SENTRY_ENABLE_SOURCE_MAPS,
  },
});
