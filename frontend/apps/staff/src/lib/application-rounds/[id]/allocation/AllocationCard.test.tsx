import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { Priority, ReservationStartInterval, ReserveeType, Weekday } from "@gql/gql-types";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import type {
  AllocatedTimeSlotNodeT,
  SectionNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";

const mockUseAcceptSlotMutation = vi.fn();
const mockUseRemoveAllocation = vi.fn();
const mockUseRefreshApplications = vi.fn();
vi.mock("./hooks", () => ({
  useAcceptSlotMutation: (...args: unknown[]) => mockUseAcceptSlotMutation(...args),
  useRemoveAllocation: (...args: unknown[]) => mockUseRemoveAllocation(...args),
  useRefreshApplications: (...args: unknown[]) => mockUseRefreshApplications(...args),
}));

function createSection(overrides: Partial<SectionNodeT> = {}): SectionNodeT {
  return {
    pk: 1,
    name: "Section name",
    reservationMinDuration: 3600,
    reservationMaxDuration: 3600,
    appliedReservationsPerWeek: 1,
    suitableTimeRanges: [],
    reservationUnitOptions: [],
    application: {
      pk: 1,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "First",
      contactPersonLastName: "Last",
      organisationName: null,
    },
    ...overrides,
  } as SectionNodeT;
}

function createAllocatedTimeSlot(overrides: Partial<AllocatedTimeSlotNodeT> = {}): AllocatedTimeSlotNodeT {
  return {
    pk: 1,
    beginTime: "10:00:00",
    endTime: "11:00:00",
    dayOfTheWeek: Weekday.Monday,
    ...overrides,
  } as AllocatedTimeSlotNodeT;
}

function createTimeSlot(overrides: Partial<SuitableTimeRangeNodeT> = {}): SuitableTimeRangeNodeT {
  return {
    dayOfTheWeek: Weekday.Monday,
    beginTime: "10:00:00",
    endTime: "11:00:00",
    priority: Priority.Primary,
    ...overrides,
  } as SuitableTimeRangeNodeT;
}

const refresh = vi.fn();
const handleRemoveAllocation = vi.fn();
const handleAcceptSlot = vi.fn();

beforeEach(() => {
  refresh.mockReset();
  handleRemoveAllocation.mockReset();
  handleAcceptSlot.mockReset();
  mockUseRefreshApplications.mockReset();
  mockUseRemoveAllocation.mockReset();
  mockUseAcceptSlotMutation.mockReset();
  mockUseRefreshApplications.mockReturnValue([refresh, false]);
  mockUseRemoveAllocation.mockReturnValue([handleRemoveAllocation, { isLoading: false }]);
  mockUseAcceptSlotMutation.mockReturnValue([handleAcceptSlot, { isLoading: false }]);
});

describe("AllocatedCard", () => {
  it("renders the section name, applicant, and allocated time with no error when duration is valid", () => {
    render(
      <AllocatedCard
        applicationSection={createSection()}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    expect(screen.getByText("Section name")).toBeInTheDocument();
    expect(screen.getByText("First Last")).toBeInTheDocument();
    expect(screen.queryByText("allocation:errors.allocatedDurationIsIncorrect")).not.toBeInTheDocument();
  });

  it("shows an error when the allocated duration is shorter than the minimum", () => {
    render(
      <AllocatedCard
        applicationSection={createSection({ reservationMinDuration: 7200, reservationMaxDuration: 7200 })}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    expect(screen.getByText("allocation:errors.allocatedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("shows an error when the allocated duration is longer than the maximum", () => {
    render(
      <AllocatedCard
        applicationSection={createSection({ reservationMinDuration: 900, reservationMaxDuration: 1800 })}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    expect(screen.getByText("allocation:errors.allocatedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("disables the remove button and shows a spinner while loading", () => {
    mockUseRemoveAllocation.mockReturnValue([handleRemoveAllocation, { isLoading: true }]);

    render(
      <AllocatedCard
        applicationSection={createSection()}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "allocation:removeAllocation" })).toBeDisabled();
  });

  it("calls handleRemoveAllocation when the remove button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AllocatedCard
        applicationSection={createSection()}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "allocation:removeAllocation" }));
    expect(handleRemoveAllocation).toHaveBeenCalledTimes(1);
  });

  it("renders the requested times inside the accordion", () => {
    render(
      <AllocatedCard
        applicationSection={createSection({
          suitableTimeRanges: [createTimeSlot({ priority: Priority.Primary })],
        })}
        allocatedTimeSlot={createAllocatedTimeSlot()}
        refetchApplicationEvents={vi.fn()}
      />
    );

    expect(screen.getByText("allocation:showTimeRequests")).toBeInTheDocument();
    expect(screen.getByText("allocation:primaryTimes:", { exact: false })).toBeInTheDocument();
  });
});

describe("SuitableTimeCard", () => {
  // Monday 10:00 to 11:00, which is the hour the default section asks for.
  const baseSelection: WeekdayInterval = { weekday: Weekday.Monday, beginMinutes: 10 * 60, endMinutes: 11 * 60 };

  /** A section that wants Monday 10:00 to 11:00, so the Selection fits it unless a test says otherwise. */
  function createRequestingSection(overrides: Partial<SectionNodeT> = {}): SectionNodeT {
    return createSection({ suitableTimeRanges: [createTimeSlot()], ...overrides });
  }

  function renderCard({
    applicationSection = createRequestingSection(),
    selection = baseSelection,
    startInterval = ReservationStartInterval.Interval_15Minutes,
    reservationUnitOptionPk = 1,
    isAllocationEnabled = true,
  }: {
    applicationSection?: SectionNodeT;
    selection?: WeekdayInterval;
    startInterval?: ReservationStartInterval;
    reservationUnitOptionPk?: number;
    isAllocationEnabled?: boolean;
  } = {}) {
    return render(
      <SuitableTimeCard
        applicationSection={applicationSection}
        reservationUnitOptionPk={reservationUnitOptionPk}
        selection={selection}
        startInterval={startInterval}
        isAllocationEnabled={isAllocationEnabled}
        refetchApplicationEvents={vi.fn()}
      />
    );
  }

  it("disables the accept button when there is no reservation unit option", () => {
    renderCard({ reservationUnitOptionPk: 0 });

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("disables the accept button when allocation is not enabled", () => {
    renderCard({ isAllocationEnabled: false });

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("enables the accept button for a valid selection inside the requested time range", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
    expect(screen.queryByText("allocation:errors.selectionOutsideOfRequestedTimes")).not.toBeInTheDocument();
    expect(screen.queryByText("allocation:errors.requestedDurationIsIncorrect")).not.toBeInTheDocument();
    expect(screen.queryByText("allocation:errors.selectionBeginTimeNotAllowed")).not.toBeInTheDocument();
  });

  it("gives the mutation the Selection itself", () => {
    renderCard();

    expect(mockUseAcceptSlotMutation).toHaveBeenCalledWith(expect.objectContaining({ selection: baseSelection }));
  });

  it("shows an error when the selection is shorter than the minimum duration", () => {
    renderCard({
      applicationSection: createRequestingSection({ reservationMinDuration: 7200, reservationMaxDuration: 7200 }),
    });

    expect(screen.getByText("allocation:errors.requestedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("shows an error when the selection is longer than the maximum duration", () => {
    renderCard({
      applicationSection: createRequestingSection({ reservationMinDuration: 900, reservationMaxDuration: 900 }),
    });

    expect(screen.getByText("allocation:errors.requestedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("reads the duration from the interval, so 45 minutes is too short for an hour", () => {
    renderCard({ selection: { ...baseSelection, endMinutes: 10 * 60 + 45 } });

    expect(screen.getByText("allocation:errors.requestedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("shows no duration error when the section asks for the 45 minutes that are selected", () => {
    renderCard({
      applicationSection: createRequestingSection({ reservationMinDuration: 2700, reservationMaxDuration: 2700 }),
      selection: { ...baseSelection, endMinutes: 10 * 60 + 45 },
    });

    expect(screen.queryByText("allocation:errors.requestedDurationIsIncorrect")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
  });

  it("shows an error when the selection falls outside the requested time range", () => {
    renderCard({ selection: { ...baseSelection, beginMinutes: 8 * 60, endMinutes: 9 * 60 } });

    expect(screen.getByText("allocation:errors.selectionOutsideOfRequestedTimes")).toBeInTheDocument();
  });

  it("treats a section with no requested time on the weekday as always outside", () => {
    renderCard({ applicationSection: createSection({ suitableTimeRanges: [] }) });

    expect(screen.getByText("allocation:errors.selectionOutsideOfRequestedTimes")).toBeInTheDocument();
  });

  it("accepts a selection that crosses two touching requested time ranges", () => {
    renderCard({
      applicationSection: createSection({
        suitableTimeRanges: [
          createTimeSlot({ beginTime: "10:00:00", endTime: "11:00:00", priority: Priority.Primary }),
          createTimeSlot({ beginTime: "11:00:00", endTime: "12:00:00", priority: Priority.Secondary }),
        ],
      }),
      selection: { ...baseSelection, beginMinutes: 10 * 60 + 30, endMinutes: 11 * 60 + 30 },
    });

    expect(screen.queryByText("allocation:errors.selectionOutsideOfRequestedTimes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
  });

  it("warns about a begin time on the quarter hour and disables the button on a 30 minute unit", () => {
    renderCard({
      applicationSection: createRequestingSection({ suitableTimeRanges: [createTimeSlot({ endTime: "11:30:00" })] }),
      selection: { ...baseSelection, beginMinutes: 10 * 60 + 15, endMinutes: 11 * 60 + 15 },
      startInterval: ReservationStartInterval.Interval_30Minutes,
    });

    expect(screen.getByText("allocation:errors.selectionBeginTimeNotAllowed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("allows a begin time on the quarter hour on a 15 minute unit", () => {
    renderCard({
      applicationSection: createRequestingSection({ suitableTimeRanges: [createTimeSlot({ endTime: "11:30:00" })] }),
      selection: { ...baseSelection, beginMinutes: 10 * 60 + 15, endMinutes: 11 * 60 + 15 },
      startInterval: ReservationStartInterval.Interval_15Minutes,
    });

    expect(screen.queryByText("allocation:errors.selectionBeginTimeNotAllowed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
  });

  it.each([ReservationStartInterval.Interval_15Minutes, ReservationStartInterval.Interval_30Minutes])(
    "allows an end time on the quarter hour on a %s unit",
    (startInterval) => {
      renderCard({
        applicationSection: createRequestingSection({ reservationMinDuration: 2700, reservationMaxDuration: 2700 }),
        selection: { ...baseSelection, endMinutes: 10 * 60 + 45 },
        startInterval,
      });

      expect(screen.queryByText("allocation:errors.selectionBeginTimeNotAllowed")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
    }
  );

  it("calls handleAcceptSlot when the accept button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "allocation:acceptSlot" }));
    expect(handleAcceptSlot).toHaveBeenCalledTimes(1);
  });

  it("disables the accept button and shows a spinner while loading", () => {
    mockUseAcceptSlotMutation.mockReturnValue([handleAcceptSlot, { isLoading: true }]);

    renderCard();

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("renders '-' for primary/secondary requested times when none are set", () => {
    renderCard({ applicationSection: createSection({ suitableTimeRanges: [] }) });

    expect(screen.getByText("allocation:primaryTimes:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("allocation:secondaryTimes:", { exact: false })).toBeInTheDocument();
  });
});
