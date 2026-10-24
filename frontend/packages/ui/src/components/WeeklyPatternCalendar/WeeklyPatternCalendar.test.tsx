import React, { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import { Weekday } from "../../../gql/gql-types";
import type {
  WeekdayInterval,
  WeeklyPatternAnnouncements,
  WeeklyPatternCalendarProps,
  WeeklyPatternValue,
} from "./types";
import { LONG_PRESS_MS } from "./useLongPressPaint";
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
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30, free$/)).toBeInTheDocument();
    expect(cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30, closed$/)).toHaveAttribute("aria-disabled", "true");
  });

  test("short weekday names are shown, and the header keeps the long name as its accessible name", () => {
    render(<Harness weekdayNameStyle="short" />);
    expect(screen.getByRole("columnheader", { name: "common:weekdayLongEnum.WEDNESDAY" })).toBeInTheDocument();
    const stickyHeader = screen.getByTestId("weekly-pattern__sticky-header");
    expect(stickyHeader).toHaveTextContent("common:weekdayShortEnum.WEDNESDAY");
    expect(stickyHeader).not.toHaveTextContent("common:weekdayLongEnum.WEDNESDAY");
    expect(cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30, closed$/)).toBeInTheDocument();
  });

  test("long weekday names are shown without the prop", () => {
    render(<Harness />);
    expect(screen.getByTestId("weekly-pattern__sticky-header")).toHaveTextContent("common:weekdayLongEnum.WEDNESDAY");
  });

  test("only one cell is in the tab order", () => {
    render(<Harness />);
    const tabbable = screen.getAllByRole("gridcell").filter((element) => element.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
  });

  test("Enter paints the cell, announces it, and Enter again erases it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Added: common:weekdayLongEnum.MONDAY, 08:00–08:30");

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("status")).toHaveTextContent("Removed: common:weekdayLongEnum.MONDAY, 08:00–08:30");
  });

  test("Shift+ArrowDown extends a run, announcing the whole span", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 570, data: primary },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Added: common:weekdayLongEnum.MONDAY, 08:00–09:30");
  });

  test("the first cell of a run is named after the whole run", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]} />);
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–09:00, primary$/)).toHaveAttribute("aria-selected", "true");
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00, primary$/)).toHaveAttribute("aria-selected", "true");
  });

  test("every cell of a long run has its own accessible name", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 600, data: primary }]} />);
    const names = screen
      .getAllByRole("gridcell", { name: /^common:weekdayLongEnum.MONDAY, .*primary$/ })
      .map((element) => element.getAttribute("aria-label"));
    expect(names).toEqual([
      "common:weekdayLongEnum.MONDAY, 08:00–10:00, primary",
      "common:weekdayLongEnum.MONDAY, 08:30–09:00, primary",
      "common:weekdayLongEnum.MONDAY, 09:00–09:30, primary",
      "common:weekdayLongEnum.MONDAY, 09:30–10:00, primary",
    ]);
  });

  test("a cell says whether it is painted, apart from what aria-selected reports", () => {
    render(
      <Harness
        initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary }]}
        getCellProps={(info) => ({ "data-test-painted": info.painted })}
      />
    );
    const painted = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30, primary$/);
    expect(painted).toHaveAttribute("data-test-painted", "true");
    expect(painted).toHaveAttribute("aria-selected", "true");

    const empty = cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00, free$/);
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
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–09:00, primary$/)).toHaveTextContent("primary");
    expect(cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30, free$/)).toBeEmptyDOMElement();
  });

  test("without a custom renderer a cell shows its hour, and a painted run its range", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]} />);
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00, primary$/)).toHaveTextContent("8:00–9:00");
    expect(cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30, free$/)).toHaveTextContent("9:00");
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
    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: secondary },
    ]);
  });

  test("a refused paint is announced with its reason and does not change the value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} isValidPaint={() => "Too short"} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Too short");
  });

  test("a sweep over an already painted cell validates and announces each changed run alone", async () => {
    const isValidPaint = vi.fn(() => null);
    const user = userEvent.setup();
    render(
      <Harness
        initial={[{ weekday: Weekday.Monday, beginMinutes: 510, endMinutes: 540, data: primary }]}
        isValidPaint={isValidPaint}
      />
    );

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(isValidPaint).toHaveBeenLastCalledWith({
      weekday: Weekday.Monday,
      beginMinutes: 540,
      endMinutes: 570,
      data: primary,
    });
    expect(isValidPaint).toHaveBeenCalledWith({
      weekday: Weekday.Monday,
      beginMinutes: 480,
      endMinutes: 510,
      data: primary,
    });
    expect(isValidPaint).not.toHaveBeenCalledWith(expect.objectContaining({ beginMinutes: 480, endMinutes: 570 }));
    expect(screen.getByRole("status").textContent?.trim()).toBe(
      "Added: common:weekdayLongEnum.MONDAY, 08:00–08:30, common:weekdayLongEnum.MONDAY, 09:00–09:30"
    );
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
    const stale = cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30, primary$/);
    expect(stale).toHaveAttribute("aria-disabled", "true");

    stale.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test("painted times outside the opening hours extend the grid", () => {
    render(<Harness initial={[{ weekday: Weekday.Monday, beginMinutes: 360, endMinutes: 390, data: primary }]} />);
    expect(cell(/^common:weekdayLongEnum.MONDAY, 06:00–06:30, primary$/)).toBeInTheDocument();
  });

  test("read-only grids cannot be edited", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness readOnly onChange={onChange} />);
    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
  });

  test("closed cells cannot be painted", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("with paintable times beyond the availability", () => {
    // Wednesday is closed but paintable from 08:00 to 09:00. Everything else outside the availability is not.
    const paintable = [{ weekday: Weekday.Wednesday, beginMinutes: 480, endMinutes: 540 }];
    const label = (cell: { data?: Data; availability: string }) => cell.data?.priority ?? cell.availability;

    test("cells are open, closed or unavailable, and only unavailable cells are disabled", () => {
      render(<Harness paintable={paintable} getStateLabel={label} />);
      expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30, open$/)).not.toHaveAttribute("aria-disabled");
      expect(cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30, closed$/)).not.toHaveAttribute("aria-disabled");
      expect(cell(/^common:weekdayLongEnum.WEDNESDAY, 09:00–09:30, unavailable$/)).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });

    test("closed cells inside them can be painted", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness paintable={paintable} getStateLabel={label} onChange={onChange} />);
      cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30/).focus();
      await user.keyboard("{Enter}");
      expect(onChange).toHaveBeenLastCalledWith([
        { weekday: Weekday.Wednesday, beginMinutes: 480, endMinutes: 510, data: primary },
      ]);
    });

    test("unavailable cells cannot be painted, and a sweep stops short of them", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness paintable={paintable} getStateLabel={label} onChange={onChange} />);
      cell(/^common:weekdayLongEnum.WEDNESDAY, 09:00–09:30/).focus();
      await user.keyboard("{Enter}");
      expect(onChange).not.toHaveBeenCalled();

      cell(/^common:weekdayLongEnum.WEDNESDAY, 08:30–09:00/).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      expect(onChange).toHaveBeenLastCalledWith([
        { weekday: Weekday.Wednesday, beginMinutes: 510, endMinutes: 540, data: primary },
      ]);
    });

    test("a drag across an unavailable cell validates and announces the cells on each side alone", async () => {
      // Thursday 08:30 to 09:00 is unavailable, between two paintable cells.
      const withGap = [
        { weekday: Weekday.Thursday, beginMinutes: 480, endMinutes: 510 },
        { weekday: Weekday.Thursday, beginMinutes: 540, endMinutes: 570 },
      ];
      const isValidPaint = vi.fn(() => null);
      const user = userEvent.setup();
      render(<Harness paintable={withGap} getStateLabel={label} isValidPaint={isValidPaint} />);

      await user.pointer([
        { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.THURSDAY, 08:00–08:30/) },
        { target: cell(/^common:weekdayLongEnum.THURSDAY, 08:30–09:00/) },
        { target: cell(/^common:weekdayLongEnum.THURSDAY, 09:00–09:30/) },
        { keys: "[/MouseLeft]" },
      ]);
      expect(isValidPaint.mock.calls).toEqual([
        [{ weekday: Weekday.Thursday, beginMinutes: 480, endMinutes: 510, data: primary }],
        [{ weekday: Weekday.Thursday, beginMinutes: 540, endMinutes: 570, data: primary }],
      ]);
      expect(screen.getByRole("status").textContent?.trim()).toBe(
        "Added: common:weekdayLongEnum.THURSDAY, 08:00–08:30, common:weekdayLongEnum.THURSDAY, 09:00–09:30"
      );
    });
  });

  describe("run error tooltip", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    // Monday 08:00–08:30 alone is too short.
    const renderInvalidRun = () =>
      render(
        <Harness
          initial={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary }]}
          getRunError={(cell) => (cell.endMinutes - cell.beginMinutes < 60 ? "Too short" : null)}
        />
      );
    const tooltip = () => screen.queryByTestId("weekly-pattern__run-error");
    const hover = (target: Element) => fireEvent.pointerOver(target, { pointerType: "mouse", buttons: 0 });
    const wait = (ms: number) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      });

    test("stays while the pointer crosses other cells, then follows the cell it ends on", () => {
      renderInvalidRun();
      hover(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/));
      expect(tooltip()).toHaveTextContent("Too short");

      hover(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/));
      wait(150);
      hover(cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/));
      expect(tooltip()).toBeInTheDocument();

      // Crossing more cells doesn't restart the delay.
      wait(50);
      expect(tooltip()).not.toBeInTheDocument();
    });

    test("stays when the pointer reaches it across the gap", () => {
      renderInvalidRun();
      hover(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/));
      hover(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/));
      fireEvent.pointerEnter(screen.getByTestId("weekly-pattern__run-error"));
      wait(1000);
      expect(tooltip()).toHaveTextContent("Too short");
    });

    test("coming back to the run keeps it", () => {
      renderInvalidRun();
      const run = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
      hover(run);
      hover(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/));
      hover(run);
      wait(1000);
      expect(tooltip()).toHaveTextContent("Too short");
    });
  });

  describe("on touch", () => {
    // jsdom has no layout, so the test decides which cell is under the finger.
    let under: Element | null = null;
    beforeEach(() => {
      vi.useFakeTimers();
      document.elementFromPoint = () => under;
    });
    afterEach(() => {
      vi.useRealTimers();
      // @ts-expect-error -- jsdom doesn't implement it, the test added it.
      delete document.elementFromPoint;
      under = null;
    });

    // jsdom's TouchEvent rejects plain objects as touches, so the list is attached afterwards.
    const touch = (type: string, target: Element, touches: Array<{ clientX: number; clientY: number }>) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: touches });
      act(() => {
        target.dispatchEvent(event);
      });
      return event;
    };
    const at = (clientY: number) => [{ clientX: 100, clientY }];
    const holdLongEnough = () => {
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_MS);
      });
    };

    test("a long press and a drag paints the range, and the drag doesn't scroll", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
      const end = cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      under = end;
      const move = touch("touchmove", start, at(140));
      touch("touchend", start, []);

      expect(move.defaultPrevented).toBe(true);
      expect(onChange).toHaveBeenLastCalledWith([
        { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 570, data: primary },
      ]);
    });

    test("a swipe that moves before the long press completes scrolls instead of painting", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);

      under = start;
      touch("touchstart", start, at(100));
      const move = touch("touchmove", start, at(130));
      holdLongEnough();
      touch("touchend", start, []);

      expect(move.defaultPrevented).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });

    test("a second finger during painting cancels the gesture and lets the browser zoom", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
      const end = cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      under = end;
      const pinch = touch("touchmove", start, [...at(140), { clientX: 200, clientY: 200 }]);
      const after = touch("touchmove", start, at(150));
      touch("touchend", start, []);

      expect(pinch.defaultPrevented).toBe(false);
      expect(after.defaultPrevented).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });

    test("a new touch during painting cancels the earlier gesture", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
      const end = cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      under = end;
      touch("touchmove", start, at(140));
      expect(end).toHaveAttribute("aria-selected", "true");

      touch("touchstart", start, [...at(140), { clientX: 200, clientY: 200 }]);
      // The preview of the cancelled gesture is gone, not left on the grid.
      expect(end).toHaveAttribute("aria-selected", "false");

      touch("touchend", start, []);
      expect(onChange).not.toHaveBeenCalled();
    });

    test("the click after a long press doesn't toggle the painted cell back", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      touch("touchend", start, []);
      fireEvent.click(start);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith([
        { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary },
      ]);
    });

    // fireEvent.click has detail 0, like a click from assistive technology.
    test("a later assistive technology click after a drag that sent no click still toggles the cell", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
      const end = cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/);
      const other = cell(/^common:weekdayLongEnum.TUESDAY, 08:00–08:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      under = end;
      touch("touchmove", start, at(140));
      touch("touchend", start, []);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      fireEvent.click(other);

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([{ weekday: Weekday.Tuesday, beginMinutes: 480, endMinutes: 510, data: primary }])
      );
    });

    test("a cancelled touch doesn't swallow the next click", () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const start = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);

      under = start;
      touch("touchstart", start, at(100));
      holdLongEnough();
      touch("touchcancel", start, []);
      fireEvent.click(start);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith([
        { weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 510, data: primary },
      ]);
    });
  });

  test("a skip link leads to the equivalent form", () => {
    render(<Harness />);
    expect(screen.getByRole("link", { name: "Skip to the time form" })).toHaveAttribute("href", "#form");
  });

  test("has no skip link without an alternative", () => {
    render(<Harness alternative={undefined} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
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

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/) },
      { keys: "[/MouseLeft]" },
    ]);

    expect(onSelectionChange).toHaveBeenCalledWith(monday(510, 540));
    expect(screen.getByRole("status")).toHaveTextContent("Selected: common:weekdayLongEnum.MONDAY, 08:30–09:00");
  });

  test("a drag moves the open end of the Selection, and the release commits it", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/) },
      { target: cell(/^common:weekdayLongEnum.MONDAY, 09:30–10:00/) },
      // Moving back towards the press shrinks the run again, so only the release decides what is chosen.
      { target: cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/) },
      { keys: "[/MouseLeft]" },
    ]);

    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(onSelectionChange).toHaveBeenCalledWith(monday(480, 570));
  });

  test("a touch tap chooses one cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    await user.pointer({ keys: "[TouchA]", target: cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/) });

    expect(onSelectionChange).toHaveBeenCalledWith(monday(540, 570));
  });

  test("Enter chooses the focused cell, and Space replaces the Selection", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 510));

    await user.keyboard("{ArrowDown} ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/)).toHaveAttribute("aria-selected", "false");
  });

  test("Shift and an arrow key grow the Selection, and shrink it from the end focus is on", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 510)} onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 570));
    expect(screen.getByRole("status")).toHaveTextContent("Selected: common:weekdayLongEnum.MONDAY, 08:00–09:30");

    // Focus sits on the last cell of the run, so moving that end back leaves the begin time where it was.
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 540));
  });

  test("Escape clears the Selection, and says what was cleared", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 540)} onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Escape}");

    expect(onSelectionChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Selection cleared: common:weekdayLongEnum.MONDAY, 08:00–09:00"
    );
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/)).toHaveAttribute("aria-selected", "false");
  });

  test("Escape during a drag cancels the drag, so the release chooses nothing", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(540, 570)} onSelectionChange={onSelectionChange} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/) },
      { target: cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/) },
    ]);
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[/MouseLeft]" });

    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  test("a click with Shift held starts the next Shift sweep from the clicked cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 540));

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/) },
      { keys: "[/MouseLeft]" },
    ]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(540, 570));

    await user.keyboard("{ArrowDown}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(540, 600));
  });

  test("a plain arrow key moves focus and keeps the Selection", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness initialSelection={monday(480, 510)} onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");

    expect(cell(/^common:weekdayLongEnum.TUESDAY, 08:30–09:00/)).toHaveFocus();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/)).toHaveAttribute("aria-selected", "true");
  });

  test("aria-selected marks only the Selection, so a cell with data is not announced as selected", () => {
    render(
      <SelectHarness
        value={[{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }]}
        initialSelection={monday(540, 570)}
      />
    );

    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–09:00, primary$/)).toHaveAttribute("aria-selected", "false");
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00, primary$/)).toHaveAttribute("aria-selected", "false");
    expect(cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30, free$/)).toHaveAttribute("aria-selected", "true");
  });

  test("the ends of the Selection are marked, so a view can frame the run", () => {
    render(<SelectHarness initialSelection={monday(480, 570)} />);

    const first = cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/);
    const middle = cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/);
    const last = cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/);

    expect(first).toHaveAttribute("data-selection-start");
    expect(first).not.toHaveAttribute("data-selection-end");
    expect(middle).not.toHaveAttribute("data-selection-start");
    expect(middle).not.toHaveAttribute("data-selection-end");
    expect(last).toHaveAttribute("data-selection-end");
    expect(last).not.toHaveAttribute("data-selection-start");
  });

  // Every offset of the frame has to be a length. A browser drops the whole box shadow when one of them is not,
  // and then only the cell that sets its own value keeps a frame. jsdom does not check a length, so this test
  // reads the offsets instead and fails if any of them loses its unit.
  test("every cell of the Selection keeps all four shadows of the frame", () => {
    render(<SelectHarness initialSelection={monday(480, 570)} />);

    const cells = [
      cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/),
      cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/),
      cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/),
    ];

    for (const td of cells) {
      const shadows = [...getComputedStyle(td).boxShadow.matchAll(/inset (\S+) (\S+)/g)];
      expect(shadows).toHaveLength(4);
      for (const [, offsetX, offsetY] of shadows) {
        expect(offsetX).toMatch(/^-?(0|\d+px)$/);
        expect(offsetY).toMatch(/^-?(0|\d+px)$/);
      }
    }
  });

  test("no gesture changes the value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    // A brush is given, so a gesture that fell through to painting would show up in onChange.
    render(<SelectHarness onChange={onChange} brush={primary} initialSelection={monday(480, 510)} />);

    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/) },
      { target: cell(/^common:weekdayLongEnum.MONDAY, 09:00–09:30/) },
      { keys: "[/MouseLeft]" },
    ]);
    await user.pointer({ keys: "[TouchA]", target: cell(/^common:weekdayLongEnum.MONDAY, 09:30–10:00/) });
    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}{Shift>}{ArrowDown}{/Shift}{Escape}");

    expect(onChange).not.toHaveBeenCalled();
  });

  test("a Selection cannot start on a closed cell", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectHarness onSelectionChange={onSelectionChange} />);

    cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    await user.pointer([
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30/) },
      { keys: "[/MouseLeft]" },
    ]);

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
      { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/) },
      { target: cell(/^common:weekdayLongEnum.MONDAY, 10:00–10:30/) },
      { keys: "[/MouseLeft]" },
    ]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(480, 510));

    cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/).focus();
    await user.keyboard("{Enter}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));

    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(monday(510, 540));
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:30–09:00/)).toHaveFocus();
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
