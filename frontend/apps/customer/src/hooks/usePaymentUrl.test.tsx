import React from "react";
import { renderHook } from "@testing-library/react";
import { addDays } from "date-fns";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { OrderStatus, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationPaymentUrlFragment } from "@gql/gql-types";
import { usePaymentUrl } from "./usePaymentUrl";

function createPendingHandledPayment(): ReservationPaymentUrlFragment {
  return {
    id: "ReservationNode:1",
    pk: 1,
    state: ReservationStateChoice.Confirmed,
    cancelReason: null,
    paymentOrder: {
      id: "PaymentOrderNode:1",
      status: OrderStatus.Pending,
      handledPaymentDueBy: addDays(new Date(), 1).toISOString(),
      checkoutUrl: null,
    },
  };
}

function PaymentLink({ reservation }: { reservation: ReservationPaymentUrlFragment }): React.ReactElement {
  const paymentUrl = usePaymentUrl(reservation, "fi");
  return <a href={paymentUrl}>pay</a>;
}

describe("usePaymentUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("gives the pending payment url with the page origin in the browser", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "");
    const { result } = renderHook(() => usePaymentUrl(createPendingHandledPayment(), "fi"));
    const redirectOnError = encodeURIComponent(`${window.location.origin}/reservations/1`);
    expect(result.current).toBe(`/v1/pay_pending_reservation/1/?lang=fi&redirect_on_error=${redirectOnError}`);
  });

  test("renders on the server without the pending payment url", () => {
    const html = renderToString(<PaymentLink reservation={createPendingHandledPayment()} />);
    expect(html).toBe("<a>pay</a>");
  });
});
