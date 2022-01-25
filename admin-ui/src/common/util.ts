import { format, parseISO } from "date-fns";
import i18next from "i18next";
import trim from "lodash/trim";
import upperFirst from "lodash/upperFirst";
import get from "lodash/get";
import {
  AllocationResult,
  ApplicationEventSchedule,
  ApplicationEventStatus,
  ApplicationRound,
  ApplicationRoundStatus,
  ApplicationStatus,
  DataFilterOption,
  LocalizationLanguages,
  Location,
  NormalizedApplicationRoundStatus,
  TranslationObject,
} from "./types";
import { LocationType } from "./gql-types";

export const formatDate = (
  date: string | null,
  outputFormat = "d.M.yyyy"
): string | null => {
  return date ? format(parseISO(date), outputFormat) : null;
};

export const formatTime = (
  date: string | null,
  outputFormat = "HH.mm"
): string | null => {
  return date ? format(parseISO(date), outputFormat) : null;
};

export const formatNumber = (
  input?: number | null,
  suffix?: string
): string => {
  if (input === null || input === undefined) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix || ""}`;
};

interface IFormatDurationOutput {
  hours: number;
  minutes: number;
}

export type ApplicationRoundStatusView = "listing";

export const formatDuration = (time: string): IFormatDurationOutput => {
  const [hours, minutes] = time.split(":");
  return {
    hours: Number(hours),
    minutes: Number(minutes),
  };
};

export const getNormalizedApplicationStatus = (
  status: ApplicationStatus,
  view: ApplicationRoundStatus
): ApplicationStatus => {
  let normalizedStatus: ApplicationStatus = status;
  if (["draft", "in_review", "allocated"].includes(view)) {
    if (status === "in_review") {
      normalizedStatus = "review_done";
    }
  } else if (view === "approved") {
    if (["in_review", "review_done"].includes(normalizedStatus)) {
      normalizedStatus = "approved";
    }
  }

  return normalizedStatus;
};

export const getNormalizedApplicationEventStatus = (
  status: ApplicationEventStatus,
  accepted?: boolean
): ApplicationEventStatus => {
  let normalizedStatus: ApplicationEventStatus = status;

  if (accepted) {
    normalizedStatus = "validated";
  } else if (["created", "allocating", "allocated"].includes(status)) {
    normalizedStatus = "created";
  }

  return normalizedStatus;
};

export const normalizeApplicationEventStatus = (
  allocationResult: AllocationResult
): ApplicationEventStatus => {
  let { status } = allocationResult.applicationEvent;

  if (
    allocationResult.allocatedReservationUnitId &&
    allocationResult.applicationEvent.declinedReservationUnitIds.includes(
      allocationResult.allocatedReservationUnitId
    )
  ) {
    status = "ignored";
  } else if (allocationResult.declined) {
    status = "declined";
  } else if (allocationResult.accepted) {
    status = "validated";
  }
  return status;
};

export const getNormalizedApplicationRoundStatus = (
  applicationRound: ApplicationRound
): ApplicationRoundStatus | NormalizedApplicationRoundStatus => {
  let normalizedStatus: NormalizedApplicationRoundStatus;

  if (
    ["in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status
    )
  ) {
    normalizedStatus = "handling";
  } else if (
    ["approved"].includes(applicationRound.status) &&
    applicationRound.applicationsSent
  ) {
    normalizedStatus = "sent";
  } else {
    normalizedStatus = applicationRound.status;
  }

  return normalizedStatus;
};

export const parseApplicationEventSchedules = (
  applicationEventSchedules: ApplicationEventSchedule[],
  index: number
): string => {
  return (
    applicationEventSchedules
      .filter((s) => s.day === index)
      .reduce((acc: string, cur: ApplicationEventSchedule) => {
        let begin = cur.begin.substring(0, 5);
        const end = cur.end.substring(0, 5);
        let prev = acc;
        let rangeChar = " - ";
        let divider = prev.length ? ", " : "";
        if (acc.endsWith(begin)) {
          begin = "";
          prev = `${prev.slice(0, -5)}`;
          rangeChar = "";
          divider = "";
        }
        return `${prev}${divider}${begin}${rangeChar}${end}`;
      }, "") || "-"
  );
};

interface HMS {
  h?: number;
  m?: number;
  s?: number;
}

export const secondsToHms = (duration?: number | null): HMS => {
  if (!duration || duration < 0) return {};
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);

  return { h, m, s };
};

export const parseDuration = (
  duration: number | null | undefined,
  unitFormat?: "long"
): string => {
  const hms = secondsToHms(duration);
  let hoursUnit: string;
  let minutesUnit: string;
  let output = "";

  switch (unitFormat) {
    case "long":
      hoursUnit = "common.hoursUnitLong";
      minutesUnit = "common.minutesUnitLong";
      break;
    default:
      hoursUnit = "common.hoursUnit";
      minutesUnit = "common.minutesUnit";
  }
  if (hms.h) output += `${i18next.t(hoursUnit, { count: hms.h })} `;
  if (hms.m) output += `${i18next.t(minutesUnit, { count: hms.m })}`;

  return output.trim();
};

export const convertHMSToSeconds = (input: string): number | null => {
  const result = Number(new Date(`1970-01-01T${input}Z`).getTime() / 1000);
  return Number.isNaN(result) ? null : result;
};

export const convertHMSToHours = (input: HMS): number => {
  if (!input.h) return 0;
  const hours = input.h;
  const hourFractions = input.m ? input.m / 60 : 0;
  return hours + hourFractions;
};

export const formatTimeDistance = (
  timeStart: string,
  timeEnd: string
): number | undefined => {
  const startArr = timeStart.split(":");
  const endArr = timeEnd.split(":");

  if ([...startArr, ...endArr].some((n) => !Number.isInteger(Number(n)))) {
    return undefined;
  }

  const startDate = new Date(
    1,
    1,
    1970,
    Number(startArr[0]),
    Number(startArr[1]),
    Number(startArr[2])
  );
  const endDate = new Date(
    1,
    1,
    1970,
    Number(endArr[0]),
    Number(endArr[1]),
    Number(endArr[2])
  );

  return Math.abs(endDate.getTime() - startDate.getTime()) / 1000;
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
};

export const localizedValue = (
  name: TranslationObject | string | undefined,
  lang: string
): string => {
  if (!name) {
    return "???";
  }
  if (typeof name === "string") {
    return name;
  }

  return name[lang as LocalizationLanguages] || "???";
};

export const localizedPropValue = (
  // eslint-disable-next-line
  o: any,
  propName: string,
  lang: string
): string => {
  return get(o, `${propName}${upperFirst(lang)}`, "???");
};

interface IAgeGroups {
  minimum?: number;
  maximum?: number;
}

export const parseAgeGroups = (ageGroups: IAgeGroups): string => {
  return `${i18next.t("common.agesSuffix", {
    range: trim(`${ageGroups.minimum || ""}-${ageGroups.maximum || ""}`, "-"),
  })}`;
};

export const parseAddress = (location: Location | LocationType): string => {
  return trim(
    `${
      (location as Location).addressStreet ||
      (location as LocationType).addressStreetFi ||
      ""
    }, ${(location as Location).addressZip || ""} ${
      (location as Location).addressCity ||
      (location as LocationType).addressCityFi ||
      ""
    }`,
    ", "
  );
};

export const isTranslationObject = (value: unknown): boolean => {
  return (
    typeof value === "object" &&
    value !== null &&
    ({}.propertyIsEnumerable.call(value, "fi") ||
      {}.propertyIsEnumerable.call(value, "en") ||
      {}.propertyIsEnumerable.call(value, "sv"))
  );
};

export const parseAddressLine1 = (
  location: Location | LocationType
): string => {
  return trim(
    `${
      (location as Location).addressStreet ||
      (location as LocationType).addressStreetFi ||
      ""
    }`
  );
};

export const parseAddressLine2 = (
  location: Location | LocationType
): string => {
  return trim(
    `${location.addressZip || ""} ${
      (location as Location).addressCity ||
      (location as LocationType).addressCityFi ||
      ""
    }`
  );
};

export const filterData = <T>(data: T[], filters: DataFilterOption[]): T[] => {
  return data.filter(
    (row) =>
      filters.filter((filter) => get(row, filter.key) === filter.value)
        .length === filters.length
  );
};
