const { i18n } = require("./next-i18next.config");

module.exports = {
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
    matomoEnabled: process.env.NEXT_PUBLIC_ENABLE_MATOMO === "true",
    oidcClientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    oidcUrl: process.env.NEXT_PUBLIC_OIDC_URL,
    oidcScope: process.env.NEXT_PUBLIC_OIDC_SCOPE,
    apiScope: process.env.NEXT_PUBLIC_TILAVARAUS_API_SCOPE,
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    mockRequests: process.env.NEXT_PUBLIC_MOCK_REQUESTS === "true",
  },
};
