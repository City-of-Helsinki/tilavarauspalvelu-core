import { isAfter, parseISO, isBefore } from "date-fns";
import { i18n, TFunction } from "next-i18next";
import queryString from "query-string";
import { trim } from "lodash";
import { ApolloError } from "@apollo/client";
import { pixel } from "@/styles/util";
import {
  toApiDate,
  toUIDate,
  getTranslation,
  fromApiDate as fromAPIDate,
  fromUIDate,
} from "common/src/common/util";
import type {
  OptionType,
  ReducedApplicationStatus,
  ReservationUnitNode,
} from "common/types/common";
import {
  type ReservationUnitImageType,
  ApplicationStatusChoice,
  type AgeGroupType,
} from "common/types/gql-types";
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

// TODO don't use parseISO unless the function specifies that it only accepts dates as ISO strings
export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date().getTime();
  return (
    isAfter(now, parseISO(startDate).getTime()) &&
    isBefore(now, parseISO(endDate).getTime())
  );
};

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

export const getLabel = (
  parameter: ParameterType | AgeGroupType,
  lang: LocalizationLanguages = "fi"
): string => {
  if ("minimum" in parameter) {
    return `${parameter.minimum || ""} - ${parameter.maximum || ""}`;
  }
  if ("name" in parameter) {
    return parameter.name;
  }
  if (parameter.nameFi && lang === "fi") {
    return parameter.nameFi;
  }
  if (parameter.nameEn && lang === "en") {
    return parameter.nameEn;
  }
  if (parameter.nameSv && lang === "sv") {
    return parameter.nameSv;
  }
  if (parameter.nameFi) {
    return parameter.nameFi;
  }
  return "no label";
};

/// @deprecated - OptionType is dangerous, union types break type safety in comparisons
export const mapOptions = (
  src: ParameterType[] | AgeGroupType[],
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
): OptionType | undefined => {
  const selected = String(selectedId);
  const option = options.find((o) => String(o.value) === selected);
  return option;
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

export const searchUrl = (params: SearchParams): string => {
  const response = `${searchPrefix}/`;

  if (params && Object.keys(params).length > 0) {
    return `${response}?${queryString.stringify(params)}`;
  }

  return response;
};

export const singleSearchUrl = (params: SearchParams): string => {
  const response = `${singleSearchPrefix}/`;

  if (params && Object.keys(params).length > 0) {
    return `${response}?${queryString.stringify(params)}`;
  }

  return response;
};

export const applicationsUrl = `${applicationsPrefix}/`;
export const reservationsUrl = `${reservationsPrefix}/`;

export function deepCopy<T>(src: T): T {
  return JSON.parse(JSON.stringify(src));
}

export const apiDurationToMinutes = (duration: string): number => {
  if (!duration) {
    return 0;
  }
  const parts = duration.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
};

const imagePriority = ["main", "map", "ground_plan", "other"].map((n) =>
  n.toUpperCase()
);

export const getMainImage = (
  ru?: ReservationUnitNode
): ReservationUnitImageType | null => {
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

export const orderImages = (
  images: ReservationUnitImageType[]
): ReservationUnitImageType[] => {
  if (!images || images.length === 0) {
    return [];
  }
  const result = [...images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return result;
};

export const getAddressAlt = (ru: ReservationUnitNode): string | null => {
  const { location } = ru.unit || {};

  if (!location) {
    return null;
  }

  return trim(
    `${
      getTranslation(location, "addressStreet") ||
      location.addressStreetFi ||
      ""
    }, ${
      getTranslation(location, "addressCity") || location.addressCityFi || ""
    }`,
    ", "
  );
};

export const applicationUrl = (id: number): string => `/application/${id}`;

export const applicationErrorText = (
  t: TFunction,
  key: string | undefined,
  attrs: { [key: string]: string | number } = {}
): string => (key ? t(`application:error.${key}`, attrs) : "");

/// @deprecated TODO: remove this (it makes no sense anymore with the changes to the statuses)
// TODO all of these should return an unknown status if the status is not recognized or allowed
// not a null / undefined
export const getReducedApplicationStatus = (
  status?: ApplicationStatusChoice
): ReducedApplicationStatus | null => {
  switch (status) {
    case ApplicationStatusChoice.Received:
      return "processing";
    case ApplicationStatusChoice.Cancelled:
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Draft:
      return "draft";
    case ApplicationStatusChoice.InAllocation:
    case ApplicationStatusChoice.ResultsSent:
    case ApplicationStatusChoice.Handled:
      return "sent";
    default:
      return null;
  }
};

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

/// Always return an image because the Design and process should not allow imageless reservation units
/// On production returns the cached medium image url
/// On development we don't have image cache so we return the full image url
/// If image is null or undefined returns a static pixel
export function getImageSource(
  image: ReservationUnitImageType | null,
  size: "small" | "large" | "medium" | "full" = "medium"
): string {
  if (!image) {
    return pixel;
  }
  return getImageSourceWithoutDefault(image, size) || image?.imageUrl || pixel;
}

function getImageSourceWithoutDefault(
  image: ReservationUnitImageType,
  size: "small" | "large" | "medium" | "full"
): string | null {
  switch (size) {
    case "small":
      return image.smallUrl ?? null;
    case "large":
      return image.largeUrl ?? null;
    case "medium":
      return image.mediumUrl ?? null;
    case "full":
      return image.imageUrl ?? null;
    default:
      return null;
  }
}
