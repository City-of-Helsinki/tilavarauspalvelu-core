import { createGraphQLMocks } from "@test/gql.mocks";
import {
  createOptionsMock,
  createReservationPageMock,
  createTermsOfUseMock,
  reservationRenderProps,
} from "@test/reservation.mocks";
import type { ReservationPaymentOrderFragment } from "@test/reservation.mocks";
import type { CreateGraphQLMockProps } from "@test/test.gql.utils";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Reservation from "@/pages/reservations/[id]";
import { OrderStatus, ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";

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
      <Reservation termsOfUse={termsOfUse} reservation={reservation} options={createOptionsMock()} />
    </MockedGraphQLProvider>
  );
}

describe("Page: View reservation", () => {
  it("renders reservation name as page title", async () => {
    const view = customRender();
    await waitForAddressSection(view);

    const name = view.getByRole("heading", { level: 1 });
    expect(name).toBeInTheDocument();
    expect(name).toHaveTextContent("reservation:reservationName");
  });

  describe("Status labels", () => {
    it.for(Object.values(ReservationStateChoice))("renders %s status label correctly", async (state) => {
      const view = customRender({ state: state });
      await waitForAddressSection(view);

      const headingSection = view.getByTestId("reservation__content").childNodes[0] as HTMLElement;
      const statusText = `reservation:state.${state}`;
      expect(within(headingSection).getByText(statusText)).toBeInTheDocument();
    });
  });

  describe("Action buttons", () => {
    it("shows appropriate text if the reservation can't be modified", async () => {
      const view = customRender(reservationRenderProps("inThePast"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      const modificationText = "reservation:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
      expect(within(buttonSection).getByText(modificationText)).toBeInTheDocument();
    });

    it("shows cancel button if the reservation can be cancelled", async () => {
      const view = customRender(reservationRenderProps("canBeCancelled"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect(within(buttonSection).getByText("reservation:cancel.reservation")).toBeInTheDocument();
    });

    it("shows action buttons if the reservation can be modified", async () => {
      const view = customRender(reservationRenderProps("canBeMoved"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect.poll(() => within(buttonSection).getByText("reservation:modifyReservationTime"));
      expect.poll(() => within(buttonSection).getByTestId("reservation-detail__button--edit"));
    });
    it("Should show the pay button if the reservation is waiting for payment", async () => {
      const view = customRender(reservationRenderProps("waitingForPayment"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      expect(within(buttonSection).getByText("reservation:payReservation")).toBeInTheDocument();
      expect(within(buttonSection).getAllByRole("button")).toHaveLength(1);
    });
  });

  describe("Past reservation", () => {
    it("Should show only the 'not cancellable/editable'-text, no action buttons", async () => {
      const view = customRender(reservationRenderProps("inThePast"));
      await waitForAddressSection(view);

      const buttonSection = view.getByTestId("reservation__content").childNodes[2] as HTMLElement;
      const modificationText = "reservation:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
      expect(within(buttonSection).getByText(modificationText)).toBeInTheDocument();
      expect(within(buttonSection).queryByText("reservation:modifyReservationTime")).not.toBeInTheDocument();
      expect(within(buttonSection).queryByText("reservation:cancel.reservation")).not.toBeInTheDocument();
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
