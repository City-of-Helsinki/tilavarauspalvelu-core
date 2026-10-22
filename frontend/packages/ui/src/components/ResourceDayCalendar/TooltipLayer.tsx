"use client";

import React, { useEffect, useImperativeHandle, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { DatedEvent } from "../DatedWeekCalendar/types";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import { EventTooltip } from "./styles";

export type TooltipController<TData extends CalendarData> = {
  show(events: Array<DatedEvent<TData>>, anchor: DOMRect): void;
  hide(): void;
};

type Props<TData extends CalendarData> = {
  controllerRef: RefObject<TooltipController<TData> | null>;
  render: (event: DatedEvent<TData>) => ReactNode;
};

/** Holds the hover tooltip's state, so showing it re-renders only this component and not the grid. */
export function TooltipLayer<TData extends CalendarData>({ controllerRef, render }: Props<TData>) {
  const [tooltip, setTooltip] = useState<{ events: Array<DatedEvent<TData>>; rect: DOMRect } | null>(null);
  useImperativeHandle(
    controllerRef,
    () => ({ show: (events, rect) => setTooltip({ events, rect }), hide: () => setTooltip(null) }),
    []
  );

  useEffect(() => {
    if (!tooltip) {
      return;
    }
    // WCAG 1.4.13: content shown on hover can be dismissed without moving the pointer.
    const dismiss = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setTooltip(null);
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [tooltip]);

  if (!tooltip) {
    return null;
  }
  return (
    <EventTooltip
      aria-hidden
      data-testid="resource-day-calendar__tooltip"
      style={{
        left: Math.min(tooltip.rect.left, Math.max(window.innerWidth - 316, 0)),
        // Flips above the cell in the lower part of the window, where there is no room below.
        ...(tooltip.rect.bottom > window.innerHeight * 0.6
          ? { bottom: window.innerHeight - tooltip.rect.top + 4 }
          : { top: tooltip.rect.bottom + 4 }),
      }}
    >
      {tooltip.events.map((item) => (
        <React.Fragment key={item.id}>{render(item)}</React.Fragment>
      ))}
    </EventTooltip>
  );
}
