import { differenceInWeeks } from "date-fns";
import { fromApiDate } from "common/src/common/util";
import { formatters as getFormatters } from "common";
import {
  AccessCodeState,
  ApplicationSectionNode,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  ReserveeType,
} from "@gql/gql-types";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { formatNumber } from "@/common/util";
import { useSearchParams } from "next/navigation";
import { mapParamToNumber } from "@/helpers";
import type { DayT } from "common/src/const";
import {
  transformAccessCodeState,
  transformApplicationSectionStatus,
  transformApplicationStatus,
  transformReserveeType,
  transformWeekday,
} from "common/src/conversion";
import { filterNonNullable } from "common/src/helpers";

function transformApplicationSectionStatusList(status: string[]): ApplicationSectionStatusChoice[] {
  return filterNonNullable(status.map(transformApplicationSectionStatus));
}

function transformApplicationStatusList(filters: string[]): ApplicationStatusChoice[] {
  const vals = filterNonNullable(filters.map(transformApplicationStatus));
  if (vals.length === 0) {
    return VALID_ALLOCATION_APPLICATION_STATUSES;
  }
  return vals;
}

function transformApplicantTypeList(filters: string[]): ReserveeType[] {
  return filterNonNullable(filters.map(transformReserveeType));
}

function transformAccessCodeStateList(filters: string[]): AccessCodeState[] {
  return filterNonNullable(filters.map(transformAccessCodeState));
}

export function useGetFilterSearchParams({ unitOptions }: { unitOptions?: { label: string; value: number }[] } = {}) {
  // Process search params from the URL to get filter values used in the application review data loaders
  const searchParams = useSearchParams();

  // If unitParam is empty, use all units the user has permission to as the filter
  // This is required on some endpoints, in case the user is missing permissions for some units
  const unitParam = mapParamToNumber(searchParams.getAll("unit"), 1);
  const unitFilter = unitParam.length > 0 ? unitParam : (unitOptions ?? []).map((u) => u.value);

  return {
    textFilter: searchParams.get("search"),
    unitFilter: unitFilter,
    unitGroupFilter: mapParamToNumber(searchParams.getAll("unitGroup"), 1),
    reservationUnitFilter: mapParamToNumber(searchParams.getAll("reservationUnit"), 1),
    statusFilter: transformApplicationStatusList(searchParams.getAll("status")),
    sectionStatusFilter: transformApplicationSectionStatusList(searchParams.getAll("sectionStatus")),
    applicantTypeFilter: transformApplicantTypeList(searchParams.getAll("applicant")),
    accessCodeStateFilter: transformAccessCodeStateList(searchParams.getAll("accessCodeState")),
    weekDayFilter: mapParamToNumber(searchParams.getAll("weekday"))
      .filter((n): n is DayT => n >= 0 && n <= 6)
      .map(transformWeekday),
  };
}

export function calculateAppliedReservationTime(
  ae: Pick<
    ApplicationSectionNode,
    "reservationsBeginDate" | "reservationsEndDate" | "appliedReservationsPerWeek" | "reservationMinDuration"
  >
): {
  count: number;
  hours: number;
} {
  const begin = ae.reservationsBeginDate ? fromApiDate(ae.reservationsBeginDate) : undefined;
  const end = ae.reservationsEndDate ? fromApiDate(ae.reservationsEndDate) : undefined;
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
