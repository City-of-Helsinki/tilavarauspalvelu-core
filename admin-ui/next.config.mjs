import { join } from "path";
import analyser from "@next/bundle-analyzer";
import * as url from "url";
await import ("./src/env.mjs");
import { env } from "./src/env.mjs";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const withBundleAnalyzer = analyser({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const config ={
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["common"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  sassOptions: {
    includePaths: [join(ROOT_PATH, "src")],
  },
  i18n: {
    locales: ['fi'],
    defaultLocale: 'fi',
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
        source: "/logout/:any*",
        destination: "/logout/:any*",
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
  reactStrictMode: true,
  // common with user ui
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

const nextConfig = withBundleAnalyzer(config)

const sentryWebpackPluginOptions = {
  hideSourceMaps: true,
  dryRun: env.SENTRY_AUTH_TOKEN === undefined,
  silent: true,
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
export default env.SENTRY_ENVIRONMENT
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions) : nextConfig;
