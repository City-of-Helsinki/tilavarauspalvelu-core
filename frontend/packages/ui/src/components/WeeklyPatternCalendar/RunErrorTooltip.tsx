"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { WeeklyPatternTooltip } from "./styles";

// Space between the run and the tooltip, and the minimum space between the tooltip and the window edge.
const GAP_PX = 6;

type Props = {
  /** The calendar, which holds the run's cells. */
  root: RefObject<HTMLElement | null>;
  /**
   * Selectors for the first and last cell of the run the tooltip explains. Looked up when placing, because a child's
   * layout effect runs before its parent's, so element refs collected by the calendar would still be stale here.
   */
  startSelector: string;
  endSelector: string;
  text: string;
  onDismiss: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

/**
 * Shows why a run is invalid, above the run (or below it when there is no room above).
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
      const runTop = start.getBoundingClientRect();
      const runBottom = end.getBoundingClientRect();
      const { width, height } = tooltip.getBoundingClientRect();
      const fitsAbove = runTop.top - GAP_PX - height >= 0;
      const top = fitsAbove ? runTop.top - GAP_PX - height : runBottom.bottom + GAP_PX;
      const centred = runTop.left + runTop.width / 2 - width / 2;
      const left = Math.min(Math.max(centred, GAP_PX), window.innerWidth - width - GAP_PX);
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
  }, [root, startSelector, endSelector, text]);

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
