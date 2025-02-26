// @ts-check
import { join } from "node:path";
import * as url from "node:url";
import analyser from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/env.mjs";
import { getVersion } from "./src/modules/baseUtils.mjs";

// await import("./src/env.mjs");

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const withBundleAnalyzer = analyser({
  enabled: process.env.ANALYZE === "true",
});

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
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    // @ts-expect-error -- implicit any, hard to type webpack config
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );
    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );
    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  // common with user ui
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

const nextConfig = withBundleAnalyzer(config);

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "city-of-helsinki",
  project: "tilavarauspalvelu-admin-ui",
  // only upload source maps to production sentry
  sentryUrl: "https://sentry.hel.fi/",
  authToken: env.SENTRY_AUTH_TOKEN,
  // Only print logs for uploading source maps in CI
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
});
