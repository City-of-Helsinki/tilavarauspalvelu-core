import { addMinutes, addSeconds } from "date-fns";
import { type CalendarEventBuffer, SlotProps } from "./Calendar";
import { ReservableTimeSpanType } from "../../gql/gql-types";
import { useMemo } from "react";

export type ReservationEventType = {
  beginsAt: string;
  endsAt: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
};

export type TimeSpanType = { start: Date; end: Date };

export function getEventBuffers(events: ReservationEventType[]): CalendarEventBuffer[] {
  // TODO: Deprecate this and make buffers non-events, use useSlotPropGetter and getBuffersFromEvents instead
  const buffers: CalendarEventBuffer[] = [];
  for (const event of events) {
    if (!event.beginsAt || !event.endsAt) {
      continue;
    }
    const { bufferTimeBefore, bufferTimeAfter } = event;
    const begin = new Date(event.beginsAt);
    const end = new Date(event.endsAt);

    if (bufferTimeBefore) {
      buffers.push({
        start: addSeconds(begin, -1 * bufferTimeBefore),
        end: begin,
        event: { ...event, state: "BUFFER" },
      });
    }
    if (bufferTimeAfter) {
      buffers.push({
        start: end,
        end: addSeconds(end, bufferTimeAfter),
        event: { ...event, state: "BUFFER" },
      });
    }
  }

  return buffers;
}

export function getBuffersFromEvents(events: ReservationEventType[]): TimeSpanType[] {
  const buffers: TimeSpanType[] = [];

  for (const event of events) {
    const { bufferTimeBefore, bufferTimeAfter } = event;

    if (bufferTimeBefore) {
      const begin = new Date(event.beginsAt);
      buffers.push({
        start: addSeconds(begin, -1 * bufferTimeBefore),
        end: begin,
      });
    }
    if (bufferTimeAfter) {
      const end = new Date(event.endsAt);
      buffers.push({
        start: end,
        end: addSeconds(end, bufferTimeAfter),
      });
    }
  }

  return buffers;
}

export function isCellOverlappingSpan(cellStart: Date, cellEnd: Date, spanStart: Date, spanEnd: Date): boolean {
  // Is this Cell inside the reservable time span?
  //     ┌─ Cell ─┐
  //═══  │        │      # No
  //═════│        │      # No
  //═════│══      │      # Yes
  //═════│════════│      # Yes
  //     │        │
  //     │  ════  │      # Yes
  //     │════════│      # Yes
  //═════│════════│═════ # Yes
  //     │        │
  //     │════════│═════ # Yes
  //     │      ══│═════ # Yes
  //     │        │═════ # No
  //     │        │  ═══ # No
  return cellStart < spanEnd && cellEnd > spanStart;
}

export function useSlotPropGetter(
  reservableTimeSpans: ReservableTimeSpanType[],
  events: ReservationEventType[]
): (date: Date) => SlotProps {
  return useMemo(() => {
    const reservableTimeSpanDates: TimeSpanType[] = reservableTimeSpans?.map((rts) => ({
      start: new Date(rts.startDatetime),
      end: new Date(rts.endDatetime),
    }));

    const bufferTimeSpans = getBuffersFromEvents(events);

    return (date: Date): SlotProps => {
      const isPast = date < new Date();
      if (isPast) return { className: "rbc-timeslot-inactive" };

      if (reservableTimeSpanDates.length === 0) return { className: "rbc-timeslot-inactive" };

      // Calendar cells are 30min slots
      const cellStart = date;
      const cellEnd = addMinutes(cellStart, 30);

      // Cell is closed, if it doesn't overlap with any reservable time span
      const isClosed = !reservableTimeSpanDates.some((span) => {
        return isCellOverlappingSpan(cellStart, cellEnd, span.start, span.end);
      });
      if (isClosed) return { className: "rbc-timeslot-inactive" };

      // Cell is buffer, if it overlaps with any buffer time span
      const isBuffer = bufferTimeSpans.some((span) => {
        return isCellOverlappingSpan(cellStart, cellEnd, span.start, span.end);
      });
      if (isBuffer) return { className: "rbc-event-buffer" };

      return {};
    };
  }, [reservableTimeSpans, events]);
}
