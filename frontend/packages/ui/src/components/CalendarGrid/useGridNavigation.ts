"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GridAddress<TColumn extends string> = { column: TColumn; index: number };

type Options<TColumn extends string> = {
  columns: ReadonlyArray<TColumn>;
  /** First and last (exclusive) row index that is shown. */
  firstIndex: number;
  endIndex: number;
  rowsPerHour: number;
  /**
   * Which way time runs. With "vertical" (the default) rows are times and the arrows Up and Down move through time.
   * With "horizontal" the cells of a column are laid out along a row, so Left and Right move through time and
   * Up and Down move between the columns. Page, Home and End always move through time.
   */
  timeAxis?: "vertical" | "horizontal";
  /** The cell that holds the tab stop before anything has been focused. Defaults to the first shown cell. */
  defaultActive?: () => GridAddress<TColumn> | null;
};

const addressKey = (column: string, index: number) => `${column}:${index}`;

/**
 * Roving tabindex and cursor movement for a time grid, as in the ARIA Authoring Practices grid pattern.
 * Whatever a cell does besides moving focus is up to the calendar that uses this.
 */
export function useGridNavigation<TColumn extends string>({
  columns,
  firstIndex,
  endIndex,
  rowsPerHour,
  timeAxis = "vertical",
  defaultActive,
}: Options<TColumn>) {
  const [active, setActive] = useState<GridAddress<TColumn> | null>(null);
  const cellElements = useRef(new Map<string, HTMLTableCellElement>());

  const isShown = (address: GridAddress<TColumn> | null): address is GridAddress<TColumn> =>
    address != null && columns.includes(address.column) && address.index >= firstIndex && address.index < endIndex;

  const firstColumn = columns[0];
  const fallback = () =>
    defaultActive?.() ??
    (firstColumn != null && endIndex > firstIndex ? { column: firstColumn, index: firstIndex } : null);
  // The remembered cell can scroll out of the shown range, e.g. after changing week.
  const activeAddress = isShown(active) ? active : fallback();

  // Read by `focus()`, which is exposed once through a ref handle and must not go stale.
  const latest = useRef(activeAddress);
  useEffect(() => {
    latest.current = activeAddress;
  });

  const focusCell = useCallback((address: GridAddress<TColumn>) => {
    cellElements.current.get(addressKey(address.column, address.index))?.focus();
  }, []);

  const focus = useCallback(() => {
    if (latest.current) {
      focusCell(latest.current);
    }
  }, [focusCell]);

  const clampRow = (row: number) => Math.min(Math.max(row, firstIndex), endIndex - 1);

  /** Where a navigation key leads from a cell, or null when the key doesn't navigate. */
  const targetFor = (key: string, column: TColumn, index: number): GridAddress<TColumn> | null => {
    const sideways = (offset: number) =>
      columns[Math.min(Math.max(columns.indexOf(column) + offset, 0), columns.length - 1)] ?? column;
    const earlier = { column, index: clampRow(index - 1) };
    const later = { column, index: clampRow(index + 1) };
    const before = { column: sideways(-1), index };
    const after = { column: sideways(1), index };
    const vertical = timeAxis === "vertical";
    switch (key) {
      case "ArrowDown":
        return vertical ? later : after;
      case "ArrowUp":
        return vertical ? earlier : before;
      case "ArrowRight":
        return vertical ? after : later;
      case "ArrowLeft":
        return vertical ? before : earlier;
      case "PageDown":
        return { column, index: clampRow(index + rowsPerHour) };
      case "PageUp":
        return { column, index: clampRow(index - rowsPerHour) };
      case "Home":
        return { column, index: firstIndex };
      case "End":
        return { column, index: endIndex - 1 };
      default:
        return null;
    }
  };

  /** Stable, so a memoised row can hold on to them. */
  const registerCell = useCallback((column: TColumn, index: number, element: HTMLTableCellElement | null) => {
    const key = addressKey(column, index);
    if (element) {
      cellElements.current.set(key, element);
    } else {
      cellElements.current.delete(key);
    }
  }, []);

  const markActive = useCallback((column: TColumn, index: number) => {
    setActive((previous) => (previous?.column === column && previous.index === index ? previous : { column, index }));
  }, []);

  /** The ref, tab stop and focus tracking every cell needs. */
  const cellProps = (column: TColumn, index: number) => ({
    ref: (element: HTMLTableCellElement | null) => registerCell(column, index, element),
    tabIndex: activeAddress?.column === column && activeAddress.index === index ? 0 : -1,
    onFocus: () => markActive(column, index),
  });

  return { activeAddress, cellProps, registerCell, markActive, targetFor, focus, focusCell };
}
