import { AccessCodeState, ApplicationSectionStatusChoice, ApplicationStatusChoice, ReserveeType } from "@gql/gql-types";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { useSearchParams } from "next/navigation";
import type { DayT } from "common/src/const";
import {
  transformAccessCodeState,
  transformApplicationSectionStatus,
  transformApplicationStatus,
  transformReserveeType,
  transformWeekday,
} from "common/src/conversion";
import { filterNonNullable, mapParamToInterger } from "common/src/helpers";

export function useGetFilterSearchParams({ unitOptions }: { unitOptions?: { label: string; value: number }[] } = {}) {
  // Process search params from the URL to get filter values used in the application review data loaders
  const searchParams = useSearchParams();

  // If unitParam is empty, use all units the user has permission to as the filter
  // This is required on some endpoints, in case the user is missing permissions for some units
  const unitParam = mapParamToInterger(searchParams.getAll("unit"), 1);
  const unitFilter = unitParam.length > 0 ? unitParam : (unitOptions ?? []).map((u) => u.value);

  return {
    textFilter: searchParams.get("search"),
    unitFilter: unitFilter,
    unitGroupFilter: mapParamToInterger(searchParams.getAll("unitGroup"), 1),
    reservationUnitFilter: mapParamToInterger(searchParams.getAll("reservationUnit"), 1),
    reservationUnitTypeFilter: mapParamToInterger(searchParams.getAll("reservationUnitType"), 1),
    statusFilter: transformApplicationStatusList(searchParams.getAll("status")),
    sectionStatusFilter: transformApplicationSectionStatusList(searchParams.getAll("sectionStatus")),
    applicantTypeFilter: transformApplicantTypeList(searchParams.getAll("applicant")),
    accessCodeStateFilter: transformAccessCodeStateList(searchParams.getAll("accessCodeState")),
    weekDayFilter: mapParamToInterger(searchParams.getAll("weekday"))
      .filter((n): n is DayT => n >= 0 && n <= 6)
      .map(transformWeekday),
  };
}

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
