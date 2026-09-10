import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, addHours, subDays } from "date-fns";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccessType,
  ChangeReservationAccessCodeSeriesDocument,
  ChangeReservationAccessCodeSingleDocument,
  RepairReservationAccessCodeSingleDocument,
} from "@gql/gql-types";
import type { CurrentUserQuery, ReservationKeylessEntryFragment } from "@gql/gql-types";
import { ReservationKeylessEntry } from "./ReservationKeylessEntrySection";

type UserNode = NonNullable<CurrentUserQuery["currentUser"]>;

function createUser(overrides: Partial<UserNode> = {}): UserNode {
  return {
    id: "user-1",
    pk: 1,
    username: "user",
    firstName: "First",
    lastName: "Last",
    email: "user@example.com",
    isSuperuser: true,
    isAdAuthenticated: false,
    unitRoles: [],
    generalRoles: [],
    ...overrides,
  } as UserNode;
}

const mockUseSession = vi.fn();
vi.mock("@/hooks", () => ({
  useSession: () => mockUseSession(),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

function createReservation(overrides: Partial<ReservationKeylessEntryFragment> = {}): ReservationKeylessEntryFragment {
  return {
    id: "1",
    pk: 1,
    endsAt: addDays(new Date(), 2).toISOString(),
    reservationUnit: {
      id: "ru1",
      unit: { id: "unit1", pk: 5 },
    },
    accessType: AccessType.AccessCode,
    isAccessCodeIsActiveCorrect: true,
    pindoraInfo: {
      accessCode: "1234",
      accessCodeIsActive: true,
      accessCodeBeginsAt: addHours(new Date(), 1).toISOString(),
      accessCodeEndsAt: addHours(new Date(), 3).toISOString(),
    },
    reservationSeries: null,
    ...overrides,
  } as ReservationKeylessEntryFragment;
}

beforeEach(() => {
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({ user: createUser() });
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

function renderComponent(
  reservation: ReservationKeylessEntryFragment,
  onSuccess = vi.fn(),
  mocks: ReadonlyArray<unknown> = []
) {
  return render(
    <MockedProvider mocks={mocks as never}>
      <ReservationKeylessEntry reservation={reservation} onSuccess={onSuccess} />
    </MockedProvider>
  );
}

describe("ReservationKeylessEntry", () => {
  it("renders nothing when access type is not ACCESS_CODE and it wasn't used previously", () => {
    const reservation = createReservation({
      accessType: AccessType.Unrestricted,
      reservationSeries: null,
    });
    const { container } = renderComponent(reservation);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders access code details for a single reservation", () => {
    renderComponent(createReservation());

    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText("accessType:status.active")).toBeInTheDocument();
    expect(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog")).toBeInTheDocument();
  });

  it("shows repair label and no confirmation dialog when access code state is incorrect", async () => {
    const onSuccess = vi.fn();
    const reservation = createReservation({ isAccessCodeIsActiveCorrect: false });
    const mocks = [
      {
        request: {
          query: RepairReservationAccessCodeSingleDocument,
          variables: { input: { pk: 1 } },
        },
        result: {
          data: {
            staffRepairReservationAccessCode: { pk: 1, accessCodeIsActive: true, accessCodeGeneratedAt: null },
          },
        },
      },
    ];
    renderComponent(reservation, onSuccess, mocks);

    const button = screen.getByRole("button", { name: "accessType:actions.repair" });
    const user = userEvent.setup();
    await user.click(button);

    await waitFor(() => expect(mockSuccessToast).toHaveBeenCalledWith({ text: "accessType:actions.repairSuccess" }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a confirmation dialog and changes the access code on accept", async () => {
    const onSuccess = vi.fn();
    const reservation = createReservation();
    const mocks = [
      {
        request: {
          query: ChangeReservationAccessCodeSingleDocument,
          variables: { input: { pk: 1 } },
        },
        result: {
          data: {
            staffChangeReservationAccessCode: { pk: 1, accessCodeIsActive: true, accessCodeGeneratedAt: null },
          },
        },
      },
    ];
    renderComponent(reservation, onSuccess, mocks);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog"));
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--accept"));

    await waitFor(() => expect(mockSuccessToast).toHaveBeenCalledWith({ text: "accessType:actions.changeSuccess" }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("closes the confirmation dialog on cancel without executing a mutation", async () => {
    renderComponent(createReservation());

    const user = userEvent.setup();
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog"));
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--cancel"));

    expect(mockSuccessToast).not.toHaveBeenCalled();
    expect(screen.queryByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--cancel")).not.toBeInTheDocument();
  });

  it("shows an error toast when the mutation fails", async () => {
    const reservation = createReservation();
    const mocks = [
      {
        request: {
          query: ChangeReservationAccessCodeSingleDocument,
          variables: { input: { pk: 1 } },
        },
        result: { errors: [new GraphQLError("boom")] },
      },
    ];
    renderComponent(reservation, vi.fn(), mocks);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog"));
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--accept"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
  });

  it("disables the button when the user lacks manage permission", () => {
    mockUseSession.mockReturnValue({ user: createUser({ isSuperuser: false, pk: 99 }) });
    renderComponent(createReservation());

    expect(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog")).toBeDisabled();
  });

  it("disables the button when the reservation has already ended", () => {
    renderComponent(createReservation({ endsAt: subDays(new Date(), 2).toISOString() }));

    expect(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog")).toBeDisabled();
  });

  it("renders the recurring layout with change/repair using series mutations", async () => {
    const onSuccess = vi.fn();
    const validityBegins = addHours(new Date(), 1).toISOString();
    const validityEnds = addHours(new Date(), 3).toISOString();
    const reservation = createReservation({
      reservationSeries: {
        id: "series-1",
        pk: 7,
        endDate: addDays(new Date(), 30).toISOString(),
        isAccessCodeIsActiveCorrect: true,
        usedAccessTypes: [AccessType.AccessCode],
        pindoraInfo: {
          accessCode: "5678",
          accessCodeIsActive: true,
          accessCodeValidity: [{ accessCodeBeginsAt: validityBegins, accessCodeEndsAt: validityEnds }],
        },
      },
    });
    const mocks = [
      {
        request: {
          query: ChangeReservationAccessCodeSeriesDocument,
          variables: { input: { pk: 7 } },
        },
        result: {
          data: {
            changeReservationSeriesAccessCode: { pk: 7, accessCodeIsActive: true, accessCodeGeneratedAt: null },
          },
        },
      },
    ];
    renderComponent(reservation, onSuccess, mocks);

    expect(screen.getByText("5678")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton--open-dialog"));
    await user.click(screen.getByTestId("AccessCodeChangeRepairButton__ConfirmationDialog--accept"));

    await waitFor(() => expect(mockSuccessToast).toHaveBeenCalledWith({ text: "accessType:actions.changeSuccess" }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("renders recurring reservation when the series used access code even if current type differs", () => {
    const reservation = createReservation({
      accessType: AccessType.Unrestricted,
      reservationSeries: {
        id: "series-1",
        pk: 7,
        endDate: addDays(new Date(), 30).toISOString(),
        isAccessCodeIsActiveCorrect: false,
        usedAccessTypes: [AccessType.AccessCode],
        pindoraInfo: {
          accessCode: "9999",
          accessCodeIsActive: false,
          accessCodeValidity: [
            {
              accessCodeBeginsAt: subDays(new Date(), 1).toISOString(),
              accessCodeEndsAt: addDays(new Date(), 1).toISOString(),
            },
          ],
        },
      },
    });
    renderComponent(reservation);

    expect(screen.getByText("9999")).toBeInTheDocument();
    expect(screen.getByText("accessType:status.inactive")).toBeInTheDocument();
  });
});
