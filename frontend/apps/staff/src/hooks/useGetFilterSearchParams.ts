import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import type { DayT } from "ui/src/modules/const";
import {
  transformAccessCodeState,
  transformApplicationSectionStatus,
  transformApplicationStatus,
  transformMunicipality,
  transformPaymentStatus,
  transformReservationState,
  transformReservationType,
  transformReservationUnitState,
  transformReserveeType,
  transformWeekday,
} from "ui/src/modules/conversion";
import { filterEmptyArray, filterNonNullable, mapParamToInteger, toInteger, toNumber } from "ui/src/modules/helpers";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/modules/const";
import { ApplicationStatusChoice, Priority } from "@gql/gql-types";

export function getFilterSearchParams({
  searchParams,
  unitOptions = [],
}: {
  searchParams: ReadonlyURLSearchParams;
  unitOptions?: { label: string; value: number }[];
}) {
  // If unitParam is empty, use all units the user has permission to as the filter
  // This is required on some endpoints, in case the user is missing permissions for some units
  const unitParam = mapParamToInteger(searchParams.getAll("unit"), 1);
  const unitFilter = unitParam.length > 0 ? unitParam : unitOptions.map((u) => u.value);

  const applicantTypeParam =
    searchParams.getAll("applicantType").length > 0
      ? searchParams.getAll("applicantType")
      : searchParams.getAll("applicant");
  const applicantTypeFilter = filterEmptyArray(filterNonNullable(applicantTypeParam.map(transformReserveeType)));

  const priorityFilter = filterEmptyArray(transformPriorityFilter(searchParams.getAll("priority")));
  const orderFilter = filterEmptyArray(mapParamToInteger(searchParams.getAll("order")));
  const ageGroupFilter = filterEmptyArray(mapParamToInteger(searchParams.getAll("ageGroup"), 1));
  const purposeFilter = filterEmptyArray(mapParamToInteger(searchParams.getAll("purpose"), 1));
  return {
    textFilter: searchParams.get("search") ?? undefined,
    unitFilter: filterEmptyArray(unitFilter),
    unitGroupFilter: filterEmptyArray(mapParamToInteger(searchParams.getAll("unitGroup"), 1)),
    reservationUnitFilter: filterEmptyArray(mapParamToInteger(searchParams.getAll("reservationUnit"), 1)),
    reservationUnitTypeFilter: filterEmptyArray(mapParamToInteger(searchParams.getAll("reservationUnitType"), 1)),
    applicationStatusFilter: filterEmptyArray(transformApplicationStatusList(searchParams.getAll("status"))),
    reservationStatusFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("state").map(transformReservationState))
    ),
    sectionStatusFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("sectionStatus").map(transformApplicationSectionStatus))
    ),
    applicantTypeFilter,
    accessCodeStateFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("accessCodeState").map(transformAccessCodeState))
    ),
    reservationTypeFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("reservationType").map(transformReservationType))
    ),
    orderStatusFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("orderStatus").map(transformPaymentStatus))
    ),
    reservationUnitStateFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("reservationUnitState").map(transformReservationUnitState))
    ),
    recurringFilter: convertRecurringParam(searchParams.get("recurring")),
    priorityFilter,
    orderFilter,
    ageGroupFilter,
    municipalityFilter: filterEmptyArray(
      filterNonNullable(searchParams.getAll("municipality").map(transformMunicipality))
    ),
    purposeFilter,
    // backend error if these are floats
    // could show validation errors for these but since it's not that important just clip the values to integers
    maxPersonsGteFilter: toInteger(searchParams.get("maxPersonsGte")) ?? undefined,
    maxPersonsLteFilter: toInteger(searchParams.get("maxPersonsLte")) ?? undefined,
    surfaceAreaGteFilter: toInteger(searchParams.get("surfaceAreaGte")) ?? undefined,
    surfaceAreaLteFilter: toInteger(searchParams.get("surfaceAreaLte")) ?? undefined,
    dateGteFilter: searchParams.get("dateGte") ?? undefined,
    dateLteFilter: searchParams.get("dateLte") ?? undefined,
    minPriceFilter: toNumber(searchParams.get("minPrice")) ?? undefined,
    maxPriceFilter: toNumber(searchParams.get("maxPrice")) ?? undefined,
    createdAtGteFilter: searchParams.get("createdAtGte") ?? undefined,
    createdAtLteFilter: searchParams.get("createdAtLte") ?? undefined,
    freeOfChargeFilter: searchParams.get("freeOfCharge") ? searchParams.get("freeOfCharge") === "true" : undefined,
    weekDayFilter: filterEmptyArray(
      mapParamToInteger(searchParams.getAll("weekday"))
        .filter((n): n is DayT => n >= 0 && n <= 6)
        .map(transformWeekday)
    ),
  };
}

function convertRecurringParam(recurring: string | null): "only" | "onlyNot" | undefined {
  if (recurring === "only") {
    return "only";
  } else if (recurring === "onlyNot") {
    return "onlyNot";
  }
  return undefined;
}

function transformPriorityFilter(values: string[]): Priority[] {
  return values.reduce<Priority[]>((acc, x) => {
    if (x === Priority.Secondary) {
      return [...acc, Priority.Secondary];
    } else if (x === Priority.Primary) {
      return [...acc, Priority.Primary];
    }
    return acc;
  }, []);
}

export function useGetFilterSearchParams({
  unitOptions = [],
}: { unitOptions?: { label: string; value: number }[] } = {}) {
  // Process search params from the URL to get filter values used in the application review data loaders
  const searchParams = useSearchParams();

  return getFilterSearchParams({ searchParams, unitOptions });
}

function transformApplicationStatusList(filters: string[]): ApplicationStatusChoice[] {
  const vals = filterNonNullable(filters.map(transformApplicationStatus));
  if (vals.length === 0) {
    return VALID_ALLOCATION_APPLICATION_STATUSES;
  }
  return vals;
}
