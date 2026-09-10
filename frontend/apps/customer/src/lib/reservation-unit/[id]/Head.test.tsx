import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { formatApiDate } from "ui/src/modules/date-utils";
import { getActivePricing, getReservationUnitAccessPeriods, isReservationUnitPaid } from "@/modules/reservationUnit";
import { AccessType, PaymentType, PriceUnit, ReservationKind } from "@gql/gql-types";
import type { ReservationUnitHeadFragment } from "@gql/gql-types";
import { Head as ReservationUnitHead } from "./Head";

vi.mock("./Images", () => ({
  Images: () => <div data-testid="images-stub" />,
}));

vi.mock("@/modules/reservationUnit", () => ({
  getActivePricing: vi.fn(() => undefined),
  getPriceString: vi.fn(() => "10,00 - 20,00 € / tunti"),
  getReservationUnitAccessPeriods: vi.fn(() => []),
  isReservationUnitPaid: vi.fn(() => false),
}));

function createReservationUnit(overrides: Partial<ReservationUnitHeadFragment> = {}): ReservationUnitHeadFragment {
  return {
    id: "1",
    reservationKind: ReservationKind.Direct,
    reservationBeginsAt: null,
    nameFi: "Test Reservation Unit",
    nameSv: "Test Reservation Unit SV",
    nameEn: "Test Reservation Unit EN",
    minReservationDuration: null,
    maxReservationDuration: null,
    maxPersons: null,
    minPersons: null,
    currentAccessType: null,
    unit: { id: "unit-1", nameFi: "Test Unit", nameSv: "Test Unit SV", nameEn: "Test Unit EN" },
    pricings: [],
    accessTypes: [],
    reservationUnitType: null,
    images: [],
    ...overrides,
  };
}

const pricing = {
  id: "pricing-1",
  begins: "2020-01-01",
  priceUnit: PriceUnit.PerHour,
  paymentType: PaymentType.Online,
  lowestPrice: "10",
  highestPrice: "20",
  materialPriceDescriptionFi: "",
  materialPriceDescriptionEn: "",
  materialPriceDescriptionSv: "",
  taxPercentage: { id: "tax-1", pk: 1, value: "24" },
};

describe("Head", () => {
  beforeEach(() => {
    vi.mocked(getActivePricing).mockReturnValue(undefined);
    vi.mocked(isReservationUnitPaid).mockReturnValue(false);
    vi.mocked(getReservationUnitAccessPeriods).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders the reservation unit name and unit name", () => {
    render(<ReservationUnitHead reservationUnit={createReservationUnit()} reservationUnitIsReservable />);

    expect(screen.getByRole("heading", { level: 1, name: "Test Reservation Unit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Test Unit" })).toBeInTheDocument();
  });

  test("hides the non-reservable notification when the unit is reservable", () => {
    render(<ReservationUnitHead reservationUnit={createReservationUnit()} reservationUnitIsReservable />);
    expect(screen.queryByTestId("reservation-unit--notification__reservation-start")).not.toBeInTheDocument();
  });

  test("shows the default not-reservable message", () => {
    render(<ReservationUnitHead reservationUnit={createReservationUnit()} reservationUnitIsReservable={false} />);
    expect(screen.getByTestId("reservation-unit--notification__reservation-start")).toHaveTextContent(
      "reservationUnit:notifications.notReservable"
    );
  });

  test("shows the recurring-only message for season reservation units", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({ reservationKind: ReservationKind.Season })}
        reservationUnitIsReservable={false}
      />
    );
    expect(screen.getByTestId("reservation-unit--notification__reservation-start")).toHaveTextContent(
      "reservationUnit:notifications.onlyRecurring"
    );
  });

  test("shows the future-opening message when reservations begin in the future", () => {
    const future = addDays(new Date(), 5);
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({ reservationBeginsAt: future.toISOString() })}
        reservationUnitIsReservable={false}
      />
    );
    expect(screen.getByTestId("reservation-unit--notification__reservation-start")).toHaveTextContent(
      "reservationUnit:notifications.futureOpening"
    );
  });

  test("omits optional icon list items when data is absent", () => {
    render(<ReservationUnitHead reservationUnit={createReservationUnit()} reservationUnitIsReservable />);

    expect(screen.queryByLabelText("reservationUnit:maxPersons")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("prices:reservationUnitPriceLabel")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("reservationUnit:accessType")).not.toBeInTheDocument();
  });

  test("shows reservation unit type, person range, duration and price when present", () => {
    vi.mocked(getActivePricing).mockReturnValue(pricing);
    vi.mocked(isReservationUnitPaid).mockReturnValue(true);

    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          reservationUnitType: {
            id: "type-1",
            pk: 1,
            nameFi: "Meeting room",
            nameEn: "Meeting room",
            nameSv: "Meeting room",
          },
          maxPersons: 10,
          minPersons: 2,
          minReservationDuration: 3600,
          maxReservationDuration: 7200,
        })}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(screen.getByText("Meeting room")).toBeInTheDocument();
    expect(screen.getByLabelText("reservationUnit:maxPersons")).toBeInTheDocument();
    expect(screen.getByLabelText("reservationCalendar:eventDuration")).toBeInTheDocument();
    expect(screen.getByText(/10,00 - 20,00 € \/ tunti/)).toBeInTheDocument();
    // subvention suffix is only shown alongside a paid, active pricing
    expect(screen.getByText("Subvention")).toBeInTheDocument();
  });

  test("does not show the subvention suffix when the unit is free of charge", () => {
    vi.mocked(getActivePricing).mockReturnValue(pricing);
    vi.mocked(isReservationUnitPaid).mockReturnValue(false);

    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit()}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(screen.queryByText("Subvention")).not.toBeInTheDocument();
  });

  test("shows the access type and its tooltip only when there are multiple access periods", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          currentAccessType: AccessType.AccessCode,
          accessTypes: [
            { id: "at-1", pk: 1, accessType: AccessType.AccessCode, beginDate: formatApiDate(new Date()) ?? "" },
          ],
        })}
        reservationUnitIsReservable
      />
    );
    expect(screen.getByLabelText("reservationUnit:accessType")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tooltip/i })).not.toBeInTheDocument();
  });

  test("shows the access type tooltip when there are multiple access periods", async () => {
    const user = userEvent.setup();
    vi.mocked(getReservationUnitAccessPeriods).mockReturnValue([
      { accessType: AccessType.AccessCode, pk: 1, beginDate: new Date(2024, 0, 1), endDate: new Date(2024, 5, 1) },
      { accessType: AccessType.Unrestricted, pk: 2, beginDate: new Date(2024, 5, 2), endDate: null },
    ]);

    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          currentAccessType: AccessType.AccessCode,
          accessTypes: [
            { id: "at-1", pk: 1, accessType: AccessType.AccessCode, beginDate: "2024-01-01" },
            { id: "at-2", pk: 2, accessType: AccessType.Unrestricted, beginDate: "2024-06-02" },
          ],
        })}
        reservationUnitIsReservable
      />
    );

    await user.click(screen.getByRole("button", { name: "Tooltip" }));

    expect(screen.getByText(new RegExp(`reservationUnit:accessTypes.${AccessType.Unrestricted}`))).toBeInTheDocument();
    expect(screen.getByText(/common:dateGte/)).toBeInTheDocument();
  });

  test("shows a material price description tooltip when present", async () => {
    const user = userEvent.setup();
    vi.mocked(getActivePricing).mockReturnValue({ ...pricing, materialPriceDescriptionFi: "<p>Extra fee applies</p>" });
    vi.mocked(isReservationUnitPaid).mockReturnValue(true);

    render(<ReservationUnitHead reservationUnit={createReservationUnit()} reservationUnitIsReservable />);

    await user.click(screen.getByRole("button", { name: "Tooltip" }));

    expect(screen.getByText("Extra fee applies")).toBeInTheDocument();
  });
});
