import React, { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import { Weekday } from "../../../gql/gql-types";
import type {
  WeekdayInterval,
  WeeklyPatternAnnouncements,
  WeeklyPatternCalendarProps,
  WeeklyPatternValue,
} from "./types";
import { WeeklyPatternCalendar } from "./WeeklyPatternCalendar";

type Data = { priority: "primary" | "secondary" };
const primary: Data = { priority: "primary" };
const secondary: Data = { priority: "secondary" };

const availability = [
  { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 600 },
  { weekday: Weekday.Tuesday, beginMinutes: 480, endMinutes: 600 },
];

// A harness fixes which props variant it renders, so its overrides are the props of that one variant. The
// partial of the whole union is a union too, and spreading that matches no variant.
type PaintProps = Extract<WeeklyPatternCalendarProps<Data>, { announcements: WeeklyPatternAnnouncements }>;
type SelectVariantProps = Extract<WeeklyPatternCalendarProps<Data>, { onSelectionChange: unknown }>;

type Overrides = Partial<Omit<PaintProps, "readOnly">> & {
  readOnly?: boolean;
  initial?: WeeklyPatternValue<Data>;
};

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

type SelectOverrides = Partial<SelectVariantProps> & { initialSelection?: WeekdayInterval | null };

// Select mode: the grid chooses a Selection and never writes the value, so the value is a plain prop here.
function SelectHarness({ value = [], initialSelection = null, onSelectionChange, ...overrides }: SelectOverrides) {
  const [selection, setSelection] = useState<WeekdayInterval | null>(initialSelection);
  return (
    <>
      <WeeklyPatternCalendar<Data>
        value={value}
        selection={selection}
        onSelectionChange={(next) => {
          setSelection(next);
          onSelectionChange?.(next);
        }}
        selectionAnnouncements={{ chosen: "Selected", cleared: "Selection cleared" }}
        step={30}
        availability={availability}
        locale="en"
        getStateLabel={(cell) => (cell.data ? cell.data.priority : cell.availability === "open" ? "free" : "closed")}
        getCellAppearance={(data) => (data.priority === "primary" ? "primary" : "secondary")}
        alternative={{ id: "form", label: "Skip to the time form" }}
        aria-label="Allocation"
        {...overrides}
      />
      <form id="form" aria-label="Time form" />
    </>
  );
}

const cell = (name: RegExp) => screen.getByRole("gridcell", { name });

const monday = (beginMinutes: number, endMinutes: number): WeekdayInterval => ({
  weekday: Weekday.Monday,
  beginMinutes,
  endMinutes,
});

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

describe("WeeklyPatternCalendar in select mode", () => {
  test("a pointer press chooses the cell it pressed, and announces it", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    await user.pointer([{ keys: "[MouseLeft>]", target: cell(/^Monday, 08:30–09:00/) }, { keys: "[/MouseLeft]" }]);

    expect(onSelectionChange).toHaveBeenCalledWith(monday(510, 540));
    expect(screen.getByRole("status")).toHaveTextContent("Selected: Monday, 08:30–09:00");
  });

  test("a drag moves the open end of the Selection, and the release commits it", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^Monday, 08:00–08:30/) },
      { target: cell(/^Monday, 09:30–10:00/) },
      // Moving back towards the press shrinks the run again, so only the release decides what is chosen.
      { target: cell(/^Monday, 09:00–09:30/) },
      { keys: "[/MouseLeft]" },
    ]);

    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(onSelectionChange).toHaveBeenCalledWith(monday(480, 570));
  });

  test("a touch tap chooses one cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    await user.pointer({ keys: "[TouchA]", target: cell(/^Monday, 09:00–09:30/) });

    expect(onSelectionChange).toHaveBeenCalledWith(monday(540, 570));
  });

  test("Enter chooses the focused cell, and Space replaces the Selection", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 510));

    await user.keyboard("{ArrowDown} ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));
    expect(cell(/^Monday, 08:00–08:30/)).toHaveAttribute("aria-selected", "false");
  });

  test("Shift and an arrow key grow the Selection, and shrink it from the end focus is on", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 510)} onSelectionChange={onSelectionChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 570));
    expect(screen.getByRole("status")).toHaveTextContent("Selected: Monday, 08:00–09:30");

    // Focus sits on the last cell of the run, so moving that end back leaves the begin time where it was.
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 540));
  });

  test("Escape clears the Selection, and says what was cleared", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 540)} onSelectionChange={onSelectionChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Escape}");

    expect(onSelectionChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole("status")).toHaveTextContent("Selection cleared: Monday, 08:00–09:00");
    expect(cell(/^Monday, 08:00–08:30/)).toHaveAttribute("aria-selected", "false");
  });

  test("a plain arrow key moves focus and keeps the Selection", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 510)} onSelectionChange={onSelectionChange} />);

    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");

    expect(cell(/^Tuesday, 08:30–09:00/)).toHaveFocus();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(cell(/^Monday, 08:00–08:30/)).toHaveAttribute("aria-selected", "true");
  });

  test("aria-selected marks only the Selection, so a cell with data is not announced as selected", () => {
    render(
      <SelectHarness
        value={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]}
        initialSelection={monday(540, 570)}
      />
    );

    expect(cell(/^Monday, 08:00–09:00, primary$/)).toHaveAttribute("aria-selected", "false");
    expect(cell(/^Monday, 08:30–09:00, primary$/)).toHaveAttribute("aria-selected", "false");
    expect(cell(/^Monday, 09:00–09:30, free$/)).toHaveAttribute("aria-selected", "true");
  });

  test("the ends of the Selection are marked, so a view can frame the run", () => {
    render(<SelectHarness initialSelection={monday(480, 570)} />);

    const first = cell(/^Monday, 08:00–08:30/);
    const middle = cell(/^Monday, 08:30–09:00/);
    const last = cell(/^Monday, 09:00–09:30/);

    expect(first).toHaveAttribute("data-selection-start");
    expect(first).not.toHaveAttribute("data-selection-end");
    expect(middle).not.toHaveAttribute("data-selection-start");
    expect(middle).not.toHaveAttribute("data-selection-end");
    expect(last).toHaveAttribute("data-selection-end");
    expect(last).not.toHaveAttribute("data-selection-start");
  });

  test("no gesture changes the value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    // A brush is given, so a gesture that fell through to painting would show up in onChange.
    render(<SelectHarness onChange={onChange} brush={primary} initialSelection={monday(480, 510)} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^Monday, 08:00–08:30/) },
      { target: cell(/^Monday, 09:00–09:30/) },
      { keys: "[/MouseLeft]" },
    ]);
    await user.pointer({ keys: "[TouchA]", target: cell(/^Monday, 09:30–10:00/) });
    cell(/^Monday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}{Shift>}{ArrowDown}{/Shift}{Escape}");

    expect(onChange).not.toHaveBeenCalled();
  });

  test("a Selection cannot start on a closed cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    cell(/^Wednesday, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    await user.pointer([{ keys: "[MouseLeft>]", target: cell(/^Wednesday, 08:00–08:30/) }, { keys: "[/MouseLeft]" }]);

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test("a Selection cannot cross a closed cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    const gapped = [
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540 },
      { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 660 },
    ];
    render(<SelectHarness availability={gapped} onSelectionChange={onSelectionChange} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^Monday, 08:00–08:30/) },
      { target: cell(/^Monday, 10:00–10:30/) },
      { keys: "[/MouseLeft]" },
    ]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 510));

    cell(/^Monday, 08:30–09:00/).focus();
    await user.keyboard("{Enter}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));

    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));
    expect(cell(/^Monday, 08:30–09:00/)).toHaveFocus();
  });

  test("a grid in select mode has no axe violations", async () => {
    const { container } = render(
      <SelectHarness
        value={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]}
        initialSelection={monday(540, 600)}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
