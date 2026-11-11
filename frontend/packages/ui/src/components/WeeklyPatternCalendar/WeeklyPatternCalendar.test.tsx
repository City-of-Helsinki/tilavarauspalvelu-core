import React, { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { axe } from "vitest-axe";
import { Weekday } from "../../../gql/gql-types";
import type { WeeklyPatternCalendarProps, WeeklyPatternValue } from "./types";
import { LONG_PRESS_MS } from "./useLongPressPaint";
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
    expect(cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30, free$/)).toBeInTheDocument();
    expect(cell(/^common:weekdayLongEnum.WEDNESDAY, 08:00–08:30, closed$/)).toHaveAttribute("aria-disabled", "true");
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

  test("a refused selection is announced with its reason and does not change the value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} isValidSelection={() => "Too short"} />);

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Too short");
  });

  test("a sweep over an already painted cell validates and announces each changed run alone", async () => {
    const isValidSelection = vi.fn(() => null);
    const user = userEvent.setup();
    render(
      <Harness
        initial={[{ weekday: Weekday.Monday, beginMinutes: 510, endMinutes: 540, data: primary }]}
        isValidSelection={isValidSelection}
      />
    );

    cell(/^common:weekdayLongEnum.MONDAY, 08:00–08:30/).focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(isValidSelection).toHaveBeenLastCalledWith({
      weekday: Weekday.Monday,
      beginMinutes: 540,
      endMinutes: 570,
      data: primary,
    });
    expect(isValidSelection).toHaveBeenCalledWith({
      weekday: Weekday.Monday,
      beginMinutes: 480,
      endMinutes: 510,
      data: primary,
    });
    expect(isValidSelection).not.toHaveBeenCalledWith(expect.objectContaining({ beginMinutes: 480, endMinutes: 570 }));
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
      const isValidSelection = vi.fn(() => null);
      const user = userEvent.setup();
      render(<Harness paintable={withGap} getStateLabel={label} isValidSelection={isValidSelection} />);

      await user.pointer([
        { keys: "[MouseLeft>]", target: cell(/^common:weekdayLongEnum.THURSDAY, 08:00–08:30/) },
        { target: cell(/^common:weekdayLongEnum.THURSDAY, 08:30–09:00/) },
        { target: cell(/^common:weekdayLongEnum.THURSDAY, 09:00–09:30/) },
        { keys: "[/MouseLeft]" },
      ]);
      expect(isValidSelection.mock.calls).toEqual([
        [{ weekday: Weekday.Thursday, beginMinutes: 480, endMinutes: 510, data: primary }],
        [{ weekday: Weekday.Thursday, beginMinutes: 540, endMinutes: 570, data: primary }],
      ]);
      expect(screen.getByRole("status").textContent?.trim()).toBe(
        "Added: common:weekdayLongEnum.THURSDAY, 08:00–08:30, common:weekdayLongEnum.THURSDAY, 09:00–09:30"
      );
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
