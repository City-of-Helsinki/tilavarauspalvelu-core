export const defaultLanguage = "fi";

export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const apiBaseUrl = process.env.REACT_APP_TILAVARAUS_API_URL;
export const authEnabled = process.env.REACT_APP_DISABLE_AUTH !== "true";
export const oidcClientId = process.env.REACT_APP_OIDC_CLIENT_ID;
export const oidcUrl = process.env.REACT_APP_OIDC_URL;
export const oidcScope = process.env.REACT_APP_OIDC_SCOPE;
export const apiScope = process.env.REACT_APP_TILAVARAUS_API_SCOPE;
