import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { formatApiDate } from "ui/src/modules/date-utils";
import { AccessType, PriceUnit, ReservationKind } from "@gql/gql-types";
import type { ReservationUnitHeadFragment } from "@gql/gql-types";
import { getReservationUnitAccessPeriods } from "@/modules/reservationUnit";
import { Head as ReservationUnitHead } from "./Head";

vi.mock("./Images", () => ({
  Images: () => <div data-testid="images-stub" />,
}));

vi.mock("@/modules/reservationUnit", () => ({
  getReservationUnitAccessPeriods: vi.fn(() => []),
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
    priceSummary: null,
    accessTypes: [],
    reservationUnitType: null,
    images: [],
    ...overrides,
  };
}

type PriceSummary = NonNullable<ReservationUnitHeadFragment["priceSummary"]>;

function createPriceSummary(overrides: Partial<PriceSummary> = {}): PriceSummary {
  return {
    isFree: false,
    lowestAmount: "20",
    priceUnit: PriceUnit.PerHour,
    canApplyForDiscount: false,
    materialPriceDescriptionFi: "",
    materialPriceDescriptionEn: "",
    materialPriceDescriptionSv: "",
    ...overrides,
  };
}

/// Finds the element that has the full text, when the text is split over child elements
function getByFullText(text: string): HTMLElement {
  return screen.getByText(
    (_content, element) =>
      element?.textContent === text && [...element.children].every((child) => child.textContent !== text)
  );
}

describe("Head", () => {
  beforeEach(() => {
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
          priceSummary: createPriceSummary({ canApplyForDiscount: true }),
        })}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(screen.getByText("Meeting room")).toBeInTheDocument();
    expect(screen.getByLabelText("reservationUnit:maxPersons")).toBeInTheDocument();
    expect(screen.getByLabelText("reservationCalendar:eventDuration")).toBeInTheDocument();
    expect(getByFullText("0–20\u00A0€/prices:priceUnits.PER_HOUR: Subvention")).toBeInTheDocument();
  });

  test("shows a fixed price without the subvention suffix when the customer can not apply for a discount", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({ priceSummary: createPriceSummary() })}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(screen.getByText("20,00 €/prices:priceUnits.PER_HOUR")).toBeInTheDocument();
    expect(screen.queryByText("Subvention")).not.toBeInTheDocument();
  });

  test("shows free of charge without the subvention suffix when the unit is free of charge", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({ isFree: true, lowestAmount: "0" }),
        })}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(screen.getByText("prices:priceFree")).toBeInTheDocument();
    expect(screen.queryByText("Subvention")).not.toBeInTheDocument();
  });

  test("shows the access type and its tooltip only when there are multiple access periods", () => {
    vi.mocked(getReservationUnitAccessPeriods).mockReturnValue([
      { accessType: AccessType.AccessCode, pk: 1, beginDate: new Date(2024, 0, 1), endDate: null },
    ]);

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

    expect(screen.getByText(`reservationUnit:accessTypes.${AccessType.Unrestricted}:`)).toBeInTheDocument();
    expect(screen.getByText(`common:dateGte ${JSON.stringify({ value: "2.6.2024" })}`)).toBeInTheDocument();
  });

  test("opens the material price description from the material price word", async () => {
    const user = userEvent.setup();
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({ materialPriceDescriptionFi: "<p>Extra fee applies</p>" }),
        })}
        reservationUnitIsReservable
      />
    );

    expect(getByFullText("20,00\u00A0€/prices:priceUnits.PER_HOUR + prices:materialPrice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tooltip" })).not.toBeInTheDocument();
    expect(screen.queryByText("Extra fee applies")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "prices:materialPrice" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(trigger);
    const panel = screen.getByRole("dialog", { name: "Prices:materialPrice" });
    expect(panel).toHaveTextContent("Extra fee applies");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
  });

  test("shows only the material price word when the unit is free of charge and has a material price", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({
            isFree: true,
            lowestAmount: "0",
            materialPriceDescriptionFi: "<p>Extra fee applies</p>",
          }),
        })}
        reservationUnitIsReservable
      />
    );

    expect(screen.getByRole("button", { name: "Prices:materialPrice" })).toBeInTheDocument();
    expect(screen.queryByText("prices:priceFree")).not.toBeInTheDocument();
  });

  test("shows the subvention suffix without a colon after the material price", () => {
    render(
      <ReservationUnitHead
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({
            canApplyForDiscount: true,
            materialPriceDescriptionFi: "<p>Extra fee applies</p>",
          }),
        })}
        reservationUnitIsReservable
        subventionSuffix={<span>Subvention</span>}
      />
    );

    expect(
      getByFullText("0–20\u00A0€/prices:priceUnits.PER_HOUR + prices:materialPriceSubvention")
    ).toBeInTheDocument();
    expect(screen.getByText("Subvention")).toBeInTheDocument();
  });
});
