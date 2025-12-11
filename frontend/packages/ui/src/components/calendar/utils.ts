import { addSeconds } from "date-fns";
import type { CalendarEventBuffer } from "./Calendar";

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

export const unavailableBackgroundSVG =
  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNSA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPG1hc2sgaWQ9Im1hc2swXzcxNzZfMTk1MTI4IiBzdHlsZT0ibWFzay10eXBlOmx1bWluYW5jZSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjM1IiBoZWlnaHQ9IjUwIj4KPHBhdGggZD0iTTM0Ljg3NDUgMEgwLjg3NDUxMlY1MEgzNC44NzQ1VjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L21hc2s+CjxwYXRoIGQ9Ik0zNC4yNzk3IC0wLjc3OTMzNkwtMiA1MUwxLjQ2OTM1IDUwLjc3ODlMMzYuNDA0MyAwLjg3NDUxN0wzNC4yNzk3IC0wLjc3OTMzNloiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTE3LjI3OTcgLTI1Ljc3OTNMLTE2LjY1NTMgMjQuMTI1TC0xNS41MzA3IDI1Ljc3ODlMMTguNDA0MyAtMjQuMTI1NUwxNy4yNzk3IC0yNS43NzkzWiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNNTEuMjc5NyAyNC4yMjA3TDE3LjM0NDcgNzQuMTI1TDE4LjQ2OTMgNzUuNzc4OUw1Mi40MDQzIDI1Ljg3NDVMNTEuMjc5NyAyNC4yMjA3WiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4=')";
