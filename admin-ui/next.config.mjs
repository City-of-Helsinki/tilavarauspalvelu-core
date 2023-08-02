import { join } from "path";
import analyser from "@next/bundle-analyzer";
import * as url from "url";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const withBundleAnalyzer = analyser({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
export default withBundleAnalyzer({
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["common"],
  sassOptions: {
    includePaths: [join(ROOT_PATH, "src")],
  },
  i18n: {
    locales: ['fi'],
    defaultLocale: 'fi',
  },
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
  serverRuntimeConfig: {
    // TODO use different env variables for ui and admin-ui
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    oidcClientId: process.env.OIDC_CLIENT_ID,
    oidcClientSecret: process.env.OIDC_CLIENT_SECRET,
    oidcIssuer: process.env.OIDC_URL,
    oidcTokenUrl: process.env.OIDC_TOKEN_URL,
    oidcAccessTokenUrl: process.env.OIDC_ACCESS_TOKEN_URL,
    oidcScope: process.env.OIDC_SCOPE,
    oidcCallbackUrl: process.env.OIDC_CALLBACK_URL,
    oidcProfileApiUrl: process.env.OIDC_PROFILE_API_SCOPE,
    oidcTilavarausApiUrl: process.env.OIDC_TILAVARAUS_API_SCOPE,
    env: process.env.NEXT_ENV,
  },
  publicRuntimeConfig: {
    // TODO use different env variables for ui and admin-ui
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    tunnistamoUrl: process.env.TUNNISTAMO_URL,
    oidcEndSessionUrl: process.env.NEXT_PUBLIC_OIDC_END_SESSION,
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sentryEnvironment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    cookiehubEnabled: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED === "true",
    matomoEnabled: process.env.NEXT_PUBLIC_MATOMO_ENABLED === "true",
    hotjarEnabled: process.env.NEXT_PUBLIC_HOTJAR_ENABLED === "true",
    mockRequests: process.env.NEXT_PUBLIC_MOCK_REQUESTS === "true",
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
});
