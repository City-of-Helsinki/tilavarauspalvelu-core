import React from "react";
import { useFormContext } from "react-hook-form";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatTime, fromUIDateTimeUnsafe } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import {
  AuthenticationType,
  CreateStaffReservationDocument,
  ReservationStartInterval,
  ReservationTypeChoice,
  ReservationUnitDocument,
  TermsOfUseTypeChoices,
} from "@gql/gql-types";
import type { CreateStaffReservationFragment } from "@gql/gql-types";
import { CreateReservationModal } from "./CreateReservationModal";

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

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return { useSearchParams: params, mockedSearchParams: params };
});
vi.mock("next/navigation", () => ({ useSearchParams }));

const mockRouterReplace = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/my-units/1", query: {}, replace: mockRouterReplace }),
}));

// Stub the HDS time-picker so `endTime` (not part of the component's
// defaultValues) can be driven with a plain text input instead of the HDS
// hour/minute segmented widget.
vi.mock("@/components/ControlledTimeInput", () => ({
  ControlledTimeInput: ({ name }: { name: "startTime" | "endTime" }) => {
    const { register } = useFormContext();
    return <input aria-label={name} {...register(name)} />;
  },
}));

// Stub the heavy reservee/metadata form (GQL-backed filter options, terms of
// use, etc.) with just enough to set `type` and register `comments`, the two
// fields required by the schema that this component doesn't default.
vi.mock("@/components/ReservationTypeForm", () => ({
  ReservationTypeForm: () => {
    const { register, setValue } = useFormContext();
    return (
      <div>
        <input type="hidden" {...register("comments")} />
        <button
          type="button"
          onClick={() => setValue("type", ReservationTypeChoice.Blocked, { shouldDirty: true, shouldValidate: true })}
        >
          set-type-blocked
        </button>
      </div>
    );
  },
}));

const emptyTerms = { id: "", textFi: "", nameFi: "", termsType: TermsOfUseTypeChoices.Payment };

function createReservationUnitFragment(
  overrides: Partial<CreateStaffReservationFragment> = {}
): CreateStaffReservationFragment {
  return {
    id: createNodeId("ReservationUnitNode", 1),
    pk: 1,
    nameFi: "Reservation unit",
    authentication: AuthenticationType.Weak,
    reservationStartInterval: ReservationStartInterval.Interval_15Minutes,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    minPersons: null,
    maxPersons: null,
    pricingTerms: emptyTerms,
    paymentTerms: emptyTerms,
    cancellationTerms: emptyTerms,
    serviceSpecificTerms: emptyTerms,
    ...overrides,
  } as CreateStaffReservationFragment;
}

const reservationUnitOptions = [{ label: "Reservation unit", value: 1 }];

// A fixed near-future date at a 15-minute-aligned hour, so both the "date not
// in the past" and "time matches reservation interval" schema checks pass
// deterministically regardless of when the suite runs.
const START = new Date();
START.setDate(START.getDate() + 7);
START.setHours(10, 0, 0, 0);

const reservationUnitMock = (overrides: Partial<CreateStaffReservationFragment> = {}) => ({
  request: { query: ReservationUnitDocument, variables: { id: createNodeId("ReservationUnitNode", 1) } },
  result: { data: { reservationUnit: createReservationUnitFragment(overrides) } },
});

beforeEach(() => {
  mockedSearchParams.mockReset();
  mockedSearchParams.mockReturnValue(new URLSearchParams());
  mockRouterReplace.mockReset();
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
  mockUseCheckCollisions.mockReset();
  mockUseCheckCollisions.mockReturnValue({ isLoading: false, hasCollisions: false });
});

function renderModal(mocks: ReadonlyArray<MockedResponse>, onClose = vi.fn()) {
  const focusAfterCloseRef = { current: document.createElement("div") };
  return {
    onClose,
    ...render(
      <MockedProvider
        mocks={mocks}
        defaultOptions={{
          watchQuery: { fetchPolicy: "no-cache" },
          query: { fetchPolicy: "no-cache" },
          mutate: { fetchPolicy: "no-cache" },
        }}
      >
        <CreateReservationModal
          reservationUnitOptions={reservationUnitOptions}
          start={START}
          onClose={onClose}
          focusAfterCloseRef={focusAfterCloseRef}
        />
      </MockedProvider>
    ),
  };
}

async function fillMinimumValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("endTime"), "11:00");
  await user.click(screen.getByRole("button", { name: "set-type-blocked" }));
  return user;
}

describe("CreateReservationModal", () => {
  it("shows a spinner while the reservation unit query is loading, and no dialog content", () => {
    renderModal([reservationUnitMock()]);
    expect(screen.queryByText("myUnits:ReservationDialog.title")).not.toBeInTheDocument();
  });

  it("renders the dialog once the reservation unit query resolves", async () => {
    renderModal([reservationUnitMock()]);
    expect(await screen.findByText("myUnits:ReservationDialog.title")).toBeInTheDocument();
  });

  it("resolves the reservation unit from the search params when present", async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams({ reservationUnit: "1" }));
    renderModal([reservationUnitMock()]);
    expect(await screen.findByText("myUnits:ReservationDialog.title")).toBeInTheDocument();
  });

  it("renders only the reservation unit selector when the query returns no reservation unit", async () => {
    const mocks = [
      {
        request: { query: ReservationUnitDocument, variables: { id: createNodeId("ReservationUnitNode", 1) } },
        result: { data: { reservationUnit: null } },
      },
    ];
    renderModal(mocks);

    await waitFor(() => expect(screen.queryByText("myUnits:ReservationDialog.title")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "myUnits:ReservationDialog.accept" })).not.toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const { onClose } = renderModal([reservationUnitMock()]);
    await screen.findByText("myUnits:ReservationDialog.title");

    const user = userEvent.setup();
    await user.click(screen.getByTestId("CreateReservationModal__cancel-reservation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables submission while the form is pristine", async () => {
    renderModal([reservationUnitMock()]);
    await screen.findByText("myUnits:ReservationDialog.title");

    expect(screen.getByTestId("CreateReservationModal__accept-reservation")).toBeDisabled();
  });

  it("shows a collision warning and disables submission when there are collisions", async () => {
    mockUseCheckCollisions.mockReturnValue({ isLoading: false, hasCollisions: true });
    renderModal([reservationUnitMock()]);
    await screen.findByText("myUnits:ReservationDialog.title");

    await fillMinimumValidForm();

    expect(screen.getByTestId("CreateReservationModal__collision-warning")).toBeInTheDocument();
    expect(screen.getByTestId("CreateReservationModal__accept-reservation")).toBeDisabled();
  });

  it("submits the reservation, renaming and stripping fields as expected, then shows a success toast and closes", async () => {
    const dateStr = formatDate(START, {});
    const startTimeStr = formatTime(START);
    const expectedBeginsAt = fromUIDateTimeUnsafe(dateStr, startTimeStr).toISOString();
    const expectedEndsAt = fromUIDateTimeUnsafe(dateStr, "11:00").toISOString();

    const mocks = [
      reservationUnitMock(),
      {
        request: {
          query: CreateStaffReservationDocument,
          variables: {
            input: {
              reservationUnit: 1,
              type: ReservationTypeChoice.Blocked,
              beginsAt: expectedBeginsAt,
              endsAt: expectedEndsAt,
              bufferTimeBefore: 0,
              bufferTimeAfter: 0,
              workingMemo: "",
            },
          },
        },
        result: { data: { createStaffReservation: { pk: 1 } } },
      },
    ];
    const { onClose } = renderModal(mocks);
    await screen.findByText("myUnits:ReservationDialog.title");

    const user = await fillMinimumValidForm();
    await user.click(screen.getByTestId("CreateReservationModal__accept-reservation"));

    await waitFor(() =>
      expect(mockSuccessToast).toHaveBeenCalledWith({ text: "myUnits:ReservationDialog.saveSuccess" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast and does not close when the mutation fails", async () => {
    const dateStr = formatDate(START, {});
    const startTimeStr = formatTime(START);
    const expectedBeginsAt = fromUIDateTimeUnsafe(dateStr, startTimeStr).toISOString();
    const expectedEndsAt = fromUIDateTimeUnsafe(dateStr, "11:00").toISOString();

    const mocks = [
      reservationUnitMock(),
      {
        request: {
          query: CreateStaffReservationDocument,
          variables: {
            input: {
              reservationUnit: 1,
              type: ReservationTypeChoice.Blocked,
              beginsAt: expectedBeginsAt,
              endsAt: expectedEndsAt,
              bufferTimeBefore: 0,
              bufferTimeAfter: 0,
              workingMemo: "",
            },
          },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];
    const { onClose } = renderModal(mocks);
    await screen.findByText("myUnits:ReservationDialog.title");

    const user = await fillMinimumValidForm();
    await user.click(screen.getByTestId("CreateReservationModal__accept-reservation"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(mockSuccessToast).not.toHaveBeenCalled();
  });
});
