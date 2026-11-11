"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Weekday } from "../../../gql/gql-types";

/** How long a finger has to rest on a cell before a drag paints instead of scrolling. */
export const LONG_PRESS_MS = 350;
/** How far a finger may drift during the press before it counts as the start of a scroll. */
const SLOP_PX = 8;
/** Painting near this distance from the scroll area's top or bottom edge scrolls the area. */
const EDGE_PX = 60;
/** Scroll speed at the very edge, in pixels per frame. */
const MAX_SCROLL_PX = 14;
/**
 * How long after lifting the finger the browser's own click may still arrive. Only that click is ignored.
 * A later click, for example from assistive technology, is a separate action and must toggle the cell.
 */
const CLICK_AFTER_TOUCH_MS = 1000;

type CellAddress = { weekday: Weekday; index: number };

type LongPressCallbacks = {
  /** Starts a paint gesture. Returns false when the cell cannot be painted. */
  start: (weekday: Weekday, index: number) => boolean;
  extend: (weekday: Weekday, index: number) => void;
  end: (shouldCommit: boolean) => void;
};

/** The painted cell under a screen point, read from the `data-weekday` and `data-index` attributes. */
function cellAt(table: HTMLElement, x: number, y: number): CellAddress | null {
  const element = document.elementFromPoint?.(x, y);
  const cell = element?.closest<HTMLElement>("td[data-weekday][data-index]");
  if (!cell || !table.contains(cell)) {
    return null;
  }
  return { weekday: cell.dataset.weekday as Weekday, index: Number(cell.dataset.index) };
}

/** The nearest ancestor that scrolls vertically, or the document when none does. */
function scrollParent(element: HTMLElement): HTMLElement {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/**
 * Touch painting for the weekly grid. A swipe scrolls the page as usual. Holding a finger still on a cell
 * for `LONG_PRESS_MS` starts a paint gesture, and from then on the finger paints instead of scrolling.
 *
 * Pointer events cannot do this. The browser decides at touchstart whether a touch may pan (`touch-action`),
 * and once it pans it sends `pointercancel`. Only `preventDefault()` on a non-passive `touchmove` can keep
 * a touch that is allowed to pan from scrolling, and React registers its touch listeners as passive.
 */
export function useLongPressPaint(callbacks: LongPressCallbacks, enabled: boolean) {
  const tableRef = useRef<HTMLTableElement>(null);
  /** Time (`Date.now()`) until which a click counts as the one that follows a finished paint gesture. */
  const suppressClickUntilRef = useRef(0);

  // The native listeners are set up once, so they read the latest callbacks through this ref.
  const latest = useRef(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });

  useEffect(() => {
    const table = tableRef.current;
    if (!table || !enabled) {
      return;
    }

    let timer: number | undefined;
    let frame: number | undefined;
    let origin: { x: number; y: number } | null = null;
    let finger: { x: number; y: number } | null = null;
    let painting = false;

    const extendTo = (x: number, y: number) => {
      const cell = cellAt(table, x, y);
      if (cell) {
        latest.current.extend(cell.weekday, cell.index);
      }
    };

    // The grid is taller than the screen, so a finger held near an edge scrolls the area under it. The cell
    // under the finger changes as the content moves, so the gesture is extended on every frame.
    const autoScroll = () => {
      frame = undefined;
      if (!painting || !finger) {
        return;
      }
      const scroller = scrollParent(table);
      const isDocument = scroller === document.scrollingElement || scroller === document.documentElement;
      const bounds = isDocument ? { top: 0, bottom: window.innerHeight } : scroller.getBoundingClientRect();
      const top = Math.max(bounds.top, 0);
      const bottom = Math.min(bounds.bottom, window.innerHeight);

      let delta = 0;
      if (finger.y < top + EDGE_PX) {
        delta = -MAX_SCROLL_PX * Math.min(1, (top + EDGE_PX - finger.y) / EDGE_PX);
      } else if (finger.y > bottom - EDGE_PX) {
        delta = MAX_SCROLL_PX * Math.min(1, (finger.y - (bottom - EDGE_PX)) / EDGE_PX);
      }
      if (delta === 0) {
        return;
      }
      scroller.scrollBy(0, delta);
      extendTo(finger.x, finger.y);
      frame = window.requestAnimationFrame(autoScroll);
    };

    const reset = () => {
      window.clearTimeout(timer);
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
      timer = undefined;
      frame = undefined;
      origin = null;
      finger = null;
      painting = false;
      delete table.dataset.touchPainting;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (painting) {
        latest.current.end(false);
      }
      reset();
      suppressClickUntilRef.current = 0;
      // A second finger means pinch zoom, not painting.
      const touch = event.touches.length === 1 ? event.touches[0] : undefined;
      if (!touch) {
        return;
      }
      origin = { x: touch.clientX, y: touch.clientY };
      finger = origin;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (!finger) {
          return;
        }
        const cell = cellAt(table, finger.x, finger.y);
        if (!cell || !latest.current.start(cell.weekday, cell.index)) {
          return;
        }
        painting = true;
        table.dataset.touchPainting = "";
        // A short buzz tells the user the press has turned into painting. Only some Android browsers support it.
        navigator.vibrate?.(10);
      }, LONG_PRESS_MS);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !origin) {
        return;
      }
      finger = { x: touch.clientX, y: touch.clientY };

      if (!painting) {
        // Moving before the press completes is a scroll, so the browser keeps it.
        if (event.touches.length > 1 || Math.hypot(finger.x - origin.x, finger.y - origin.y) > SLOP_PX) {
          window.clearTimeout(timer);
          timer = undefined;
          origin = null;
        }
        return;
      }

      // A second finger during painting means pinch zoom. The gesture is cancelled and the browser gets the touch.
      if (event.touches.length > 1) {
        reset();
        latest.current.end(false);
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }
      extendTo(finger.x, finger.y);
      if (frame === undefined) {
        frame = window.requestAnimationFrame(autoScroll);
      }
    };

    const finish = (shouldCommit: boolean) => () => {
      const wasPainting = painting;
      reset();
      if (!wasPainting) {
        return;
      }
      // A completed press that never moved may still produce a click, which would toggle the cell straight back.
      // A cancelled touch produces no click, so nothing is suppressed then.
      suppressClickUntilRef.current = shouldCommit ? Date.now() + CLICK_AFTER_TOUCH_MS : 0;
      latest.current.end(shouldCommit);
    };
    const onTouchEnd = finish(true);
    const onTouchCancel = finish(false);

    // Android opens a context menu on a long press, and iOS a callout. Neither belongs on the grid.
    const onContextMenu = (event: Event) => {
      if (painting || timer !== undefined) {
        event.preventDefault();
      }
    };

    table.addEventListener("touchstart", onTouchStart, { passive: true });
    table.addEventListener("touchmove", onTouchMove, { passive: false });
    table.addEventListener("touchend", onTouchEnd);
    table.addEventListener("touchcancel", onTouchCancel);
    table.addEventListener("contextmenu", onContextMenu);
    return () => {
      table.removeEventListener("touchstart", onTouchStart);
      table.removeEventListener("touchmove", onTouchMove);
      table.removeEventListener("touchend", onTouchEnd);
      table.removeEventListener("touchcancel", onTouchCancel);
      table.removeEventListener("contextmenu", onContextMenu);
      if (painting) {
        latest.current.end(false);
      }
      reset();
    };
  }, [enabled]);

  /** True once for the click that follows a finished touch paint gesture right away. That click should be ignored. */
  const consumeSuppressedClick = useCallback(() => {
    const suppressed = Date.now() < suppressClickUntilRef.current;
    suppressClickUntilRef.current = 0;
    return suppressed;
  }, []);

  return { tableRef, consumeSuppressedClick };
}
