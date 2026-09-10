import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { AccessType, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationCardFragment } from "@gql/gql-types";
import { isReservationCancellable } from "@/modules/reservation";
import { ReservationCard } from "./ReservationCard";

vi.mock("@/modules/reservation", () => ({
  getNormalizedReservationOrderStatus: vi.fn(() => null),
  getPaymentUrl: vi.fn(() => null),
  isReservationCancellable: vi.fn(() => false),
}));

vi.mock("@/modules/reservationUnit", () => ({
  getPrice: vi.fn(() => "€100"),
}));

vi.mock("@/modules/urls", () => ({
  getReservationPath: vi.fn((pk) => `/reservations/${pk}`),
}));

vi.mock("ui/src/components/statuses", () => ({
  ReservationStatusLabel: ({ state }: { state: ReservationStateChoice }) => (
    <span>ReservationStatus: {state}</span>
  ),
  OrderStatusLabel: () => <span>OrderStatus</span>,
}));

vi.mock("ui/src/modules/helpers", () => ({
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  getImageSource: vi.fn(() => null),
  getLocalizationLang: vi.fn(() => "en"),
  getTranslation: vi.fn((obj: unknown) => {
    // eslint-disable-next-line eqeqeq
    if (typeof obj === "object" && obj != null && "nameFi" in obj) {
      return (obj as Record<string, unknown>).nameFi || "Test";
    }
    return "Test";
  }),
  getMainImage: vi.fn(() => null),
}));

function createMockReservation(
  overrides: Partial<ReservationCardFragment> = {}
): ReservationCardFragment {
  return {
    pk: 1,
    beginsAt: "2026-09-15T10:00:00Z",
    endsAt: "2026-09-15T11:00:00Z",
    state: ReservationStateChoice.Confirmed,
    accessType: AccessType.Unrestricted,
    reservationUnit: {
      id: "ru-1",
      nameFi: "Test Unit",
      nameEn: "Test Unit",
      nameSv: "Test Unit",
      images: [],
      unit: {
        id: "unit-1",
        nameFi: "Test Space",
        nameEn: "Test Space",
        nameSv: "Test Space",
      },
    },
    ...overrides,
  } as ReservationCardFragment;
}

describe("ReservationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders reservation card with reservation unit name", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(screen.getByText("Test Unit, Test Space")).toBeInTheDocument();
  });

  test("renders reservation status label", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(
      screen.getByText(`ReservationStatus: ${ReservationStateChoice.Confirmed}`)
    ).toBeInTheDocument();
  });

  test("renders show button", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(screen.getByRole("link", { name: /common:show/i })).toBeInTheDocument();
  });

  test("renders price icon with aria label", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(screen.getByLabelText("common:price")).toBeInTheDocument();
  });

  test("renders access type icon with aria label", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(screen.getByLabelText("reservationUnit:accessType")).toBeInTheDocument();
  });

  test("returns null when reservation unit is missing", () => {
    const mockReservation = createMockReservation({ reservationUnit: null } as unknown as Partial<ReservationCardFragment>);

    const { container } = render(
      <ReservationCard
        reservation={mockReservation}
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test("renders cancel button when type is upcoming and reservation is cancellable", () => {
    vi.mocked(isReservationCancellable).mockReturnValue(true);
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        type="upcoming"
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(
      screen.getByRole("link", {
        name: /reservation:cancel.reservationAbbreviated/i,
      })
    ).toBeInTheDocument();
  });

  test("does not render cancel button when type is past", () => {
    const mockReservation = createMockReservation();

    render(
      <ReservationCard
        reservation={mockReservation}
        type="past"
        apiBaseUrl="http://localhost:3000"
      />
    );

    expect(
      screen.queryByRole("link", {
        name: /reservation:cancel.reservationAbbreviated/i,
      })
    ).not.toBeInTheDocument();
  });
});
