// @ts-check
import { join } from "node:path";
import * as url from "node:url";
// eslint-disable-next-line import/extensions -- removing extension breaks build
import i18nconfig from "./next-i18next.config.js";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./env.mjs";

// TODO why was this necessary?
// This breaks tests, they work on admin-ui but not here...
// await import ("./env.mjs");
const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const { i18n } = i18nconfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  i18n,
  basePath: env.NEXT_PUBLIC_BASE_URL,
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
  // NOTE webpack.experimental.topLevelAwait breaks middleware (it hangs forever)
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "city-of-helsinki",
  project: "tilavaraus-ui",
  sentryUrl: "https://sentry.test.hel.ninja/",
  authToken: env.SENTRY_AUTH_TOKEN,
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
