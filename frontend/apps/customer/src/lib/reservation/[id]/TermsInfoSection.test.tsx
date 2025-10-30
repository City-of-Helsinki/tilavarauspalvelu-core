import React from "react";
import { TermsInfoSection } from "./TermsInfoSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMockReservation, createTermsOfUseMock, generateTextFragment } from "@test/reservation.mocks";
import type { ReservationPageQuery } from "@gql/gql-types";
import { generateNameFragment } from "@test/test.gql.utils";

type NodeT = NonNullable<ReservationPageQuery["reservation"]>;

const customRender = (
  reservation: NodeT,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tos?: any
): ReturnType<typeof render> => {
  return render(<TermsInfoSection reservation={reservation} termsOfUse={tos ?? createTermsOfUseMock()} />);
};

describe("Component: Reservation page terms info section", () => {
  describe("Payment and cancellation terms", () => {
    it("should contain both terms, when both exist", () => {
      const paymentAndCancellationTerms = createMockReservation({});
      customRender(paymentAndCancellationTerms);
      const reservationUnit = paymentAndCancellationTerms.reservationUnit;

      expect(screen.getByText(reservationUnit.paymentTerms?.textFi ?? "Maksuehdot")).toBeInTheDocument();
      expect(screen.getByText(reservationUnit.paymentTerms?.textFi ?? "Peruutusehdot")).toBeInTheDocument();
    });

    it("should contain only payment terms if only it exists (no cancellation terms)", () => {
      const onlyPaymentTerms = createMockReservation({
        cancellationTerms: null,
      });
      customRender(onlyPaymentTerms);
      const reservationUnit = onlyPaymentTerms.reservationUnit;
      const termsContent = screen.getByTestId("reservation__payment-and-cancellation-terms").children[1];
      expect(termsContent?.textContent).toBe(reservationUnit.paymentTerms?.textFi ?? "");
    });

    it("should contain only cancellation terms if only it exists (no payment terms)", () => {
      const onlyCancellationTerms = createMockReservation({
        paymentTerms: null,
      });
      customRender(onlyCancellationTerms);
      const reservationUnit = onlyCancellationTerms.reservationUnit;
      const termsContent = screen.getByTestId("reservation__payment-and-cancellation-terms").children[1];

      expect(termsContent?.textContent).toBe(reservationUnit.cancellationTerms?.textFi ?? "");
    });

    it("should not render at all if neither of the terms exist", () => {
      const noTerms = createMockReservation({
        paymentTerms: null,
        cancellationTerms: null,
      });
      customRender(noTerms);
      expect(screen.queryByTestId("reservation__payment-and-cancellation-terms")).not.toBeInTheDocument();
    });
  });

  describe("Pricing terms", () => {
    it("should be shown if all conditions are met", () => {
      const applyingFreePricingTerms = createMockReservation({
        pricingTerms: {
          id: "1",
          ...generateNameFragment("Pricing terms name"),
          ...generateTextFragment("Pricing terms text"),
        },
        price: "0",
        applyingForFreeOfCharge: true,
        canApplyFreeOfCharge: true,
      });
      customRender(applyingFreePricingTerms);
      const reservationUnit = applyingFreePricingTerms.reservationUnit;
      expect(screen.getByText("reservationUnit:pricingTerms")).toBeInTheDocument();
      expect(screen.getByText(reservationUnit.pricingTerms?.textFi ?? "Pricing terms text FI")).toBeInTheDocument();
    });

    it.for(
      Object.entries({
        "applying for free of charge but reservation unit price is already zero": {
          ...createMockReservation({
            price: "0",
          }),
        },
        "reservation unit can't be applied for free": {
          ...createMockReservation({
            canApplyFreeOfCharge: false,
          }),
        },
        "reservation unit has no pricing terms": {
          ...createMockReservation({
            pricingTerms: null,
            applyingForFreeOfCharge: true,
          }),
        },
      })
    )("should not be shown because %s", (res) => {
      const reservation = res[1];
      customRender(reservation);
      expect(screen.queryByText("reservationUnit:pricingTerms")).not.toBeInTheDocument();
      expect(
        screen.queryByText(reservation.reservationUnit.pricingTerms?.textFi ?? "Pricing terms text FI")
      ).not.toBeInTheDocument();
    });
  });

  describe("Terms of use-section", () => {
    it("should contain both service specific terms and terms of use, if both exist", () => {
      const reservation = createMockReservation({});
      const normalTOS = createTermsOfUseMock();
      customRender(reservation, normalTOS);
      expect(
        screen.getByText(reservation.reservationUnit.serviceSpecificTerms?.textFi ?? "Test service specific terms FI")
      ).toBeInTheDocument();
      expect(screen.getByText(normalTOS.genericTerms?.textFi ?? "Test terms of use FI")).toBeInTheDocument();
    });

    it("should contain only service specific terms if only it exists (no terms of use)", () => {
      const reservation = createMockReservation({});
      const emptyTOS = createTermsOfUseMock(true);
      customRender(reservation, emptyTOS);
      expect(
        screen.getByText(reservation.reservationUnit.serviceSpecificTerms?.textFi ?? "Test service specific terms FI")
          .textContent
      ).toBe(reservation.reservationUnit.serviceSpecificTerms?.textFi);
    });

    it("should contain only terms of use if only it exists (no service specific terms)", () => {
      const reservation = createMockReservation({
        serviceSpecificTerms: null,
      });
      const normalTOS = createTermsOfUseMock();
      customRender(reservation, normalTOS);
      expect(screen.getByText(normalTOS.genericTerms?.textFi ?? "Test terms of use FI").textContent).toBe(
        normalTOS.genericTerms?.textFi
      );
    });
  });
});
