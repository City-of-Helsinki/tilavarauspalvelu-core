import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateGraphQLMockProps } from "@/test/test.gql.utils";
import { render, screen, within } from "@testing-library/react";
import Reservation from "@/pages/reservations/[id]";
import { OrderStatus, ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import { camelCase } from "lodash-es";
import {
  createOptionsMock,
  createReservationPageMock,
  createTermsOfUseMock,
  type ReservationPaymentOrderFragment,
  reservationRenderProps,
} from "@test/reservation.mocks";
import { createGraphQLMocks } from "@test/gql.mocks";
import { MockedGraphQLProvider } from "@test/test.react.utils";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
    }),
    mockedRouterReplace,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

vi.mock("next/router", () => ({
  useRouter,
}));

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
  const params = new URLSearchParams();
  params.set("modalShown", false.toString());
  mockedSearchParams.mockReturnValue(params);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

interface CustomRenderProps extends CreateGraphQLMockProps {
  pk?: number;
  state?: ReservationStateChoice;
  begin?: string;
  end?: string;
  isHandled?: boolean;
  type?: ReservationTypeChoice;
  price?: string;
  paymentOrder?: ReservationPaymentOrderFragment & { handledPaymentDueBy: string };
  cancellable?: boolean;
}

function customRender(
  { state, pk, begin, end, isHandled, type, price, paymentOrder, cancellable, ...mockProps }: CustomRenderProps = {
    ...reservationRenderProps(),
  }
): ReturnType<typeof render> {
  const reservation = createReservationPageMock({
    pk,
    state,
    begin,
    end,
    isHandled,
    type,
    price,
    paymentOrder,
    cancellable,
  });
  const termsOfUse = createTermsOfUseMock();
  return render(
    <MockedGraphQLProvider mocks={createGraphQLMocks(mockProps)}>
      <Reservation
        termsOfUse={termsOfUse}
        reservation={reservation}
        feedbackUrl=""
        options={createOptionsMock()}
        apiBaseUrl="http://localhost:8000"
      />
    </MockedGraphQLProvider>
  );
}

describe("Page: View reservation", () => {
  it("renders reservation title correctly", async () => {
    const view = customRender();
    await waitForAddressSection(view);

    const title = view.getByTestId("reservation__name");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("reservations:reservationName");
  });

  describe("Status labels", () => {
    it.for(Object.values(ReservationStateChoice))("renders %s status label correctly", async (state) => {
      const view = customRender({ state: state });
      await waitForAddressSection(view);

      const headingSection = view.getByTestId("reservation__content").childNodes[0] as HTMLElement;
      const statusText = "reservations:status." + camelCase(state);
      expect(within(headingSection).getByText(statusText)).toBeInTheDocument();
    });
  });

  describe("Action buttons", () => {
    it("shows appropriate text if the reservation can't be modified", async () => {
      const view = customRender(reservationRenderProps("inThePast"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      const modificationText = "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
      expect(within(buttonSection).getByText(modificationText)).toBeInTheDocument();
    });

    it("shows cancel button if the reservation can be cancelled", async () => {
      const view = customRender(reservationRenderProps("canBeCancelled"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect(within(buttonSection).getByText("reservations:cancel.reservation")).toBeInTheDocument();
    });

    it("shows action buttons if the reservation can be modified", async () => {
      const view = customRender(reservationRenderProps("canBeMoved"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect.poll(() => within(buttonSection).getByText("reservations:modifyReservationTime"));
      expect.poll(() => within(buttonSection).getByTestId("reservation-detail__button--edit"));
    });
    it("Should show the pay button if the reservation is waiting for payment", async () => {
      const view = customRender(reservationRenderProps("waitingForPayment"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect(within(buttonSection).getByText("reservations:payReservation")).toBeInTheDocument();
      expect(within(buttonSection).getAllByRole("button")).toHaveLength(1);
    });
  });

  describe("Past reservation", () => {
    it("Should show only the 'not cancellable/editable'-text, no action buttons", async () => {
      const view = customRender(reservationRenderProps("inThePast"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      const modificationText = "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
      expect(within(buttonSection).getByText(modificationText)).toBeInTheDocument();
      expect(within(buttonSection).queryByText("reservations:modifyReservationTime")).not.toBeInTheDocument();
      expect(within(buttonSection).queryByText("reservations:cancel.reservation")).not.toBeInTheDocument();
    });
  });

  const shouldHaveReceiptButton = new Set([OrderStatus.Paid, OrderStatus.PaidByInvoice, OrderStatus.Refunded]);

  describe("Sidebar", () => {
    it("should render a 'Save to calendar'-button when the reservation state is CONFIRMED", () => {
      const view = customRender(reservationRenderProps());
      expect(view.getByTestId("reservation__button--calendar-link")).toBeInTheDocument();
    });

    it.for(Object.entries(OrderStatus).filter((status, _idx) => shouldHaveReceiptButton.has(status[1])))(
      "should show a receipt button for a %s payment order",
      ([_, status]) => {
        customRender(reservationRenderProps("default", status));
        expect(screen.getByTestId("reservation__confirmation--button__receipt-link")).toBeInTheDocument();
      }
    );

    it.for(Object.entries(OrderStatus).filter((status) => !shouldHaveReceiptButton.has(status[1])))(
      "should not show a receipt button for a %s payment order",
      ([_, status]) => {
        customRender(reservationRenderProps("default", status));
        expect(screen.queryByTestId("reservation__confirmation--button__receipt-link")).not.toBeInTheDocument();
      }
    );

    it("should not show a receipt button if there is no receiptUrl", () => {
      customRender(reservationRenderProps("default", OrderStatus.Paid, null));
      expect(screen.queryByTestId("reservation__confirmation--button__receipt-link")).not.toBeInTheDocument();
    });
  });
});

// If you don't wait for something the mock query is still loading
// even if you don't need the statusLabel
// waiting for this is a proxy that the query has finished
async function waitForAddressSection(view: ReturnType<typeof customRender>): Promise<HTMLElement> {
  const addressSection = view.getByTestId("reservation-unit__address--container");
  await expect.poll(() => addressSection).toBeInTheDocument();
  return addressSection;
}
