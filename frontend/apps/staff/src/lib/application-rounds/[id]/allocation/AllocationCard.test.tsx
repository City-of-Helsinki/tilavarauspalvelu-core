import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Priority, ReserveeType, Weekday } from "@gql/gql-types";
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
  const baseSelection = ["1-10-00", "1-10-00"];

  it("disables the accept button when there is no reservation unit option", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={0}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("disables the accept button when allocation is not enabled", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled={false}
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("enables the accept button for a valid selection inside the requested time range", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeEnabled();
    expect(screen.queryByText("allocation:errors.selectionOutsideOfRequestedTimes")).not.toBeInTheDocument();
    expect(screen.queryByText("allocation:errors.requestedDurationIsIncorrect")).not.toBeInTheDocument();
  });

  it("shows an error when the selection is shorter than the minimum duration", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection({ reservationMinDuration: 7200, reservationMaxDuration: 7200 })}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByText("allocation:errors.requestedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("shows an error when the selection is longer than the maximum duration", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection({ reservationMinDuration: 900, reservationMaxDuration: 900 })}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByText("allocation:errors.requestedDurationIsIncorrect")).toBeInTheDocument();
  });

  it("shows an error when the selection falls outside the requested time range", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={["1-8-00", "1-8-00"]}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot({ beginTime: "10:00:00", endTime: "11:00:00" })}
      />
    );

    expect(screen.getByText("allocation:errors.selectionOutsideOfRequestedTimes")).toBeInTheDocument();
  });

  it("treats a missing requested time range as always outside", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot({ beginTime: undefined, endTime: undefined })}
      />
    );

    expect(screen.getByText("allocation:errors.selectionOutsideOfRequestedTimes")).toBeInTheDocument();
  });

  it("calls handleAcceptSlot when the accept button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    await user.click(screen.getByRole("button", { name: "allocation:acceptSlot" }));
    expect(handleAcceptSlot).toHaveBeenCalledTimes(1);
  });

  it("disables the accept button and shows a spinner while loading", () => {
    mockUseAcceptSlotMutation.mockReturnValue([handleAcceptSlot, { isLoading: true }]);

    render(
      <SuitableTimeCard
        applicationSection={createSection()}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByRole("button", { name: "allocation:acceptSlot" })).toBeDisabled();
  });

  it("renders '-' for primary/secondary requested times when none are set", () => {
    render(
      <SuitableTimeCard
        applicationSection={createSection({ suitableTimeRanges: [] })}
        reservationUnitOptionPk={1}
        selection={baseSelection}
        isAllocationEnabled
        refetchApplicationEvents={vi.fn()}
        timeSlot={createTimeSlot()}
      />
    );

    expect(screen.getByText("allocation:primaryTimes:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("allocation:secondaryTimes:", { exact: false })).toBeInTheDocument();
  });
});
