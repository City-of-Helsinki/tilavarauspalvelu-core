import { availableParallelism } from "node:os";
import { join } from "node:path";
import * as url from "node:url";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { CSP_HEADER } from "ui/src/modules/baseUtils";
import { SENTRY_APPLICATION_KEY, getCustomerRelease } from "@/modules/baseUtils";
import i18nconfig from "./next-i18next.config.cjs";
import { env } from "./src/env.mjs";

// NOTE required for next-i18next to find the config file (when not .js)
// required to be cjs because they don't support esm
process.env.I18NEXT_DEFAULT_CONFIG_PATH = "./next-i18next.config.cjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));
const HDS_COOKIE_CONSENT_IMPORT = "hds-core/lib/components/cookie-consent/cookieConsent";
const HDS_COOKIE_CONSENT_TARGET = "hds-core/lib/components/cookie-consent/cookieConsent.ts";

// Set NEXT_BUILD_CPUS to limit the build workers, for example in Docker where the CPU limit does not apply.
const envCores = Number(process.env.NEXT_BUILD_CPUS);
const numberOfCores = envCores > 0 ? envCores : availableParallelism();

const { i18n } = i18nconfig;

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  // NOTE default worker count uses os.cpus() which ignores container CPU limits
  // and spawns too many workers (OOM in memory limited containers)
  experimental: {
    cpus: numberOfCores,
    serverSourceMaps: env.SENTRY_ENABLE_SOURCE_MAPS,
  },
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
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  release: {
    name: getCustomerRelease(),
  },
  // Tags our own code, so thirdPartyErrorFilterIntegration does not drop every error.
  applicationKey: SENTRY_APPLICATION_KEY,
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",
  // Disable sourcemaps because we use nextjs configuration for it
  sourcemaps: {
    disable: true,
  },
});
