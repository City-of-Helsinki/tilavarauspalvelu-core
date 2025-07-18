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
import { transformWeekday } from "common/src/conversion";

function transformApplicationSectionStatus(status: string[]): ApplicationSectionStatusChoice[] {
  return status
    .map((s) => {
      switch (s) {
        case ApplicationSectionStatusChoice.Handled:
          return ApplicationSectionStatusChoice.Handled;
        case ApplicationSectionStatusChoice.Unallocated:
          return ApplicationSectionStatusChoice.Unallocated;
        case ApplicationSectionStatusChoice.InAllocation:
          return ApplicationSectionStatusChoice.InAllocation;
        case ApplicationSectionStatusChoice.Rejected:
          return ApplicationSectionStatusChoice.Rejected;
        default:
          return undefined;
      }
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
}

function transformApplicationStatuses(filters: string[]): ApplicationStatusChoice[] {
  if (filters.length === 0) {
    return VALID_ALLOCATION_APPLICATION_STATUSES;
  }
  return filters
    .map((filter) => {
      switch (filter) {
        case ApplicationStatusChoice.Received:
          return ApplicationStatusChoice.Received;
        case ApplicationStatusChoice.Handled:
          return ApplicationStatusChoice.Handled;
        case ApplicationStatusChoice.ResultsSent:
          return ApplicationStatusChoice.ResultsSent;
        case ApplicationStatusChoice.InAllocation:
          return ApplicationStatusChoice.InAllocation;
        default:
          return undefined;
      }
    })
    .filter((asc): asc is NonNullable<typeof asc> => asc != null);
}

function transformApplicantType(filters: string[]): ReserveeType[] {
  return filters
    .map((filter) => {
      switch (filter) {
        case ReserveeType.Individual:
          return ReserveeType.Individual;
        case ReserveeType.Company:
          return ReserveeType.Company;
        case ReserveeType.Nonprofit:
          return ReserveeType.Nonprofit;
        default:
          return undefined;
      }
    })
    .filter((at): at is NonNullable<typeof at> => at != null);
}

function transformAccessCodeState(filters: string[]): AccessCodeState[] {
  return filters
    .map((f) => {
      switch (f) {
        case AccessCodeState.AccessCodeCreated:
          return AccessCodeState.AccessCodeCreated;
        case AccessCodeState.AccessCodePending:
          return AccessCodeState.AccessCodePending;
        case AccessCodeState.AccessCodeNotRequired:
          return AccessCodeState.AccessCodeNotRequired;
        default:
          return undefined;
      }
    })
    .filter((act): act is NonNullable<typeof act> => act != null);
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
    statusFilter: transformApplicationStatuses(searchParams.getAll("status")),
    sectionStatusFilter: transformApplicationSectionStatus(searchParams.getAll("sectionStatus")),
    applicantTypeFilter: transformApplicantType(searchParams.getAll("applicant")),
    accessCodeStateFilter: transformAccessCodeState(searchParams.getAll("accessCodeState")),
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
