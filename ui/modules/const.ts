import { i18n } from "next-i18next";
import getConfig from "next/config";
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

export const emptyOption = (label: string): OptionType => ({
  label,
  value: undefined,
});

export const participantCountOptions = [
  1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200,
].map((v) => ({ label: `${v}`, value: v } as OptionType));

export const DATE_TYPES = {
  TODAY: "today",
  TOMORROW: "tomorrow",
  WEEKEND: "weekend",
  THIS_WEEK: "this_week",
};

const option = (label: string, value: string): OptionType => {
  return { label, value };
};

const formatNumber = (n: number): string => `00${n}`.slice(-2);

export const getDurationOptions = (): OptionType[] => {
  const result = [] as OptionType[];
  let h = 1;
  let m = 30;
  for (let i = 0; i < 35; i += 1) {
    result.push(
      option(
        `${i18n.t("common:abbreviations.hour", { count: h })} ${
          m ? `${i18n.t("common:abbreviations.minute", { count: m })}` : ""
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

export const isBrowser = typeof window !== "undefined";

export const PROFILE_TOKEN_HEADER = "X-Authorization";

export const SESSION_EXPIRED_ERROR = "JWT too old";

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export const {
  cookiehubEnabled,
  matomoEnabled,
  hotjarEnabled,
  mockRequests,
  mapboxToken,
  baseUrl,
} = publicRuntimeConfig;

export const apiBaseUrl = isBrowser
  ? publicRuntimeConfig.apiBaseUrl
  : serverRuntimeConfig.apiBaseUrl;
export const authEnabled = isBrowser
  ? publicRuntimeConfig.authEnabled
  : serverRuntimeConfig.authEnabled;

export const authenticationIssuer = "tunnistamo";
export const authenticationApiRoute = "/api/auth";
export const authenticationLogoutApiRoute = "/api/auth/logout";
