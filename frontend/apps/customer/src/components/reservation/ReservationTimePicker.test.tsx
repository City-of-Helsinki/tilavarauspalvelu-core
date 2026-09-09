import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockReservableTimes, createMockReservationUnit } from "@test/reservation-unit.mocks";
import { formatDate, formatTime } from "ui/src/modules/date-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import type { BlockingReservationFieldsFragment, ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import { ReservationTimePicker } from "./ReservationTimePicker";

const {
  mockGetBoundCheckedReservation,
  mockIsRangeReservable,
  mockGetSlotPropGetter,
  mockConvertFormToFocustimeSlot,
  mockGetDurationOptions,
  mockGetNewReservation,
  mockUseCurrentUser,
  mockUseMedia,
  mockUseListReservationsQuery,
  mockReservationCalendarControls,
} = vi.hoisted(() => ({
  mockGetBoundCheckedReservation: vi.fn(),
  mockIsRangeReservable: vi.fn(),
  mockGetSlotPropGetter: vi.fn(),
  mockConvertFormToFocustimeSlot: vi.fn(),
  mockGetDurationOptions: vi.fn(),
  mockGetNewReservation: vi.fn(),
  mockUseCurrentUser: vi.fn(),
  mockUseMedia: vi.fn(),
  mockUseListReservationsQuery: vi.fn(),
  mockReservationCalendarControls: vi.fn(),
}));

vi.mock("@/modules/reservable", async (importOriginal) => ({
  ...(await importOriginal()),
  getBoundCheckedReservation: (...args: unknown[]) => mockGetBoundCheckedReservation(...args),
  isRangeReservable: (...args: unknown[]) => mockIsRangeReservable(...args),
  getSlotPropGetter: (...args: unknown[]) => mockGetSlotPropGetter(...args),
}));

vi.mock("@/modules/reservation", async (importOriginal) => ({
  ...(await importOriginal()),
  convertFormToFocustimeSlot: (...args: unknown[]) => mockConvertFormToFocustimeSlot(...args),
  getDurationOptions: (...args: unknown[]) => mockGetDurationOptions(...args),
  getNewReservation: (...args: unknown[]) => mockGetNewReservation(...args),
}));

vi.mock("@/hooks", () => ({ useCurrentUser: () => mockUseCurrentUser() }));

vi.mock("react-use", () => ({ useMedia: (...args: unknown[]) => mockUseMedia(...args) }));

vi.mock("@gql/gql-types", async (importOriginal) => ({
  ...(await importOriginal()),
  useListReservationsQuery: (...args: unknown[]) => mockUseListReservationsQuery(...args),
}));

vi.mock("@/components/calendar/Legend", () => ({
  Legend: () => <div data-testid="mock-legend" />,
}));

vi.mock("../calendar/ReservationCalendarControls", () => ({
  ReservationCalendarControls: (props: unknown) => {
    mockReservationCalendarControls(props);
    return <div data-testid="mock-controls" />;
  },
}));

type MockCalendarProps = {
  reservable?: boolean;
  resizable?: boolean;
  viewType?: string;
  events?: unknown[];
  onSelectSlot?: (props: { start: Date; end: Date; action: string; slots: Date[] }) => boolean;
  onEventDrop?: (props: { start: Date; end: Date }) => boolean;
  onSelecting?: (props: { start: Date; end: Date }) => boolean;
  onNavigate?: (d: Date) => void;
  onView?: (n: string) => void;
};

vi.mock("ui/src/components/calendar/Calendar", () => ({
  Calendar: (props: MockCalendarProps) => (
    <div data-testid="mock-calendar" data-reservable={String(props.reservable)} data-view-type={props.viewType}>
      <button
        type="button"
        data-testid="rtp-select-slot"
        onClick={() =>
          props.onSelectSlot?.({
            start: new Date("2024-01-01T10:00:00"),
            end: new Date("2024-01-01T11:00:00"),
            action: "click",
            slots: [],
          })
        }
      >
        select
      </button>
      <button
        type="button"
        data-testid="rtp-event-drop"
        onClick={() =>
          props.onEventDrop?.({ start: new Date("2024-01-01T10:00:00"), end: new Date("2024-01-01T11:00:00") })
        }
      >
        drop
      </button>
      <button type="button" data-testid="rtp-navigate" onClick={() => props.onNavigate?.(new Date("2024-02-15"))}>
        navigate
      </button>
      <button type="button" data-testid="rtp-view-month" onClick={() => props.onView?.("month")}>
        view-month
      </button>
    </div>
  ),
}));

function Wrapper({
  isReservationQuotaReached = false,
  loginAndSubmitButton,
  blockingReservations = [],
}: {
  isReservationQuotaReached?: boolean;
  loginAndSubmitButton?: React.ReactElement;
  blockingReservations?: ReadonlyArray<BlockingReservationFieldsFragment>;
}): React.ReactElement {
  const form = useForm<PendingReservationFormType>({
    defaultValues: {
      date: formatDate(new Date("2024-01-01T10:00:00")),
      time: formatTime(new Date("2024-01-01T10:00:00")),
      duration: 60,
      isControlsVisible: true,
    },
  });
  const date = useWatch({ control: form.control, name: "date" });
  const time = useWatch({ control: form.control, name: "time" });
  const duration = useWatch({ control: form.control, name: "duration" });
  const reservationUnit = createMockReservationUnit({ pk: 1 }) as unknown as ReservationTimePickerFieldsFragment;

  return (
    <>
      <ReservationTimePicker
        reservationUnit={reservationUnit}
        reservableTimes={createMockReservableTimes()}
        blockingReservations={blockingReservations}
        reservationForm={form}
        isReservationQuotaReached={isReservationQuotaReached}
        submitReservation={vi.fn()}
        startingTimeOptions={[]}
        loginAndSubmitButton={loginAndSubmitButton}
      />
      <div data-testid="form-date">{date}</div>
      <div data-testid="form-time">{time}</div>
      <div data-testid="form-duration">{duration}</div>
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBoundCheckedReservation.mockReturnValue({
    start: new Date("2024-01-01T10:00:00"),
    end: new Date("2024-01-01T11:00:00"),
  });
  mockIsRangeReservable.mockReturnValue(true);
  mockGetSlotPropGetter.mockReturnValue(() => ({}));
  mockConvertFormToFocustimeSlot.mockReturnValue({ isReservable: false });
  mockGetDurationOptions.mockReturnValue([]);
  mockGetNewReservation.mockReturnValue({ begin: new Date("2024-03-05T09:30:00") });
  mockUseCurrentUser.mockReturnValue({ currentUser: undefined, error: undefined, loading: false });
  mockUseMedia.mockReturnValue(false);
  mockUseListReservationsQuery.mockReturnValue({ data: undefined });
});

describe("ReservationTimePicker", () => {
  it("renders the calendar and controls, enabled when quota is not reached", () => {
    render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-reservable", "true");
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view-type", "week");
    expect(screen.getByTestId("mock-controls")).toBeInTheDocument();
    expect(screen.getByTestId("mock-legend")).toBeInTheDocument();
  });

  it("shows the day view on mobile", () => {
    mockUseMedia.mockReturnValue(true);
    render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view-type", "day");
  });

  it("disables interaction and ignores slot/drag events when the reservation quota is reached", async () => {
    render(<Wrapper isReservationQuotaReached />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-reservable", "false");

    await userEvent.click(screen.getByTestId("rtp-select-slot"));
    await userEvent.click(screen.getByTestId("rtp-event-drop"));

    expect(mockGetBoundCheckedReservation).not.toHaveBeenCalled();
    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-01-01T10:00:00")));
  });

  it("updates the date and time on slot click, without changing the duration", async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-select-slot"));

    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-03-05T09:30:00")));
    expect(screen.getByTestId("form-time")).toHaveTextContent(formatTime(new Date("2024-03-05T09:30:00")));
    expect(screen.getByTestId("form-duration")).toHaveTextContent("60");
  });

  it("does not update the form when the slot cannot be bound-checked", async () => {
    mockGetBoundCheckedReservation.mockReturnValue(null);
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-select-slot"));

    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-01-01T10:00:00")));
  });

  it("does not update the form when the range is not reservable", async () => {
    mockIsRangeReservable.mockReturnValue(false);
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-select-slot"));

    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-01-01T10:00:00")));
  });

  it("updates date, time, and duration on event drop/resize", async () => {
    mockGetBoundCheckedReservation.mockReturnValue({
      start: new Date("2024-04-10T14:00:00"),
      end: new Date("2024-04-10T15:30:00"),
    });
    mockGetNewReservation.mockReturnValue({ begin: new Date("2024-04-10T14:00:00") });
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-event-drop"));

    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-04-10T14:00:00")));
    expect(screen.getByTestId("form-time")).toHaveTextContent(formatTime(new Date("2024-04-10T14:00:00")));
    expect(screen.getByTestId("form-duration")).toHaveTextContent("90");
  });

  it("changes the calendar view type via onView", async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-view-month"));
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view-type", "month");
  });

  it("updates the form date via onNavigate", async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-navigate"));
    expect(screen.getByTestId("form-date")).toHaveTextContent(formatDate(new Date("2024-02-15")));
  });

  it("skips fetching the user's reservations when there is no current user, fetches when there is", () => {
    const { rerender } = render(<Wrapper />);
    expect(mockUseListReservationsQuery).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));

    mockUseCurrentUser.mockReturnValue({ currentUser: { pk: 5 }, error: undefined, loading: false });
    rerender(<Wrapper />);
    expect(mockUseListReservationsQuery).toHaveBeenLastCalledWith(expect.objectContaining({ skip: false }));
  });

  it("passes create-mode controls with the login button, edit-mode controls without it", () => {
    const { rerender } = render(<Wrapper />);
    expect(mockReservationCalendarControls).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "edit" }));

    const loginButton = <button type="button">login</button>;
    rerender(<Wrapper loginAndSubmitButton={loginButton} />);
    expect(mockReservationCalendarControls).toHaveBeenLastCalledWith(
      expect.objectContaining({ mode: "create", submitButton: loginButton })
    );
  });
});
