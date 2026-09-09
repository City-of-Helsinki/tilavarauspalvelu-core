import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useGenericTerms } from "@ui/hooks";
import { getFuturePricing, getPriceString } from "@/modules/reservationUnit";
import { PaymentType, PriceUnit, Weekday } from "@gql/gql-types";
import type { ReservationUnitMoreDetailsFragment } from "@gql/gql-types";
import { ReservationUnitMoreDetails } from "./ReservationUnitMoreDetails";

vi.mock("next-i18next", async (importOriginal) => ({
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

vi.mock("@/modules/reservationUnit", () => ({
  getFuturePricing: vi.fn(() => null),
  getPriceString: vi.fn(() => "10,00 € / tunti"),
}));

vi.mock("./ReservationInfoSection", () => ({
  ReservationInfoSection: () => <div data-testid="reservation-info-section-stub" />,
}));

vi.mock("@/components/AddressSection", () => ({
  AddressSection: () => <div data-testid="address-section-stub" />,
}));

vi.mock("@/components/UnitMap", () => ({
  UnitMap: () => <div data-testid="unit-map-stub" />,
}));

const termsOfUseText = { id: "terms-1", textFi: "Service terms", textEn: "Service terms", textSv: "Service terms" };

const pricing = {
  id: "pricing-1",
  highestPrice: "20",
  begins: "2020-01-01",
  priceUnit: PriceUnit.PerHour,
  paymentType: PaymentType.Online,
  lowestPrice: "10",
  materialPriceDescriptionFi: "",
  materialPriceDescriptionEn: "",
  materialPriceDescriptionSv: "",
  taxPercentage: { id: "tax-1", pk: 1, value: "24" },
};

function createReservationUnit(
  overrides: Partial<ReservationUnitMoreDetailsFragment> = {}
): ReservationUnitMoreDetailsFragment {
  return {
    nameFi: "Test Reservation Unit",
    nameEn: "Test Reservation Unit EN",
    nameSv: "Test Reservation Unit SV",
    canApplyFreeOfCharge: false,
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
    pricings: [],
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
      textFi: "Generic terms",
      textEn: "Generic terms",
      textSv: "Generic terms",
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

  test("hides the reservation-notice accordion when there is no future pricing or notes", () => {
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

  test("shows a future price-change notice with a tax notice when the tax rate is above zero", () => {
    vi.mocked(getFuturePricing).mockReturnValue({ ...pricing, taxPercentage: { id: "tax-1", pk: 1, value: "24" } });

    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit({ pricings: [pricing] })} isReservable />);

    const noticeAccordion = screen.getByTestId("reservation-unit__reservation-notice");
    expect(noticeAccordion).toHaveTextContent("reservationUnit:futurePricingNotice");
    expect(noticeAccordion).toHaveTextContent("reservationUnit:futurePriceNoticeTax");
  });

  test("omits the tax notice when the future pricing is free", () => {
    vi.mocked(getFuturePricing).mockReturnValue({ ...pricing, taxPercentage: { id: "tax-1", pk: 1, value: "0" } });
    vi.mocked(getPriceString).mockReturnValue("Free");

    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit({ pricings: [pricing] })} isReservable />);

    const noticeAccordion = screen.getByTestId("reservation-unit__reservation-notice");
    expect(noticeAccordion).toHaveTextContent("reservationUnit:futurePricingNotice");
    expect(noticeAccordion).not.toHaveTextContent("reservationUnit:futurePriceNoticeTax");
  });

  test("hides the application-round schedule accordion when there are no active application rounds", () => {
    render(<ReservationUnitMoreDetails reservationUnit={createReservationUnit()} isReservable />);
    expect(screen.queryByText("reservationUnit:recurringHeading")).not.toBeInTheDocument();
  });

  test("shows the application-round schedule sorted by weekday, with closed days marked", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({
          applicationRounds: [{ id: "round-1", reservationPeriodBeginDate: "2024-01-01", reservationPeriodEndDate: "2024-12-31" }],
          applicationRoundTimeSlots: [
            { id: "slot-wed", weekday: Weekday.Wednesday, isClosed: false, reservableTimes: [{ begin: "08:00", end: "16:00" }] },
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

  test("hides the pricing terms accordion when the unit cannot apply free-of-charge", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ canApplyFreeOfCharge: false, pricingTerms: termsOfUseText, pricings: [pricing] })}
        isReservable
      />
    );
    expect(screen.queryByTestId("reservation-unit__pricing-terms")).not.toBeInTheDocument();
  });

  test("shows the pricing terms accordion when the unit can apply free-of-charge on a paid pricing", () => {
    render(
      <ReservationUnitMoreDetails
        reservationUnit={createReservationUnit({ canApplyFreeOfCharge: true, pricingTerms: termsOfUseText, pricings: [pricing] })}
        isReservable
      />
    );
    expect(screen.getByTestId("reservation-unit__pricing-terms")).toHaveTextContent("Service terms");
  });
});
