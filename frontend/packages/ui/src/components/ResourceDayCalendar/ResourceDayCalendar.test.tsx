import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import type { DatedEvent, DatedRange } from "../DatedWeekCalendar/types";
import { ResourceDayCalendar } from "./ResourceDayCalendar";
import type { ResourceDayCalendarProps, ResourceDayResource } from "./types";

type Data = { state: string };

const event = (id: string, title: string, start: string, end: string): DatedEvent<Data> => ({
  id,
  title,
  start: new Date(start),
  end: new Date(end),
  data: { state: "Confirmed" },
});

const labels = {
  list: "Show as a list",
  skipToList: "Skip to the list",
  emptyList: "Nothing today",
  free: "free",
  closed: "closed",
  opensInNewTab: "opens in a new tab",
  draftResource: "draft",
};

const resources: Array<ResourceDayResource<Data>> = [
  {
    id: "1",
    title: "Studio",
    events: [event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T10:30:00+03:00")],
  },
  { id: "2", title: "Hall", isDraft: true, events: [] },
];

function renderCalendar(overrides: Partial<ResourceDayCalendarProps<Data>> = {}) {
  const props: ResourceDayCalendarProps<Data> = {
    date: new Date("2026-10-21T10:00:00+03:00"),
    resources,
    step: 30,
    visibleHours: { beginMinutes: 480, endMinutes: 720 },
    labels,
    getEventLabel: (item) => `${item.data.state}: ${item.title}`,
    "aria-label": "Reservations",
    ...overrides,
  };
  return { props, ...render(<ResourceDayCalendar<Data> {...props} />) };
}

// Looked up by label because role queries recompute the accessible name of every cell, which is slow in a full grid.
const cell = (name: RegExp) => screen.getByLabelText(name);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResourceDayCalendar", () => {
  test("is a read-only grid with an hour header per hour and a row header per resource", () => {
    renderCalendar();
    expect(screen.getByRole("grid", { name: "Reservations" })).toHaveAttribute("aria-readonly", "true");
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["8", "9", "10", "11"]);
    expect(screen.getAllByRole("rowheader")).toHaveLength(2);
    expect(screen.getByRole("rowheader", { name: "Hall, draft" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Studio" })).toBeInTheDocument();
  });

  test("a cell with an event names the whole event and a free cell says it is free", () => {
    renderCalendar();
    expect(cell(/^Studio, 09:00–10:30, Confirmed: Band practice$/)).toBeInTheDocument();
    expect(cell(/^Hall, 09:00–09:30, free$/)).toBeInTheDocument();
  });

  test("cells outside the open ranges are closed", () => {
    renderCalendar({
      resources: [
        {
          id: "1",
          title: "Studio",
          events: [],
          openRanges: [{ start: new Date("2026-10-21T09:00:00+03:00"), end: new Date("2026-10-21T10:00:00+03:00") }],
        },
      ],
    });
    expect(cell(/^Studio, 08:00–08:30, closed$/)).toHaveAttribute("aria-disabled", "true");
    expect(cell(/^Studio, 09:00–09:30, free$/)).not.toHaveAttribute("aria-disabled");
  });

  test("an event extends the shown hours", () => {
    renderCalendar({
      resources: [
        {
          id: "1",
          title: "Studio",
          events: [event("a", "Early", "2026-10-21T06:00:00+03:00", "2026-10-21T07:00:00+03:00")],
        },
      ],
    });
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("6");
  });

  test("the arrows move through time along a row and between resources", async () => {
    const user = userEvent.setup();
    renderCalendar();
    cell(/^Studio, 08:00–08:30/).focus();
    await user.keyboard("{ArrowRight}");
    expect(cell(/^Studio, 08:30–09:00/)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(cell(/^Hall, 08:30–09:00/)).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(cell(/^Hall, 08:00–08:30/)).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(cell(/^Studio, 08:00–08:30/)).toHaveFocus();
  });

  test("Page and End jump through time", async () => {
    const user = userEvent.setup();
    renderCalendar();
    cell(/^Studio, 08:00–08:30/).focus();
    await user.keyboard("{PageDown}");
    expect(cell(/^Studio, 09:00–10:30/)).toHaveFocus();
    await user.keyboard("{End}");
    expect(cell(/^Studio, 11:30–12:00/)).toHaveFocus();
  });

  test("choosing a free open cell reports the resource and the time", async () => {
    const user = userEvent.setup();
    const onSelectSlot = vi.fn<(resourceId: string, range: DatedRange) => null>(() => null);
    renderCalendar({ onSelectSlot });
    expect(screen.getByRole("grid")).not.toHaveAttribute("aria-readonly");
    cell(/^Hall, 09:30–10:00/).focus();
    await user.keyboard("{Enter}");
    expect(onSelectSlot).toHaveBeenCalledOnce();
    const [resourceId, range] = onSelectSlot.mock.calls[0] ?? [];
    expect(resourceId).toBe("2");
    expect(range).toEqual({
      start: new Date("2026-10-21T09:30:00+03:00"),
      end: new Date("2026-10-21T10:00:00+03:00"),
    });
  });

  test("a refusal is announced", async () => {
    const user = userEvent.setup();
    renderCalendar({ onSelectSlot: () => "Too soon" });
    await user.click(cell(/^Hall, 09:30–10:00/));
    expect(screen.getByRole("log")).toHaveTextContent("Too soon");
  });

  test("closed cells and cells with an event can't be chosen", async () => {
    const user = userEvent.setup();
    const onSelectSlot = vi.fn<(resourceId: string, range: DatedRange) => null>(() => null);
    renderCalendar({
      onSelectSlot,
      resources: [
        {
          id: "1",
          title: "Studio",
          events: [event("a", "Band practice", "2026-10-21T09:00:00+03:00", "2026-10-21T10:00:00+03:00")],
          openRanges: [{ start: new Date("2026-10-21T09:00:00+03:00"), end: new Date("2026-10-21T11:00:00+03:00") }],
        },
      ],
    });
    await user.click(cell(/^Studio, 08:00–08:30/));
    await user.click(cell(/^Studio, 09:00–10:00/));
    expect(onSelectSlot).not.toHaveBeenCalled();
  });

  test("Enter on a cell with a linked event opens the link in a new tab", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderCalendar({ getEventHref: (item) => `/reservations/${item.id}` });
    expect(cell(/^Studio, 09:00–10:30, Confirmed: Band practice, opens in a new tab$/)).toBeInTheDocument();
    cell(/^Studio, 09:00–10:30/).focus();
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalledWith("/reservations/a", "_blank", "noopener,noreferrer");
  });

  test("the list alternative holds the events with their resource and time", async () => {
    const user = userEvent.setup();
    renderCalendar({ getEventHref: (item) => `/reservations/${item.id}` });
    await user.click(screen.getByText("Show as a list"));
    expect(screen.getByRole("link", { name: /Band practice/ })).toHaveTextContent(
      "Studio, 09:00–10:30: Confirmed: Band practice, opens in a new tab"
    );
  });

  test("the list says so when nothing happens", () => {
    renderCalendar({ resources: [{ id: "1", title: "Studio", events: [] }] });
    expect(screen.getByText("Nothing today")).toBeInTheDocument();
  });

  test("hovering a cell with an event shows its tooltip until the pointer leaves or Escape is pressed", async () => {
    const user = userEvent.setup();
    renderCalendar({ renderEventTooltip: (item) => <p>Full title of {item.title}</p> });
    expect(screen.queryByTestId("resource-day-calendar__tooltip")).not.toBeInTheDocument();
    await user.hover(cell(/^Hall, 09:00–09:30, free$/));
    expect(screen.queryByTestId("resource-day-calendar__tooltip")).not.toBeInTheDocument();
    await user.hover(cell(/^Studio, 09:00–10:30/));
    expect(screen.getByTestId("resource-day-calendar__tooltip")).toHaveTextContent("Full title of Band practice");
    expect(screen.getByTestId("resource-day-calendar__tooltip")).toHaveAttribute("aria-hidden", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("resource-day-calendar__tooltip")).not.toBeInTheDocument();
    await user.hover(cell(/^Studio, 10:00–10:30/));
    expect(screen.getByTestId("resource-day-calendar__tooltip")).toBeInTheDocument();
    await user.unhover(cell(/^Studio, 10:00–10:30/));
    expect(screen.queryByTestId("resource-day-calendar__tooltip")).not.toBeInTheDocument();
  });

  test("marks the grid busy while loading", () => {
    renderCalendar({ isLoading: true });
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
  });

  test("has no axe violations", async () => {
    const { container } = renderCalendar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
