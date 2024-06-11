import { addSeconds } from "date-fns";
import { type CalendarEventBuffer } from "../../types/common";

// TODO use a fragment
export type ReservationEventType = {
  begin: string;
  end: string;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
};
export function getEventBuffers(
  events: ReservationEventType[]
): CalendarEventBuffer[] {
  const buffers: CalendarEventBuffer[] = [];
  for (const event of events) {
    if (!event.begin || !event.end) {
      continue;
    }
    const { bufferTimeBefore, bufferTimeAfter } = event;
    const begin = new Date(event.begin);
    const end = new Date(event.end);

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
