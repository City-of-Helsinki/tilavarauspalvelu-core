import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { VisibleHours, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { Weekday } from "@gql/gql-types";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { AllocationCalendar } from "./AllocationCalendar";
import type { AllocationCellData, AllocationHighlight } from "./modules/allocationPattern";

// Two hours instead of the whole day, so a test renders 8 rows and not 68. The grid is the same either way.
const extent: VisibleHours = { beginMinutes: 10 * 60, endMinutes: 12 * 60 };

const pattern: WeeklyPatternValue<AllocationCellData> = [
  { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 660, data: { state: "demand", count: 3 } },
  { weekday: Weekday.Tuesday, beginMinutes: 600, endMinutes: 630, data: { state: "allocated" } },
  { weekday: Weekday.Wednesday, beginMinutes: 600, endMinutes: 630, data: { state: "affecting" } },
];

function renderCalendar(highlights: ReadonlyArray<AllocationHighlight> = []) {
  return render(
    <>
      <AllocationCalendar pattern={pattern} extent={extent} highlights={highlights} />
      {/* The equal form the skip link leads to, which is the allocation column in the page itself. */}
      <div id={ALLOCATION_TIME_FORM_ID} />
    </>
  );
}

describe("AllocationCalendar", () => {
  it("names a cell after its state", () => {
    renderCalendar();

    expect(
      screen.getByRole("gridcell", { name: "maanantai, 10:00–11:00, allocation:calendar.state.demand" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("gridcell", { name: "tiistai, 10:00–10:30, allocation:calendar.state.allocated" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("gridcell", { name: "keskiviikko, 10:00–10:30, allocation:calendar.state.affecting" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("gridcell", { name: "torstai, 10:00–10:15, allocation:calendar.state.free" })
    ).toBeInTheDocument();
  });

  it("adds a word to the state of a cell in the Highlight", () => {
    renderCalendar([{ weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 660, kind: "range" }]);

    expect(
      screen.getByRole("gridcell", {
        name: "maanantai, 10:00–11:00, allocation:calendar.state.demand, allocation:calendar.state.highlighted",
      })
    ).toBeInTheDocument();
  });

  it("gives every Demand bucket, icon and frame a legend row", () => {
    renderCalendar();

    expect(screen.getByText("allocation:calendar.legend.demandOne")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.demandFull")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.allocated")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.affecting")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.selection")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.highlightRange")).toBeInTheDocument();
    expect(screen.getByText("allocation:calendar.legend.highlightAllocation")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderCalendar([
      { weekday: Weekday.Tuesday, beginMinutes: 600, endMinutes: 630, kind: "allocation" },
    ]);

    expect(await axe(container)).toHaveNoViolations();
  });
});
