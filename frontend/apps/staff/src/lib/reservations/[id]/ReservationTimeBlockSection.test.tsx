import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import type { CurrentUserQuery, TimeBlockSectionFragment } from "@gql/gql-types";
import { TimeBlockSection } from "./ReservationTimeBlockSection";

type UserNode = NonNullable<CurrentUserQuery["currentUser"]>;

function createUser(overrides: Partial<UserNode> = {}): UserNode {
  return {
    id: "user-1",
    pk: 1,
    isSuperuser: true,
    unitRoles: [],
    generalRoles: [],
    ...overrides,
  } as UserNode;
}

const mockUseSession = vi.fn();
const mockUseReservationCalendarData = vi.fn();
const mockUseReservationSeries = vi.fn();
vi.mock("@/hooks", () => ({
  useSession: () => mockUseSession(),
  useReservationCalendarData: (...args: unknown[]) => mockUseReservationCalendarData(...args),
  useReservationSeries: (...args: unknown[]) => mockUseReservationSeries(...args),
}));

const mockSetSearchParams = vi.fn();
vi.mock("@/hooks/useSetSearchParams", () => ({
  useSetSearchParams: () => mockSetSearchParams,
}));

const mockSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

const mockSetModalContent = vi.fn();
vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: mockSetModalContent, modalContent: { content: null } }),
}));

vi.mock("@/components/ReservationSeriesView", () => ({
  ReservationSeriesView: (props: { reservationSeriesPk: number }) => (
    <div data-testid="mock-series-view" data-pk={props.reservationSeriesPk} />
  ),
}));

vi.mock("ui/src/components/calendar/Calendar", () => ({
  Calendar: (props: {
    toolbarComponent?: (p: unknown) => React.ReactNode;
    onNavigate?: (d: Date) => void;
  }) => (
    <div data-testid="mock-calendar">
      {props.toolbarComponent?.({})}
      <button type="button" data-testid="mock-navigate" onClick={() => props.onNavigate?.(addDays(new Date(), 90))}>
        navigate
      </button>
    </div>
  ),
}));

vi.mock("ui/src/components/calendar/Toolbar", () => ({
  Toolbar: ({ children }: { children?: React.ReactNode }) => <div data-testid="mock-toolbar">{children}</div>,
  ToolbarBtn: ({ onClick, children }: { onClick?: () => void; children?: React.ReactNode }) => (
    <button type="button" data-testid="mock-edit-time-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

function createReservation(overrides: Partial<TimeBlockSectionFragment> = {}): TimeBlockSectionFragment {
  return {
    id: "1",
    pk: 1,
    beginsAt: addDays(new Date(), 1).toISOString(),
    endsAt: addDays(new Date(), 1).toISOString(),
    bufferTimeAfter: 0,
    bufferTimeBefore: 0,
    name: "Reservation",
    state: ReservationStateChoice.Confirmed,
    type: ReservationTypeChoice.Staff,
    reservationSeries: null,
    reservationUnit: {
      id: "ru1",
      pk: 5,
      unit: { id: "unit1", pk: 9 },
    },
    user: { id: "user-1", pk: 1 },
    ...overrides,
  } as TimeBlockSectionFragment;
}

beforeEach(() => {
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({ user: createUser() });
  mockUseReservationCalendarData.mockReset();
  mockUseReservationCalendarData.mockReturnValue({ events: [], refetch: vi.fn() });
  mockUseReservationSeries.mockReset();
  mockUseReservationSeries.mockReturnValue({ reservations: [], reservationSeries: undefined, refetch: vi.fn() });
  mockSearchParams.mockReset();
  mockSearchParams.mockReturnValue(new URLSearchParams());
  mockSetModalContent.mockReset();
  mockSetSearchParams.mockReset();
});

describe("TimeBlockSection", () => {
  it("renders the calendar section", () => {
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={vi.fn()} />);

    expect(screen.getByText("reservation:calendar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
  });

  it("does not render the recurring section when the reservation isn't part of a series", () => {
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={vi.fn()} />);

    expect(screen.queryByTestId("mock-series-view")).not.toBeInTheDocument();
    expect(screen.queryByText("reservation:recurring")).not.toBeInTheDocument();
  });

  it("renders the recurring section wired to the series when part of one", () => {
    const reservation = createReservation({ reservationSeries: { id: "series-1", pk: 42 } });
    render(<TimeBlockSection reservation={reservation} onReservationUpdated={vi.fn()} />);

    expect(screen.getByText("reservation:recurring")).toBeInTheDocument();
    expect(screen.getByTestId("mock-series-view")).toHaveAttribute("data-pk", "42");
  });

  it("fetches calendar data for the reservation on mount", () => {
    const refetch = vi.fn();
    mockUseReservationCalendarData.mockReturnValue({ events: [], refetch });
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={vi.fn()} />);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows an edit-time button and refetches on accept when editing is allowed", async () => {
    const refetch = vi.fn();
    const onReservationUpdated = vi.fn();
    mockUseReservationCalendarData.mockReturnValue({ events: [], refetch });
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={onReservationUpdated} />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("mock-edit-time-button"));

    expect(mockSetModalContent).toHaveBeenCalledTimes(1);
    const dialog = mockSetModalContent.mock.calls[0]?.[0] as React.ReactElement<{
      onAccept: () => void;
    }>;
    expect(dialog.props.onAccept).toBeInstanceOf(Function);

    dialog.props.onAccept();

    expect(onReservationUpdated).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(mockSetModalContent).toHaveBeenLastCalledWith(null);
  });

  it("hides the edit-time button when the reservation is part of a series", () => {
    const reservation = createReservation({ reservationSeries: { id: "series-1", pk: 42 } });
    render(<TimeBlockSection reservation={reservation} onReservationUpdated={vi.fn()} />);

    expect(screen.queryByTestId("mock-edit-time-button")).not.toBeInTheDocument();
  });

  it("hides the edit-time button when the reservation state disallows editing", () => {
    const reservation = createReservation({ state: ReservationStateChoice.Cancelled });
    render(<TimeBlockSection reservation={reservation} onReservationUpdated={vi.fn()} />);

    expect(screen.queryByTestId("mock-edit-time-button")).not.toBeInTheDocument();
  });

  it("hides the edit-time button when the user lacks permission", () => {
    mockUseSession.mockReturnValue({ user: createUser({ isSuperuser: false, pk: 99 }) });
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={vi.fn()} />);

    expect(screen.queryByTestId("mock-edit-time-button")).not.toBeInTheDocument();
  });

  it("notifies the parent but doesn't force a calendar refetch when navigating to a different focus date", async () => {
    const refetch = vi.fn();
    const onReservationUpdated = vi.fn();
    mockUseReservationCalendarData.mockReturnValue({ events: [], refetch });
    render(<TimeBlockSection reservation={createReservation()} onReservationUpdated={onReservationUpdated} />);
    const user = userEvent.setup();
    refetch.mockClear();

    await user.click(screen.getByTestId("mock-navigate"));

    expect(onReservationUpdated).toHaveBeenCalledTimes(1);
    expect(refetch).not.toHaveBeenCalled();
  });
});
