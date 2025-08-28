export type TimeStruct = {
  hours: number;
  minutes?: number;
};

export type DateFormatOptions = {
  includeWeekday?: boolean;
  locale?: string;
  trailingMinutes?: boolean;
};

export type DateTimeRangeFormatOptions = {
  includeWeekday?: boolean;
  showEndDate?: boolean;
  trailingMinutes?: boolean;
};

export type Maybe<T> = T | null | undefined;
