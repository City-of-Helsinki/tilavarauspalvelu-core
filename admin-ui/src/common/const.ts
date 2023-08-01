import getConfig from "next/config";

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

const { publicRuntimeConfig } = getConfig();
export const { baseUrl, apiBaseUrl } = publicRuntimeConfig;
// export const { nextAuthRoute } = serverRuntimeConfig;
export const nextAuthRoute = "/api/auth";

export const publicUrl = process.env.NEXT_PUBLIC_URL ?? "";
export const previewUrlPrefix =
  process.env.NEXT_RESERVATION_UNIT_PREVIEW_URL_PREFIX;

export const PROFILE_TOKEN_HEADER = "X-Authorization";
export const SESSION_EXPIRED_ERROR = "JWT too old";

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;

export const RECURRING_AUTOMATIC_REFETCH_LIMIT = 2000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

export const HERO_IMAGE_URL = "/hero-user@1x.jpg";
export const LOGO_IMAGE_URL = "/logo.png";
