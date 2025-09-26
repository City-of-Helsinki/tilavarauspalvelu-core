import { addSeconds, addWeeks, startOfISOWeek } from "date-fns";
import { type CalendarEventBuffer } from "./Calendar";
import { ReservableTimeSpanType } from "../../gql/gql-types";

export type ReservationEventType = {
  beginsAt: string;
  endsAt: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
};

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

/// Invert reservable timespans to get closed timespans
export function getEventClosedHours(events: ReservableTimeSpanType[], weekBegin: Date): CalendarEventBuffer[] {
  if (events.length === 0) return [];

  const weekBeginTime = startOfISOWeek(weekBegin);
  const weekEndTime = addWeeks(weekBeginTime, 1);

  // Create a closed event spanning the whole week
  const closedEvents: CalendarEventBuffer[] = [
    {
      start: weekBeginTime,
      end: weekEndTime,
      event: { state: "CLOSED" },
    },
  ];

  // For every reservable timespan, split the last closed event into two parts:
  // one before and one after the reservable timespan
  for (const rst of events) {
    const rstStart = new Date(rst.startDatetime);
    const rstEnd = new Date(rst.endDatetime);

    (closedEvents[closedEvents.length - 1] as CalendarEventBuffer).end = rstStart;
    closedEvents.push({
      start: rstEnd,
      end: weekEndTime,
      event: { state: "CLOSED" },
    });
  }

  return closedEvents;
}
