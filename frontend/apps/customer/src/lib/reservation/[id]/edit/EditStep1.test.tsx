import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { createMockReservation, createOptionsMock } from "@test/reservation.mocks";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { transformReservation } from "@/modules/reservation";
import { PendingReservationFormSchema } from "@/modules/schemas/reservationUnit";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { getReservationPath } from "@/modules/urls";
import { AdjustReservationTimeDocument } from "@gql/gql-types";
import type { EditPageReservationFragment } from "@gql/gql-types";
import { EditStep1 } from "./EditStep1";

// SummaryGeneralFields/SummaryReserveeFields are already covered by
// SummaryFields.test.tsx - stub them so this test can focus on EditStep1's
// own submit/terms-acceptance/navigation logic.
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

function buildReservation(): EditPageReservationFragment {
  const base = createMockReservation({ pk: 1 });
  return {
    ...base,
    reservationUnit: {
      ...base.reservationUnit,
      applicationRounds: [],
      reservableTimeSpans: [],
      minReservationDuration: null,
      maxReservationDuration: null,
      reservationStartInterval: null,
    },
  } as unknown as EditPageReservationFragment;
}

function createAdjustReservationTimeMock({
  data,
  errors,
}: {
  data?: Record<string, unknown>;
  errors?: ReadonlyArray<GraphQLError>;
} = {}) {
  return {
    request: {
      query: AdjustReservationTimeDocument,
    },
    variableMatcher: () => true,
    result: errors ? { errors } : { data: { adjustReservationTime: data } },
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

function Wrapper({
  reservation,
  onBack,
}: {
  reservation: EditPageReservationFragment;
  onBack: () => void;
}): React.ReactElement {
  const form = useForm<PendingReservationFormType>({
    defaultValues: transformReservation(reservation),
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });
  return <EditStep1 reservation={reservation} options={createOptionsMock()} onBack={onBack} form={form} />;
}

function customRender({
  reservation = buildReservation(),
  mocks = [],
  onBack = vi.fn(),
}: {
  reservation?: EditPageReservationFragment;
  mocks?: ReadonlyArray<MockedResponse>;
  onBack?: () => void;
} = {}): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <Wrapper reservation={reservation} onBack={onBack} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockedRouterPush.mockReset();
});

describe("EditStep1", () => {
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

  it("calls onBack when the prev button is clicked", async () => {
    const onBack = vi.fn();
    customRender({ onBack });

    await userEvent.click(screen.getByTestId("reservation-edit__button--back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("submits the adjusted time and navigates to the reservation with timeUpdated on success", async () => {
    const reservation = buildReservation();
    const mocks = [
      createAdjustReservationTimeMock({
        data: { pk: reservation.pk, state: "CONFIRMED", beginsAt: reservation.beginsAt, endsAt: reservation.endsAt },
      }),
    ];
    customRender({ reservation, mocks });

    await acceptAllTerms();
    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() =>
      expect(mockedRouterPush).toHaveBeenCalledWith(`${getReservationPath(reservation.pk)}?timeUpdated=true`)
    );
  });

  it("does not navigate when the mutation fails", async () => {
    const reservation = buildReservation();
    const mocks = [
      createAdjustReservationTimeMock({
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
});
