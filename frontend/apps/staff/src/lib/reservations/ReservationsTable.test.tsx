import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStateChoice } from "@gql/gql-types";
import type { ReservationTableElementFragment } from "@gql/gql-types";
import { ReservationsTable } from "./ReservationsTable";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("ui/src/modules/date-utils", () => ({
  formatDateTime: (date: Date) => date.toISOString(),
  formatDateTimeRange: (start: Date, end: Date) => `${start.toISOString()} - ${end.toISOString()}`,
  parseValidDateObject: (dateStr: string) => new Date(dateStr),
}));

vi.mock("ui/src/components/statuses", () => ({
  OrderStatusLabel: ({ status }: { status: string }) => <span>{status}</span>,
  ReservationStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
}));

function createReservation(overrides: Partial<ReservationTableElementFragment> = {}): ReservationTableElementFragment {
  return {
    id: "res-1",
    pk: 1000,
    name: "John Doe",
    state: ReservationStateChoice.Confirmed,
    beginsAt: "2024-06-15T09:00:00Z",
    endsAt: "2024-06-15T11:00:00Z",
    createdAt: "2024-06-01T10:00:00Z",
    reservationUnit: {
      id: "ru-1",
      nameFi: "Meeting Room A",
      unit: {
        id: "unit-1",
        nameFi: "Unit 1",
      },
    },
    paymentOrder: null,
    ...overrides,
  } as ReservationTableElementFragment;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReservationsTable", () => {
  it("renders table rows with all columns", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ReservationsTable
        sort="pk"
        sortChanged={mockSortChanged}
        isLoading={false}
        reservations={[createReservation()]}
      />
    );

    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("Meeting Room A")).toBeInTheDocument();
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
    expect(container.querySelector("table tbody tr")).toBeTruthy();
  });

  it("shows empty state when no reservations", () => {
    const mockSortChanged = vi.fn();
    render(<ReservationsTable sort="pk" sortChanged={mockSortChanged} isLoading={false} reservations={[]} />);

    expect(screen.getByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("renders reservation link with correct href", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ReservationsTable
        sort="pk"
        sortChanged={mockSortChanged}
        isLoading={false}
        reservations={[createReservation()]}
      />
    );

    const link = container.querySelector("a[href*='/reservations/1000']");
    expect(link).toBeTruthy();
  });

  it("handles reservations without names", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ReservationsTable
        sort="pk"
        sortChanged={mockSortChanged}
        isLoading={false}
        reservations={[createReservation({ name: null })]}
      />
    );

    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("handles multiple reservations with different states", () => {
    const mockSortChanged = vi.fn();
    const reservations = [
      createReservation({ pk: 1000, state: ReservationStateChoice.Confirmed }),
      createReservation({ pk: 1001, state: ReservationStateChoice.Cancelled }),
      createReservation({ pk: 1002, state: ReservationStateChoice.RequiresHandling }),
    ];
    render(<ReservationsTable sort="pk" sortChanged={mockSortChanged} isLoading={false} reservations={reservations} />);

    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("1001")).toBeInTheDocument();
    expect(screen.getByText("1002")).toBeInTheDocument();
  });

  it("handles reservations without payment orders", () => {
    const mockSortChanged = vi.fn();
    render(
      <ReservationsTable
        sort="pk"
        sortChanged={mockSortChanged}
        isLoading={false}
        reservations={[createReservation({ paymentOrder: null })]}
      />
    );

    const dashCells = screen.getAllByText("-");
    expect(dashCells.length).toBeGreaterThan(0);
  });
});
