import React from "react";
import { render, screen } from "@testing-library/react";
import { addDays, subDays } from "date-fns";
import { describe, test, expect } from "vitest";
import type { ReservationInfoSectionFragment } from "@gql/gql-types";
import { ReservationInfoSection } from "./ReservationInfoSection";

function createReservationUnit(
  overrides: Partial<ReservationInfoSectionFragment> = {}
): ReservationInfoSectionFragment {
  return {
    id: "1",
    reservationBeginsAt: null,
    reservationEndsAt: null,
    reservationsMaxDaysBefore: null,
    reservationsMinDaysBefore: null,
    minReservationDuration: null,
    maxReservationDuration: null,
    maxReservationsPerUser: null,
    ...overrides,
  };
}

describe("ReservationInfoSection", () => {
  test("renders nothing when the reservation unit is not reservable", () => {
    const { container } = render(
      <ReservationInfoSection reservationUnit={createReservationUnit()} reservationUnitIsReservable={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing extra when there is no day limit, duration, status or per-user max", () => {
    render(<ReservationInfoSection reservationUnit={createReservationUnit()} reservationUnitIsReservable />);
    expect(screen.getByTestId("reservation-unit__reservation-info")).toBeInTheDocument();
    expect(screen.queryByText(/dayLimit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/duration/)).not.toBeInTheDocument();
    expect(screen.queryByText(/maxReservationsPerUser/)).not.toBeInTheDocument();
  });

  test("shows only the max-day limit when only a max is set", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ reservationsMaxDaysBefore: 14 })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.dayLimitMax/)).toBeInTheDocument();
    expect(screen.queryByText(/dayLimitMin/)).not.toBeInTheDocument();
    expect(screen.queryByText(`common:and`, { exact: false })).not.toBeInTheDocument();
  });

  test("shows only the min-day limit when only a min is set", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ reservationsMinDaysBefore: 2 })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.dayLimitMin/)).toBeInTheDocument();
    expect(screen.queryByText(/dayLimitMax/)).not.toBeInTheDocument();
  });

  test("joins min and max day limits with 'and' when both are set", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ reservationsMaxDaysBefore: 14, reservationsMinDaysBefore: 2 })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.dayLimitMax/)).toBeInTheDocument();
    expect(screen.getByText(/reservationInfoSection.dayLimitMin/)).toBeInTheDocument();
    expect(screen.getByText("common:and", { exact: false })).toBeInTheDocument();
  });

  test("shows the reservation duration range when both min and max durations are set", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ minReservationDuration: 3600, maxReservationDuration: 7200 })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.duration/)).toBeInTheDocument();
  });

  test("hides the duration when either bound is missing", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ minReservationDuration: 3600, maxReservationDuration: null })}
        reservationUnitIsReservable
      />
    );
    expect(screen.queryByText(/reservationInfoSection.duration/)).not.toBeInTheDocument();
  });

  test("shows the per-user reservation max when set", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ maxReservationsPerUser: 3 })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getAllByText(/reservationInfoSection.maxReservationsPerUser/).length).toBeGreaterThan(0);
  });

  test("shows a 'will open' status when reservations begin in the future", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({
          reservationBeginsAt: addDays(new Date(), 5).toISOString(),
          reservationEndsAt: addDays(new Date(), 10).toISOString(),
        })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.willOpen/)).toBeInTheDocument();
  });

  test("shows an 'is open' status when reservations have started but not ended", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({
          reservationBeginsAt: subDays(new Date(), 1).toISOString(),
          reservationEndsAt: addDays(new Date(), 10).toISOString(),
        })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.isOpen/)).toBeInTheDocument();
  });

  test("shows a 'has closed' status when the reservation period has ended", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ reservationEndsAt: subDays(new Date(), 1).toISOString() })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByText(/reservationInfoSection.hasClosed/)).toBeInTheDocument();
  });

  test("shows no status when there is no end date", () => {
    render(
      <ReservationInfoSection
        reservationUnit={createReservationUnit({ reservationBeginsAt: subDays(new Date(), 1).toISOString() })}
        reservationUnitIsReservable
      />
    );
    expect(screen.queryByText(/reservationInfoSection.(willOpen|isOpen|hasClosed)/)).not.toBeInTheDocument();
  });
});
