import type { ReadonlyURLSearchParams } from "next/navigation";
import { describe, expect, it } from "vitest";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/modules/const";
import {
  AccessCodeState,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  MunicipalityChoice,
  OrderStatusWithFree,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
  Weekday,
} from "@gql/gql-types";
import { getFilterSearchParams } from "./useGetFilterSearchParams";

function toSearchParams(init: Array<[string, string]>): ReadonlyURLSearchParams {
  return new URLSearchParams(init) as ReadonlyURLSearchParams;
}

describe("getFilterSearchParams", () => {
  it("leaves every filter undefined when there are no search params", () => {
    const res = getFilterSearchParams({ searchParams: toSearchParams([]) });
    expect(res.unitFilter).toBeUndefined();
    expect(res.textFilter).toBeUndefined();
    expect(res.reservationStatusFilter).toBeUndefined();
    expect(res.weekDayFilter).toBeUndefined();
    expect(res.recurringFilter).toBeUndefined();
    // the application status filter is the one filter with a default
    expect(res.applicationStatusFilter).toEqual(VALID_ALLOCATION_APPLICATION_STATUSES);
  });

  it("transforms each enum param into its gql enum value", () => {
    const res = getFilterSearchParams({
      searchParams: toSearchParams([
        ["applicantType", ReserveeType.Individual],
        ["state", ReservationStateChoice.Confirmed],
        ["sectionStatus", ApplicationSectionStatusChoice.Handled],
        ["accessCodeState", AccessCodeState.AccessCodeCreated],
        ["reservationType", ReservationTypeChoice.Staff],
        ["orderStatus", OrderStatusWithFree.Paid],
        ["reservationUnitState", ReservationUnitPublishingState.Published],
        ["municipality", MunicipalityChoice.Helsinki],
        ["status", ApplicationStatusChoice.Handled],
        ["weekday", "1"],
      ]),
    });
    expect(res.applicantTypeFilter).toEqual([ReserveeType.Individual]);
    expect(res.reservationStatusFilter).toEqual([ReservationStateChoice.Confirmed]);
    expect(res.sectionStatusFilter).toEqual([ApplicationSectionStatusChoice.Handled]);
    expect(res.accessCodeStateFilter).toEqual([AccessCodeState.AccessCodeCreated]);
    expect(res.reservationTypeFilter).toEqual([ReservationTypeChoice.Staff]);
    expect(res.orderStatusFilter).toEqual([OrderStatusWithFree.Paid]);
    expect(res.reservationUnitStateFilter).toEqual([ReservationUnitPublishingState.Published]);
    expect(res.municipalityFilter).toEqual([MunicipalityChoice.Helsinki]);
    expect(res.applicationStatusFilter).toEqual([ApplicationStatusChoice.Handled]);
    expect(res.weekDayFilter).toEqual([Weekday.Tuesday]);
  });

  it("drops values that are not known enum members", () => {
    const res = getFilterSearchParams({
      searchParams: toSearchParams([
        ["applicantType", "NOT_A_RESERVEE_TYPE"],
        ["state", "NOT_A_STATE"],
        ["municipality", "NOT_A_MUNICIPALITY"],
        ["weekday", "7"],
        ["status", "NOT_A_STATUS"],
      ]),
    });
    expect(res.applicantTypeFilter).toBeUndefined();
    expect(res.reservationStatusFilter).toBeUndefined();
    expect(res.municipalityFilter).toBeUndefined();
    expect(res.weekDayFilter).toBeUndefined();
    // an unknown status falls back to the default instead of filtering nothing out
    expect(res.applicationStatusFilter).toEqual(VALID_ALLOCATION_APPLICATION_STATUSES);
  });

  it("reads the applicant type from the legacy applicant param", () => {
    const res = getFilterSearchParams({
      searchParams: toSearchParams([["applicant", ReserveeType.Company]]),
    });
    expect(res.applicantTypeFilter).toEqual([ReserveeType.Company]);
  });

  it("prefers the applicantType param over the legacy applicant param", () => {
    const res = getFilterSearchParams({
      searchParams: toSearchParams([
        ["applicant", ReserveeType.Company],
        ["applicantType", ReserveeType.Nonprofit],
      ]),
    });
    expect(res.applicantTypeFilter).toEqual([ReserveeType.Nonprofit]);
  });

  it("falls back to the units the user has permission to when no unit is selected", () => {
    const unitOptions = [
      { label: "Unit 1", value: 1 },
      { label: "Unit 2", value: 2 },
    ];
    expect(getFilterSearchParams({ searchParams: toSearchParams([]), unitOptions }).unitFilter).toEqual([1, 2]);
    expect(getFilterSearchParams({ searchParams: toSearchParams([["unit", "2"]]), unitOptions }).unitFilter).toEqual([
      2,
    ]);
  });

  it("clips the person and surface area limits to integers", () => {
    const res = getFilterSearchParams({
      searchParams: toSearchParams([
        ["maxPersonsGte", "1.7"],
        ["surfaceAreaLte", "20.4"],
        ["minPrice", "10.5"],
      ]),
    });
    expect(res.maxPersonsGteFilter).toBe(1);
    expect(res.surfaceAreaLteFilter).toBe(20);
    // prices are not clipped
    expect(res.minPriceFilter).toBe(10.5);
  });

  it("reads the recurring and free of charge flags", () => {
    expect(getFilterSearchParams({ searchParams: toSearchParams([["recurring", "only"]]) }).recurringFilter).toBe(
      "only"
    );
    expect(getFilterSearchParams({ searchParams: toSearchParams([["recurring", "onlyNot"]]) }).recurringFilter).toBe(
      "onlyNot"
    );
    expect(
      getFilterSearchParams({ searchParams: toSearchParams([["recurring", "??"]]) }).recurringFilter
    ).toBeUndefined();
    expect(getFilterSearchParams({ searchParams: toSearchParams([["freeOfCharge", "true"]]) }).freeOfChargeFilter).toBe(
      true
    );
    expect(
      getFilterSearchParams({ searchParams: toSearchParams([["freeOfCharge", "false"]]) }).freeOfChargeFilter
    ).toBe(false);
  });
});
