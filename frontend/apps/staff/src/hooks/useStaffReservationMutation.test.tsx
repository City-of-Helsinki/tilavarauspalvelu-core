import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import type { UseStaffReservationFragment } from "@gql/gql-types";
import { MUTATION_DATA, createMocks } from "./__test__/mocks";
import { useStaffReservationMutation } from "./useStaffReservationMutation";
import type { MutationInputParams } from "./useStaffReservationMutation";

export function createMockReservation({ pk }: { pk: number }): UseStaffReservationFragment {
  return {
    id: createNodeId("ReservationNode", pk),
    pk,
    reservationSeries: null,
  };
}

function TestComponent({
  reservation,
  onSuccess,
  seriesName,
}: {
  reservation: UseStaffReservationFragment;
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

const successCb = vi.fn(() => {});

beforeEach(() => {
  successCb.mockReset();
});

describe("edit mutation hook single reservation", () => {
  const wrappedRender = (pk: number, onSuccess: () => void) => {
    const reservation = createMockReservation({ pk });
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
