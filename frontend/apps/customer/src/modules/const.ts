import type { TFunction } from "i18next";

export { isBrowser } from "ui/src/modules/helpers";
export { genericTermsVariant } from "ui/src/modules/const";

export const mapUrlPrefix = "https://palvelukartta.hel.fi/";

export const ANALYTICS_COOKIE_GROUP_NAME = "statistics";

// Poll other reservations when user is looking at the reservation calendar
export const BLOCKING_RESERVATIONS_POLL_INTERVAL_MS = 30 * 1000;
// Poll after webstore redirect to success to wait for backend webhook to be activated
export const WEBSTORE_SUCCESS_POLL_INTERVAL_MS = 500;
// Timeout webstore redirect if backend hasn't confirmed the reservation
export const WEBSTORE_SUCCESS_POLL_TIMEOUT_MS = 30 * 1000;

export const SEARCH_PAGING_LIMIT = 36;

type DurationOption = { label: string; value: number };
function durationMinuteOptions(t: TFunction) {
  const durations: DurationOption[] = [];
  let minute = 30; // no zero duration option, as all available reservations have a positive/non-zero duration
  while (minute <= 90) {
    durations.push({
      label: t("common:minute_other", { count: minute }),
      value: minute,
    });
    minute += 30;
  }
  return durations;
}

/// @returns an array of duration options in minutes
export function getDurationOptions(t: TFunction): DurationOption[] {
  const times: DurationOption[] = [];
  let hour = 2;
  let minute = 0;

  while (hour < 24) {
    times.push({
      label: t("common:hour_other", { count: hour + minute / 60 }),
      value: hour * 60 + minute,
    });
    minute += 30;
    // Reset the minute counter, and increment the hour counter if necessary
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }

  // we need to add the minute times to the beginning of the duration options
  return [...durationMinuteOptions(t), ...times];
}
