import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApproveReservationDocument, PriceUnit } from "@gql/gql-types";
import type { ApprovalDialogFieldsFragment } from "@gql/gql-types";
import { ApproveDialog } from "./ApproveDialog";

vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: vi.fn(), modalContent: { content: null } }),
}));

vi.mock("@/modules/reservation", () => ({
  getReservationPriceDetails: () => "price details",
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

type PriceLine = NonNullable<ApprovalDialogFieldsFragment["priceLines"]>[number];

function createPriceLine(overrides: Partial<PriceLine> = {}): PriceLine {
  return {
    id: "UmVzZXJ2YXRpb25QcmljZUxpbmVOb2RlOjI=",
    pk: 2,
    quantity: "1.0000",
    priceUnit: PriceUnit.PerHour,
    unitAmount: "0",
    amount: "0",
    overrideAmount: null,
    taxPercentage: "25.5",
    ...overrides,
  };
}

function createReservation(overrides: Partial<ApprovalDialogFieldsFragment> = {}): ApprovalDialogFieldsFragment {
  return {
    pk: 1,
    price: "0",
    handlingDetails: "",
    applyingForFreeOfCharge: false,
    freeOfChargeReason: null,
    priceLines: [createPriceLine()],
    ...overrides,
  } as ApprovalDialogFieldsFragment;
}

beforeEach(() => {
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

describe("ApproveDialog", () => {
  it("renders handling details and accepts without changing the price line", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", priceLines: [{ pk: 2, overrideAmount: null }] } },
        },
        result: { data: { approveReservation: { pk: 1, state: "CONFIRMED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog reservation={createReservation()} onClose={vi.fn()} onAccept={onAccept} />
      </MockedProvider>
    );

    expect(screen.queryByText("price details")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservation:ApproveDialog.approved" });
  });

  it("closes on cancel", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]}>
        <ApproveDialog reservation={createReservation()} onClose={onClose} onAccept={vi.fn()} />
      </MockedProvider>
    );

    await user.click(screen.getByTestId("approval-dialog__cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the subvention section, zeroes the price via the clear-price checkbox, and submits", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", priceLines: [{ pk: 2, overrideAmount: "0" }] } },
        },
        result: { data: { approveReservation: { pk: 1, state: "CONFIRMED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog
          reservation={createReservation({
            price: "10",
            applyingForFreeOfCharge: true,
            freeOfChargeReason: "reason",
            priceLines: [createPriceLine({ amount: "10" })],
          })}
          onClose={vi.fn()}
          onAccept={onAccept}
        />
      </MockedProvider>
    );

    expect(screen.getByText("price details")).toBeInTheDocument();
    expect(screen.getByText("reason")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "reservation:ApproveDialog.clearPrice" }));
    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });

  it("sends the entered price as the override of the price line", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", priceLines: [{ pk: 2, overrideAmount: "5" }] } },
        },
        result: { data: { approveReservation: { pk: 1, state: "CONFIRMED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog
          reservation={createReservation({
            price: "10",
            applyingForFreeOfCharge: true,
            priceLines: [createPriceLine({ amount: "10" })],
          })}
          onClose={vi.fn()}
          onAccept={onAccept}
        />
      </MockedProvider>
    );

    const priceInput = screen.getByRole("spinbutton");
    expect(priceInput).toHaveValue(10);
    await user.clear(priceInput);
    await user.type(priceInput, "5");
    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });

  it("keeps the current override of the price line when the price is not shown", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", priceLines: [{ pk: 2, overrideAmount: "7" }] } },
        },
        result: { data: { approveReservation: { pk: 1, state: "CONFIRMED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog
          reservation={createReservation({ priceLines: [createPriceLine({ amount: "10", overrideAmount: "7" })] })}
          onClose={vi.fn()}
          onAccept={onAccept}
        />
      </MockedProvider>
    );

    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });

  it("sends the price when the reservation has no price lines", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", price: "10" } },
        },
        result: { data: { approveReservation: { pk: 1, state: "CONFIRMED" } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog
          reservation={createReservation({ price: "10", priceLines: [] })}
          onClose={vi.fn()}
          onAccept={onAccept}
        />
      </MockedProvider>
    );

    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });

  it("displays an error and does not call onAccept when the mutation fails", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, handlingDetails: "", priceLines: [{ pk: 2, overrideAmount: null }] } },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ApproveDialog reservation={createReservation()} onClose={vi.fn()} onAccept={onAccept} />
      </MockedProvider>
    );

    await user.click(screen.getByTestId("approval-dialog__accept-button"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
  });
});
