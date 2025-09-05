import type { TFunction } from "next-i18next";
import type { LocalizationLanguages } from "../urlBuilder";

export type TimeStruct = {
  hours?: number;
  minutes?: number;
  seconds?: number;
};

export interface CommonDateOptions {
  t?: TFunction;
  locale?: LocalizationLanguages | "fi" | "sv" | "en";
  formatString?: string;
}

export interface FormatDateOptions extends CommonDateOptions {
  includeWeekday?: boolean;
}

export interface FormatDateTimeOptions extends CommonDateOptions {
  includeWeekday?: boolean;
  includeTimeSeparator?: boolean;
}

export interface FormatDateRangeOptions extends FormatDateOptions {
  showEndDate?: boolean;
}

export interface FormatDateTimeRangeOptions extends FormatDateTimeOptions {
  showEndDate?: boolean;
}

export interface ReservationDateTime {
  date: Date;
  time: string;
  dayOfWeek: string;
  isModified: boolean;
}
