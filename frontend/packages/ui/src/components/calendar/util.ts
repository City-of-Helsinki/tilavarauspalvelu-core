import { addSeconds } from "date-fns";
import { type CalendarEventBuffer } from "./Calendar";

export type ReservationEventType = {
  beginsAt: string;
  endsAt: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
};

export type TimeSpanType = Readonly<{
  start: Readonly<Date>;
  end: Readonly<Date>;
}>;

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

export function isCellOverlappingSpan(
  cellStart: Readonly<Date>,
  cellEnd: Readonly<Date>,
  spanStart: Readonly<Date>,
  spanEnd: Readonly<Date>
): boolean {
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
