import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { createMockReservation, createOptionsMock } from "@test/reservation.mocks";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReservationInProgressPath, getReservationUnitPath } from "@/modules/urls";
import { ReservationStateChoice, ReserveeType, UpdateReservationDocument } from "@gql/gql-types";
import type { ReservationQuery, ReservationUpdateMutationInput } from "@gql/gql-types";
import { ReservationStep0 } from "./ReservationStep0";

// The general/reservee form sections render the full metadata-set driven UI
// (heavy, already covered by their own tests) - stub them so this test can
// focus on ReservationStep0's own submit/transform/navigation logic.
vi.mock("@ui/components/reservation-form", () => ({
  ReservationFormGeneralSection: () => <div data-testid="mock-general-section" />,
  ReservationFormReserveeSection: () => <div data-testid="mock-reservee-section" />,
}));

const { mockedRouterPush, useRouter } = vi.hoisted(() => {
  const mockedRouterPush = vi.fn();
  return {
    mockedRouterPush,
    useRouter: () => ({
      push: mockedRouterPush,
    }),
  };
});

vi.mock("next/router", () => ({ useRouter }));

type ReservationT = NonNullable<ReservationQuery["reservation"]>;

function buildReservation(overrides: Partial<ReservationT> = {}): ReservationT {
  const base = createMockReservation({ pk: 1 });
  return {
    ...base,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    reservationUnit: {
      ...base.reservationUnit,
      minPersons: 1,
      maxPersons: 10,
      requireReservationHandling: false,
    },
    ...overrides,
  };
}

function customRender({
  reservation = buildReservation(),
  mocks = [],
  cancelReservation = vi.fn(),
}: {
  reservation?: ReservationT;
  mocks?: ReadonlyArray<MockedResponse>;
  cancelReservation?: () => void;
} = {}): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <ReservationStep0 reservation={reservation} cancelReservation={cancelReservation} options={createOptionsMock()} />
    </MockedProvider>
  );
}

function createUpdateReservationMock({
  state = ReservationStateChoice.RequiresHandling,
  onVariables,
  errors,
}: {
  state?: ReservationStateChoice;
  onVariables?: (variables: { input: ReservationUpdateMutationInput }) => void;
  errors?: ReadonlyArray<GraphQLError>;
} = {}) {
  return {
    request: {
      query: UpdateReservationDocument,
    },
    variableMatcher: () => true,
    result: (variables: { input: ReservationUpdateMutationInput }) => {
      onVariables?.(variables);
      if (errors) {
        return { errors };
      }
      return {
        data: {
          updateReservation: {
            pk: 1,
            state,
          },
        },
      };
    },
  };
}

beforeEach(() => {
  mockedRouterPush.mockReset();
});

describe("ReservationStep0", () => {
  it("renders the form with continue and cancel buttons", () => {
    customRender();
    expect(screen.getByTestId("reservation__button--continue")).toBeInTheDocument();
    expect(screen.getByTestId("reservation__button--cancel")).toBeInTheDocument();
  });

  it("calls cancelReservation when the cancel button is clicked", async () => {
    const cancelReservation = vi.fn();
    customRender({ cancelReservation });
    await userEvent.click(screen.getByTestId("reservation__button--cancel"));
    expect(cancelReservation).toHaveBeenCalledTimes(1);
  });

  it("navigates to the in-progress step 1 path when the mutation does not cancel the reservation", async () => {
    const reservation = buildReservation();
    const mocks = [createUpdateReservationMock({ state: ReservationStateChoice.RequiresHandling })];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(getReservationInProgressPath(1, reservation.pk, 1))
    );
  });

  it("navigates to the reservation unit path when the mutation cancels the reservation", async () => {
    const reservation = buildReservation();
    const mocks = [createUpdateReservationMock({ state: ReservationStateChoice.Cancelled })];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(mockedRouterPush).toHaveBeenCalledWith(getReservationUnitPath(1)));
  });

  it("navigates to the reservation unit path when the mutation fails with a NOT_FOUND error", async () => {
    const reservation = buildReservation();
    const mocks = [
      createUpdateReservationMock({
        errors: [new GraphQLError("Not found", { extensions: { code: "NOT_FOUND" } })],
      }),
    ];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(mockedRouterPush).toHaveBeenCalledWith(getReservationUnitPath(1)));
  });

  it("does not navigate when the mutation fails with a generic error", async () => {
    const reservation = buildReservation();
    const mocks = [
      createUpdateReservationMock({
        errors: [new GraphQLError("Boom", { extensions: { code: "GENERIC_ERROR" } })],
      }),
    ];
    customRender({ reservation, mocks });

    const continueButton = screen.getByTestId("reservation__button--continue");
    await userEvent.click(continueButton);

    await waitFor(() => expect(continueButton).not.toBeDisabled());
    expect(mockedRouterPush).not.toHaveBeenCalled();
  });

  it("clears reserveeIdentifier for individual reservees regardless of the stored value", async () => {
    const reservation = buildReservation({ reserveeType: ReserveeType.Individual, reserveeIdentifier: "1234567-8" });
    let capturedVariables: { input: ReservationUpdateMutationInput } | undefined;
    const mocks = [
      createUpdateReservationMock({
        onVariables: (variables) => {
          capturedVariables = variables;
        },
      }),
    ];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(capturedVariables).toBeDefined());
    expect(capturedVariables?.input.reserveeIdentifier).toBe("");
    expect(capturedVariables?.input.reserveeType).toBe(ReserveeType.Individual);
  });

  it("keeps reserveeIdentifier for a registered nonprofit reservee", async () => {
    const reservation = buildReservation({
      reserveeType: ReserveeType.Nonprofit,
      reserveeIdentifier: "1234567-8",
    });
    let capturedVariables: { input: ReservationUpdateMutationInput } | undefined;
    const mocks = [
      createUpdateReservationMock({
        onVariables: (variables) => {
          capturedVariables = variables;
        },
      }),
    ];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(capturedVariables).toBeDefined());
    expect(capturedVariables?.input.reserveeIdentifier).toBe("1234567-8");
  });

  it("forces empty freeOfChargeReason when applyingForFreeOfCharge is false", async () => {
    const reservation = buildReservation({
      applyingForFreeOfCharge: false,
      freeOfChargeReason: "Some reason that should be dropped",
    });
    let capturedVariables: { input: ReservationUpdateMutationInput } | undefined;
    const mocks = [
      createUpdateReservationMock({
        onVariables: (variables) => {
          capturedVariables = variables;
        },
      }),
    ];
    customRender({ reservation, mocks });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(capturedVariables).toBeDefined());
    expect(capturedVariables?.input.freeOfChargeReason).toBe("");
  });
});
