import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TFunction } from "next-i18next/pages";
import { dateToMinutes, formatDate, formatDuration, formatTime, formatTimeRange } from "ui/src/modules/date-utils";
import type { BlockingReservationFieldsFragment, ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { createMockReservableTimes, createMockReservationUnit } from "@test/reservation-unit.mocks";
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
  view?: string;
  events?: Array<{ id: string; title: string }>;
  draftId?: string;
  isOpen?: (range: { start: Date; end: Date }) => boolean;
  onSelectSlot?: (range: { start: Date; end: Date }) => string | null;
  onMoveDraft?: (range: { start: Date; end: Date }) => string | null;
  onNavigate?: (d: Date) => void;
  onViewChange?: (view: string) => void;
  alternative?: { id: string };
};

const slotRange = { start: new Date("2024-01-01T10:00:00"), end: new Date("2024-01-01T11:00:00") };

vi.mock("@ui/components/DatedWeekCalendar/DatedWeekCalendar", () => ({
  DatedWeekCalendar: (props: MockCalendarProps) => {
    const [result, setResult] = React.useState("");
    return (
      <div
        data-testid="mock-calendar"
        data-view={props.view}
        data-draft-id={props.draftId}
        data-can-select={String(props.onSelectSlot != null)}
        data-can-move={String(props.onMoveDraft != null)}
        data-alternative={props.alternative?.id}
        data-event-ids={props.events?.map((e) => e.id).join(",")}
        data-draft-title={props.events?.find((e) => e.id === props.draftId)?.title}
      >
        <button
          type="button"
          data-testid="rtp-select-slot"
          onClick={() => setResult(String(props.onSelectSlot?.(slotRange)))}
        >
          select
        </button>
        <button
          type="button"
          data-testid="rtp-event-drop"
          onClick={() => setResult(String(props.onMoveDraft?.(slotRange)))}
        >
          drop
        </button>
        <button type="button" data-testid="rtp-navigate" onClick={() => props.onNavigate?.(new Date("2024-02-15"))}>
          navigate
        </button>
        <button type="button" data-testid="rtp-view-day" onClick={() => props.onViewChange?.("day")}>
          view-day
        </button>
        <span data-testid="rtp-result">{result}</span>
        <span data-testid="rtp-open">{String(props.isOpen?.(slotRange))}</span>
      </div>
    );
  },
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
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-can-select", "true");
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-can-move", "true");
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view", "week");
    expect(screen.getByTestId("mock-controls")).toBeInTheDocument();
    expect(screen.getByTestId("mock-legend")).toBeInTheDocument();
  });

  it("shows the day view on mobile", () => {
    mockUseMedia.mockReturnValue(true);
    render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view", "day");
  });

  it("disables interaction and ignores slot/drag events when the reservation quota is reached", async () => {
    render(<Wrapper isReservationQuotaReached />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-can-select", "false");
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-can-move", "false");

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

  it("changes the calendar view via onViewChange", async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-view-day"));
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-view", "day");
  });

  it("accepts a slot with no refusal reason and refuses with one when the range is not reservable", async () => {
    const { unmount } = render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-select-slot"));
    expect(screen.getByTestId("rtp-result")).toHaveTextContent("null");
    unmount();

    mockIsRangeReservable.mockReturnValue(false);
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId("rtp-select-slot"));
    expect(screen.getByTestId("rtp-result")).toHaveTextContent("reservationCalendar:cannotReserveHere");
    await userEvent.click(screen.getByTestId("rtp-event-drop"));
    expect(screen.getByTestId("rtp-result")).toHaveTextContent("reservationCalendar:cannotReserveHere");
  });

  it("makes the draft movable only when the form describes a reservable time", () => {
    const { unmount } = render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).not.toHaveAttribute("data-draft-id");
    unmount();

    mockConvertFormToFocustimeSlot.mockReturnValue({
      isReservable: true,
      start: new Date("2024-01-01T10:00:00"),
      end: new Date("2024-01-01T11:00:00"),
      durationMinutes: 60,
    });
    render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-draft-id", "draft");
    expect(screen.getByTestId("mock-calendar").dataset.eventIds).toContain("draft");
  });

  it("labels the draft with its time range, always followed by the duration", () => {
    mockConvertFormToFocustimeSlot.mockReturnValue({
      isReservable: true,
      start: new Date("2024-01-01T09:00:00"),
      end: new Date("2024-01-01T11:30:00"),
      durationMinutes: 150,
    });
    render(<Wrapper />);

    // The test's useTranslation mock echoes the key and its arguments instead of real text.
    const t = ((str: string, args?: unknown) => `${str}${args ? " " + JSON.stringify(args) : ""}`) as TFunction;
    const timeRange = formatTimeRange(
      dateToMinutes(new Date("2024-01-01T09:00:00")),
      dateToMinutes(new Date("2024-01-01T11:30:00")),
      true
    );
    const expected = `${timeRange} (${formatDuration(t, { minutes: 150 })})`;
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-draft-title", expected);
  });

  it("leads to the reservation form from a skip link", () => {
    render(<Wrapper />);
    expect(screen.getByTestId("mock-calendar")).toHaveAttribute("data-alternative", "reservation-time-controls");
  });

  it("treats a slot as open unless the slot getter marks it inactive", () => {
    mockGetSlotPropGetter.mockReturnValue(() => ({ className: "rbc-timeslot-inactive" }));
    const { unmount } = render(<Wrapper />);
    expect(screen.getByTestId("rtp-open")).toHaveTextContent("false");
    unmount();

    mockGetSlotPropGetter.mockReturnValue(() => ({}));
    render(<Wrapper />);
    expect(screen.getByTestId("rtp-open")).toHaveTextContent("true");
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
