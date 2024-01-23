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
  experimental: {
    // this includes files from the monorepo base two directories up
    outputFileTracingRoot: join(ROOT_PATH, "../../"),
  },
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

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  hideSourceMaps: true,
  dryRun: env.SENTRY_AUTH_TOKEN === undefined,
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
export default env.SENTRY_ENVIRONMENT
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
