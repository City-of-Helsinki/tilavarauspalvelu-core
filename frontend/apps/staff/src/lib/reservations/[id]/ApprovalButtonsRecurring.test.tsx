import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStateChoice } from "@gql/gql-types";
import { ApprovalButtonsRecurring } from "./ApprovalButtonsRecurring";

const mockSetModalContent = vi.fn();
vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: mockSetModalContent, modalContent: { content: null } }),
}));

const mockUseReservationSeries = vi.fn();
vi.mock("@/hooks", () => ({
  useReservationSeries: (pk: number | undefined) => mockUseReservationSeries(pk),
}));

function reservation(overrides: Partial<{ pk: number; state: ReservationStateChoice; beginsAt: string }> = {}) {
  return {
    pk: 1,
    state: ReservationStateChoice.RequiresHandling,
    beginsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    handlingDetails: "",
    ...overrides,
  };
}

beforeEach(() => {
  mockSetModalContent.mockReset();
  mockUseReservationSeries.mockReset();
});

describe("ApprovalButtonsRecurring", () => {
  it("renders nothing while loading", () => {
    mockUseReservationSeries.mockReturnValue({ loading: true, reservations: [], refetch: vi.fn() });
    const { container } = render(
      <ApprovalButtonsRecurring reservationSeries={{ pk: 1 }} handleClose={vi.fn()} handleAccept={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no reservation in the series can be denied", () => {
    mockUseReservationSeries.mockReturnValue({
      loading: false,
      reservations: [reservation({ state: ReservationStateChoice.Denied })],
      refetch: vi.fn(),
    });
    const { container } = render(
      <ApprovalButtonsRecurring reservationSeries={{ pk: 1 }} handleClose={vi.fn()} handleAccept={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the reject button and edit links, opening the deny dialog on click", async () => {
    const user = userEvent.setup();
    mockUseReservationSeries.mockReturnValue({
      loading: false,
      reservations: [reservation({ pk: 7 })],
      refetch: vi.fn(),
    });

    render(<ApprovalButtonsRecurring reservationSeries={{ pk: 1 }} handleClose={vi.fn()} handleAccept={vi.fn()} />);

    expect(screen.getByTestId("approval-buttons-recurring__edit-link")).toHaveAttribute("href", "/reservations/7/edit");
    expect(screen.getByText("reservation:ApprovalButtons.editSeriesTime")).toHaveAttribute(
      "href",
      "/reservations/7/series"
    );

    await user.click(screen.getByTestId("approval-buttons-recurring__reject-button"));
    expect(mockSetModalContent).toHaveBeenCalledTimes(1);
  });

  it("hides the non-essential edit links when disableNonEssentialButtons is set", () => {
    mockUseReservationSeries.mockReturnValue({
      loading: false,
      reservations: [reservation()],
      refetch: vi.fn(),
    });

    render(
      <ApprovalButtonsRecurring
        reservationSeries={{ pk: 1 }}
        handleClose={vi.fn()}
        handleAccept={vi.fn()}
        disableNonEssentialButtons
      />
    );

    expect(screen.getByTestId("approval-buttons-recurring__reject-button")).toBeInTheDocument();
    expect(screen.queryByTestId("approval-buttons-recurring__edit-link")).not.toBeInTheDocument();
  });

  it("only considers reservations that are still possible to deny", () => {
    mockUseReservationSeries.mockReturnValue({
      loading: false,
      reservations: [
        reservation({ pk: 1, state: ReservationStateChoice.Denied }),
        reservation({ pk: 9, state: ReservationStateChoice.RequiresHandling }),
      ],
      refetch: vi.fn(),
    });

    render(<ApprovalButtonsRecurring reservationSeries={{ pk: 1 }} handleClose={vi.fn()} handleAccept={vi.fn()} />);

    expect(screen.getByTestId("approval-buttons-recurring__edit-link")).toHaveAttribute("href", "/reservations/9/edit");
  });
});
