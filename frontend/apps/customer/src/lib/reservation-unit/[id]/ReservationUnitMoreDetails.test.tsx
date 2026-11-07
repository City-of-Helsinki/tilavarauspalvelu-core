import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useGenericTerms } from "@ui/hooks";
import { PriceUnit, TermsOfUseTypeChoices, Weekday } from "@gql/gql-types";
import type { ReservationUnitMoreDetailsFragment } from "@gql/gql-types";
import { ReservationUnitMoreDetails } from "./ReservationUnitMoreDetails";

vi.mock("next-i18next/pages", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTranslation: () => ({
    t: (str: string, args: unknown) => `${str}${args ? " " + JSON.stringify(args) : ""}`,
    i18n: { language: "fi" },
  }),
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, unknown> }) => (
    <>
      {i18nKey}
      {values ? JSON.stringify(values) : null}
    </>
  ),
}));

vi.mock("@ui/hooks", () => ({ useGenericTerms: vi.fn(() => null) }));

vi.mock("./ReservationInfoSection", () => ({
  ReservationInfoSection: () => <div data-testid="reservation-info-section-stub" />,
}));

vi.mock("@/components/AddressSection", () => ({
  AddressSection: () => <div data-testid="address-section-stub" />,
}));

vi.mock("@/components/UnitMap", () => ({
  UnitMap: () => <div data-testid="unit-map-stub" />,
}));

const termsOfUseText = {
  id: "terms-1",
  pk: "terms-pk",
  textFi: "Service terms",
  textEn: "Service terms",
  textSv: "Service terms",
  termsType: TermsOfUseTypeChoices.Generic,
  nameFi: null,
  nameEn: null,
  nameSv: null,
};

type PriceSummary = NonNullable<ReservationUnitMoreDetailsFragment["priceSummary"]>;

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

function createReservationUnit(
  overrides: Partial<ReservationUnitMoreDetailsFragment> = {}
): ReservationUnitMoreDetailsFragment {
  return {
    nameFi: "Test Reservation Unit",
    nameEn: "Test Reservation Unit EN",
    nameSv: "Test Reservation Unit SV",
    priceSummary: null,
    id: "1",
    notesWhenApplyingFi: null,
    notesWhenApplyingEn: null,
    notesWhenApplyingSv: null,
    maxReservationsPerUser: null,
    numActiveUserReservations: 0,
    reservationBeginsAt: null,
    reservationEndsAt: null,
    reservationsMaxDaysBefore: null,
    reservationsMinDaysBefore: null,
    minReservationDuration: null,
    maxReservationDuration: null,
    applicationRoundTimeSlots: [],
    unit: {
      id: "unit-1",
      pk: 1,
      tprekId: null,
      addressStreetEn: "",
      addressStreetSv: "",
      addressCityEn: "",
      addressCitySv: "",
      addressStreetFi: "",
      addressCityFi: "",
      addressZip: "",
    },
    serviceSpecificTerms: null,
    cancellationTerms: null,
    paymentTerms: null,
    pricingTerms: null,
    applicationRounds: [],
    ...overrides,
  };
}

describe("ReservationUnitMoreDetails", () => {
  test("always renders the reservation info section and the terms of use accordion", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);

    expect(screen.getByTestId("reservation-info-section-stub")).toBeInTheDocument();
    expect(screen.getByTestId("reservation-unit__terms-of-use")).toBeInTheDocument();
  });

  test("shows generic terms of use from useGenericTerms and service-specific terms when present", () => {
    vi.mocked(useGenericTerms).mockReturnValue({
      id: "generic-1",
      pk: "generic-pk",
      textFi: "Generic terms",
      textEn: "Generic terms",
      textSv: "Generic terms",
      termsType: TermsOfUseTypeChoices.Generic,
      nameFi: null,
      nameEn: null,
      nameSv: null,
    });

    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ serviceSpecificTerms: termsOfUseText })}
        isReservable
      />
    );

    const termsAccordion = screen.getByTestId("reservation-unit__terms-of-use");
    expect(termsAccordion).toHaveTextContent("Generic terms");
    expect(termsAccordion).toHaveTextContent("Service terms");
  });

  test("hides the reservation-notice accordion when there are no notes", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);
    expect(screen.queryByTestId("reservation-unit__reservation-notice")).not.toBeInTheDocument();
  });

  test("shows the reservation-notice accordion with notes when notes are present", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ notesWhenApplyingFi: "Please arrive early" })}
        isReservable
      />
    );
    expect(screen.getByTestId("reservation-unit__reservation-notice")).toHaveTextContent("Please arrive early");
  });

  test("hides the application-round schedule accordion when there are no active application rounds", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);
    expect(screen.queryByText("reservationUnit:recurringHeading")).not.toBeInTheDocument();
  });

  test("shows the application-round schedule sorted by weekday, with closed days marked", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({
          applicationRounds: [
            { id: "round-1", reservationPeriodBeginDate: "2024-01-01", reservationPeriodEndDate: "2024-12-31" },
          ],
          applicationRoundTimeSlots: [
            {
              id: "slot-wed",
              weekday: Weekday.Wednesday,
              isClosed: false,
              reservableTimes: [{ begin: "08:00", end: "16:00" }],
            },
            { id: "slot-mon", weekday: Weekday.Monday, isClosed: true, reservableTimes: [] },
          ],
        })}
        isReservable
      />
    );

    const weekdays = screen.getAllByTestId("application-round-time-slot__weekday");
    expect(weekdays.map((el) => el.textContent)).toEqual([
      "common:weekdayLongEnum.MONDAY",
      "common:weekdayLongEnum.WEDNESDAY",
    ]);
    const values = screen.getAllByTestId("application-round-time-slot__value");
    expect(values[0]).toHaveTextContent("-");
    expect(values[1]).toHaveTextContent(/08|16/);
  });

  test("hides the location accordion when the unit has no tprekId", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);
    expect(screen.queryByTestId("unit-map-stub")).not.toBeInTheDocument();
  });

  test("shows the location accordion (address + map) when the unit has a tprekId", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ unit: { ...createReservationUnit().unit, tprekId: "123" } })}
        isReservable
      />
    );
    expect(screen.getByTestId("address-section-stub")).toBeInTheDocument();
    expect(screen.getByTestId("unit-map-stub")).toBeInTheDocument();
  });

  test("hides the payment/cancellation terms accordion when neither is present", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);
    expect(screen.queryByTestId("reservation-unit__payment-and-cancellation-terms")).not.toBeInTheDocument();
  });

  test("titles the payment/cancellation accordion as cancellation-only when there are no payment terms", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ cancellationTerms: termsOfUseText })}
        isReservable
      />
    );
    expect(screen.getByText("reservationUnit:cancellationTerms")).toBeInTheDocument();
  });

  test("titles the accordion as payment-and-cancellation when payment terms are present", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ paymentTerms: termsOfUseText, cancellationTerms: termsOfUseText })}
        isReservable
      />
    );
    expect(screen.getByText("reservationUnit:paymentAndCancellationTerms")).toBeInTheDocument();
  });

  test("hides the pricing terms accordion when the customer can not apply for a discount", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({ canApplyForDiscount: false }),
          pricingTerms: termsOfUseText,
        })}
        isReservable
      />
    );
    expect(screen.queryByTestId("reservation-unit__pricing-terms")).not.toBeInTheDocument();
  });

  test("shows the pricing terms accordion when the customer can apply for a discount", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({
          priceSummary: createPriceSummary({ canApplyForDiscount: true }),
          pricingTerms: termsOfUseText,
        })}
        isReservable
      />
    );
    expect(screen.getByTestId("reservation-unit__pricing-terms")).toHaveTextContent("Service terms");
  });
});
