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
): PeriodType | undefined => {
  return openingTimePeriods?.find((openingTimePeriod) => {
    const startDate = new Date(openingTimePeriod.startDate);
    const endDate = new Date(openingTimePeriod.endDate);
    return (
      isWithinInterval(new Date(date), {
        start: startDate,
        end: endDate,
      }) ||
      ((openingTimePeriod.startDate === null || toApiDate(startDate) <= date) &&
        (openingTimePeriod.endDate === null || toApiDate(endDate) >= date))
    );
  });
};

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
  const { label, from, to } = openingTime;
  const [fromHours, fromMinutes] = from.split(":").map(Number);
  const [toHours, toMinutes] = to.split(":").map(Number);

  const fromDate = new Date();
  fromDate.setUTCHours(fromHours, fromMinutes);
  const fromStr = i18n.t("common:time", { date: fromDate });

  const toDate = new Date();
  toDate.setUTCHours(toHours, toMinutes);
  const toStr = i18n.t("common:time", { date: toDate });

  return { label, value: `${fromStr} - ${toStr}`, index };
};
