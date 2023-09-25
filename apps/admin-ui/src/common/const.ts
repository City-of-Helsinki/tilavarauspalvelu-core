import { env } from "app/env.mjs";

export const defaultLanguage = "fi";

// NOTE this is a dangerous variable, it does not change the frontend language
// instead it changes the possible data translations saved to backend.
// Changing it without changing the backend will break all form submits.
export const languages = ["fi", "sv", "en"];

export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const isBrowser = typeof window !== "undefined";

export const PUBLIC_URL = env.NEXT_PUBLIC_BASE_URL;
// @deprecated
export const publicUrl = PUBLIC_URL;
export const API_BASE_URL =
  env.NEXT_PUBLIC_TILAVARAUS_API_URL != null
    ? `${env.NEXT_PUBLIC_TILAVARAUS_API_URL}`
    : "";

export const GRAPQL_API_URL =
  env.NEXT_PUBLIC_TILAVARAUS_API_URL != null
    ? `${env.NEXT_PUBLIC_TILAVARAUS_API_URL}/graphql/`
    : "/graphql/";

export const previewUrlPrefix =
  env.NEXT_PUBLIC_RESERVATION_UNIT_PREVIEW_URL_PREFIX;

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;

export const RECURRING_AUTOMATIC_REFETCH_LIMIT = 2000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

export const HERO_IMAGE_URL = `${publicUrl}/hero-user@1x.jpg`;
export const LOGO_IMAGE_URL = `${publicUrl}/logo.png`;

// TODO create a clean version of the API_URL and reuse it
const AUTH_URL =
  env.NEXT_PUBLIC_TILAVARAUS_API_URL != null
    ? `${env.NEXT_PUBLIC_TILAVARAUS_API_URL}/helauth`
    : "/helauth";

const getCleanPublicUrl = () => {
  const hasPublicUrl =
    publicUrl != null && publicUrl !== "/" && publicUrl !== "";
  const publicUrlNoSlash =
    publicUrl && hasPublicUrl ? publicUrl.replace(/\/$/, "") : "";
  const cleanPublicUrl = publicUrlNoSlash.startsWith("/")
    ? publicUrlNoSlash
    : `/${publicUrlNoSlash}`;
  return cleanPublicUrl;
};
// Returns href url for sign in dialog when given redirect url as parameter
export const getSignInUrl = (callBackUrl: string): string => {
  if (callBackUrl.includes(`/logout`)) {
    const baseUrl = new URL(callBackUrl).origin;
    const cleanPublicUrl = getCleanPublicUrl();
    return `${AUTH_URL}/login?next=${baseUrl}${cleanPublicUrl}`;
  }
  return `${AUTH_URL}/login?next=${callBackUrl}`;
};

// Returns href url for logging out with redirect url to /logout
export const getSignOutUrl = (): string => {
  const baseUrl = new URL(window.location.href).origin;
  const cleanPublicUrl = getCleanPublicUrl();
  const callBackUrl = `${baseUrl}${cleanPublicUrl}/auth/logout`;
  return `${AUTH_URL}/logout?next=${callBackUrl}`;
};
