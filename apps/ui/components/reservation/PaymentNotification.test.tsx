import { render, screen } from "@testing-library/react";
import PaymentNotification from "@/components/reservation/PaymentNotification";
import { describe, it, expect } from "vitest";
import { AppliedPricingInfo, OrderStatus, PaymentOrderNode, PaymentType, PriceUnit } from "@gql/gql-types";
import { toUIDateTime } from "common/src/common/util";

function customRender() {
  const paymentOrder = createPaymentOrderMock();
  const appliedPricing = createAppliedPricingMock();
  return render(
    <PaymentNotification
      pk={1}
      paymentOrder={paymentOrder}
      appliedPricing={appliedPricing}
      apiBaseUrl={"http://localhost:8000"}
    />
  );
}

describe("Component: Payment Notification", () => {
  it("should render the payment notification component with correct text", () => {
    customRender();
    expect(screen.getByText("reservations:paymentBanner.title")).toBeInTheDocument();
    expect(screen.getByText("reservations:paymentBanner.description")).toBeInTheDocument();
  });

  it("should render the payment notification component with correct price details", () => {
    customRender();
    const appliedPricingMock = createAppliedPricingMock();
    const formattedPrice = appliedPricingMock.highestPrice.split(".").join(",") + "0";
    // eslint-disable-next-line no-irregular-whitespace
    const priceText = `common:price: ${formattedPrice} € (common:inclTax {"taxPercentage":"25,5"})`;
    const priceElement = screen.getByTestId("reservation__payment-notification__price");

    expect(screen.getByText((_, element) => element?.textContent?.trim() === priceText)).toBeInTheDocument();
    expect(priceElement.textContent?.trim()).toBe(priceText);
  });

  it("should render the payment notification component with correct deadline", () => {
    customRender();
    const paymentOrderMock = createPaymentOrderMock();
    const deadlineText = `common:deadline: ${toUIDateTime(new Date(paymentOrderMock.handledPaymentDueBy ?? ""))}`;
    expect(screen.getByText(deadlineText)).toBeInTheDocument();
  });
});

function createPaymentOrderMock(): PaymentOrderNode {
  return {
    checkoutUrl: "https://example.com/checkout",
    expiresInMinutes: 360,
    handledPaymentDueBy: new Date("2023-10-01T12:00:00Z").toISOString(),
    orderUuid: "23",
    paymentType: PaymentType.OnlineOrInvoice,
    processedAt: new Date("2023-10-01T12:00:00Z").toISOString(),
    receiptUrl: "https://example.com/receipt",
    refundUuid: "123",
    reservation: null,
    reservationPk: "1",
    id: "paymentOrderId",
    status: OrderStatus.Pending,
  };
}

function createAppliedPricingMock(): AppliedPricingInfo {
  return {
    begins: new Date("2023-10-01T12:00:00Z").toISOString(),
    highestPrice: "40.0",
    lowestPrice: "0",
    priceUnit: PriceUnit.PerHour,
    taxPercentage: "25.5",
  };
}
