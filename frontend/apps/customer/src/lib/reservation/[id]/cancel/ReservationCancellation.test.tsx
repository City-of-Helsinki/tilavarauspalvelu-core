import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { createMockReservation } from "@test/reservation.mocks";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApplicationPath, getReservationPath } from "@/modules/urls";
import { CancelReservationDocument, ReservationCancelReasonChoice } from "@gql/gql-types";
import type { CancelReservationMutationVariables, ReservationCancelPageQuery } from "@gql/gql-types";
import { ReservationCancellation } from "./ReservationCancellation";

const { mockedRouterPush, useRouter, mockDisplayError } = vi.hoisted(() => {
  const mockedRouterPush = vi.fn();
  return {
    mockedRouterPush,
    mockDisplayError: vi.fn(),
    useRouter: () => ({
      push: mockedRouterPush,
    }),
  };
});

vi.mock("next/router", () => ({ useRouter }));
vi.mock("ui/src/hooks", () => ({ useDisplayError: () => mockDisplayError }));

type ReservationT = NonNullable<ReservationCancelPageQuery["reservation"]>;

function buildReservation(overrides: Partial<ReservationT> = {}): ReservationT {
  const base = createMockReservation({ pk: 5 });
  return {
    ...base,
    ...overrides,
  } as ReservationT;
}

function buildApplicationReservation(overrides: Partial<ReservationT> = {}): ReservationT {
  return buildReservation({
    reservationSeries: {
      id: "rs-1",
      name: "Test Series",
      allocatedTimeSlot: {
        id: "ats-1",
        pk: 1,
        reservationUnitOption: {
          id: "ruo-1",
          applicationSection: {
            id: "as-1",
            application: {
              id: "app-1",
              pk: 42,
              applicationRound: {
                id: "ar-1",
                termsOfUse: {
                  id: "tou-1",
                  textFi: "Series terms FI",
                  textEn: "Series terms EN",
                  textSv: "Series terms SV",
                },
              },
            },
          },
        },
      },
    },
    ...overrides,
  });
}

function customRender({
  reservation = buildReservation(),
  mocks = [],
}: {
  reservation?: ReservationT;
  mocks?: ReadonlyArray<MockedResponse>;
} = {}): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <ReservationCancellation reservation={reservation} />
    </MockedProvider>
  );
}

function createCancelReservationMock({
  onVariables,
  errors,
}: {
  onVariables?: (variables: CancelReservationMutationVariables) => void;
  errors?: ReadonlyArray<GraphQLError>;
} = {}): MockedResponse {
  return {
    request: { query: CancelReservationDocument },
    variableMatcher: () => true,
    result: (variables: CancelReservationMutationVariables) => {
      onVariables?.(variables);
      if (errors) {
        return { errors };
      }
      return { data: { cancelReservation: { pk: variables.input.pk } } };
    },
  };
}

async function selectReason(
  reason: ReservationCancelReasonChoice = ReservationCancelReasonChoice.ChangeOfPlans
): Promise<void> {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: /reservation:cancel.reason/i }));
  const option = await screen.findByRole("option", { name: `reservation:cancel.reasons.${reason}` });
  await user.click(option);
}

beforeEach(() => {
  mockedRouterPush.mockReset();
  mockDisplayError.mockReset();
});

describe("ReservationCancellation", () => {
  it("renders the plain reservation info card and cancellation terms", () => {
    customRender({ reservation: buildReservation() });

    expect(screen.getByText("reservation:cancel.ingress")).toBeInTheDocument();
    expect(screen.getByText("reservation:cancel.infoBody")).toBeInTheDocument();
    expect(screen.getByTestId("reservation__reservation-info-card__content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reservationUnit:cancellationTerms/i })).toBeInTheDocument();
  });

  it("does not render a cancellation terms accordion when none are available", () => {
    const reservation = buildReservation({
      reservationUnit: {
        ...buildReservation().reservationUnit,
        cancellationTerms: null,
      },
    });
    customRender({ reservation });

    expect(screen.queryByRole("button", { name: /reservationUnit:cancellationTerms/i })).not.toBeInTheDocument();
  });

  it("renders the application info card for a reservation that is part of an application", () => {
    customRender({ reservation: buildApplicationReservation() });

    expect(screen.getByText("reservation:cancel.ingressApplication")).toBeInTheDocument();
    expect(screen.getByText("reservation:cancel.infoBodyApplication")).toBeInTheDocument();
    expect(screen.queryByTestId("reservation__reservation-info-card__content")).not.toBeInTheDocument();
    expect(screen.getByText("Test Series")).toBeInTheDocument();
  });

  it("navigates to the reservation path with a deleted query param for a plain reservation", async () => {
    const reservation = buildReservation();
    let capturedVariables: CancelReservationMutationVariables | undefined;
    const mocks = [
      createCancelReservationMock({
        onVariables: (variables) => {
          capturedVariables = variables;
        },
      }),
    ];
    customRender({ reservation, mocks });

    await selectReason();
    await userEvent.click(screen.getByTestId("reservation-cancel__button--cancel"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(`${getReservationPath(reservation.pk)}?deleted=true`)
    );
    expect(capturedVariables?.input).toEqual({
      pk: reservation.pk,
      cancelReason: ReservationCancelReasonChoice.ChangeOfPlans,
    });
  });

  it("navigates to the application path with the deleted reservation pk for an application-linked reservation", async () => {
    const reservation = buildApplicationReservation();
    const mocks = [createCancelReservationMock()];
    customRender({ reservation, mocks });

    await selectReason();
    await userEvent.click(screen.getByTestId("reservation-cancel__button--cancel"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(`${getApplicationPath(42, "view")}?deletedReservationPk=5`)
    );
  });

  it("displays an error and does not navigate when the mutation fails", async () => {
    const reservation = buildReservation();
    const mocks = [createCancelReservationMock({ errors: [new GraphQLError("Boom")] })];
    customRender({ reservation, mocks });

    await selectReason();
    await userEvent.click(screen.getByTestId("reservation-cancel__button--cancel"));

    await waitFor(() => expect(mockDisplayError).toHaveBeenCalledTimes(1));
    expect(mockedRouterPush).not.toHaveBeenCalled();
  });
});
