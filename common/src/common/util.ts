import {
  parseISO,
  startOfWeek as dateFnsStartOfWeek,
  endOfWeek as dateFnsEndOfWeek,
  format,
  isValid,
  isAfter,
} from "date-fns";
import { isNumber } from "lodash";
import { i18n } from "next-i18next";
import { HMS, Parameter } from "../../types/common";

export const parseDate = (date: string): Date => parseISO(date);

export const convertHMSToSeconds = (input: string): number | null => {
  const result = Number(new Date(`1970-01-01T${input}Z`).getTime() / 1000);
  return Number.isNaN(result) ? null : result;
};

export const startOfWeek = (d: Date): Date =>
  dateFnsStartOfWeek(d, { weekStartsOn: 1 });

export const endOfWeek = (d: Date): Date =>
  dateFnsEndOfWeek(d, { weekStartsOn: 1 });

export const secondsToHms = (
  duration: number | null
): HMS | Record<string, number> => {
  if (duration === null || duration < 0) return {};
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);

  return { h, m, s };
};

export const formatDuration = (
  duration: string,
  abbreviated = true
): string => {
  if (!duration || isNumber(duration) || !duration?.includes(":")) {
    return "-";
  }

  const hourKey = abbreviated ? "common:abbreviations.hour" : "common:hour";
  const minuteKey = abbreviated
    ? "common:abbreviations.minute"
    : "common:minute";

  const time = duration.split(":");
  if (time.length < 3) {
    return "-";
  }

  const hours = Number(time[0]);
  const minutes = Number(time[1]);

  return `${
    hours
      ? `${`${i18n?.t(hourKey, { count: hours }) || "".toLocaleLowerCase()}`} `
      : ""
  }${minutes ? i18n?.t(minuteKey, { count: minutes }) : ""}`.trim();
};

export const formatSecondDuration = (
  duration: number,
  abbreviated = true
): string => {
  if (!duration || !isNumber(duration)) {
    return "-";
  }

  const hms = secondsToHms(duration);
  return formatDuration(`${hms.h}:${hms.m}:${hms.s}`, abbreviated);
};

export const toApiDate = (date: Date, formatStr = "yyyy-MM-dd"): string => {
  return format(date, formatStr);
};

export const isValidDate = (date: Date): boolean =>
  isValid(date) && isAfter(date, new Date("1000-01-01"));

export const toUIDate = (date: Date, formatStr = "d.M.yyyy"): string => {
  if (!date || !isValidDate(date)) {
    return "";
  }
  return format(date, formatStr);
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, size + index));
    index += size;
  }

  return result;
};

export const sortAgeGroups = (ageGroups: Parameter[]): Parameter[] => {
  return ageGroups.sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.indexOf(strA) > -1 || order.indexOf(strB) > -1
      ? order.indexOf(strA) - order.indexOf(strB)
      : (a.minimum || 0) - (b.minimum || 0);
  });
};
