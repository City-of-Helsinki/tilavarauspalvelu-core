import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReservationType } from "common/types/gql-types";
import * as NotificationContext from "app/context/NotificationContext";
import { useStaffReservationMutation } from ".";
import {
  MUTATION_DATA,
  NotificationMock,
  mockRecurringReservation,
  mockReservation,
  mocks,
} from "./__test__/mocks";

const TestComponent = ({
  reservation,
  onSuccess,
  seriesName,
}: {
  reservation: ReservationType;
  onSuccess: () => void;
  seriesName?: string;
}) => {
  const mutationFn = useStaffReservationMutation({
    reservation,
    onSuccess,
  });

  const input = {
    ...MUTATION_DATA.input,
    ...MUTATION_DATA.workingMemo,
    pk: reservation.pk ?? 0,
    seriesName,
  };
  return (
    <button type="button" onClick={() => mutationFn(input)}>
      mutate
    </button>
  );
};

const successCb = jest.fn(() => {});
const failNotifyCb = jest.fn(() => {});
const successNotifyCb = jest.fn(() => {});

beforeEach(() => {
  successCb.mockReset();
  successNotifyCb.mockReset();
  failNotifyCb.mockReset();
  jest.spyOn(NotificationContext, "useNotification").mockImplementation(() => ({
    ...NotificationMock,
    notifyError: failNotifyCb,
    notifySuccess: successNotifyCb,
  }));
});

describe("edit mutation hook single reservation", () => {
  const wrappedRender = (pk: number, onSuccess: () => void) => {
    const reservation = { ...mockReservation, pk };
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TestComponent reservation={reservation} onSuccess={onSuccess} />
      </MockedProvider>
    );
  };

  test("edit mutation hook single reservation", async () => {
    const view = wrappedRender(1, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
    expect(failNotifyCb).not.toHaveBeenCalled();
    expect(successNotifyCb).toHaveBeenCalled();
  });

  test("reservation failing with network error gets retried once", async () => {
    const view = wrappedRender(101, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
    expect(failNotifyCb).not.toHaveBeenCalled();
    expect(successNotifyCb).toHaveBeenCalled();
  });

  test("reservation failing with network error twice fails", async () => {
    const view = wrappedRender(102, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(failNotifyCb).toHaveBeenCalled());
    expect(successCb).not.toHaveBeenCalled();
    expect(successNotifyCb).not.toHaveBeenCalled();
  });

  test("reservation failing with GQL error", async () => {
    const view = wrappedRender(111, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    // TODO should check the error message also
    await waitFor(() => expect(failNotifyCb).toHaveBeenCalled());
    expect(successCb).not.toHaveBeenCalled();
    expect(successNotifyCb).not.toHaveBeenCalled();
  });

  test("reservation 666 doesn't exist causes an Error", async () => {
    const view = wrappedRender(666, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    // TODO should check the error message also
    await waitFor(() => expect(failNotifyCb).toHaveBeenCalled());
    expect(successCb).not.toHaveBeenCalled();
    expect(successNotifyCb).not.toHaveBeenCalled();
  });
});

describe("edit mutation hook recurring reservation", () => {
  const wrappedRender = (
    pk: number,
    recurringPk: number,
    onSuccess: () => void
  ) => {
    const reservation: ReservationType = {
      ...mockRecurringReservation,
      pk,
      recurringReservation: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...mockRecurringReservation.recurringReservation!,
        pk: recurringPk,
      },
    };
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TestComponent
          reservation={reservation}
          onSuccess={onSuccess}
          seriesName="Modify recurring name"
        />
      </MockedProvider>
    );
  };

  test("success mutating recurring reservation", async () => {
    const view = wrappedRender(21, 1, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(successNotifyCb).not.toHaveBeenCalled();
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successNotifyCb).toHaveBeenCalled());
    expect(successCb).toHaveBeenCalled();
    expect(failNotifyCb).not.toHaveBeenCalled();
  });

  test("successful retry if a single mutation fails once with a network error", async () => {
    const view = wrappedRender(31, 2, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(successNotifyCb).not.toHaveBeenCalled();
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
    expect(failNotifyCb).not.toHaveBeenCalled();
    expect(successNotifyCb).toHaveBeenCalled();
  });

  test("fail if a single mutation fails twice with a network error", async () => {
    const view = wrappedRender(51, 4, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(failNotifyCb).not.toHaveBeenCalled();
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(failNotifyCb).toHaveBeenCalled());
    expect(successCb).not.toHaveBeenCalled();
    expect(successNotifyCb).not.toHaveBeenCalled();
  });

  test.todo("all already denied should fail mutations");
  test.todo("all in the past should fail mutations");
  test.todo("edit mutation hook recurring reservation failing with GQL error");
});
