const serverConfigKeys = [
  'REACT_APP_TILAVARAUS_API_URL',
  'REACT_APP_SENTRY_DSN',
  'REACT_APP_SENTRY_ENVIRONMENT',
  'REACT_APP_VERSION',
  'REACT_APP_OIDC_CLIENT_ID',
  'REACT_APP_DISABLE_AUTH',
  'REACT_APP_OIDC_URL',
  'REACT_APP_OIDC_SCOPE',
  'REACT_APP_TILAVARAUS_API_SCOPE',
];

module.exports = {
  ...serverConfigKeys.reduce((p, c) => ({ ...p, [c]: process.env[c] }), {}),
};
