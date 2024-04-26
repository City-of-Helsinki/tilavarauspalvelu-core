import type { OptionType } from "common/types/common";
import type { TFunction } from "i18next";

export { isBrowser } from "common/src/helpers";
export { getSignInUrl, getSignOutUrl } from "common/src/urlBuilder";
export { genericTermsVariant } from "common/src/const";

export const reservationUnitPrefix = "/reservation-unit";
export const searchPrefix = "/search";
export const singleSearchPrefix = "/search/single";
export const applicationsPrefix = "/applications";
export const applicationPrefix = "/application";
export const applicationRoundPrefix = "/application_round";
export const reservationsPrefix = "/reservations";
export const criteriaPrefix = "/criteria";
export const parametersPrefix = "/parameters";

export const mapUrlPrefix = "https://palvelukartta.hel.fi/";

export const SEARCH_PAGING_LIMIT = 36;

export const reservationUnitPath = (id: number): string =>
  `${reservationUnitPrefix}/${id}`;

export const emptyOption = (
  label: string,
  value?: string | number | null
): OptionType => ({
  label,
  value: value != null ? value : undefined,
});

export const participantCountOptions = [
  1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200,
].map((v) => ({ label: `${v}`, value: v }));

export const DATE_TYPES = {
  TODAY: "today",
  TOMORROW: "tomorrow",
  WEEKEND: "weekend",
  THIS_WEEK: "this_week",
};

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
  return durationMinuteOptions(t).concat(times);
}

export const daysByMonths: Array<{ label: string; value: number }> = [
  { label: "2", value: 14 },
  { label: "1", value: 30 },
  { label: "2", value: 60 },
  { label: "3", value: 90 },
  { label: "6", value: 182 },
  { label: "12", value: 365 },
  { label: "24", value: 730 },
];

export const defaultDuration = "01:30:00";
export const defaultDurationMins = 90;

// TODO the validation needs to go to env.mjs because this reloads the page constantly
// TODO we should default to this host if the env variable is not set
// allowing us to host the api and the frontend on the same host without rebuilding the Docker container
// possible problem: SSR requires absolute url for the api (so get the host url?)
/* TODO add checks back probably to env.mjs
if (!isBrowser && !env.SKIP_ENV_VALIDATION) {
  // Don't check validity because it should default to same address (both host + port)
  // this could be a transformation on the base value in env.mjs and a warning
  // throwing here because we'd have to fix all baseurls
  if (
    apiBaseUrl != null &&
    (apiBaseUrl.match("localhost") || apiBaseUrl.match("127.0.0.1")) &&
    apiBaseUrl.startsWith("https://")
  ) {
    throw new Error(
      "NEXT_PUBLIC_TILAVARAUS_API_URL is not valid, don't use SSL (https) when using localhost"
    );
  }
}
*/
