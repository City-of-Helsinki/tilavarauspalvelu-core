const { i18n } = require("./next-i18next.config");
const { withSentryConfig } = require("@sentry/nextjs");
const withPlugins = require("next-compose-plugins");
const withTM = require("next-transpile-modules")(["common"]);

const moduleExports = {
  i18n,
  serverRuntimeConfig: {
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
  },
  publicRuntimeConfig: {
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sentryEnvironment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    cookiehubEnabled: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED === "true",
    matomoEnabled: process.env.NEXT_PUBLIC_MATOMO_ENABLED === "true",
    hotjarEnabled: process.env.NEXT_PUBLIC_HOTJAR_ENABLED === "true",
    oidcClientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    oidcUrl: process.env.NEXT_PUBLIC_OIDC_URL,
    apiTokenUrl: process.env.NEXT_PUBLIC_API_TOKEN_URL,
    oidcScope: process.env.NEXT_PUBLIC_OIDC_SCOPE,
    apiScope: process.env.NEXT_PUBLIC_TILAVARAUS_API_SCOPE,
    profileApiScope: process.env.NEXT_PUBLIC_PROFILE_API_SCOPE,
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    mockRequests: process.env.NEXT_PUBLIC_MOCK_REQUESTS === "true",
  },
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  dryRun: process.env.SENTRY_AUTH_TOKEN === undefined,
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withPlugins(
  [withTM],
  withSentryConfig(moduleExports, sentryWebpackPluginOptions)
);
