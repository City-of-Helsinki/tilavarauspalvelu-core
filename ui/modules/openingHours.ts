import { isWithinInterval } from "date-fns";
import { uniq } from "lodash";
import { i18n } from "next-i18next";
import { PeriodType, TimeSpanType } from "./gql-types";
import { toApiDate } from "./util";

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
): PeriodType | undefined =>
  openingTimePeriods?.find((openingTimePeriod) =>
    isWithinInterval(new Date(date), {
      start: new Date(openingTimePeriod.startDate),
      end: new Date(openingTimePeriod.endDate),
    })
  );

export const getActiveOpeningTimes = (
  openingTimePeriods?: PeriodType[]
): ActiveOpeningTime[] => {
  const result = [] as ActiveOpeningTime[];
  const activeOpeningTimePeriod = getActiveOpeningTimePeriod(
    openingTimePeriods,
    toApiDate(new Date())
  );
  const timeSpans = activeOpeningTimePeriod?.timeSpans?.filter((timeSpan) =>
    reservableStates.includes(timeSpan.resourceState)
  );
  const weekdays = uniq(
    timeSpans?.reduce((acc, timeSpan) => acc.concat(timeSpan.weekdays), [])
  ).sort();
  weekdays.forEach((weekday) => {
    const activeTimeSpans: TimeSpanType[] = timeSpans?.filter((n) =>
      n.weekdays.includes(weekday)
    );
    activeTimeSpans.forEach((timeSpan) => {
      result.push({
        day: weekday,
        label: i18n.t(`common:weekDay.${weekday}`),
        from: timeSpan.startTime,
        to: timeSpan.endTime,
      });
    });
  });

  return result;
};

export const getDayOpeningTimes = (
  openingTime: { label: string; from: string; to: string },
  index: number
): OpeningHourRow => {
  const { label } = openingTime;

  const from = openingTime.from.split(":");
  const fromDate = new Date();
  fromDate.setHours(Number(from[0]));
  fromDate.setMinutes(Number(from[1]));
  const fromStr = i18n.t("common:time", { date: fromDate });

  const to = openingTime.to.split(":");
  const toDate = new Date();
  toDate.setHours(Number(to[0]));
  toDate.setMinutes(Number(to[1]));
  const toStr = i18n.t("common:time", { date: toDate });

  return { label, value: `${fromStr} - ${toStr}`, index };
};
