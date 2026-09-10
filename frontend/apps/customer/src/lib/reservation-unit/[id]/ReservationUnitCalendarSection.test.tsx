import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import type { ReservationQuotaReachedFragment, ReservationUnitPageQuery } from "@gql/gql-types";
import { ReservationUnitCalendarSection, isReservationQuotaReached } from "./ReservationUnitCalendarSection";

vi.mock("@/hooks", () => ({ useReservableTimes: vi.fn(() => new Map()) }));

vi.mock("@/components/reservation", () => ({
  ReservationTimePicker: () => <div data-testid="reservation-time-picker-stub" />,
}));

type ReservationUnitT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;

function createReservationUnit(): ReservationUnitT {
  return {
    nameFi: "Test Reservation Unit",
    nameSv: "Test Reservation Unit SV",
    nameEn: "Test Reservation Unit EN",
    reservableTimeSpans: [],
  } as unknown as ReservationUnitT;
}

function createRefreshedQuotaReservationUnit(
  overrides: Partial<ReservationQuotaReachedFragment> = {}
): ReservationQuotaReachedFragment {
  return {
    id: "1",
    maxReservationsPerUser: null,
    numActiveUserReservations: 0,
    ...overrides,
  };
}

function Wrapper({
  refreshedQuotaReservationUnit,
  isQuotaReached = false,
}: {
  refreshedQuotaReservationUnit: ReservationQuotaReachedFragment;
  isQuotaReached?: boolean;
}) {
  const reservationForm = useForm<PendingReservationFormType>();
  return (
    <ReservationUnitCalendarSection
      reservationUnit={createReservationUnit()}
      reservationForm={reservationForm}
      isQuotaReached={isQuotaReached}
      refreshedQuotaReservationUnit={refreshedQuotaReservationUnit}
      startingTimeOptions={[]}
      blockingReservations={[]}
      submitReservation={vi.fn()}
    />
  );
}

describe("ReservationUnitCalendarSection", () => {
  test("renders the heading with the reservation unit name and the time picker", () => {
    render(<Wrapper refreshedQuotaReservationUnit={createRefreshedQuotaReservationUnit()} />);

    expect(screen.getByText(/reservation:reservationCalendar/)).toBeInTheDocument();
    expect(screen.getByTestId("reservation-time-picker-stub")).toBeInTheDocument();
  });

  test("hides the quota notification when there is no per-user max or no active reservations", () => {
    render(<Wrapper refreshedQuotaReservationUnit={createRefreshedQuotaReservationUnit()} />);
    expect(screen.queryByTestId("reservation-unit--notification__reservation-quota")).not.toBeInTheDocument();
  });

  test("shows an info notification when some but not all of the quota is used", () => {
    render(
      <Wrapper
        refreshedQuotaReservationUnit={createRefreshedQuotaReservationUnit({
          maxReservationsPerUser: 3,
          numActiveUserReservations: 1,
        })}
      />
    );
    expect(screen.getByTestId("reservation-unit--notification__reservation-quota")).toHaveTextContent("some.text");
  });

  test("shows an alert notification when the quota is fully used", () => {
    render(
      <Wrapper
        refreshedQuotaReservationUnit={createRefreshedQuotaReservationUnit({
          maxReservationsPerUser: 2,
          numActiveUserReservations: 2,
        })}
      />
    );
    expect(screen.getByTestId("reservation-unit--notification__reservation-quota")).toHaveTextContent("full.text");
  });
});

describe("isReservationQuotaReached", () => {
  test("is false when there is no per-user max", () => {
    expect(isReservationQuotaReached({ maxReservationsPerUser: null, numActiveUserReservations: 5 })).toBe(false);
  });

  test("is false when active reservations are below the max", () => {
    expect(isReservationQuotaReached({ maxReservationsPerUser: 3, numActiveUserReservations: 2 })).toBe(false);
  });

  test("is true when active reservations meet or exceed the max", () => {
    expect(isReservationQuotaReached({ maxReservationsPerUser: 3, numActiveUserReservations: 3 })).toBe(true);
    expect(isReservationQuotaReached({ maxReservationsPerUser: 3, numActiveUserReservations: 4 })).toBe(true);
  });
});
