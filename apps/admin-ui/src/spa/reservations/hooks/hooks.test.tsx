import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReservationQuery } from "@gql/gql-types";
import { type MutationInputParams, useStaffReservationMutation } from ".";
import {
  MUTATION_DATA,
  createMockRecurringReservation,
  mockReservation,
  createMocks,
} from "./__test__/mocks";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
function TestComponent({
  reservation,
  onSuccess,
  seriesName,
}: {
  reservation: ReservationType;
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

describe("edit mutation hook single reservation", () => {
  const wrappedRender = (pk: number, onSuccess: () => void) => {
    const reservation = { ...mockReservation, pk };
    return render(
      <MockedProvider mocks={createMocks()} addTypename={false}>
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

// TODO all of these tests are broken
describe.skip("edit mutation hook recurring reservation", () => {
  const wrappedRender = (
    pk: number,
    recurringPk: number,
    onSuccess: () => void
  ) => {
    const reservation = createMockRecurringReservation({
      pk,
      recurringPk,
    });
    return render(
      <MockedProvider mocks={createMocks()} addTypename={false}>
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

  test("successful retry if a single mutation fails once with a network error", async () => {
    const view = wrappedRender(31, 2, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(btn);

    await waitFor(() => expect(successCb).toHaveBeenCalled());
  });

  test("fail if a single mutation fails twice with a network error", async () => {
    const view = wrappedRender(51, 4, successCb);
    const btn = view.getByRole("button", { name: /mutate/i });
    expect(btn).toBeInTheDocument();
    const user = userEvent.setup({ delay: null });
    await user.click(btn);

    expect(successCb).not.toHaveBeenCalled();
  });

  test.todo("all already denied should fail mutations");
  test.todo("all in the past should fail mutations");
  test.todo("edit mutation hook recurring reservation failing with GQL error");
});
