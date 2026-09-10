import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
  StaffAdjustReservationTimeDocument,
  Weekday,
} from "@gql/gql-types";
import type { ChangeReservationTimeFragment } from "@gql/gql-types";
import { EditTimeModal, NewReservationModal } from "./EditTimeModal";

vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: vi.fn(), modalContent: { content: null } }),
}));

const mockUseCheckCollisions = vi.fn();
vi.mock("@/hooks", () => ({
  useCheckCollisions: (...args: unknown[]) => mockUseCheckCollisions(...args),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

function createReservation(overrides: Partial<ChangeReservationTimeFragment> = {}): ChangeReservationTimeFragment {
  // NOTE: use a date well in the future (relative to "now") and at fixed local
  // wall-clock hours so the date/time validation schema (which rejects past
  // dates) always passes regardless of when the test suite runs.
  const begin = new Date();
  begin.setDate(begin.getDate() + 7);
  begin.setHours(10, 0, 0, 0);
  const end = new Date(begin);
  end.setHours(11, 0, 0, 0);
  return {
    id: "1",
    pk: 1,
    beginsAt: begin.toISOString(),
    endsAt: end.toISOString(),
    type: ReservationTypeChoice.Staff,
    bufferTimeAfter: 900,
    bufferTimeBefore: 900,
    reservationSeries: null,
    reservationUnit: {
      id: "ru1",
      pk: 10,
      bufferTimeBefore: 900,
      bufferTimeAfter: 900,
      reservationStartInterval: ReservationStartInterval.Interval_15Minutes,
    },
    ...overrides,
  } as ChangeReservationTimeFragment;
}

beforeEach(() => {
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
  mockUseCheckCollisions.mockReset();
  mockUseCheckCollisions.mockReturnValue({ isLoading: false, hasCollisions: false });
});

async function makeFormDirty() {
  const user = userEvent.setup();
  // Toggling a buffer checkbox is the simplest way to make the form dirty
  // without needing to interact with the HDS date/time inputs.
  const [checkbox] = screen.getAllByRole("checkbox");
  if (!checkbox) {
    throw new Error("Expected at least one buffer checkbox to be rendered");
  }
  await user.click(checkbox);
  return user;
}

describe("EditTimeModal", () => {
  it("renders the original time and recurring info when part of a series", () => {
    const reservation = createReservation({
      reservationSeries: {
        pk: 3,
        id: "s1",
        weekdays: [Weekday.Monday, Weekday.Tuesday],
        beginDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    });
    render(
      <MockedProvider mocks={[]}>
        <EditTimeModal reservation={reservation} onAccept={vi.fn()} onClose={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText("EditTimeModal.title")).toBeInTheDocument();
    expect(screen.getByText("EditTimeModal.recurringInfoLabel:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("EditTimeModal.originalTime:", { exact: false })).toBeInTheDocument();
  });

  it("submits the new time and calls onAccept on success", async () => {
    const reservation = createReservation();
    const onAccept = vi.fn();
    const mocks = [
      {
        request: {
          query: StaffAdjustReservationTimeDocument,
          variables: {
            input: {
              beginsAt: reservation.beginsAt,
              endsAt: reservation.endsAt,
              pk: 1,
              bufferTimeAfter: 900,
              bufferTimeBefore: 0,
            },
          },
        },
        result: {
          data: {
            staffAdjustReservationTime: {
              pk: 1,
              beginsAt: reservation.beginsAt,
              endsAt: reservation.endsAt,
              state: "CONFIRMED",
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <EditTimeModal reservation={reservation} onAccept={onAccept} onClose={vi.fn()} />
      </MockedProvider>
    );

    const user = await makeFormDirty();
    await user.click(screen.getByRole("button", { name: "reservation:EditTimeModal.acceptBtn" }));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "EditTimeModal.successToast" });
  });

  it("disables submission and shows a notification when there are collisions", async () => {
    mockUseCheckCollisions.mockReturnValue({ isLoading: false, hasCollisions: true });
    const reservation = createReservation();

    render(
      <MockedProvider mocks={[]}>
        <EditTimeModal reservation={reservation} onAccept={vi.fn()} onClose={vi.fn()} />
      </MockedProvider>
    );

    await makeFormDirty();
    expect(screen.getAllByText("reservation:CommonModal.error.reservationCollides").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "reservation:EditTimeModal.acceptBtn" })).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]}>
        <EditTimeModal reservation={createReservation()} onAccept={vi.fn()} onClose={onClose} />
      </MockedProvider>
    );

    await user.click(screen.getByRole("button", { name: "common:cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays an error toast when the mutation fails", async () => {
    const reservation = createReservation();
    const mocks = [
      {
        request: {
          query: StaffAdjustReservationTimeDocument,
          variables: {
            input: {
              beginsAt: reservation.beginsAt,
              endsAt: reservation.endsAt,
              pk: 1,
              bufferTimeAfter: 900,
              bufferTimeBefore: 0,
            },
          },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <EditTimeModal reservation={reservation} onAccept={vi.fn()} onClose={vi.fn()} />
      </MockedProvider>
    );

    const user = await makeFormDirty();
    await user.click(screen.getByRole("button", { name: "reservation:EditTimeModal.acceptBtn" }));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
  });
});

describe("NewReservationModal", () => {
  function createReservationToCopy(
    overrides: Partial<ChangeReservationTimeFragment> = {}
  ): ChangeReservationTimeFragment {
    return createReservation({
      reservationSeries: { pk: 7, id: "s1", weekdays: [], beginDate: "2024-01-01", endDate: "2024-12-31" },
      ...overrides,
    });
  }

  it("renders the dialog with an empty date/time form ready for user input", () => {
    render(
      <MockedProvider mocks={[]}>
        <NewReservationModal reservationToCopy={createReservationToCopy()} onAccept={vi.fn()} onClose={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText("NewReservationModal.title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reservation:NewReservationModal.acceptBtn" })).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]}>
        <NewReservationModal reservationToCopy={createReservationToCopy()} onAccept={vi.fn()} onClose={onClose} />
      </MockedProvider>
    );

    await user.click(screen.getByRole("button", { name: "common:cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
