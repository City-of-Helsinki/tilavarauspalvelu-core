import type { TFunction } from "next-i18next";
import type { LocalizationLanguages } from "../urlBuilder";

export type TimeStruct = {
  hours: number;
  minutes?: number;
};

export interface CommonDateOptions {
  t?: TFunction;
  locale?: LocalizationLanguages | "fi" | "sv" | "en";
  formatString?: string;
}

export interface FormatTimeOptions extends CommonDateOptions {
  includeTimeSeparator?: boolean;
}

export interface FormatDateOptions extends CommonDateOptions {
  includeWeekday?: boolean;
}

export interface FormatDateTimeOptions extends CommonDateOptions {
  includeWeekday?: boolean;
  includeTimeSeparator?: boolean;
}

export interface FormatDateTimeRangeOptions extends FormatDateTimeOptions {
  showEndDate?: boolean;
}
