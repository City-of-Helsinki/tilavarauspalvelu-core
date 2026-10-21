import React from "react";
import { render, screen } from "@testing-library/react";
import { addDays, setHours, startOfISOWeek } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";

const mockUseSession = vi.fn();
vi.mock("@/hooks", () => ({
  useSession: () => mockUseSession(),
}));

const mockQuery = vi.fn();
vi.mock("@gql/gql-types", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReservationUnitCalendarQuery: (...args: unknown[]) => mockQuery(...args),
}));

// A Wednesday far enough ahead that none of it has passed.
const week = startOfISOWeek(addDays(new Date(), 400));
const at = (day: number, hour: number) => setHours(addDays(week, day), hour).toISOString();

function reservation(overrides: Record<string, unknown> = {}) {
  return {
    id: "ReservationNode:7",
    pk: 7,
    beginsAt: at(2, 10),
    endsAt: at(2, 12),
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    name: "Rehearsal",
    reserveeName: "Band",
    state: ReservationStateChoice.Confirmed,
    type: ReservationTypeChoice.Normal,
    affectedReservationUnits: [5],
    reservationUnit: { pk: 5, nameFi: "Studio" },
    ...overrides,
  };
}

function mockData(reservations: Array<Record<string, unknown>>, loading = false) {
  mockQuery.mockReturnValue({
    loading,
    error: undefined,
    data: {
      reservationUnit: {
        id: "ReservationUnitNode:5",
        pk: 5,
        reservations,
        reservableTimeSpans: [{ startDatetime: at(2, 8), endDatetime: at(2, 20) }],
      },
      affectingReservations: [],
    },
  });
}

function renderCalendar() {
  return render(
    <ReservationUnitCalendar begin={week.toISOString()} onNavigate={vi.fn()} reservationUnitPk={5} unitPk={9} />
  );
}

beforeEach(() => {
  mockUseSession.mockReturnValue({ user: { id: "u", pk: 1, isSuperuser: true, unitRoles: [], generalRoles: [] } });
});

describe("ReservationUnitCalendar", () => {
  it("links a reservation to its page in a new tab when the user may view reservations", () => {
    mockData([reservation()]);
    renderCalendar();

    const link = screen.getByRole("link", { name: /Band/ });
    expect(link).toHaveAttribute("href", expect.stringMatching(/\/reservations\/7$/));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows no links to users who may not view reservations", () => {
    mockUseSession.mockReturnValue({ user: { id: "u", pk: 2, isSuperuser: false, unitRoles: [], generalRoles: [] } });
    mockData([reservation()]);
    renderCalendar();

    expect(screen.queryByRole("link", { name: /Band/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Band/, { selector: "li" })).toBeInTheDocument();
  });

  it("shows buffer time around a reservation as its own entry that has no link", () => {
    mockData([reservation({ bufferTimeBefore: 1800, bufferTimeAfter: 1800 })]);
    renderCalendar();

    expect(screen.getAllByText(/reservationCalendar:buffer/, { selector: "li" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /Band/ })).toHaveLength(1);
  });

  it("marks the grid busy while loading", () => {
    mockData([], true);
    renderCalendar();

    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
  });
});
