const { i18n } = require("./next-i18next.config");
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  i18n,
  serverRuntimeConfig: {
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
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    oidcEndSessionUrl: process.env.NEXT_PUBLIC_OIDC_END_SESSION,
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sentryEnvironment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    cookiehubEnabled: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED === "true",
    matomoEnabled: process.env.NEXT_PUBLIC_MATOMO_ENABLED === "true",
    hotjarEnabled: process.env.NEXT_PUBLIC_HOTJAR_ENABLED === "true",
    mockRequests: process.env.NEXT_PUBLIC_MOCK_REQUESTS === "true",
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  transpilePackages: ["common"],
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  hideSourceMaps: true,
  dryRun: process.env.SENTRY_AUTH_TOKEN === undefined,
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = !!process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
