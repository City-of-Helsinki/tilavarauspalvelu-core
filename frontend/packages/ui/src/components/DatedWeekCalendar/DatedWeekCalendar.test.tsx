import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
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
  opensInNewTab: "opens in a new tab",
  draft: {
    hint: "Your reservation. Press Enter to move it.",
    grabbed: "Moving",
    moved: "Moved to",
    cancelled: "Move cancelled",
    slotSelected: "Selected",
    controls: "Move your reservation",
    earlier: "Earlier",
    later: "Later",
    shorter: "Shorter",
    longer: "Longer",
  },
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

function listElement(): HTMLDetailsElement {
  const list = screen.getByText("Show as a list").closest("details");
  if (!list) {
    throw new Error("The list alternative is missing");
  }
  return list;
}

// Narrows an optional value without an `as` or `!` assertion, matching listElement() above.
function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

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

  test("has no axe violations", { timeout: 20_000 }, async () => {
    const { container } = renderCalendar({
      events: [
        event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T11:00:00+03:00"),
        event("b", "Maintenance", "2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00", "Blocked"),
      ],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DatedWeekCalendar current time line", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const nowLines = () => screen.queryAllByTestId("dated-week-calendar__now-line");

  test("is drawn through every day column when today is in the shown week, at the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T09:15:00+03:00"));
    renderCalendar();
    const lines = nowLines();
    expect(lines).toHaveLength(7);
    expect(lines[0]).toHaveStyle({ top: "50%" });
  });

  // The dot sits in the row header, not in a line, so it stays in view while the header is sticky and the grid
  // scrolls sideways. There is one header per hour, so the dot's offset is read against the hour and not the row.
  test("the hour's row header carries the one dot, at the time inside that hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T09:15:00+03:00"));
    renderCalendar();

    const dots = screen.getAllByTestId("dated-week-calendar__now-dot");
    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveStyle({ top: "25%" });

    const header = required(dots[0]?.closest("th"), "The dot is not in a row header");
    expect(header).toHaveAttribute("role", "rowheader");
    expect(header).toHaveAccessibleName("09:00");
    for (const line of nowLines()) {
      expect(within(line).queryByTestId("dated-week-calendar__now-dot")).not.toBeInTheDocument();
    }
  });

  test("is hidden when today is outside the shown range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T09:15:00+03:00"));
    renderCalendar({ date: new Date("2026-11-04T10:00:00+02:00") });
    expect(nowLines()).toHaveLength(0);
  });

  test("is hidden when the current time is outside the visible hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T23:15:00+03:00"));
    renderCalendar();
    expect(nowLines()).toHaveLength(0);
  });

  test("is hidden in the day view when the shown day is not today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T09:15:00+03:00"));
    renderCalendar({ view: "day", date: new Date("2026-10-22T10:00:00+03:00") });
    expect(nowLines()).toHaveLength(0);
  });
});

describe("DatedWeekCalendar event links", () => {
  const two = [
    event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T11:00:00+03:00"),
    event("b", "Maintenance", "2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00", "Blocked"),
  ];
  const getEventHref = (item: DatedEvent<Data>) => `/reservations/${item.id}`;

  test("events with a link are links in the text list that say they open a new tab", () => {
    renderCalendar({ getEventHref });
    const link = screen.getByRole("link", { name: /Band practice/ });
    expect(link).toHaveAttribute("href", "/reservations/a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAccessibleName(
      "Wednesday 21 October, 09:00–11:00: Confirmed: Band practice, opens in a new tab"
    );
  });

  test("events without a link stay plain text", () => {
    renderCalendar({ getEventHref: (item) => (item.id === "a" ? "/reservations/a" : undefined), events: two });
    expect(screen.getAllByRole("link", { name: /opens in a new tab/ })).toHaveLength(1);
    expect(screen.getByText(/Blocked: Maintenance/, { selector: "li" })).toBeInTheDocument();
  });

  test("a cell with one linked event says it opens a new tab", () => {
    renderCalendar({ getEventHref });
    expect(
      cell(/^Wednesday 21 October, 09:00–11:00, Confirmed: Band practice, opens in a new tab$/)
    ).toBeInTheDocument();
    expect(cell(/^Wednesday 21 October, 11:00–11:30, free$/)).toBeInTheDocument();
  });

  test("Enter and Space on a cell with one linked event open it in a new tab", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderCalendar({ getEventHref });
    cell(/^Wednesday 21 October, 09:00–11:00/).focus();
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenLastCalledWith("/reservations/a", "_blank", "noopener,noreferrer");
    await user.keyboard(" ");
    expect(open).toHaveBeenCalledTimes(2);
    open.mockRestore();
  });

  test("Enter on a cell without a linked event does nothing", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderCalendar({ getEventHref });
    cell(/^Wednesday 21 October, 11:00–11:30, free$/).focus();
    await user.keyboard("{Enter}");
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  test("Enter on a cell with several linked events moves focus to the first of them in the list", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderCalendar({ getEventHref, events: two });
    const list = listElement();
    expect(list.open).toBe(false);

    cell(/^Wednesday 21 October, 10:00–10:30/).focus();
    await user.keyboard("{Enter}");

    expect(open).not.toHaveBeenCalled();
    expect(list.open).toBe(true);
    expect(screen.getByRole("link", { name: /Band practice/ })).toHaveFocus();
    open.mockRestore();
  });

  test("the list can still be opened and closed by hand", async () => {
    const user = userEvent.setup();
    renderCalendar({ getEventHref });
    const list = listElement();
    await user.click(screen.getByText("Show as a list"));
    expect(list.open).toBe(true);
    await user.click(screen.getByText("Show as a list"));
    expect(list.open).toBe(false);
  });

  test("a loading calendar is marked busy", () => {
    renderCalendar({ isLoading: true });
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
  });

  test("a skip link leads to the equal form when there is one", () => {
    renderCalendar({ alternative: { id: "form", label: "Skip to the form" } });
    expect(screen.getByRole("link", { name: "Skip to the form" })).toHaveAttribute("href", "#form");
    expect(screen.getAllByRole("link", { name: /^Skip to/ })).toHaveLength(2);
  });

  test("a calendar with links has no axe violations", { timeout: 20_000 }, async () => {
    const { container } = renderCalendar({ getEventHref, events: two });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DatedWeekCalendar choosing and moving", () => {
  const draft = event("draft", "Your reservation", "2026-10-21T10:00:00+03:00", "2026-10-21T11:00:00+03:00", "Draft");
  const range = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });

  function renderInteractive(overrides: Partial<DatedWeekCalendarProps<Data>> = {}) {
    const onSelectSlot = vi.fn<(r: { start: Date; end: Date }) => string | null>(() => null);
    const onMoveDraft = vi.fn<(r: { start: Date; end: Date }) => string | null>(() => null);
    const view = renderCalendar({ events: [draft], draftId: "draft", onSelectSlot, onMoveDraft, ...overrides });
    return { ...view, onSelectSlot, onMoveDraft };
  }

  const log = () => screen.getByRole("log");

  // The draft's body is split into one segment per row it spans; any of them can be grabbed.
  const draftHandle = () => required(screen.getAllByTestId("dated-week-calendar__draft")[0], "The draft is missing");

  test("a grid where cells can be chosen is not read only", () => {
    renderInteractive();
    expect(screen.getByRole("grid")).not.toHaveAttribute("aria-readonly");
  });

  test("clicking a free open cell asks to choose it and announces the time", async () => {
    const user = userEvent.setup();
    const { onSelectSlot } = renderInteractive();
    await user.click(cell(/^Wednesday 21 October, 08:30–09:00, free$/));
    expect(onSelectSlot).toHaveBeenCalledWith(range("2026-10-21T08:30:00+03:00", "2026-10-21T09:00:00+03:00"));
    expect(log()).toHaveTextContent("Selected: Wednesday 21 October, 08:30–09:00");
  });

  test("Enter and Space on a free open cell choose it too", async () => {
    const user = userEvent.setup();
    const { onSelectSlot } = renderInteractive();
    cell(/^Thursday 22 October, 09:00–09:30, free$/).focus();
    await user.keyboard("{Enter} ");
    expect(onSelectSlot).toHaveBeenCalledTimes(2);
  });

  test("a refused choice announces the reason instead", async () => {
    const user = userEvent.setup();
    renderInteractive({ onSelectSlot: () => "Too soon" });
    await user.click(cell(/^Wednesday 21 October, 08:30–09:00, free$/));
    expect(log()).toHaveTextContent("Too soon");
    expect(log()).not.toHaveTextContent("Selected");
  });

  test("closed cells can't be chosen", async () => {
    const user = userEvent.setup();
    const { onSelectSlot } = renderInteractive({
      isOpen: ({ start }) => start.getTime() >= new Date("2026-10-21T09:00:00+03:00").getTime(),
    });
    await user.click(cell(/^Wednesday 21 October, 08:30–09:00, closed$/));
    expect(onSelectSlot).not.toHaveBeenCalled();
    expect(cell(/^Wednesday 21 October, 09:00–09:30, free$/)).not.toHaveAttribute("aria-disabled");
  });

  test("clicking an event with a link opens it", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderInteractive({
      events: [draft, event("a", "Band", "2026-10-22T09:00:00+03:00", "2026-10-22T10:00:00+03:00")],
      getEventHref: (item) => (item.id === "a" ? "/r/a" : undefined),
    });
    await user.click(cell(/^Thursday 22 October, 09:00–10:00/));
    expect(open).toHaveBeenCalledWith("/r/a", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });

  test("the draft cell is described by how to move it", () => {
    renderInteractive();
    expect(cell(/^Wednesday 21 October, 10:00–11:00, Draft: Your reservation$/)).toHaveAccessibleDescription(
      "Your reservation. Press Enter to move it."
    );
    expect(cell(/^Wednesday 21 October, 08:00–08:30, free$/)).not.toHaveAccessibleDescription();
  });

  test("Enter on the draft grabs it, arrows move a preview and Enter confirms", async () => {
    const user = userEvent.setup();
    const { onMoveDraft, onSelectSlot } = renderInteractive();
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}");
    expect(log()).toHaveTextContent("Moving");
    expect(onSelectSlot).not.toHaveBeenCalled();

    await user.keyboard("{ArrowDown}");
    expect(log()).toHaveTextContent("Wednesday 21 October, 10:30–11:30");
    expect(cell(/^Wednesday 21 October, 10:30–11:30, Draft: Your reservation$/)).toHaveFocus();
    expect(onMoveDraft).not.toHaveBeenCalled();

    await user.keyboard("{ArrowRight}{Enter}");
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-22T10:30:00+03:00", "2026-10-22T11:30:00+03:00"));
    expect(log()).toHaveTextContent("Moved to: Thursday 22 October, 10:30–11:30");
  });

  test("Shift and the arrows change the length", async () => {
    const user = userEvent.setup();
    const { onMoveDraft } = renderInteractive();
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{Shift>}{ArrowDown}{/Shift}{Enter}");
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T11:30:00+03:00"));
  });

  test("Escape cancels the move and the draft goes back", async () => {
    const user = userEvent.setup();
    const { onMoveDraft } = renderInteractive();
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{ArrowDown}{Escape}");
    expect(onMoveDraft).not.toHaveBeenCalled();
    expect(log()).toHaveTextContent("Move cancelled");
    expect(cell(/^Wednesday 21 October, 10:00–11:00, Draft: Your reservation$/)).toBeInTheDocument();
  });

  test("a refused move says why and stays in move mode", async () => {
    const user = userEvent.setup();
    renderInteractive({ onMoveDraft: vi.fn(() => "Already booked") });
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(log()).toHaveTextContent("Already booked");
    expect(cell(/^Wednesday 21 October, 10:30–11:30, Draft: Your reservation$/)).toBeInTheDocument();
  });

  test("leaving the grid cancels a move", async () => {
    const user = userEvent.setup();
    renderInteractive();
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{ArrowDown}");
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(cell(/^Wednesday 21 October, 10:00–11:00, Draft: Your reservation$/)).toBeInTheDocument();
  });

  test("buttons move and resize the draft without any dragging or move mode", async () => {
    const user = userEvent.setup();
    const { onMoveDraft } = renderInteractive();
    const group = screen.getByRole("group", { name: "Move your reservation" });
    await user.click(within(group).getByRole("button", { name: "Later" }));
    expect(onMoveDraft).toHaveBeenLastCalledWith(range("2026-10-21T10:30:00+03:00", "2026-10-21T11:30:00+03:00"));
    await user.click(within(group).getByRole("button", { name: "Earlier" }));
    expect(onMoveDraft).toHaveBeenLastCalledWith(range("2026-10-21T09:30:00+03:00", "2026-10-21T10:30:00+03:00"));
    await user.click(within(group).getByRole("button", { name: "Longer" }));
    expect(onMoveDraft).toHaveBeenLastCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T11:30:00+03:00"));
    await user.click(within(group).getByRole("button", { name: "Shorter" }));
    expect(onMoveDraft).toHaveBeenLastCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00"));
    expect(log()).toHaveTextContent("Moved to");
  });

  test("there are no move buttons without a way to move the draft", () => {
    renderInteractive({ onMoveDraft: undefined });
    expect(screen.queryByRole("group", { name: "Move your reservation" })).not.toBeInTheDocument();
  });

  test("dragging the draft to another cell moves it, keeping its length, and commits on release", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(draftHandle());
    expect(log()).toHaveTextContent("Moving");

    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 09:00–09:30/));
    expect(cell(/^Wednesday 21 October, 09:00–10:00, Draft: Your reservation$/)).toBeInTheDocument();
    expect(onMoveDraft).not.toHaveBeenCalled();

    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T09:00:00+03:00", "2026-10-21T10:00:00+03:00"));
    expect(log()).toHaveTextContent("Moved to: Wednesday 21 October, 09:00–10:00");
  });

  test("dragging across days moves the draft to the day under the pointer", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(draftHandle());
    fireEvent.pointerEnter(cell(/^Thursday 22 October, 10:00–10:30/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-22T10:00:00+03:00", "2026-10-22T11:00:00+03:00"));
  });

  test("pressing and releasing the draft without crossing a cell leaves it grabbed, like a click", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(draftHandle());
    fireEvent.pointerUp(window);
    expect(onMoveDraft).not.toHaveBeenCalled();
    expect(cell(/^Wednesday 21 October, 10:00–11:00, Draft: Your reservation$/)).toBeInTheDocument();
  });

  test("dragging the resize handle changes the draft's end, keeping its start, and commits on release", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(screen.getByTestId("dated-week-calendar__resize-handle"));
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 11:30–12:00/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T12:00:00+03:00"));
  });

  test("the resize handle can't shrink the draft below one step", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(screen.getByTestId("dated-week-calendar__resize-handle"));
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 08:00–08:30/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T10:30:00+03:00"));
  });

  test("a pointercancel cancels a drag without committing anything", () => {
    const { onMoveDraft } = renderInteractive();
    fireEvent.pointerDown(draftHandle());
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 09:00–09:30/));
    fireEvent.pointerCancel(window);
    expect(onMoveDraft).not.toHaveBeenCalled();
  });

  // Wednesday is closed before 09:00 and over a lunch break from 11:30 to 12:00. Every other cell is open.
  const at = (time: string) => new Date(`2026-10-21T${time}:00+03:00`).getTime();
  const lunchBreak = ({ start }: { start: Date }) => {
    const time = start.getTime();
    return !((time >= at("00:00") && time < at("09:00")) || (time >= at("11:30") && time < at("12:00")));
  };

  test("a drag doesn't take the draft onto closed cells, it stays at the last place it fitted", () => {
    const { onMoveDraft } = renderInteractive({ isOpen: lunchBreak });
    fireEvent.pointerDown(draftHandle());
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 09:00–09:30/));
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 08:30–09:00/));
    expect(cell(/^Wednesday 21 October, 09:00–10:00, Draft: Your reservation$/)).toBeInTheDocument();
    // 11:00–12:00 would cover the closed 11:30.
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 11:00–11:30/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T09:00:00+03:00", "2026-10-21T10:00:00+03:00"));
  });

  test("a drag doesn't take the draft where the consumer refuses it", () => {
    const { onMoveDraft } = renderInteractive({
      isDraftAllowed: ({ start }) => start.getTime() !== new Date("2026-10-22T10:00:00+03:00").getTime(),
    });
    fireEvent.pointerDown(draftHandle());
    fireEvent.pointerEnter(cell(/^Thursday 22 October, 10:00–10:30/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).not.toHaveBeenCalled();
  });

  test("the resize handle stops at a closed cell", () => {
    const { onMoveDraft } = renderInteractive({ isOpen: lunchBreak });
    fireEvent.pointerDown(screen.getByTestId("dated-week-calendar__resize-handle"));
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 11:00–11:30/));
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 11:30–12:00/));
    fireEvent.pointerUp(window);
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T10:00:00+03:00", "2026-10-21T11:30:00+03:00"));
  });

  test("the arrows jump the draft over closed cells and say where it is when it can't go further", async () => {
    const user = userEvent.setup();
    const { onMoveDraft } = renderInteractive({
      isOpen: lunchBreak,
      visibleHours: { beginMinutes: 480, endMinutes: 840 },
    });
    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{ArrowDown}{ArrowDown}");
    expect(log()).toHaveTextContent("Wednesday 21 October, 12:00–13:00");

    await user.keyboard("{Enter}");
    expect(onMoveDraft).toHaveBeenCalledWith(range("2026-10-21T12:00:00+03:00", "2026-10-21T13:00:00+03:00"));

    cell(/^Wednesday 21 October, 10:00–11:00/).focus();
    await user.keyboard("{Enter}{ArrowUp}{ArrowUp}");
    expect(log()).toHaveTextContent("Wednesday 21 October, 09:00–10:00");
  });

  test("hovering a free cell shows a ghost of the draft where a click would move it", () => {
    renderInteractive();
    fireEvent.pointerEnter(cell(/^Thursday 22 October, 08:30–09:00, free$/));
    // The ghost keeps the draft's hour, so it covers two cells.
    expect(screen.getAllByTestId("dated-week-calendar__ghost")).toHaveLength(2);
    expect(screen.getAllByTestId("dated-week-calendar__ghost")[0]).toHaveTextContent("Your reservation");
    fireEvent.pointerLeave(screen.getByRole("grid"));
    expect(screen.queryByTestId("dated-week-calendar__ghost")).not.toBeInTheDocument();
  });

  test("there is no ghost where the draft doesn't fit, on the draft itself, or for a touch", () => {
    renderInteractive({ isOpen: lunchBreak });
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 11:00–11:30, free$/));
    expect(screen.queryByTestId("dated-week-calendar__ghost")).not.toBeInTheDocument();
    fireEvent.pointerEnter(cell(/^Wednesday 21 October, 10:00–11:00/));
    expect(screen.queryByTestId("dated-week-calendar__ghost")).not.toBeInTheDocument();
    fireEvent.pointerEnter(cell(/^Thursday 22 October, 08:30–09:00, free$/), { pointerType: "touch" });
    expect(screen.queryByTestId("dated-week-calendar__ghost")).not.toBeInTheDocument();
  });

  test("an interactive grid has no axe violations", { timeout: 20_000 }, async () => {
    // The day view has the same draft, hint, buttons and cell markup with a seventh of the cells.
    const { container } = renderInteractive({ view: "day" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
