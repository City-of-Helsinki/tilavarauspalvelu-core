import { env } from "app/env.mjs";
import { ApplicationStatusChoice } from "common/types/gql-types";

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

export const PUBLIC_URL = env.NEXT_PUBLIC_BASE_URL ?? "";

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;

export const RECURRING_AUTOMATIC_REFETCH_LIMIT = 2000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

// TODO PUBLIC_URL should be cleaned up and always end in /
export const HERO_IMAGE_URL = `${PUBLIC_URL}/hero-user@1x.jpg`;
export const LOGO_IMAGE_URL = `${PUBLIC_URL}/logo.png`;

// TODO move the url constructors to packages/common
// TODO make this into utility function
function getCleanPublicUrl() {
  const publicUrl = PUBLIC_URL;
  const hasPublicUrl =
    publicUrl != null && publicUrl !== "/" && publicUrl !== "";
  const publicUrlNoSlash =
    publicUrl && hasPublicUrl ? publicUrl.replace(/\/$/, "") : "";
  const cleanPublicUrl = publicUrlNoSlash.startsWith("/")
    ? publicUrlNoSlash
    : `/${publicUrlNoSlash}`;
  return cleanPublicUrl;
}

// Returns href url for sign in dialog when given redirect url as parameter
export function getSignInUrl(apiBaseUrl: string, callBackUrl: string): string {
  const authUrl = `${apiBaseUrl}/helauth`;
  if (callBackUrl.includes(`/logout`)) {
    const baseUrl = new URL(callBackUrl).origin;
    const cleanPublicUrl = getCleanPublicUrl();
    return `${authUrl}/login?next=${baseUrl}${cleanPublicUrl}`;
  }
  return `${authUrl}/login?next=${callBackUrl}`;
}

// Returns href url for logging out with redirect url to /logout
export function getSignOutUrl(apiBaseUrl: string): string {
  const authUrl = `${apiBaseUrl}/helauth`;
  return `${authUrl}/logout`;
}

export const VALID_ALLOCATION_APPLICATION_STATUSES = [
  ApplicationStatusChoice.Received,
  ApplicationStatusChoice.InAllocation,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.ResultsSent,
];

export const VALID_ALLOCATED_APPLICATION_STATUSES = [
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.ResultsSent,
];
