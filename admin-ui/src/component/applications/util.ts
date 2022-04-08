import { differenceInWeeks } from "date-fns";
import { isEqual, sum, trim } from "lodash";
import { TFunction } from "react-i18next";
import {
  Application,
  ApplicationEvent,
  ApplicationRoundStatus,
  ApplicationStatus,
} from "../../common/types";
import { formatDuration } from "../../common/util";

export const applicantName = (
  application: Application | null
): string | null | undefined =>
  application?.applicantType === "individual"
    ? application?.applicantName
    : application?.organisation?.name;

export const getApplicationStatusColor = (
  status: ApplicationStatus,
  size: "s" | "l"
): string => {
  let color = "";
  switch (status) {
    case "draft":
    case "in_review":
      color = "var(--color-info)";
      break;
    case "review_done":
      color = "var(--color-success)";
      break;
    case "approved":
    case "sent":
      color = "var(--color-white)";
      break;
    case "declined":
    case "cancelled":
      switch (size) {
        case "s":
          color = "var(--color-error)";
          break;
        case "l":
        default:
          color = "var(--color-error-dark)";
      }
      break;
    default:
  }

  return color;
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

export const numTurns = (
  startDate: string,
  endDate: string,
  biWeekly: boolean,
  eventsPerWeek: number
): number =>
  (differenceInWeeks(new Date(endDate), new Date(startDate)) /
    (biWeekly ? 2 : 1)) *
  eventsPerWeek;

export const apiDurationToMinutes = (duration: string): number => {
  if (!duration) {
    return 0;
  }
  const parts = duration.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
};

export const appEventHours = (
  startDate: string,
  endDate: string,
  biWeekly: boolean,
  eventsPerWeek: number,
  minDuration: string
): number => {
  const turns = numTurns(startDate, endDate, biWeekly, eventsPerWeek);

  const hours =
    (turns * eventsPerWeek * apiDurationToMinutes(minDuration)) / 60;
  return hours;
};

export const applicationHours = (application: Application): number =>
  sum(
    application.applicationEvents.map((ae) =>
      appEventHours(
        ae.begin as string,
        ae.end as string,
        ae.biweekly,
        ae.eventsPerWeek,
        ae.minDuration as string
      )
    )
  );

export const applicationTurns = (application: Application): number =>
  sum(
    application.applicationEvents.map((ae) =>
      numTurns(
        ae.begin as string,
        ae.end as string,
        ae.biweekly,
        ae.eventsPerWeek
      )
    )
  );

const parseDuration = (
  duration: string | null,
  t: TFunction,
  type?: "min" | "max"
): string => {
  if (!duration) return "";
  const durationObj = formatDuration(duration);
  const translationKey = `common.${type}Amount`;
  let result = "";
  result += `${type ? t(translationKey) : ""} ${
    durationObj.hours && durationObj.hours + t("common.hoursUnit")
  }`;
  if (durationObj.minutes) {
    result += ` ${durationObj.minutes + t("common.minutesUnit")}`;
  }
  return result;
};

export const appEventDuration = (
  applicationEvent: ApplicationEvent,
  t: TFunction
): string => {
  let duration = "";
  if (isEqual(applicationEvent.minDuration, applicationEvent.maxDuration)) {
    duration += parseDuration(applicationEvent.minDuration, t);
  } else {
    duration += parseDuration(applicationEvent?.minDuration, t, "min");
    duration += `, ${parseDuration(applicationEvent?.maxDuration, t, "max")}`;
  }
  return trim(duration, ", ");
};
