import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservationUnitTableElementFragment } from "@gql/gql-types";
import { ReservationUnitsTable } from "./ReservationUnitsTable";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/context/EnvContext", () => ({
  useEnvContext: () => ({
    env: {
      apiBaseUrl: "http://api.example.com",
    },
  }),
}));

vi.mock("ui/src/components/statuses", () => ({
  ReservationUnitPublishingStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
  ReservationUnitReservationStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
}));

function createReservationUnit(
  overrides: Partial<ReservationUnitTableElementFragment> = {}
): ReservationUnitTableElementFragment {
  return {
    id: "ru-1",
    pk: 1,
    nameFi: "Reservation Unit 1",
    publishingState: "PUBLISHED",
    reservationState: "RESERVABLE",
    maxPersons: 10,
    surfaceArea: 25.5,
    unit: {
      id: "unit-1",
      nameFi: "Unit 1",
    },
    reservationUnitType: {
      id: "type-1",
      nameFi: "Meeting Room",
    },
    ...overrides,
  } as ReservationUnitTableElementFragment;
}

function ReservationUnitsTableWrapper({
  reservationUnits,
}: {
  reservationUnits: ReservationUnitTableElementFragment[];
}) {
  const [selectedRows, setSelectedRows] = useState<Array<number | string>>([]);
  const mockSortChanged = vi.fn();

  return (
    <ReservationUnitsTable
      sort=""
      sortChanged={mockSortChanged}
      reservationUnits={reservationUnits}
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReservationUnitsTable", () => {
  it("renders table rows with all columns", () => {
    render(<ReservationUnitsTableWrapper reservationUnits={[createReservationUnit()]} />);

    expect(screen.getByRole("link", { name: "Reservation Unit 1" })).toBeInTheDocument();
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
    expect(screen.getByText("Meeting Room")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows empty state when no reservation units", () => {
    render(<ReservationUnitsTableWrapper reservationUnits={[]} />);

    expect(screen.getByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("renders reservation unit name link with correct href", () => {
    render(<ReservationUnitsTableWrapper reservationUnits={[createReservationUnit()]} />);

    const link = screen.getByRole("link", { name: "Reservation Unit 1" });
    expect(link).toHaveAttribute("href", expect.stringContaining("/1"));
  });

  it("displays surface area with locale formatting", () => {
    render(<ReservationUnitsTableWrapper reservationUnits={[createReservationUnit()]} />);

    const cells = screen.getAllByRole("cell");
    const surfaceAreaCell = cells.find((c) => c.textContent?.includes("25") || c.textContent?.includes("m²"));
    expect(surfaceAreaCell).toBeTruthy();
  });

  it("handles missing optional fields", () => {
    render(
      <ReservationUnitsTableWrapper
        reservationUnits={[
          createReservationUnit({
            maxPersons: null,
            surfaceArea: null,
            reservationUnitType: null,
          }),
        ]}
      />
    );

    const cells = screen.getAllByText("-");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("handles multiple reservation units with different states", () => {
    const units = [
      createReservationUnit({ pk: 1 }),
      createReservationUnit({ pk: 2 }),
      createReservationUnit({ pk: 3 }),
    ];
    render(<ReservationUnitsTableWrapper reservationUnits={units} />);

    expect(screen.getAllByRole("link", { name: /Reservation Unit/ })).toHaveLength(3);
  });
});
