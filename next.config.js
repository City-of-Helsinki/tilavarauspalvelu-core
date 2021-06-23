const { i18n } = require("./next-i18next.config");

module.exports = {
  i18n,
  publicRuntimeConfig: {
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    sentryDSN: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
    matomoEnabled: process.env.ENABLE_MATOMO === "true",
    oidcClientId: process.env.OIDC_CLIENT_ID,
    oidcUrl: process.env.OIDC_URL,
    oidcScope: process.env.OIDC_SCOPE,
    apiScope: process.env.TILAVARAUS_API_SCOPE,
  },
};
