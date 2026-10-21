import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import { DatedWeekCalendar } from "./DatedWeekCalendar";
import type { DatedEvent, DatedWeekCalendarProps } from "./types";

type Data = { state: string };

const event = (id: string, title: string, start: string, end: string, state = "Confirmed"): DatedEvent<Data> => ({
  id,
  title,
  start: new Date(start),
  end: new Date(end),
  data: { state },
});

const labels = {
  toolbar: "Calendar controls",
  previous: "Previous",
  next: "Next",
  today: "Today",
  day: "Day",
  week: "Week",
  list: "Show as a list",
  skipToList: "Skip to the list",
  emptyList: "Nothing in this week",
  free: "free",
  closed: "closed",
};

function renderCalendar(overrides: Partial<DatedWeekCalendarProps<Data>> = {}) {
  const props: DatedWeekCalendarProps<Data> = {
    date: new Date("2026-10-21T10:00:00+03:00"),
    onNavigate: vi.fn(),
    view: "week",
    onViewChange: vi.fn(),
    events: [event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T11:00:00+03:00")],
    step: 30,
    visibleHours: { beginMinutes: 480, endMinutes: 720 },
    locale: "en-GB",
    labels,
    getEventLabel: (item) => `${item.data.state}: ${item.title}`,
    "aria-label": "Reservations",
    ...overrides,
  };
  return { props, ...render(<DatedWeekCalendar<Data> {...props} />) };
}

// Looked up by label because role queries recompute the accessible name of every cell, which is slow in a full grid.
const cell = (name: RegExp) => screen.getByLabelText(name);

describe("DatedWeekCalendar", () => {
  test("is a read-only grid with a column header for each day of the week", () => {
    renderCalendar();
    expect(screen.getByRole("grid", { name: "Reservations" })).toHaveAttribute("aria-readonly", "true");
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveAccessibleName("Monday 19 October");
    expect(headers[6]).toHaveAccessibleName("Sunday 25 October");
  });

  test("the day view has a single column", () => {
    renderCalendar({ view: "day" });
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
  });

  test("the first cell of an event is named after the whole event and the others after themselves", () => {
    renderCalendar();
    expect(cell(/^Wednesday 21 October, 09:00–11:00, Confirmed: Band practice$/)).toBeInTheDocument();
    expect(cell(/^Wednesday 21 October, 09:30–10:00, Confirmed: Band practice$/)).toBeInTheDocument();
    expect(cell(/^Wednesday 21 October, 10:30–11:00, Confirmed: Band practice$/)).toBeInTheDocument();
    expect(cell(/^Wednesday 21 October, 11:00–11:30, free$/)).toBeInTheDocument();
  });

  test("the title is shown once, on the cell where the event begins", () => {
    renderCalendar();
    expect(screen.getAllByText("Band practice")).toHaveLength(1);
  });

  test("a cell with overlapping events names all of them", () => {
    renderCalendar({
      events: [
        event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T11:00:00+03:00"),
        event("b", "Maintenance", "2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00", "Blocked"),
      ],
    });
    expect(
      cell(/^Wednesday 21 October, 10:00–10:30, Confirmed: Band practice; Blocked: Maintenance$/)
    ).toBeInTheDocument();
  });

  test("an event that crosses midnight appears on both days", () => {
    renderCalendar({
      events: [event("a", "Night shift", "2026-10-21T23:00:00+03:00", "2026-10-22T09:00:00+03:00")],
      visibleHours: undefined,
      step: 60,
    });
    expect(cell(/^Wednesday 21 October, 23:00–24:00, Confirmed: Night shift$/)).toBeInTheDocument();
    expect(cell(/^Thursday 22 October, 06:00–07:00, Confirmed: Night shift$/)).toBeInTheDocument();
  });

  test("cells outside the open ranges are closed", () => {
    renderCalendar({
      openRanges: [{ start: new Date("2026-10-21T09:00:00+03:00"), end: new Date("2026-10-21T11:00:00+03:00") }],
      events: [],
    });
    expect(cell(/^Wednesday 21 October, 08:00–08:30, closed$/)).toHaveAttribute("aria-disabled", "true");
    expect(cell(/^Wednesday 21 October, 09:00–09:30, free$/)).not.toHaveAttribute("aria-disabled");
  });

  test("an event outside the visible hours extends the grid", () => {
    renderCalendar({ events: [event("a", "Early", "2026-10-21T06:00:00+03:00", "2026-10-21T07:00:00+03:00")] });
    expect(cell(/^Wednesday 21 October, 06:00–07:00, Confirmed: Early$/)).toBeInTheDocument();
  });

  test("only one cell is in the tab order and arrow keys move between cells", async () => {
    const user = userEvent.setup();
    renderCalendar();
    const tabbable = screen.getAllByRole("gridcell").filter((element) => element.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/^Monday 19 October, 08:00–08:30/);

    tabbable[0]?.focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(cell(/^Tuesday 20 October, 08:30–09:00/)).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(cell(/^Tuesday 20 October, 09:30–10:00/)).toHaveFocus();
    await user.keyboard("{End}");
    expect(cell(/^Tuesday 20 October, 11:30–12:00/)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cell(/^Tuesday 20 October, 08:00–08:30/)).toHaveFocus();
  });

  test("the toolbar steps a week in the week view and a day in the day view", async () => {
    const user = userEvent.setup();
    const week = renderCalendar();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(week.props.onNavigate).toHaveBeenLastCalledWith(new Date("2026-10-28T10:00:00+02:00"));
    week.unmount();

    const day = renderCalendar({ view: "day" });
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(day.props.onNavigate).toHaveBeenLastCalledWith(new Date("2026-10-20T10:00:00+03:00"));
  });

  test("the view buttons say which view is shown", async () => {
    const user = userEvent.setup();
    const { props } = renderCalendar();
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(props.onViewChange).toHaveBeenCalledWith("day");
  });

  test("the shown range is announced when it changes", () => {
    renderCalendar();
    expect(screen.getByRole("status")).toHaveTextContent("19 – 25 October 2026");
  });

  test("a text list of the same events is the equal alternative, reachable with a skip link", () => {
    renderCalendar();
    const list = screen.getByText("Show as a list").closest("details");
    expect(screen.getByRole("link", { name: "Skip to the list" })).toHaveAttribute("href", `#${list?.id}`);
    expect(within(list as HTMLElement).getByRole("listitem")).toHaveTextContent(
      "Wednesday 21 October, 09:00–11:00: Confirmed: Band practice"
    );
  });

  test("says so when nothing happens in the shown range", () => {
    renderCalendar({ events: [] });
    expect(screen.getByText("Nothing in this week")).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = renderCalendar({
      events: [
        event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T11:00:00+03:00"),
        event("b", "Maintenance", "2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00", "Blocked"),
      ],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
