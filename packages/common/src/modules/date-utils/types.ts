import type { TFunction } from "next-i18next";
import type { LocalizationLanguages } from "../urlBuilder";

export type TimeStruct = {
  hours?: number | null;
  minutes?: number | null;
  seconds?: number | null;
};

export interface CommonDateOptions {
  t?: TFunction;
  locale?: LocalizationLanguages | "fi" | "sv" | "en";
}

export interface FormatDateOptions extends CommonDateOptions {
  includeWeekday?: boolean;
  showYear?: boolean;
}

export interface FormatDateTimeOptions extends CommonDateOptions {
  includeWeekday?: boolean;
  includeTimeSeparator?: boolean;
  showYear?: boolean;
}

export interface FormatDateRangeOptions extends FormatDateOptions {
  showEndDate?: boolean;
  showYear?: boolean;
}

export interface FormatDateTimeRangeOptions extends FormatDateTimeOptions {
  showEndDate?: boolean;
  showYear?: boolean;
}

export interface ApplicationReservationDateTime {
  date: Date;
  time: string;
  dayOfWeek: string;
  isModified: boolean;
}
