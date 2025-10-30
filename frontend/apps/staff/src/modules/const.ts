import { env } from "@/env.mjs";
import { ApplicationStatusChoice } from "@gql/gql-types";
export { isBrowser } from "ui/src/modules/helpers";
export { getSignOutUrl } from "ui/src/modules/urlBuilder";

export const PUBLIC_URL = env.NEXT_PUBLIC_BASE_URL ?? "";

export const LIST_PAGE_SIZE = 50;
export const LARGE_LIST_PAGE_SIZE = 100;

export const ALLOCATION_CALENDAR_TIMES = [7, 23] as const;

export const NUMBER_OF_DECIMALS = 6;

/// Poll updates to application sections on the allocation page (in milliseconds), 0 to disable.
/// Why use this? if there are multiple users working on the same allocation, they will see updates.
/// If you are testing, you can use multiple tabs / browsers to see the updates.
/// Reason to disable (especially in production): the allocations queries are heavy and may cause performance issues.
/// TODO if this is left enabled it should be moved to env (so we can disable without recompiling).
/// NOTE seems to work fine without backoff logic (the next query is run after the previous one is finished)
/// better solution would be to use subscriptions (i.e. drive updates from the backend).
export const ALLOCATION_POLL_INTERVAL = 20000;

// This is a backend (or library) limit based on testing
export const GQL_MAX_RESULTS_PER_QUERY = 100;

// truncate names when they are printed to table cells (placeholder / default)
export const MAX_NAME_LENGTH = 22;
export const MAX_UNIT_NAME_LENGTH = 40;
export const MAX_APPLICATION_ROUND_NAME_LENGTH = 30;
export const MAX_ALLOCATION_CARD_UNIT_NAME_LENGTH = 31;

// TODO PUBLIC_URL should be cleaned up and always end in /
export const HERO_IMAGE_URL = `${PUBLIC_URL}/hero-user@1x.jpg`;

export const VALID_ALLOCATION_APPLICATION_STATUSES = [
  ApplicationStatusChoice.Received,
  ApplicationStatusChoice.InAllocation,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.ResultsSent,
];

export const NOT_FOUND_SSR_VALUE = {
  notFound: true,
  props: {
    notFound: true,
  },
};
