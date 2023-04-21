import { differenceInWeeks } from "date-fns";
import { sum } from "lodash";
import { ApplicationType } from "common/types/gql-types";
import {
  Application,
  ApplicationRoundStatus,
  ApplicationStatus,
} from "../../common/types";

export const applicantName = (app: Application | ApplicationType): string => {
  return app.applicantType === "individual" ||
    app.applicantType === "INDIVIDUAL"
    ? `${app.contactPerson?.firstName || "-"} ${
        app.contactPerson?.lastName || "-"
      }`
    : app.organisation?.name || "-";
};

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
  minDuration: number
): number => {
  const turns = numTurns(startDate, endDate, biWeekly, eventsPerWeek);
  return (turns * minDuration) / 3600;
};

export const applicationHours = (
  application: Application | ApplicationType
): number =>
  sum(
    (application.applicationEvents || []).map((ae) =>
      appEventHours(
        ae?.begin as string,
        ae?.end as string,
        ae?.biweekly as boolean,
        ae?.eventsPerWeek as number,
        ae?.minDuration as number
      )
    )
  );

export const applicationTurns = (application: Application): number =>
  sum(
    (application.applicationEvents || []).map((ae) =>
      numTurns(
        ae?.begin as string,
        ae?.end as string,
        ae?.biweekly as boolean,
        ae?.eventsPerWeek as number
      )
    )
  );
