import { i18n } from "next-i18next";
import { OptionType } from "common/types/common";
import { MapboxStyle } from "react-map-gl";

export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const reservationUnitPrefix = "/reservation-unit";
export const searchPrefix = "/search";
export const singleSearchPrefix = "/search/single";
export const applicationsPrefix = "/applications";
export const applicationPrefix = "/application";
export const applicationRoundPrefix = "/application_round";
export const reservationsPrefix = "/reservations";
export const criteriaPrefix = "/criteria";
export const parametersPrefix = "/parameters";

export const mapStyle: MapboxStyle = {
  version: 8,
  name: "hel-osm-light",
  metadata: {},
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tiles.hel.ninja/styles/hel-osm-light/{z}/{x}/{y}.png"],
      minzoom: 0,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

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
].map((v) => ({ label: `${v}`, value: v }) as OptionType);

export const DATE_TYPES = {
  TODAY: "today",
  TOMORROW: "tomorrow",
  WEEKEND: "weekend",
  THIS_WEEK: "this_week",
};

/// @return options array with value in seconds
// TODO use of i18n.t is bad (loading of translations)
export const getDurationNumberOptions = (): Array<{
  label: string;
  value: number;
}> => {
  const result: Array<{ label: string; value: number }> = [];
  let h = 1;
  let m = 0;
  // why are we doing till 45?
  for (let i = 0; i < 45; i += 1) {
    const label = `${i18n?.t("common:abbreviations.hour", { count: h })} ${
      m ? `${i18n?.t("common:abbreviations.minute", { count: m })}` : ""
    }`;
    result.push({ label, value: (h * 60 + m) * 60 });
    m += 15;
    if (m === 60) {
      m = 0;
      h += 1;
    }
  }

  return result;
};

const option = (label: string, value: string): OptionType => {
  return { label, value };
};

const formatNumber = (n: number): string => `00${n}`.slice(-2);

export const getDurationOptions = (): OptionType[] => {
  const result: OptionType[] = [];
  let h = 1;
  let m = 0;
  for (let i = 0; i < 45; i += 1) {
    result.push(
      option(
        `${i18n?.t("common:abbreviations.hour", { count: h })} ${
          m ? `${i18n?.t("common:abbreviations.minute", { count: m })}` : ""
        }`,
        `${formatNumber(h)}:${formatNumber(m)}:00`
      )
    );
    m += 15;
    if (m === 60) {
      m = 0;
      h += 1;
    }
  }

  return result;
};

export const daysByMonths: OptionType[] = [
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

export const isBrowser = typeof window !== "undefined";

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

// Returns href url for sign in dialog when given redirect url as parameter
// @param callBackUrl - url to redirect after successful login
// @param originOverride - when behind a gateway on a server the url.origin is incorrect
export const getSignInUrl = (
  apiBaseUrl: string,
  callBackUrl: string,
  originOverride?: string
): string => {
  const authUrl = `${apiBaseUrl}/helauth`;
  // TODO why is originOveride only used when on logout?
  if (callBackUrl.includes(`/logout`)) {
    const baseUrl =
      originOverride != null ? originOverride : new URL(callBackUrl).origin;
    return `${authUrl}/login?next=${baseUrl}`;
  }
  return `${authUrl}/login?next=${callBackUrl}`;
};

// Returns href url for logging out with redirect url to /logout
export const getSignOutUrl = (apiBaseUrl: string): string => {
  const authUrl = `${apiBaseUrl}/helauth`;
  return `${authUrl}/logout`;
};

export const genericTermsVariant = {
  BOOKING: "booking",
  SERVICE: "service",
  PRIVACY: "privacy",
  ACCESSIBILITY: "accessibility",
};
