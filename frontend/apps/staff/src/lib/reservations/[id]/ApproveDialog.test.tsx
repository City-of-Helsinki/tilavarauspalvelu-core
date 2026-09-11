import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApproveReservationDocument } from "@gql/gql-types";
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

function createReservation(overrides: Partial<ApprovalDialogFieldsFragment> = {}): ApprovalDialogFieldsFragment {
  return {
    pk: 1,
    price: "0",
    handlingDetails: "",
    applyingForFreeOfCharge: false,
    freeOfChargeReason: null,
    ...overrides,
  } as ApprovalDialogFieldsFragment;
}

beforeEach(() => {
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

describe("ApproveDialog", () => {
  it("renders handling details and accepts with the default price", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, price: "0", handlingDetails: "" } },
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
          variables: { input: { pk: 1, price: "0", handlingDetails: "" } },
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

  it("displays an error and does not call onAccept when the mutation fails", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: ApproveReservationDocument,
          variables: { input: { pk: 1, price: "0", handlingDetails: "" } },
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
