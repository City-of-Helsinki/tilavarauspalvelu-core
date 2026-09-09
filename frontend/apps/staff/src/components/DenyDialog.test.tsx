import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DenyReservationDocument,
  DenyReservationSeriesDocument,
  OrderStatus,
  RefundReservationDocument,
} from "@gql/gql-types";
import type { DenyDialogFieldsFragment } from "@gql/gql-types";
import { DenyDialog, DenyDialogSeries } from "./DenyDialog";

vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: vi.fn(), modalContent: { content: null } }),
}));

vi.mock("@/hooks", () => ({
  useDenyReasonOptions: () => ({
    options: [
      { value: 1, label: "Reason one" },
      { value: 2, label: "Reason two" },
    ],
    loading: false,
  }),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

function createReservation(overrides: Partial<DenyDialogFieldsFragment> = {}): DenyDialogFieldsFragment {
  return {
    id: "1",
    pk: 1,
    beginsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    handlingDetails: "",
    price: "0",
    paymentOrder: null,
    ...overrides,
  } as DenyDialogFieldsFragment;
}

async function selectDenyReason(label = "Reason one") {
  const user = userEvent.setup();
  const combo = screen.getByRole("combobox", { name: /denyReason/i });
  await user.click(combo);
  const option = await screen.findByRole("option", { name: label });
  await user.click(option);
  return user;
}

beforeEach(() => {
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

describe("DenyDialog", () => {
  it("renders deny reason select and handling details, and closes on cancel", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]}>
        <DenyDialog reservation={createReservation()} onClose={onClose} onReject={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByRole("combobox", { name: /denyReason/i })).toBeInTheDocument();
    await user.click(screen.getByTestId("deny-dialog__cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows no refund choice for a free reservation and denies successfully", async () => {
    const onReject = vi.fn();
    const mocks = [
      {
        request: {
          query: DenyReservationDocument,
          variables: { input: { pk: 1, denyReason: 1, handlingDetails: "" } },
        },
        result: { data: { denyReservation: { pk: 1, state: "DENIED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DenyDialog reservation={createReservation({ price: "0" })} onClose={vi.fn()} onReject={onReject} />
      </MockedProvider>
    );

    // free reservation: no refund radio group rendered
    expect(screen.queryByText("radioLabel")).not.toBeInTheDocument();

    const user = await selectDenyReason();
    await user.click(screen.getByTestId("deny-dialog__deny-button"));

    await waitFor(() => expect(onReject).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservation:DenyDialog.successNotify" });
  });

  it("shows the refund radio group and refunds when 'refund' is selected", async () => {
    const onReject = vi.fn();
    const reservation = createReservation({
      price: "10",
      paymentOrder: { id: "o1", orderUuid: "uuid-1", status: OrderStatus.Paid, refundUuid: null },
    });
    const mocks = [
      {
        request: {
          query: DenyReservationDocument,
          variables: { input: { pk: 1, denyReason: 1, handlingDetails: "" } },
        },
        result: { data: { denyReservation: { pk: 1, state: "DENIED" } } },
      },
      {
        request: {
          query: RefundReservationDocument,
          variables: { input: { pk: 1 } },
        },
        result: { data: { refundReservation: { pk: 1 } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DenyDialog reservation={reservation} onClose={vi.fn()} onReject={onReject} />
      </MockedProvider>
    );

    expect(screen.getByText("radioLabel")).toBeInTheDocument();

    const user = await selectDenyReason();
    // Deny button should be disabled until a refund choice is made
    expect(screen.getByTestId("deny-dialog__deny-button")).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "returnChoice" }));
    await user.click(screen.getByTestId("deny-dialog__deny-button"));

    await waitFor(() => expect(onReject).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservation:DenyDialog.refund.mutationSuccess" });
  });

  it("shows 'not allowed' text when the reservation cannot be refunded", () => {
    render(
      <MockedProvider mocks={[]}>
        <DenyDialog
          reservation={createReservation({
            price: "10",
            paymentOrder: { id: "o1", orderUuid: null, status: OrderStatus.Draft, refundUuid: null },
          })}
          onClose={vi.fn()}
          onReject={vi.fn()}
        />
      </MockedProvider>
    );
    expect(screen.getByText("notAllowed")).toBeInTheDocument();
  });

  it("shows 'already refunded' text when the reservation was already refunded", () => {
    render(
      <MockedProvider mocks={[]}>
        <DenyDialog
          reservation={createReservation({
            price: "10",
            paymentOrder: { id: "o1", orderUuid: "uuid-1", status: OrderStatus.Paid, refundUuid: "refund-1" },
          })}
          onClose={vi.fn()}
          onReject={vi.fn()}
        />
      </MockedProvider>
    );
    expect(screen.getByText("alreadyRefunded")).toBeInTheDocument();
  });

  it("displays an error and does not call onReject when the deny mutation fails", async () => {
    const onReject = vi.fn();
    const mocks = [
      {
        request: {
          query: DenyReservationDocument,
          variables: { input: { pk: 1, denyReason: 1, handlingDetails: "" } },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DenyDialog reservation={createReservation({ price: "0" })} onClose={vi.fn()} onReject={onReject} />
      </MockedProvider>
    );

    const user = await selectDenyReason();
    await user.click(screen.getByTestId("deny-dialog__deny-button"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(onReject).not.toHaveBeenCalled();
  });
});

describe("DenyDialogSeries", () => {
  it("renders without a refund section and denies the series successfully", async () => {
    const onReject = vi.fn();
    const mocks = [
      {
        request: {
          query: DenyReservationSeriesDocument,
          variables: { input: { pk: 5, denyReason: 1, handlingDetails: "details" } },
        },
        result: { data: { denyReservationSeries: { denied: 1, future: 0 } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DenyDialogSeries
          initialHandlingDetails="details"
          reservationSeries={{ pk: 5 }}
          onClose={vi.fn()}
          onReject={onReject}
        />
      </MockedProvider>
    );

    expect(screen.queryByText("radioLabel")).not.toBeInTheDocument();

    const user = await selectDenyReason();
    await user.click(screen.getByTestId("deny-dialog__deny-button"));

    await waitFor(() => expect(onReject).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservation:DenyDialog.successNotify" });
  });

  it("displays an error when the reservation series pk is missing", async () => {
    render(
      <MockedProvider mocks={[]}>
        <DenyDialogSeries
          initialHandlingDetails=""
          reservationSeries={{ pk: null }}
          onClose={vi.fn()}
          onReject={vi.fn()}
        />
      </MockedProvider>
    );

    const user = await selectDenyReason();
    await user.click(screen.getByTestId("deny-dialog__deny-button"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
  });
});
