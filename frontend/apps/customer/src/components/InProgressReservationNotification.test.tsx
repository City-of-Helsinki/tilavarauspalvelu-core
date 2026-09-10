import React from "react";
import { ApolloError } from "@apollo/client";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStateChoice } from "@gql/gql-types";
import type { ReservationNotificationFragment } from "@gql/gql-types";
import { InProgressReservationNotification } from "./InProgressReservationNotification";

const {
  mockUseCurrentUser,
  mockUseRouter,
  mockRouterPush,
  mockUseListInProgressReservationsQuery,
  mockDeleteReservation,
  mockUseDeleteReservationMutation,
  mockReservationQ,
  mockUseReservationStateLazyQuery,
  mockRefetch,
  mockRefetchQueries,
  mockUseApolloClient,
  mockErrorToast,
  mockSuccessToast,
  mockDisplayError,
} = vi.hoisted(() => ({
  mockUseCurrentUser: vi.fn(),
  mockUseRouter: vi.fn(),
  mockRouterPush: vi.fn(),
  mockUseListInProgressReservationsQuery: vi.fn(),
  mockDeleteReservation: vi.fn(),
  mockUseDeleteReservationMutation: vi.fn(),
  mockReservationQ: vi.fn(),
  mockUseReservationStateLazyQuery: vi.fn(),
  mockRefetch: vi.fn(),
  mockRefetchQueries: vi.fn(),
  mockUseApolloClient: vi.fn(),
  mockErrorToast: vi.fn(),
  mockSuccessToast: vi.fn(),
  mockDisplayError: vi.fn(),
}));

vi.mock("@/hooks", () => ({ useCurrentUser: () => mockUseCurrentUser() }));

vi.mock("next/router", () => ({ useRouter: () => mockUseRouter() }));

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useApolloClient: () => mockUseApolloClient(),
}));

vi.mock("@gql/gql-types", async (importOriginal) => ({
  ...(await importOriginal()),
  useListInProgressReservationsQuery: (...args: unknown[]) => mockUseListInProgressReservationsQuery(...args),
  useDeleteReservationMutation: (...args: unknown[]) => mockUseDeleteReservationMutation(...args),
  useReservationStateLazyQuery: (...args: unknown[]) => mockUseReservationStateLazyQuery(...args),
}));

vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

vi.mock("ui/src/hooks", () => ({ useDisplayError: () => mockDisplayError }));

function createReservation(overrides: Partial<ReservationNotificationFragment> = {}): ReservationNotificationFragment {
  return {
    id: "1",
    pk: 1,
    state: ReservationStateChoice.WaitingForPayment,
    draftExpiresAt: null,
    paymentOrder: {
      id: "po-1",
      expiresInMinutes: 30,
      checkoutUrl: "https://pay.example.com/checkout",
    },
    reservationUnit: {
      id: "ru-1",
      pk: 10,
    },
    ...overrides,
  } as ReservationNotificationFragment;
}

function mockReservations(reservations: ReadonlyArray<ReservationNotificationFragment>): void {
  mockUseListInProgressReservationsQuery.mockReturnValue({
    data: { reservations: { edges: reservations.map((node) => ({ node })) } },
    refetch: mockRefetch,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCurrentUser.mockReturnValue({ currentUser: { pk: 1 }, error: undefined, loading: false });
  mockUseRouter.mockReturnValue({ pathname: "/", query: {}, push: mockRouterPush });
  mockUseApolloClient.mockReturnValue({ refetchQueries: mockRefetchQueries });
  mockUseDeleteReservationMutation.mockReturnValue([mockDeleteReservation, { loading: false }]);
  mockUseReservationStateLazyQuery.mockReturnValue([mockReservationQ]);
  mockReservations([]);
  mockDeleteReservation.mockResolvedValue({ data: { deleteTentativeReservation: { deleted: true } } });
  mockReservationQ.mockResolvedValue({ data: { reservation: { id: "r1" } } });
});

describe("InProgressReservationNotification", () => {
  it("renders nothing when there are no in-progress reservations", () => {
    const { container } = render(<InProgressReservationNotification />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the waiting-for-payment notification on the cancel/success routes", () => {
    mockReservations([createReservation()]);
    const { rerender } = render(<InProgressReservationNotification />);
    expect(screen.getByTestId("unpaid-reservation-notification__title")).toBeInTheDocument();

    mockUseRouter.mockReturnValue({ pathname: "/reservation/cancel", query: {}, push: mockRouterPush });
    rerender(<InProgressReservationNotification />);
    expect(screen.queryByTestId("unpaid-reservation-notification__title")).not.toBeInTheDocument();
  });

  it("shows both a created and a waiting-for-payment notification with distinct labels", () => {
    mockReservations([
      createReservation({ pk: 1, state: ReservationStateChoice.WaitingForPayment }),
      createReservation({
        pk: 2,
        state: ReservationStateChoice.Created,
        draftExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        paymentOrder: null,
      }),
    ]);
    render(<InProgressReservationNotification />);

    const titles = screen.getAllByTestId("unpaid-reservation-notification__title");
    expect(titles).toHaveLength(2);
    expect(screen.getByText(/notification:waitingForPayment\.continueButton/)).toBeInTheDocument();
    expect(screen.getByText(/notification:createdReservation\.continueButton/)).toBeInTheDocument();
  });

  it("deletes, shows a success toast, and refreshes the cache when not viewing the deleted reservation's page", async () => {
    const reservation = createReservation({ pk: 7 });
    mockReservations([reservation]);
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--delete"));

    await waitFor(() =>
      expect(mockDeleteReservation).toHaveBeenCalledWith({
        variables: { input: { pk: "7" } },
      })
    );
    expect(mockSuccessToast).toHaveBeenCalled();
    expect(mockRefetchQueries).toHaveBeenCalledWith({
      include: ["ReservationQuotaReached", "AffectingReservations"],
    });
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("redirects to the front page when deleting the reservation whose page is currently open", async () => {
    const reservation = createReservation({ pk: 5 });
    mockReservations([reservation]);
    mockUseRouter.mockReturnValue({ pathname: "/reservations/5", query: { id: "5" }, push: mockRouterPush });
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--delete"));

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/"));
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it("silently refreshes without an error toast when delete fails with NOT_FOUND", async () => {
    mockReservations([createReservation()]);
    mockDeleteReservation.mockRejectedValue(
      new ApolloError({ graphQLErrors: [new GraphQLError("Boom", { extensions: { code: "NOT_FOUND" } })] })
    );
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--delete"));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(mockDisplayError).not.toHaveBeenCalled();
    expect(mockSuccessToast).not.toHaveBeenCalled();
  });

  it("shows a generic error via displayError when delete fails for another reason", async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError("Boom", { extensions: { code: "GENERIC_ERROR" } })],
    });
    mockReservations([createReservation()]);
    mockDeleteReservation.mockRejectedValue(error);
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--delete"));

    await waitFor(() => expect(mockDisplayError).toHaveBeenCalledWith(error));
  });

  it("navigates to the computed checkout URL on checkout click", async () => {
    mockReservations([createReservation({ pk: 3 })]);
    render(<InProgressReservationNotification />);
    await userEvent.click(screen.getByTestId("reservation-notification__button--checkout"));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining("/paymentmethod?lang=fi")));
  });

  it("disables checkout when there is no checkout URL", () => {
    mockReservations([
      createReservation({ pk: 4, paymentOrder: { id: "po-4", expiresInMinutes: 30, checkoutUrl: null } }),
    ]);
    render(<InProgressReservationNotification />);
    expect(screen.getByTestId("reservation-notification__button--checkout")).toBeDisabled();
  });

  it("navigates to the in-progress path when continuing a created reservation that still exists", async () => {
    mockReservations([
      createReservation({
        pk: 2,
        state: ReservationStateChoice.Created,
        draftExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        paymentOrder: null,
        reservationUnit: { id: "ru-9", pk: 9 },
      }),
    ]);
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--checkout"));

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/reservation-unit/9/reservation/2"));
  });

  it("shows a NOT_FOUND error and refreshes when continuing a reservation that no longer exists", async () => {
    mockReservationQ.mockResolvedValue({ data: { reservation: null } });
    mockReservations([
      createReservation({
        pk: 2,
        state: ReservationStateChoice.Created,
        draftExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        paymentOrder: null,
      }),
    ]);
    render(<InProgressReservationNotification />);

    await userEvent.click(screen.getByTestId("reservation-notification__button--checkout"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:api:NOT_FOUND" }));
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("counts down the remaining minutes every 60 seconds and hides once expired", () => {
    vi.useFakeTimers({ now: new Date("2024-01-01T10:00:00Z") });
    mockReservations([
      createReservation({
        pk: 2,
        state: ReservationStateChoice.Created,
        draftExpiresAt: new Date("2024-01-01T10:01:00Z").toISOString(),
        paymentOrder: null,
      }),
    ]);
    render(<InProgressReservationNotification />);

    expect(screen.getByTestId("unpaid-reservation-notification__title")).toBeInTheDocument();
    expect(screen.getByText(/"time":1/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.queryByTestId("unpaid-reservation-notification__title")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
