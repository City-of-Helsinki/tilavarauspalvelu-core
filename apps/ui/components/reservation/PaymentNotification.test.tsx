import { createReservationPageMock } from "@test/reservation.mocks";
import { render, screen } from "@testing-library/react";
import { PaymentNotification } from "@/components/reservation/PaymentNotification";
import { describe, it, expect } from "vitest";
import { toUIDateTime } from "common/src/common/util";

function customRender() {
  const reservation = createReservationPageMock({});
  return render(<PaymentNotification reservation={reservation} apiBaseUrl={"http://localhost:8000"} />);
}

describe("Component: Payment Notification", () => {
  it("should render the payment notification component with correct text", () => {
    customRender();
    expect(screen.getByText("reservations:paymentBanner.title")).toBeInTheDocument();
    expect(screen.getByText("reservations:paymentBanner.description")).toBeInTheDocument();
  });

  it("should render the payment notification component with correct price details", () => {
    customRender();
    const reservation = createReservationPageMock({});
    const appliedPricingMock = reservation.appliedPricing;
    if (!appliedPricingMock) {
      throw new Error("Applied pricing mock is undefined");
    }
    const formattedPrice = appliedPricingMock.highestPrice.split(".").join(",") + "0";
    // eslint-disable-next-line no-irregular-whitespace
    const priceText = `common:price: ${formattedPrice} € (common:inclTax {"taxPercentage":"24,5"})`;
    const priceElement = screen.getByTestId("reservation__payment-notification__price");

    expect(screen.getByText((_, element) => element?.textContent?.trim() === priceText)).toBeInTheDocument();
    expect(priceElement.textContent?.trim()).toBe(priceText);
  });

  it("should render the payment notification component with correct deadline", () => {
    customRender();
    const reservation = createReservationPageMock({});
    const paymentOrderMock = reservation.paymentOrder;
    if (!paymentOrderMock) {
      throw new Error("Payment order mock is undefined");
    }
    const deadlineText = `common:deadline: ${toUIDateTime(new Date(paymentOrderMock.handledPaymentDueBy ?? ""), "common:dayTimeSeparator")}`;
    expect(screen.getByText(deadlineText)).toBeInTheDocument();
  });
});
