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

export const languages = ["fi", "sv", "en"];

export const apiBaseUrl = process.env.REACT_APP_TILAVARAUS_API_URL;
export const authEnabled = process.env.REACT_APP_DISABLE_AUTH !== "true";
export const oidcClientId = process.env.REACT_APP_OIDC_CLIENT_ID;
export const oidcUrl = process.env.REACT_APP_OIDC_URL;
export const oidcScope = process.env.REACT_APP_OIDC_SCOPE;
export const apiScope = process.env.REACT_APP_TILAVARAUS_API_SCOPE;
export const apiTokenUrl = process.env.REACT_APP_API_TOKEN_URL;
export const publicUrl = process.env.PUBLIC_URL;
export const previewUrlPrefix =
  process.env.REACT_APP_RESERVATION_UNIT_PREVIEW_URL_PREFIX;

export const LIST_PAGE_SIZE = 36;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;
