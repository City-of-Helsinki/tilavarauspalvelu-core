import React, { createRef } from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireHandlingDocument } from "@gql/gql-types";
import { ReturnToRequiresHandlingDialog } from "./ReturnToRequiresHandlingDialog";

vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: vi.fn(), modalContent: { content: null } }),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

beforeEach(() => {
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

function renderDialog(mocks: ReadonlyArray<MockedResponse>, reservation: { pk: number | null } = { pk: 1 }) {
  const onClose = vi.fn();
  const onAccept = vi.fn();
  const focusAfterCloseRef = createRef<HTMLElement>();
  render(
    <MockedProvider mocks={mocks}>
      <ReturnToRequiresHandlingDialog
        reservation={reservation}
        onClose={onClose}
        onAccept={onAccept}
        focusAfterCloseRef={focusAfterCloseRef as React.RefObject<HTMLElement>}
      />
    </MockedProvider>
  );
  return { onClose, onAccept };
}

describe("ReturnToRequiresHandlingDialog", () => {
  it("returns the reservation to handling and calls onAccept", async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: { query: RequireHandlingDocument, variables: { input: { pk: 1 } } },
        result: { data: { requireHandlingForReservation: { pk: 1, state: "REQUIRES_HANDLING" } } },
      },
    ];
    const { onAccept } = renderDialog(mocks);

    await user.click(screen.getByText("reservation:ReturnToRequiresHandlingDialog.accept"));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservation:ReturnToRequiresHandlingDialog.returned" });
  });

  it("closes on cancel without calling the mutation", async () => {
    const user = userEvent.setup();
    const { onClose, onAccept } = renderDialog([]);

    await user.click(screen.getByText("common:prev"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("displays an error when the reservation pk is missing", async () => {
    const user = userEvent.setup();
    const { onAccept } = renderDialog([], { pk: null });

    await user.click(screen.getByText("reservation:ReturnToRequiresHandlingDialog.accept"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("displays an error when the mutation fails", async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: { query: RequireHandlingDocument, variables: { input: { pk: 1 } } },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];
    const { onAccept } = renderDialog(mocks);

    await user.click(screen.getByText("reservation:ReturnToRequiresHandlingDialog.accept"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
  });
});
