import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreateGraphQLMockProps,
  createGraphQLMocks,
  createMockReservation,
  createTermsOfUseMock,
} from "@/test/test.gql.utils";
import { render, within } from "@testing-library/react";
import Reservation from "@/pages/reservations/[id]";
import {
  OrderFieldsFragment,
  OrderStatus,
  PaymentType,
  ReservationPageQuery,
  ReservationStateChoice,
  ReservationTypeChoice,
} from "@gql/gql-types";
import { MockedProvider } from "@apollo/client/testing";
import { camelCase } from "lodash-es";

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

vi.mock("next/router", () => ({
  useRouter,
}));

interface CustomRenderProps extends CreateGraphQLMockProps {
  pk?: number;
  state?: ReservationStateChoice;
  begin?: string;
  end?: string;
  isHandled?: boolean;
  type?: ReservationTypeChoice;
  paymentOrder?: OrderFieldsFragment;
  cancelable?: boolean;
}

function customRender(
  {
    state,
    pk,
    begin,
    end,
    isHandled,
    type,
    paymentOrder,
    cancelable,
    ...mockProps
  }: CustomRenderProps = {
    ...reservationRenderProps.default,
  }
): ReturnType<typeof render> {
  const reservation = createReservationMock({
    pk,
    state,
    begin,
    end,
    isHandled,
    type,
    paymentOrder,
    cancelable,
  });
  const termsOfUse = createTermsOfUseMock();
  return render(
    <MockedProvider
      mocks={createGraphQLMocks(mockProps)}
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      <Reservation
        termsOfUse={termsOfUse}
        reservation={reservation}
        feedbackUrl=""
      />
    </MockedProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("Page: Reservation Details", () => {
  it("should render page with default values", async () => {
    const view = customRender();
    await expect
      .poll(() => view.getByTestId("reservation__name"))
      .toBeInTheDocument();
  });

  it("should render reservation title", async () => {
    const view = customRender();
    const title = view.getByTestId("reservation__name");
    await expect.poll(() => title).toBeInTheDocument();
    await expect
      .poll(() => title)
      .toHaveTextContent("reservations:reservationName");
  });

  it.for(Object.values(ReservationStateChoice))(
    "renders exactly one status label with correct contents, for state: %s",
    async (state) => {
      const view = customRender({ state: state });
      const contentSection = view.getByTestId("reservation__content");
      const statusText = "reservations:status." + camelCase(state);
      await expect
        .poll(() => within(contentSection).getByText(statusText))
        .toBeInTheDocument();
    }
  );

  it("shows appropriate text if the reservation can't be modified", async () => {
    const view = customRender(reservationRenderProps.inThePast);
    const buttonSection = view.getByTestId("reservation__content")
      .childNodes[2] as HTMLElement;
    const modificationText =
      "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
    await expect
      .poll(() => within(buttonSection).getByText(modificationText))
      .toBeInTheDocument();
  });

  it("shows cancel button if the reservation can be cancelled", async () => {
    const view = customRender(reservationRenderProps.canBeCancelled);
    const contentSection = view.getByTestId("reservation__content");
    await expect
      .poll(() =>
        within(contentSection).getByText("reservations:cancel.reservation")
      )
      .toBeInTheDocument();
  });

  it("shows action buttons if the reservation can be modified", async () => {
    const view = customRender(reservationRenderProps.canBeModified);
    const buttonSection = view.getByTestId("reservation__content")
      .childNodes[2] as HTMLElement;
    const modifyButtonText = "reservations:modifyReservationTime";
    expect.poll(() => within(buttonSection).getByText(modifyButtonText));
    expect.poll(() => {
      within(buttonSection).getByTestId("reservation-detail__button--edit");
    });
    //.toBeInTheDocument(); - Why does this fail? And why don't they require await??
  });
});

describe("Page: Reservation Details | Past reservation", () => {
  it("Should show only the not cancellable/editable text, no action buttons", async () => {
    const view = customRender(reservationRenderProps.inThePast);
    const buttonSection = view.getByTestId("reservation__content")
      .childNodes[2] as HTMLElement;
    const modificationText =
      "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED";
    await expect
      .poll(() => within(buttonSection).getByText(modificationText))
      .toBeInTheDocument();
    await expect
      .poll(() =>
        within(buttonSection).queryByText("reservations:modifyReservationTime")
      )
      .not.toBeInTheDocument();
    await expect
      .poll(() =>
        within(buttonSection).queryByText("reservations:cancel.reservation")
      )
      .not.toBeInTheDocument();
  });
});

describe("Page: Reservation Details | Payable reservation", () => {
  it("Should show the pay button", async () => {
    const view = customRender(reservationRenderProps.payable);
    const buttonSection = view.getByTestId("reservation__content")
      .childNodes[2] as HTMLElement;
    await expect
      .poll(() =>
        within(buttonSection).getByText("reservations:payReservation")
      )
      .toBeInTheDocument();
    expect(within(buttonSection).getAllByRole("button")).toHaveLength(1);
  });
});

function createReservationMock({
  pk,
  state,
  begin,
  end,
  isHandled,
  type,
  paymentOrder,
  cancelable,
}: {
  pk?: number;
  state?: ReservationStateChoice;
  begin?: string;
  end?: string;
  isHandled?: boolean;
  type?: ReservationTypeChoice;
  paymentOrder: OrderFieldsFragment;
  cancelable?: boolean;
}): Readonly<NonNullable<ReservationPageQuery["reservation"]>> {
  return createMockReservation({
    pk: pk ?? reservationRenderProps.default.pk,
    state: state ?? reservationRenderProps.default.state,
    begin: begin ?? reservationRenderProps.default.begin,
    end: end ?? reservationRenderProps.default.end,
    isHandled: isHandled ?? reservationRenderProps.default.isHandled,
    type: type ?? reservationRenderProps.default.type,
    paymentOrder: paymentOrder ?? reservationRenderProps.default.paymentOrder,
    cancelable: cancelable ?? reservationRenderProps.default.cancelable,
  });
}

const future1hReservation = {
  begin: new Date(2024, 0, 14, 9, 0, 0).toISOString(),
  end: new Date(2024, 0, 14, 10, 0, 0).toISOString(),
};

const reservationRenderProps = {
  // Set/use all available attribute defaults
  default: {
    pk: 1,
    state: ReservationStateChoice.Confirmed,
    begin: new Date(2024, 0, 1, 9, 0, 0).toISOString(),
    end: new Date(2024, 0, 1, 10, 0, 0).toISOString(),
    isHandled: true,
    type: ReservationTypeChoice.Normal,
    cancelable: false,
    paymentOrder: {
      id: "1",
      reservationPk: "1",
      status: OrderStatus.PaidManually,
      paymentType: PaymentType.OnSite,
      receiptUrl: "https://example.com/receipt",
      checkoutUrl: "https://example.com/checkout",
    },
  },
  //
  inThePast: {
    state: ReservationStateChoice.Confirmed,
    begin: new Date(2023, 0, 1, 9, 0, 0).toISOString(),
    end: new Date(2023, 0, 1, 10, 0, 0).toISOString(),
  },
  // can be cancelled
  canBeCancelled: {
    state: ReservationStateChoice.Confirmed,
    ...future1hReservation,
    isHandled: false,
    type: ReservationTypeChoice.Normal,
    cancelable: true,
  },
  canBeModified: {
    state: ReservationStateChoice.Created,
    ...future1hReservation,
    isHandled: false,
    type: ReservationTypeChoice.Normal,
    price: "0",
  },
  payable: {
    state: ReservationStateChoice.WaitingForPayment,
    ...future1hReservation,
    price: "40.0",
    paymentOrder: {
      id: "1",
      reservationPk: "1",
      status: OrderStatus.Draft,
      paymentType: PaymentType.OnlineOrInvoice,
      receiptUrl: "https://example.com/receipt",
      checkoutUrl: "https://example.com/checkout",
    },
  },
};
