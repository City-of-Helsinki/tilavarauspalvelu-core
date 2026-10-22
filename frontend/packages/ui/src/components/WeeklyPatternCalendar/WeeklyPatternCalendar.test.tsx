import React, { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import { Weekday } from "../../../gql/gql-types";
import type { WeeklyPatternCalendarProps, WeeklyPatternValue } from "./types";
import { WeeklyPatternCalendar } from "./WeeklyPatternCalendar";

type Data = { priority: "primary" | "secondary" };
const primary: Data = { priority: "primary" };
const secondary: Data = { priority: "secondary" };

const availability = [
  { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 600 },
  { weekday: Weekday.Tuesday, beginMinutes: 480, endMinutes: 600 },
];

type Overrides = Partial<WeeklyPatternCalendarProps<Data>> & { initial?: WeeklyPatternValue<Data> };

function Harness({ initial = [], onChange, ...overrides }: Overrides) {
  const [value, setValue] = useState<WeeklyPatternValue<Data>>(initial);
  return (
    <>
      <WeeklyPatternCalendar<Data>
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        step={30}
        availability={availability}
        brush={primary}
        locale="en"
        getStateLabel={(cell) => (cell.data ? cell.data.priority : cell.availability === "open" ? "free" : "closed")}
        getCellAppearance={(data) => (data.priority === "primary" ? "primary" : "secondary")}
        announcements={{ painted: "Added", erased: "Removed" }}
        alternative={{ id: "form", label: "Skip to the time form" }}
        aria-label="Suitable times"
        {...overrides}
      />
      <form id="form" aria-label="Time form" />
    </>
  );
}

const cell = (name: RegExp) => screen.getByRole("gridcell", { name });

describe("WeeklyPatternCalendar", () => {
  test("is a grid with weekday column headers and state in every cell label", () => {
    render(<Harness />);
    expect(screen.getByRole("grid", { name: "Suitable times" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    expect(cell(/^Monday, 08:00–08:30, free$/)).toBeInTheDocument();
    expect(cell(/^Wednesday, 08:00–08:30, closed$/)).toHaveAttribute("aria-disabled", "true");
  });

  test("short weekday names are shown, and the header keeps the long name as its accessible name", () => {
    render(<Harness weekdayNameStyle="short" />);
    const header = screen.getByRole("columnheader", { name: "Wednesday" });
    expect(header).toHaveTextContent("Wed");
    expect(cell(/^Wednesday, 08:00–08:30, closed$/)).toBeInTheDocument();
  });

  test("long weekday names are shown without the prop", () => {
    render(<Harness />);
    expect(screen.getByRole("columnheader", { name: "Wednesday" })).toHaveTextContent("Wednesday");
  });

  test("only one cell is in the tab order", () => {
    render(<Harness />);
    const tabbable = screen.getAllByRole("gridcell").filter((element) => element.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/^Monday, 08:00–08:30/);
  });

  test("Enter paints the cell, announces it, and Enter again erases it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Added: Monday, 08:00–08:30");

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("status")).toHaveTextContent("Removed: Monday, 08:00–08:30");
  });

  test("Shift+ArrowDown extends a run, announcing the whole span", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 570, data: primary },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Added: Monday, 08:00–09:30");
  });

  test("the first cell of a run is named after the whole run", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]} />);
    expect(cell(/^Monday, 08:00–09:00, primary$/)).toHaveAttribute("aria-selected", "true");
    expect(cell(/^Monday, 08:30–09:00, primary$/)).toHaveAttribute("aria-selected", "true");
  });

  test("every cell of a long run has its own accessible name", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 600, data: primary }]} />);
    const names = screen
      .getAllByRole("gridcell", { name: /^Monday, .*primary$/ })
      .map((element) => element.getAttribute("aria-label"));
    expect(names).toEqual([
      "Monday, 08:00–10:00, primary",
      "Monday, 08:30–09:00, primary",
      "Monday, 09:00–09:30, primary",
      "Monday, 09:30–10:00, primary",
    ]);
  });

  test("a cell says whether it is painted, apart from what aria-selected reports", () => {
    render(
      <Harness
        initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary }]}
        getCellProps={(info) => ({ "data-test-painted": info.painted })}
      />
    );
    const painted = cell(/^Monday, 08:00–08:30, primary$/);
    expect(painted).toHaveAttribute("data-test-painted", "true");
    expect(painted).toHaveAttribute("aria-selected", "true");

    const empty = cell(/^Monday, 08:30–09:00, free$/);
    expect(empty).toHaveAttribute("data-test-painted", "false");
    expect(empty).toHaveAttribute("aria-selected", "false");
  });

  test("a custom renderer decides what a cell shows", () => {
    render(
      <Harness
        initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]}
        renderCellContent={(info) => (info.painted ? <span>{info.data?.priority}</span> : null)}
      />
    );
    expect(cell(/^Monday, 08:00–09:00, primary$/)).toHaveTextContent("primary");
    expect(cell(/^Monday, 09:00–09:30, free$/)).toBeEmptyDOMElement();
  });

  test("without a custom renderer a cell shows its hour, and a painted run its range", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]} />);
    expect(cell(/^Monday, 08:30–09:00, primary$/)).toHaveTextContent("8:00–9:00");
    expect(cell(/^Monday, 09:00–09:30, free$/)).toHaveTextContent("9:00");
  });

  test("a different brush paints over an existing run instead of erasing it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        brush={secondary}
        initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary }]}
        onChange={onChange}
      />
    );
    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: secondary },
    ]);
  });

  test("a refused paint is announced with its reason and does not change the value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} isValidPaint={() => "Too short"} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Too short");
  });

  test("saved times in closed cells stay visible and can be erased", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initial={[{ weekday: Weekday.Wednesday, beginMinutes: 480, endMinutes: 510, data: primary }]}
        onChange={onChange}
      />
    );
    const stale = cell(/^Wednesday, 08:00–08:30, primary$/);
    expect(stale).toHaveAttribute("aria-disabled", "true");

    stale.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test("painted times outside the opening hours extend the grid", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 360, endMinutes: 390, data: primary }]} />);
    expect(cell(/^Monday, 06:00–06:30, primary$/)).toBeInTheDocument();
  });

  test("read-only grids cannot be edited", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness readOnly onChange={onChange} />);
    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
  });

  test("closed cells cannot be painted", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    cell(/^Wednesday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  test("a skip link leads to the equivalent form", () => {
    render(<Harness />);
    expect(screen.getByRole("link", { name: "Skip to the time form" })).toHaveAttribute("href", "#form");
  });

  test("rows are labelled with the hour they start", () => {
    render(<Harness />);
    expect(within(screen.getByRole("grid")).getByRole("rowheader", { name: "08:00" })).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <Harness
        initial={[
          { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary },
          { weekday: Weekday.Tuesday, beginMinutes: 540, endMinutes: 570, data: secondary },
        ]}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  test("a read-only grid has no axe violations", async () => {
    const { container } = render(<Harness readOnly />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
