import { format, parseISO } from "date-fns";
import i18next from "i18next";
import {
  ApplicationEventSchedule,
  ApplicationStatus,
  LocalizationLanguages,
  TranslationObject,
} from "./types";

export const formatDate = (date: string | null): string | null => {
  return date ? format(parseISO(date), "d.M.yyyy") : null;
};

export const formatNumber = (
  input?: number | null,
  suffix?: string
): string => {
  if (!input) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix}`;
};

interface IFormatDurationOutput {
  hours: number;
  minutes: number;
}

export type StatusView = "review" | "handling";

export const formatDuration = (time: string): IFormatDurationOutput => {
  const [hours, minutes] = time.split(":");
  return {
    hours: Number(hours),
    minutes: Number(minutes),
  };
};

export const getNormalizedStatus = (
  status: ApplicationStatus,
  view: StatusView
): ApplicationStatus => {
  let normalizedStatus: ApplicationStatus = status;
  if (view === "review") {
    if (status === "in_review") {
      normalizedStatus = "review_done";
    }
  } else if (view === "handling") {
    if (["review_done", "in_review"].includes(status)) {
      normalizedStatus = "allocated";
    }
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

export const secondsToHms = (
  duration?: number
): { h?: number; m?: number; s?: number } => {
  if (!duration || duration < 0) return {};
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);

  return { h, m, s };
};

export const parseDuration = (duration?: number): string => {
  const hms = secondsToHms(duration);
  let output = "";

  if (hms.h) output += `${hms.h} ${i18next.t("common.hoursUnit")}`;
  if (hms.m) output += ` ${hms.m} ${i18next.t("common.minutesUnit")}`;

  return output.trim();
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
  name: TranslationObject | undefined,
  lang: string
): string => {
  if (!name) {
    return "???";
  }

  return name[lang as LocalizationLanguages] || "???";
};
