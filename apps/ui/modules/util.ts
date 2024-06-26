import { parseISO } from "date-fns";
import { i18n, TFunction } from "next-i18next";
import queryString from "query-string";
import { trim } from "lodash";
import type { ApolloError } from "@apollo/client";
import type { OptionType } from "common";
import {
  toApiDate,
  toUIDate,
  getTranslation,
  fromApiDate as fromAPIDate,
  fromUIDate,
} from "common/src/common/util";
import type {
  AgeGroupNode,
  ImageFragment,
  LocationFieldsI18nFragment,
} from "@gql/gql-types";
import {
  searchPrefix,
  applicationsPrefix,
  singleSearchPrefix,
  reservationsPrefix,
  isBrowser,
} from "./const";
import type { LocalizationLanguages } from "common/src/helpers";

export { formatDuration } from "common/src/common/util";
export { fromAPIDate, fromUIDate };
export { getTranslation };

// TODO why? where is this used? why not use toUIDate(new Date(string))
// TODO why return "-" instead of null or ""?
export const formatDate = (date: string, formatStr?: string): string => {
  if (!date) {
    return "-";
  }
  return toUIDate(parseISO(date), formatStr);
};

// Takes a date string in format "yyyy-MM-dd" and returns a string in format "d.M.yyyy"
// @deprecated just use the separate functions
export const apiDateToUIDate = (date: string): string => {
  const d = fromAPIDate(date);
  return d ? toUIDate(d) : "";
};

export const uiDateToApiDate = (date: string): string | null => {
  // TODO this is awful (unspecified special case) but there is probably a use case that depends on it
  if (!date.includes(".")) {
    return date;
  }
  const d = fromUIDate(date);
  if (!d) {
    return null;
  }
  return toApiDate(d);
};

// @deprecated use toApiDate(new Date(string))
export const formatApiDate = (date: string): string | null => {
  if (!date) {
    return null;
  }
  return toApiDate(parseISO(date));
};

export const capitalize = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

type ParameterType =
  | {
      pk: number;
      nameFi: string;
      nameEn?: string;
      nameSv?: string;
    }
  | { pk: number; name: string };

function getLabel(
  parameter:
    | ParameterType
    | { minimum?: number | null; maximum?: number | null },
  lang: LocalizationLanguages = "fi"
): string {
  if ("minimum" in parameter) {
    return `${parameter.minimum || ""} - ${parameter.maximum || ""}`;
  }
  if ("name" in parameter) {
    return parameter.name;
  }
  if ("nameEn" in parameter && parameter.nameEn != null && lang === "en") {
    return parameter.nameEn;
  }
  if ("nameSv" in parameter && parameter.nameSv != null && lang === "sv") {
    return parameter.nameSv;
  }
  if ("nameFi" in parameter) {
    return parameter.nameFi;
  }
  return "no label";
}

export { getLabel as getParameterLabel };

/// @deprecated - OptionType is dangerous, union types break type safety in comparisons
export const mapOptions = (
  src: ParameterType[] | AgeGroupNode[],
  emptyOptionLabel?: string,
  lang: LocalizationLanguages = "fi"
): OptionType[] => {
  const r: OptionType[] = [
    ...(emptyOptionLabel ? [{ label: emptyOptionLabel, value: 0 }] : []),
    ...src.map((v) => ({
      label: getLabel(v, lang),
      value: v.pk ?? 0,
    })),
  ];
  return r;
};

export const getSelectedOption = (
  selectedId: number | string | null,
  options: OptionType[]
): OptionType | null => {
  const selected = String(selectedId);
  const option = options.find((o) => String(o.value) === selected);
  return option ?? null;
};

export const getComboboxValues = (
  value: string,
  options: OptionType[]
): OptionType[] => {
  if (value.length === 0) {
    return [];
  }
  if (value.includes(",")) {
    return value
      .split(",")
      .map((unit) => getSelectedOption(unit, options))
      .filter((x): x is OptionType => x != null);
  }
  const val = getSelectedOption(value, options);
  if (val) {
    return [val];
  }
  return [];
};

type SearchParams = Record<
  string,
  string | (string | null)[] | number | boolean | null
>;

// @deprecated, todo rewrite a getSearcSeasonalhUrl function
// or alternatively remove the use of query-string
export const searchUrl = (params: SearchParams): string => {
  const response = `${searchPrefix}/`;

  if (params && Object.keys(params).length > 0) {
    return `${response}?${queryString.stringify(params)}`;
  }

  return response;
};

// @deprecated, todo rewrite a getSingleSearchUrl function
// or alternatively remove the use of query-string
export const singleSearchUrl = (params?: SearchParams): string => {
  const response = `${singleSearchPrefix}/`;

  if (params && Object.keys(params).length > 0) {
    return `${response}?${queryString.stringify(params)}`;
  }

  return response;
};

export const applicationsUrl = `${applicationsPrefix}/`;
export const reservationsUrl = `${reservationsPrefix}/`;

const imagePriority = ["main", "map", "ground_plan", "other"].map((n) =>
  n.toUpperCase()
);

export const getMainImage = (ru?: {
  images: ImageFragment[];
}): ImageFragment | null => {
  if (!ru || !ru.images || ru.images.length === 0) {
    return null;
  }
  const images = [...ru.images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return images[0];
};

export function orderImages(images: ImageFragment[]): ImageFragment[] {
  if (!images || images.length === 0) {
    return [];
  }
  const result = [...images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return result;
}

export const getAddressAlt = (ru: {
  unit?: {
    location?: LocationFieldsI18nFragment | null;
  } | null;
}): string | null => {
  const { location } = ru.unit || {};

  if (!location) {
    return null;
  }

  const street =
    getTranslation(location, "addressStreet") || location.addressStreetFi || "";
  const city =
    getTranslation(location, "addressCity") || location.addressCityFi || "";
  return trim(`${street}, ${city}`, ", ");
};

export const applicationUrl = (id: number): string => `/application/${id}`;

export const applicationErrorText = (
  t: TFunction,
  key: string | undefined,
  attrs: { [key: string]: string | number } = {}
): string => (key ? t(`application:error.${key}`, attrs) : "");

export const getReadableList = (list: string[]): string => {
  if (list.length === 0) {
    return "";
  }

  const andStr = i18n?.t("common:and") || "";

  if (list.length < 3) {
    return list.join(` ${andStr} `);
  }

  return `${list.slice(0, -1).join(", ")} ${andStr} ${list[list.length - 1]}`;
};

export const printErrorMessages = (error: ApolloError): string => {
  if (!error.graphQLErrors || error.graphQLErrors.length === 0) {
    return "";
  }

  const { graphQLErrors: errors } = error;

  // TODO add this case "No Reservation matches the given query."
  // at least happens when mutating a reservation that doesn't exist
  return errors
    .reduce((acc, cur) => {
      const code = cur?.extensions?.error_code
        ? // eslint-disable-next-line @typescript-eslint/no-base-to-string -- FIXME
          i18n?.t(`errors:${cur?.extensions?.error_code}`)
        : "";
      const message =
        code === cur?.extensions?.error_code || !cur?.extensions?.error_code
          ? i18n?.t("errors:general_error")
          : code || "";
      return message ? `${acc}${message}\n` : acc; /// contains non-breaking space
    }, "")
    .trim();
};

export const isTouchDevice = (): boolean =>
  isBrowser && window?.matchMedia("(any-hover: none)").matches;

export const getPostLoginUrl = () => {
  if (!isBrowser) {
    return undefined;
  }
  const { origin, pathname, searchParams } = new URL(window.location.href);
  const params = new URLSearchParams(searchParams);
  params.set("isPostLogin", "true");
  return `${origin}${pathname}?${params.toString()}`;
};

// TODO move to common and combine with admin (requires i18n changes: replace messages.ts with json)
export function formatTimeRange(
  t: TFunction,
  beginDate: Date,
  endDate: Date
): string {
  const beginTime = t("common:timeWithPrefixInForm", { date: beginDate });
  const endTime = t("common:timeInForm", { date: endDate });
  return `${beginTime}–${endTime}`;
}
export function formatDateTimeRange(
  t: TFunction,
  begin: Date,
  end: Date
): string {
  const beginDate = t("common:dateWithWeekday", { date: begin });
  const beginTime = t("common:timeWithPrefixInForm", { date: begin });
  const endDate = t("common:dateWithWeekday", { date: end });
  const endTime = t("common:timeInForm", { date: end });

  return trim(
    `${beginDate} ${beginTime}–${
      endDate !== beginDate ? endDate : ""
    }${endTime}`,
    " – "
  );
}
export function formatDateTime(t: TFunction, date: Date): string {
  const dateStr = t("common:dateWithWeekday", {
    date,
  });
  const timeStr = t("common:time", {
    date,
  });
  return `${dateStr} ${timeStr}`;
}
