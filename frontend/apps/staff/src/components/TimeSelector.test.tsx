import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Priority, Weekday } from "@gql/gql-types";
import type { ApplicationAdminQuery } from "@gql/gql-types";
import { TimeSelector } from "./TimeSelector";

type Section = NonNullable<NonNullable<ApplicationAdminQuery["application"]>["applicationSections"]>[0];

function slot(weekday: Weekday, begin: string, end: string) {
  return { id: `slot-${weekday}-${begin}`, pk: 1, weekday, isClosed: false, reservableTimes: [{ begin, end }] };
}

function option(slots: Array<ReturnType<typeof slot>>) {
  return { reservationUnit: { applicationRoundTimeSlots: slots } };
}

function createSection(overrides: Record<string, unknown> = {}): Section {
  return {
    suitableTimeRanges: [
      {
        pk: 1,
        id: "range-1",
        dayOfTheWeek: Weekday.Wednesday,
        beginTime: "10:00:00",
        endTime: "12:00:00",
        priority: Priority.Primary,
      },
    ],
    reservationUnitOptions: [
      option([slot(Weekday.Wednesday, "08:00:00", "16:00:00")]),
      option([slot(Weekday.Thursday, "09:00:00", "12:00:00")]),
    ],
    ...overrides,
  } as unknown as Section;
}

const cell = (name: RegExp) => screen.getByLabelText(name);

describe("staff TimeSelector", () => {
  test("shows the requested times as a read-only grid", () => {
    render(<TimeSelector applicationSection={createSection()} alternativeId="times" />);

    expect(screen.getByRole("grid", { name: "application:TimeSelector.calendarLabel" })).toHaveAttribute(
      "aria-readonly",
      "true"
    );
    expect(cell(/^keskiviikko, 10:00–12:00, application:TimeSelector.legend.primary$/)).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("a cell is open when any requested reservation unit can be booked then", () => {
    render(<TimeSelector applicationSection={createSection()} alternativeId="times" />);

    expect(cell(/^keskiviikko, 08:00–08:15, application:TimeSelector.legend.open$/)).toBeInTheDocument();
    expect(cell(/^torstai, 09:00–09:15, application:TimeSelector.legend.open$/)).toBeInTheDocument();
    expect(cell(/^torstai, 13:00–13:15, application:TimeSelector.legend.unavailable$/)).toBeInTheDocument();
  });

  test("times cannot be changed", async () => {
    const user = userEvent.setup();
    render(<TimeSelector applicationSection={createSection()} alternativeId="times" />);

    cell(/^torstai, 09:00–09:15/).focus();
    await user.keyboard("{Enter}");

    expect(cell(/^torstai, 09:00–09:15, application:TimeSelector.legend.open$/)).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  test("links to the text list of the same times and has a legend", () => {
    render(<TimeSelector applicationSection={createSection()} alternativeId="times" />);

    expect(screen.getByRole("link", { name: "application:TimeSelector.skipToList" })).toHaveAttribute("href", "#times");
    expect(within(screen.getByTestId("weekly-pattern__legend")).getAllByRole("listitem")).toHaveLength(4);
  });
});
