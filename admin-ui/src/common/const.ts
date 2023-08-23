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

export const publicUrl = env.NEXT_PUBLIC_BASE_URL;
export const apiBaseUrl = env.NEXT_PUBLIC_TILAVARAUS_API_URL;
export const nextAuthRoute = `${publicUrl}/api/auth`;

export const previewUrlPrefix =
  env.NEXT_PUBLIC_RESERVATION_UNIT_PREVIEW_URL_PREFIX;

export const PROFILE_TOKEN_HEADER = "X-Authorization";
export const SESSION_EXPIRED_ERROR = "JWT too old";

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;

export const RECURRING_AUTOMATIC_REFETCH_LIMIT = 2000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

export const HERO_IMAGE_URL = `${publicUrl}/hero-user@1x.jpg`;
export const LOGO_IMAGE_URL = `${publicUrl}/logo.png`;
