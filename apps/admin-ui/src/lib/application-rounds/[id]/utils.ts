import { differenceInWeeks } from "date-fns";
import { fromApiDate } from "common/src/date-utils";
import { formatters as getFormatters } from "common";
import { type ApplicationSectionNode } from "@gql/gql-types";
import { formatNumber } from "@/common/util";

export function calculateAppliedReservationTime(
  ae: Pick<
    ApplicationSectionNode,
    "reservationsBeginDate" | "reservationsEndDate" | "appliedReservationsPerWeek" | "reservationMinDuration"
  >
): {
  count: number;
  hours: number;
} {
  const begin = ae.reservationsBeginDate ? fromApiDate({ date: ae.reservationsBeginDate }) : undefined;
  const end = ae.reservationsEndDate ? fromApiDate({ date: ae.reservationsEndDate }) : undefined;
  const evtPerW = ae.appliedReservationsPerWeek ?? 0;
  const turns = begin && end ? differenceInWeeks(end, begin) * evtPerW : 0;

  const minDuration = ae.reservationMinDuration ?? 0;
  const totalHours = (turns * minDuration) / 3600;
  return { count: turns, hours: totalHours };
}

const formatters = getFormatters("fi");
export function formatAppliedReservationTime(time: { count: number; hours: number }): string {
  const { count, hours } = time;
  return `${formatNumber(count, "")} / ${formatters.oneDecimal?.format(hours) ?? hours} t`;
}
