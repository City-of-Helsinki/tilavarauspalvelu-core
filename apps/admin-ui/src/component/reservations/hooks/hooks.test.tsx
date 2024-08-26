import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReservationNode } from "@gql/gql-types";
import { type MutationInputParams, useStaffReservationMutation } from ".";
import {
  MUTATION_DATA,
  mockRecurringReservation,
  mockReservation,
  mocks,
} from "./__test__/mocks";

function TestComponent({
  reservation,
  onSuccess,
  seriesName,
}: {
  reservation: ReservationNode;
  onSuccess: () => void;
  seriesName?: string;
}): JSX.Element {
  const mutationFn = useStaffReservationMutation({
    reservation,
    onSuccess,
  });

  const input: MutationInputParams = {
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
}

const successCb = jest.fn(() => {});

beforeEach(() => {
  successCb.mockReset();
});

// FIXME mock types are broken because of backend changes that were not supposed to be included in this PR
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
  });

  test("reservation failing with network error gets retried once", async () => {
    const view = wrappedRender(101, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
  });

  test("reservation failing with network error twice fails", async () => {
    const view = wrappedRender(102, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    expect(successCb).not.toHaveBeenCalled();
  });

  // FIXME fails with missing pk 111 in the mocks
  test.skip("reservation failing with GQL error", async () => {
    const view = wrappedRender(111, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    // TODO should check the error message also
    expect(successCb).not.toHaveBeenCalled();
  });

  // FIXME fails with missing pk 666 in the mocks
  test.skip("reservation 666 doesn't exist causes an Error", async () => {
    const view = wrappedRender(666, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    // TODO should check the error message also
    expect(successCb).not.toHaveBeenCalled();
  });
});

// FIXME mock types are broken because of backend changes that were not supposed to be included in this PR
describe("edit mutation hook recurring reservation", () => {
  const wrappedRender = (
    pk: number,
    recurringPk: number,
    onSuccess: () => void
  ) => {
    const reservation: ReservationNode = {
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
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    expect(successCb).toHaveBeenCalled();
  });

  // FIXME causes Apollo error to be logged in console
  test("successful retry if a single mutation fails once with a network error", async () => {
    const view = wrappedRender(31, 2, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
  });

  // FIXME broken still
  test.skip("fail if a single mutation fails twice with a network error", async () => {
    const view = wrappedRender(51, 4, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    expect(successCb).not.toHaveBeenCalled();
  });

  test.todo("all already denied should fail mutations");
  test.todo("all in the past should fail mutations");
  test.todo("edit mutation hook recurring reservation failing with GQL error");
});
