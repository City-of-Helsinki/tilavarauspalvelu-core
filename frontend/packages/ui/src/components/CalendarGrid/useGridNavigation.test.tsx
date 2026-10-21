import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { useGridNavigation } from "./useGridNavigation";

const columns = ["mon", "tue", "wed"] as const;

function Grid({
  firstIndex = 2,
  endIndex = 6,
  timeAxis,
}: {
  firstIndex?: number;
  endIndex?: number;
  timeAxis?: "vertical" | "horizontal";
}) {
  const grid = useGridNavigation({ columns, firstIndex, endIndex, rowsPerHour: 2, timeAxis });
  const rows = Array.from({ length: endIndex - firstIndex }, (_, offset) => firstIndex + offset);
  return (
    <table>
      <tbody>
        {rows.map((index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td
                key={column}
                {...grid.cellProps(column, index)}
                data-testid={`${column}-${index}`}
                onKeyDown={(event) => {
                  const target = grid.targetFor(event.key, column, index);
                  if (target) {
                    event.preventDefault();
                    grid.focusCell(target);
                  }
                }}
              >
                {column}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cell = (id: string) => screen.getByTestId(id);

describe("useGridNavigation", () => {
  test("only the first shown cell is in the tab order to begin with", () => {
    render(<Grid />);
    const tabbable = screen.getAllByRole("cell").filter((element) => element.getAttribute("tabindex") === "0");
    expect(tabbable).toEqual([cell("mon-2")]);
  });

  test("arrows move a cell at a time and stop at the edges", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    cell("mon-2").focus();
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(cell("mon-2")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowDown}");
    expect(cell("wed-3")).toHaveFocus();
  });

  test("Page keys jump an hour and Home and End go to the first and last row", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    cell("tue-2").focus();
    await user.keyboard("{PageDown}");
    expect(cell("tue-4")).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(cell("tue-5")).toHaveFocus();
    await user.keyboard("{PageUp}");
    expect(cell("tue-3")).toHaveFocus();
    await user.keyboard("{End}");
    expect(cell("tue-5")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cell("tue-2")).toHaveFocus();
  });

  test("the tab stop follows focus", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    cell("mon-2").focus();
    await user.keyboard("{ArrowRight}");
    expect(cell("tue-2")).toHaveAttribute("tabindex", "0");
    expect(cell("mon-2")).toHaveAttribute("tabindex", "-1");
  });

  test("the tab stop falls back to the first cell when the remembered one is no longer shown", () => {
    const { rerender } = render(<Grid />);
    act(() => cell("wed-5").focus());
    expect(cell("wed-5")).toHaveAttribute("tabindex", "0");
    rerender(<Grid endIndex={4} />);
    expect(cell("mon-2")).toHaveAttribute("tabindex", "0");
  });

  test("keys that don't navigate are left alone", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    cell("mon-2").focus();
    await user.keyboard("a{Enter}");
    expect(cell("mon-2")).toHaveFocus();
  });
});

describe("useGridNavigation with time along the row", () => {
  test("Left and Right move through time and Up and Down between the columns", async () => {
    const user = userEvent.setup();
    render(<Grid timeAxis="horizontal" />);
    cell("tue-3").focus();
    await user.keyboard("{ArrowRight}");
    expect(cell("tue-4")).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(cell("tue-2")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cell("tue-2")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(cell("wed-2")).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(cell("mon-2")).toHaveFocus();
  });

  test("Page keys still jump an hour of time and Home and End go to the first and last time", async () => {
    const user = userEvent.setup();
    render(<Grid timeAxis="horizontal" />);
    cell("tue-2").focus();
    await user.keyboard("{PageDown}");
    expect(cell("tue-4")).toHaveFocus();
    await user.keyboard("{PageUp}");
    expect(cell("tue-2")).toHaveFocus();
    await user.keyboard("{End}");
    expect(cell("tue-5")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cell("tue-2")).toHaveFocus();
  });
});
