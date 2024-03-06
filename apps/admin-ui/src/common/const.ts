import { env } from "app/env.mjs";
import { ApplicationStatusChoice } from "common/types/gql-types";

export { isBrowser } from "common/src/helpers";
export { getSignOutUrl } from "common/src/urlBuilder";

export const defaultLanguage = "fi";

// NOTE this is a dangerous variable, it does not change the frontend language
// instead it changes the possible data translations saved to backend.
// Changing it without changing the backend will break all form submits.
export const languages = ["fi", "sv", "en"];

// @deprecated TODO this should be removed use numbers or translations instead
export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const PUBLIC_URL = env.NEXT_PUBLIC_BASE_URL ?? "";

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23];

export const NUMBER_OF_DECIMALS = 6;

export const RECURRING_AUTOMATIC_REFETCH_LIMIT = 2000;

/// Poll updates to application sections on the allocation page (in milliseconds), 0 to disable.
/// Why use this? if there are multiple users working on the same allocation, they will see updates.
/// If you are testing, you can use multiple tabs / browsers to see the updates.
/// Reason to disable (especially in production): the allocations queries are heavy and may cause performance issues.
/// TODO if this is left enabled it should be moved to env (so we can disable without recompiling).
/// NOTE seems to work fine without backoff logic (the next query is run after the previous one is finished)
/// better solution would be to use subscriptions (i.e. drive updates from the backend).
export const ALLOCATION_POLL_INTERVAL = 10000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

// TODO PUBLIC_URL should be cleaned up and always end in /
export const HERO_IMAGE_URL = `${PUBLIC_URL}/hero-user@1x.jpg`;
export const LOGO_IMAGE_URL = `${PUBLIC_URL}/logo.png`;

// Why?
// not sure actually, since we are using the RAW PUBLIC_URL for static data
// one reason is that localhost:3000 gets turned into localhost:3000/folder when returning from login
// TODO move the url constructors to packages/common
// TODO make this into utility function
// TODO this seems overly complex for what it should be
function getCleanPublicUrl() {
  const publicUrl = PUBLIC_URL;
  const hasPublicUrl = publicUrl !== "/" && publicUrl !== "";
  // Remove the endslash, so folder/ => folder
  const publicUrlNoSlash =
    publicUrl && hasPublicUrl ? publicUrl.replace(/\/$/, "") : "";
  // Add slash to the beginning so folder => /folder
  const cleanPublicUrl = publicUrlNoSlash.startsWith("/")
    ? publicUrlNoSlash
    : `/${publicUrlNoSlash}`;
  return cleanPublicUrl;
}

/// Returns href url for sign in dialog when given redirect url as parameter
/// @returns url to sign in dialog
/// TODO use the common version in urlBuilder.ts (missing the publicUrl option)
export function getSignInUrl(apiBaseUrl: string, callBackUrl: string): string {
  const authUrl = `${apiBaseUrl}/helauth/`;
  if (callBackUrl.includes(`/logout`)) {
    const baseUrl = new URL(callBackUrl).origin;
    const cleanPublicUrl = getCleanPublicUrl();
    return `${authUrl}login?next=${baseUrl}${cleanPublicUrl}`;
  }
  return `${authUrl}login?next=${callBackUrl}`;
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
