"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { WeeklyPatternTooltip } from "./styles";

// Space between the run and the tooltip, and the minimum space between the tooltip and the window edge.
const GAP_PX = 6;

type Box = { top: number; bottom: number; left: number; right: number };

/**
 * The part of the window where `element` can be seen: the window cut down by every ancestor that clips its overflow,
 * like the grid's scroller. Scrollbars are left out, since content under them is hidden.
 */
function visibleBoxOf(element: Element): Box {
  const box: Box = { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
  for (
    let ancestor = element.parentElement;
    ancestor && ancestor !== document.body;
    ancestor = ancestor.parentElement
  ) {
    const { overflowX, overflowY } = getComputedStyle(ancestor);
    if (overflowX === "visible" && overflowY === "visible") {
      continue;
    }
    const rect = ancestor.getBoundingClientRect();
    const top = rect.top + ancestor.clientTop;
    const left = rect.left + ancestor.clientLeft;
    box.top = Math.max(box.top, top);
    box.bottom = Math.min(box.bottom, top + ancestor.clientHeight);
    box.left = Math.max(box.left, left);
    box.right = Math.min(box.right, left + ancestor.clientWidth);
  }
  return box;
}

const isVisibleIn = (rect: DOMRect, visible: Box) =>
  rect.bottom > visible.top && rect.top < visible.bottom && rect.right > visible.left && rect.left < visible.right;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

type Props = {
  /** The calendar, which holds the run's cells. */
  root: RefObject<HTMLElement | null>;
  /**
   * Selectors for the first and last cell of the run the tooltip explains. Looked up when placing, because a child's
   * layout effect runs before its parent's, so element refs collected by the calendar would still be stale here.
   */
  startSelector: string;
  endSelector: string;
  /** Selector for the hovered or focused cell. The anchor when neither end of the run can be seen. */
  activeSelector: string;
  text: string;
  onDismiss: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

/**
 * Shows why a run is invalid, above the run (or below it when there is no room above).
 *
 * When the grid has scrolled part of the run out of sight, the tooltip points at the part that can still be seen
 * instead of an end that can't. When neither end can be seen, it points at the active cell. It always stays inside the
 * window.
 *
 * Rendered in document.body with a fixed position, like Popover, because the grid scrolls sideways: overflow-x makes
 * the scroller clip in both directions, so a tooltip inside it would be cut off at the top of the grid.
 *
 * Hidden from assistive technology. The reason is already part of every cell's accessible name in the run, which is
 * announced reliably while moving in the grid, unlike a description.
 *
 * WCAG 1.4.13: Escape dismisses it, the pointer can move onto it without it closing, and it stays until the run loses
 * hover and focus.
 */
export function RunErrorTooltip({
  root,
  startSelector,
  endSelector,
  activeSelector,
  text,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
}: Readonly<Props>): React.ReactElement {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const place = () => {
      const start = root.current?.querySelector(startSelector);
      const end = root.current?.querySelector(endSelector);
      const tooltip = tooltipRef.current;
      if (!start || !end || !tooltip) {
        return;
      }
      const startRect = start.getBoundingClientRect();
      const endRect = end.getBoundingClientRect();
      const visible = visibleBoxOf(start);
      const active = root.current?.querySelector(activeSelector);
      const activeRect = active?.getBoundingClientRect();
      const anchor: Box =
        isVisibleIn(startRect, visible) || isVisibleIn(endRect, visible) || !activeRect
          ? // The run, trimmed to what can be seen.
            {
              top: Math.max(startRect.top, visible.top),
              bottom: Math.min(endRect.bottom, visible.bottom),
              left: Math.max(startRect.left, visible.left),
              right: Math.min(startRect.right, visible.right),
            }
          : activeRect;
      const { width, height } = tooltip.getBoundingClientRect();
      const fitsAbove = anchor.top - GAP_PX - height >= GAP_PX;
      const preferredTop = fitsAbove ? anchor.top - GAP_PX - height : anchor.bottom + GAP_PX;
      const top = clamp(preferredTop, GAP_PX, window.innerHeight - height - GAP_PX);
      const centred = (anchor.left + anchor.right) / 2 - width / 2;
      const left = clamp(centred, GAP_PX, window.innerWidth - width - GAP_PX);
      tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      tooltip.dataset.placement = fitsAbove ? "above" : "below";
    };
    place();
    // Scroll events do not bubble. Capture sees the page and the grid's own horizontal scroller.
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [root, startSelector, endSelector, activeSelector, text]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return createPortal(
    <WeeklyPatternTooltip
      ref={tooltipRef}
      aria-hidden
      data-testid="weekly-pattern__run-error"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {text}
    </WeeklyPatternTooltip>,
    document.body
  );
}
