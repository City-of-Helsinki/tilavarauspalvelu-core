import { isWithinInterval } from "date-fns";
import { uniq } from "lodash";
import { i18n } from "next-i18next";
import { toApiDate } from "common/src/common/util";
import { PeriodType, TimeSpanType } from "common/types/gql-types";

export type ActiveOpeningTime = {
  day: number;
  label: string;
  from: string;
  to: string;
};

export type OpeningHourRow = {
  label: string;
  value: string | number;
  index: number;
};

const reservableStates = ["open"];

export const getActiveOpeningTimePeriod = (
  openingTimePeriods: PeriodType[],
  date: string
): PeriodType | undefined => {
  return openingTimePeriods?.find((openingTimePeriod) => {
    const start = openingTimePeriod.startDate ?? null
    const end = openingTimePeriod.endDate ?? null
    if (start == null || end == null) {
      return false;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      isWithinInterval(new Date(date), {
        start: startDate,
        end: endDate,
      })) {
      return true;
    }

    return startDate <= new Date(date) && endDate >= new Date(date)
  });
};

export const getActiveOpeningTimes = (
  openingTimePeriods?: PeriodType[]
): ActiveOpeningTime[] => {
  const result = [] as ActiveOpeningTime[];
  const openingTimes = openingTimePeriods ?? [];
  const apiDate = toApiDate(new Date());
  const activeOpeningTimePeriod = apiDate != null ? getActiveOpeningTimePeriod(openingTimes, apiDate) : undefined;

  const timeSpans = activeOpeningTimePeriod?.timeSpans?.filter((ts) =>
    ts?.resourceState != null && reservableStates.includes(ts.resourceState)
  ).filter((ts): ts is TimeSpanType => ts != null) ?? [];
  const weekdays = uniq(
    timeSpans?.reduce<number[]>((acc, timeSpan) => ([
      ...acc,
      ...(timeSpan.weekdays != null ? timeSpan.weekdays.filter((d): d is number => d != null) : []),
    ]), [])
  ).sort();
  weekdays.forEach((weekday) => {
    const activeTimeSpans: TimeSpanType[] = timeSpans?.filter((n) =>
      n.weekdays != null && n.weekdays.includes(weekday)
    );
    activeTimeSpans.forEach((timeSpan) => {
      result.push({
        day: weekday,
        label: i18n?.t(`common:weekDay.${weekday}`) ?? "",
        from: timeSpan.startTime ?? "",
        to: timeSpan.endTime ?? "",
      });
    });
  });

  return result;
};

export const getDayOpeningTimes = (
  openingTime: { label: string; from: string; to: string },
  index: number
): OpeningHourRow => {
  const { label, from, to } = openingTime;
  const [fromHours, fromMinutes] = from.split(":").map(Number);
  const [toHours, toMinutes] = to.split(":").map(Number);

  const fromDate = new Date();
  fromDate.setUTCHours(fromHours, fromMinutes);
  const fromStr = i18n?.t("common:time", { date: fromDate });

  const toDate = new Date();
  toDate.setUTCHours(toHours, toMinutes);
  const toStr = i18n?.t("common:time", { date: toDate });

  return { label, value: `${fromStr} - ${toStr}`, index };
};
