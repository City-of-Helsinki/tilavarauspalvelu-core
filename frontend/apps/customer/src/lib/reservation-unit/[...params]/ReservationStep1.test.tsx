import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { createMockReservation, createOptionsMock } from "@test/reservation.mocks";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmReservationDocument, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationQuery } from "@gql/gql-types";
import { getCheckoutUrl } from "@/modules/reservation";
import { getReservationInProgressPath, getReservationPath, getReservationUnitPath } from "@/modules/urls";
import { ReservationStep1 } from "./ReservationStep1";

// SummaryGeneralFields/SummaryReserveeFields are already covered by their own
// SummaryFields.test.tsx - stub them so this test can focus on ReservationStep1's
// own submit/state-branching/navigation logic.
vi.mock("@/components/reservation", async (importOriginal) => ({
  ...(await importOriginal()),
  SummaryGeneralFields: () => <div data-testid="mock-general-fields" />,
  SummaryReserveeFields: () => <div data-testid="mock-reservee-fields" />,
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

function createConfirmReservationMock({
  data,
  errors,
}: {
  data?: Record<string, unknown>;
  errors?: ReadonlyArray<GraphQLError>;
} = {}) {
  return {
    request: {
      query: ConfirmReservationDocument,
    },
    variableMatcher: () => true,
    result: errors ? { errors } : { data: { confirmReservation: data } },
  };
}

async function acceptAllTerms(): Promise<void> {
  const checkboxes = screen.getAllByTestId("terms-box__checkbox--accept-terms");
  for (const checkbox of checkboxes) {
    await userEvent.click(checkbox);
  }
}

function nthElement(elements: ReadonlyArray<HTMLElement>, index: number): HTMLElement {
  const element = elements[index];
  if (element == null) {
    throw new Error(`Expected an element at index ${index}`);
  }
  return element;
}

function customRender({
  reservation = buildReservation(),
  mocks = [],
  requiresPayment = false,
}: {
  reservation?: ReservationT;
  mocks?: ReadonlyArray<MockedResponse>;
  requiresPayment?: boolean;
} = {}): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <ReservationStep1 reservation={reservation} options={createOptionsMock()} requiresPayment={requiresPayment} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockedRouterPush.mockReset();
});

describe("ReservationStep1", () => {
  it("disables the continue button until both terms are accepted", async () => {
    customRender();
    const continueButton = screen.getByTestId("reservation__button--continue");
    expect(continueButton).toBeDisabled();

    const checkboxes = screen.getAllByTestId("terms-box__checkbox--accept-terms");
    expect(checkboxes).toHaveLength(2);
    await userEvent.click(nthElement(checkboxes, 0));
    expect(continueButton).toBeDisabled();

    await userEvent.click(nthElement(checkboxes, 1));
    expect(continueButton).toBeEnabled();
  });

  it("navigates back to step 0 when the prev button is clicked", async () => {
    const reservation = buildReservation();
    customRender({ reservation });

    await userEvent.click(screen.getByTestId("reservation__button--prev"));

    expect(mockedRouterPush).toHaveBeenCalledWith(getReservationInProgressPath(1, reservation.pk, 0));
  });

  it("navigates to the confirmed reservation path when the state is Confirmed", async () => {
    const reservation = buildReservation();
    const mocks = [
      createConfirmReservationMock({
        data: { pk: reservation.pk, state: ReservationStateChoice.Confirmed, order: null },
      }),
    ];
    customRender({ reservation, mocks });

    await acceptAllTerms();
    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(getReservationPath(reservation.pk, undefined, "confirmed"))
    );
  });

  it("navigates to the requires-handling reservation path when the state is RequiresHandling", async () => {
    const reservation = buildReservation();
    const mocks = [
      createConfirmReservationMock({
        data: { pk: reservation.pk, state: ReservationStateChoice.RequiresHandling, order: null },
      }),
    ];
    customRender({ reservation, mocks });

    await acceptAllTerms();
    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(getReservationPath(reservation.pk, undefined, "requires_handling"))
    );
  });

  it("navigates to the checkout url when the state is WaitingForPayment", async () => {
    const reservation = buildReservation();
    const checkoutUrl = "https://example.com/checkout";
    const mocks = [
      createConfirmReservationMock({
        data: {
          pk: reservation.pk,
          state: ReservationStateChoice.WaitingForPayment,
          order: { id: "1", checkoutUrl },
        },
      }),
    ];
    customRender({ reservation, mocks, requiresPayment: true });

    await acceptAllTerms();
    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    const expectedUrl = getCheckoutUrl({ checkoutUrl }, "fi");
    await waitFor(() => expect(mockedRouterPush).toHaveBeenCalledWith(expectedUrl));
  });

  it("navigates to the reservation unit path when the mutation fails with a NOT_FOUND error", async () => {
    const reservation = buildReservation();
    const mocks = [
      createConfirmReservationMock({
        errors: [new GraphQLError("Not found", { extensions: { code: "NOT_FOUND" } })],
      }),
    ];
    customRender({ reservation, mocks });

    await acceptAllTerms();
    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(mockedRouterPush).toHaveBeenCalledWith(getReservationUnitPath(1)));
  });

  it("does not navigate when the mutation fails with a generic error", async () => {
    const reservation = buildReservation();
    const mocks = [
      createConfirmReservationMock({
        errors: [new GraphQLError("Boom", { extensions: { code: "GENERIC_ERROR" } })],
      }),
    ];
    customRender({ reservation, mocks });

    await acceptAllTerms();
    const continueButton = screen.getByTestId("reservation__button--continue");
    await userEvent.click(continueButton);

    await waitFor(() => expect(continueButton).not.toBeDisabled());
    expect(mockedRouterPush).not.toHaveBeenCalled();
  });

  it("shows the waiting-for-payment label when payment is required", () => {
    customRender({ requiresPayment: true });
    expect(screen.getByTestId("reservation__button--continue")).toHaveTextContent(
      "notification:waitingForPayment.continueButton"
    );
  });
});
