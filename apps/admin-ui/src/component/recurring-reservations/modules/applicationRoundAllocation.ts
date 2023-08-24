import { get, orderBy, padStart, sortBy, uniqBy } from "lodash";
import {
  ApplicationEventScheduleType,
  ApplicationEventType,
  ApplicationsApplicationApplicantTypeChoices,
  ApplicationType,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  ApplicationEventSchedulePriority,
  OptionType,
} from "../../../common/types";
import { parseApplicationEventScheduleTime } from "../../../common/util";

export const getFilteredApplicationEvents = (
  applications: ApplicationType[],
  unitFilter: OptionType | null,
  timeFilter: OptionType[],
  orderFilter: OptionType[],
  reservationUnitFilter: ReservationUnitType | null
): ApplicationEventType[] => {
  if (applications?.length < 1 || !reservationUnitFilter) return [];

  let applicationEvents = applications.flatMap(
    (application): ApplicationEventType[] =>
      application.applicationEvents as ApplicationEventType[]
  );

  if (orderFilter?.length) {
    const order = orderFilter.map((n) => (n.value as number) - 1);
    applicationEvents = applicationEvents.filter((applicationEvent) =>
      order.every(
        (o) =>
          get(applicationEvent, `applicationEventSchedules[${o}]`) !== undefined
      )
    );
  }

  if (unitFilter) {
    applicationEvents = applicationEvents.filter((applicationEvent) =>
      applicationEvent?.eventReservationUnits?.some((eventReservationUnit) => {
        const unitId = eventReservationUnit?.reservationUnit?.unit?.pk || 0;
        return unitFilter.value === unitId;
      })
    );
  }

  if (timeFilter.length) {
    const priorities = timeFilter.map((n) => n.value);
    applicationEvents = applicationEvents.filter((applicationEvent) =>
      applicationEvent?.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule?.priority &&
          priorities.includes(applicationEventSchedule?.priority)
      )
    );
  }

  if (reservationUnitFilter) {
    applicationEvents = applicationEvents.filter((applicationEvent) =>
      applicationEvent?.eventReservationUnits?.some(
        (eventReservationUnit) =>
          eventReservationUnit?.reservationUnit?.pk === reservationUnitFilter.pk
      )
    );
  }

  return applicationEvents || [];
};

export const getApplicationByApplicationEvent = (
  applications: ApplicationType[],
  applicationEventId: number
): ApplicationType | undefined => {
  return applications.find((application) =>
    application?.applicationEvents?.find(
      (applicationEvent) => applicationEvent?.pk === applicationEventId
    )
  );
};

export type Cell = {
  hour: number;
  minute: number;
  state?: string;
  key: string;
};

export const applicationEventSchedulesToCells = (
  firstSlotStart: number,
  lastSlotStart: number
): Cell[][] => {
  const cells = [] as Cell[][];

  for (let j = 0; j < 7; j += 1) {
    const day = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${j}-${i}-00`,
        hour: i,
        minute: 0,
      } as Cell);
      day.push({
        key: `${j}-${i}-30`,
        hour: i,
        minute: 30,
      } as Cell);
    }
    cells.push(day);
  }

  return cells;
};

export const isSlotAdjacent = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  return minute === 0
    ? selection.includes(`${day}-${hour}-30`) ||
        selection.includes(`${day}-${hour - 1}-30`)
    : selection.includes(`${day}-${hour}-00`) ||
        selection.includes(`${day}-${hour + 1}-00`);
};

export const isSlotFirst = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  return minute === 0
    ? !selection.includes(`${day}-${hour - 1}-30`)
    : !selection.includes(`${day}-${hour}-00`);
};

export const isSlotLast = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  return minute === 0
    ? !selection.includes(`${day}-${hour}-30`)
    : !selection.includes(`${day}-${hour + 1}-00`);
};

export const getApplicationEventScheduleTimes = (
  applicationEventSchedule: ApplicationEventScheduleType
): { begin: string; end: string } => {
  return {
    begin: `${applicationEventSchedule?.day}-${Number(
      applicationEventSchedule?.begin.substring(0, 2)
    )}-${applicationEventSchedule?.begin.substring(3, 5)}`,
    end: `${applicationEventSchedule?.day}-${Number(
      applicationEventSchedule?.end.substring(0, 2)
    )}-${applicationEventSchedule?.end.substring(3, 5)}`,
  };
};

export const timeSlotKeyToTime = (slot: string): number => {
  const [, hour, minute] = slot.split("-").map(Number);
  return new Date().setHours(hour, minute);
};

export const doSomeSlotsFitApplicationEventSchedule = (
  applicationEventSchedule: ApplicationEventScheduleType,
  slots: string[]
): boolean => {
  const { begin, end } = getApplicationEventScheduleTimes(
    applicationEventSchedule
  );

  return slots.some((slot) => {
    const [slotDay, slotHour, slotMinute] = slot.split("-").map(Number);
    const [beginDay, beginHour, beginMinute] = begin.split("-").map(Number);
    const [, endHour, endMinute] = end.split("-").map(Number);
    const slotTime = new Date().setHours(slotHour, slotMinute);
    const beginTime = new Date().setHours(beginHour, beginMinute);
    const endTime = new Date().setHours(endHour, endMinute);
    return slotDay === beginDay && beginTime <= slotTime && endTime > slotTime;
  });
};

export const getMatchingApplicationEventSchedules = (
  selection: string[],
  applicationEventSchedules?: ApplicationEventScheduleType[] | null
): ApplicationEventScheduleType[] => {
  if (!applicationEventSchedules) return [];
  return applicationEventSchedules.filter((applicationEventSchedule) =>
    doSomeSlotsFitApplicationEventSchedule(applicationEventSchedule, selection)
  );
};

export const getSlotApplicationEventCount = (
  slots: string[],
  applicationEvents: ApplicationEventType[] | null
): number => {
  const applicationEventSchedules = applicationEvents?.flatMap(
    (applicationEvent) => applicationEvent.applicationEventSchedules
  );
  const schedules = applicationEventSchedules?.filter(
    (applicationEventSchedule) =>
      applicationEventSchedule &&
      doSomeSlotsFitApplicationEventSchedule(applicationEventSchedule, slots)
  );
  return uniqBy(schedules, "pk").length;
};

export const areSlotsOnStatus = (
  slots: string[],
  applicationEventScheduleResultStatuses: ApplicationEventScheduleResultStatuses,
  status: "accepted" | "declined"
): boolean => {
  return slots.every((slot) =>
    applicationEventScheduleResultStatuses[`${status}Slots`].includes(slot)
  );
};

export const getTimeSlotOptions = (
  day: string,
  startHours: number,
  startMinutes: number,
  endHours: number,
  endOptions?: boolean
): OptionType[] => {
  const timeSlots = [];
  for (let i = startHours; i <= endHours; i += 1) {
    if (endOptions) {
      timeSlots.push({
        label: `${i}:30`,
        value: `${day}-${i}-00`,
      });
      timeSlots.push({
        label: `${i === 23 ? 0 : i + 1}:00`,
        value: `${day}-${i}-30`,
      });
    } else {
      timeSlots.push({
        label: `${i}:00`,
        value: `${day}-${i}-00`,
      });
      timeSlots.push({
        label: `${i}:30`,
        value: `${day}-${i}-30`,
      });
    }
  }

  if (startMinutes === 30) timeSlots.shift();

  return timeSlots;
};

export const getTimeSlots = (
  applicationEventSchedules: ApplicationEventScheduleType[]
): string[] => {
  return applicationEventSchedules?.reduce(
    (acc: string[], cur: ApplicationEventScheduleType) => {
      const { day } = cur;
      const [startHours, startMinutes] = cur.begin.split(":").map(Number);
      const [endHours, endMinutes] = cur.end.split(":").map(Number);
      const timeSlots: string[] = [];
      for (let i = startHours; i <= endHours; i += 1) {
        timeSlots.push(`${day}-${i}-00`);
        timeSlots.push(`${day}-${i}-30`);
      }

      if (startMinutes === 30) timeSlots.shift();
      if (endMinutes === 0) {
        timeSlots.pop();
        timeSlots.pop();
      }
      if (endMinutes === 30) {
        timeSlots.pop();
      }

      return [...acc, ...timeSlots];
    },
    []
  );
};

export const getTimeSeries = (
  day: string,
  begin: string,
  end: string
): string[] => {
  const [, startHours, startMinutes] = begin.split("-").map(Number);
  const [, endHours, endMinutes] = end.split("-").map(Number);
  const timeSlots: string[] = [];
  for (let i = startHours; i <= endHours; i += 1) {
    timeSlots.push(`${day}-${i}-00`);
    timeSlots.push(`${day}-${i}-30`);
  }

  if (startMinutes === 30) timeSlots.shift();
  if (endMinutes === 0) timeSlots.pop();

  return timeSlots;
};

export const getApplicantName = (
  application: ApplicationType | undefined
): string => {
  return application?.applicantType ===
    ApplicationsApplicationApplicantTypeChoices.Individual
    ? `${application?.contactPerson?.firstName} ${application?.contactPerson?.lastName}`.trim()
    : application?.applicantName || "";
};

export const getSlotApplicationEvents = (
  slots: string[] | null,
  applicationEvents: ApplicationEventType[] | null
): ApplicationEventType[] => {
  if (!slots) return [];
  return (
    applicationEvents?.filter((applicationEvent) =>
      applicationEvent?.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule &&
          doSomeSlotsFitApplicationEventSchedule(
            applicationEventSchedule,
            slots
          )
      )
    ) || []
  );
};

export const getTimeSlotMatchingPercentage = (
  applicationEventSchedules: ApplicationEventScheduleType[],
  selection: string[] | null
): number => {
  if (!selection || applicationEventSchedules?.length < 1) {
    return 0;
  }

  const timeSlots = getTimeSlots(applicationEventSchedules);
  const matches = selection?.filter((n) => timeSlots.includes(n)).length;

  return (matches / selection.length) * 100;
};

export const getEarliestScheduleStart = (
  applicationEventSchedules: ApplicationEventScheduleType[]
): string | null => {
  const starts = applicationEventSchedules.map((n) => n.begin).sort();
  return starts?.length > 0 ? starts[0] : null;
};

export const getSelectedApplicationEvents = (
  applicationEvents: ApplicationEventType[],
  selection: string[] | null,
  priority: ApplicationEventSchedulePriority
): ApplicationEventType[] => {
  if (!selection || !applicationEvents) return [];

  return orderBy(
    applicationEvents.filter((applicationEvent) =>
      applicationEvent.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule?.priority === priority &&
          getTimeSlots([applicationEventSchedule]).some((timeSlot) =>
            selection?.some((selectionItem) => timeSlot.includes(selectionItem))
          )
      )
    ),
    [
      (o) =>
        getTimeSlotMatchingPercentage(
          o.applicationEventSchedules as ApplicationEventScheduleType[],
          selection
        ),
      (o) =>
        getEarliestScheduleStart(
          o.applicationEventSchedules as ApplicationEventScheduleType[]
        ),
      (o) => o.name,
    ],
    ["desc", "asc", "asc"]
  );
};

export const getApplicationEventScheduleTimeString = (
  applicationEventSchedules: ApplicationEventScheduleType[],
  priority: ApplicationEventSchedulePriority
): string => {
  const schedules = sortBy(
    applicationEventSchedules?.filter(
      (applicationEventSchedule) =>
        applicationEventSchedule?.priority === priority
    ),
    ["day", "begin"]
  );

  return schedules
    ?.map((schedule) => schedule && parseApplicationEventScheduleTime(schedule))
    .join(", ");
};

export const timeSlotKeyToScheduleTime = (
  slot: string,
  padEnd = false
): string => {
  let [, hours, minutes] = slot.split("-").map(Number);
  if (padEnd) {
    if (minutes === 0) {
      minutes = 30;
    } else {
      hours = hours < 23 ? hours + 1 : 0;
      minutes = 0;
    }
  }

  return `${padStart(`${hours}`, 2, "0")}:${padStart(`${minutes}`, 2, "0")}:00`;
};

export type ApplicationEventScheduleResultStatuses = {
  acceptedSlots: string[];
  declinedSlots: string[];
};

export const getApplicationEventScheduleResultStatuses = (
  applicationEvents: ApplicationEventType[] | null
): ApplicationEventScheduleResultStatuses => {
  const getResultTimeSlots = (
    day: number,
    begin: string,
    end: string
  ): string[] => {
    const allocationResult = {
      day,
      begin,
      end,
    };
    return getTimeSlots([allocationResult as ApplicationEventScheduleType]);
  };

  const schedules = applicationEvents?.flatMap(
    (applicationEvent) => applicationEvent.applicationEventSchedules
  ) as ApplicationEventScheduleType[];

  const { acceptedSlots, declinedSlots } = schedules.reduce(
    (
      acc: ApplicationEventScheduleResultStatuses,
      cur: ApplicationEventScheduleType
    ): ApplicationEventScheduleResultStatuses => {
      if (cur?.applicationEventScheduleResult?.accepted) {
        const { allocatedDay, allocatedBegin, allocatedEnd } =
          cur.applicationEventScheduleResult;

        const allocationResult = getResultTimeSlots(
          allocatedDay as unknown as number,
          allocatedBegin,
          allocatedEnd
        );

        acc.acceptedSlots = [...acc.acceptedSlots, ...allocationResult];
      }

      if (cur?.applicationEventScheduleResult?.declined) {
        const { allocatedDay, allocatedBegin, allocatedEnd } =
          cur.applicationEventScheduleResult;

        const allocationResult = getResultTimeSlots(
          allocatedDay as unknown as number,
          allocatedBegin,
          allocatedEnd
        );
        acc.declinedSlots = [...acc.declinedSlots, ...allocationResult];
      }

      return acc;
    },
    { acceptedSlots: [], declinedSlots: [] }
  );

  return {
    acceptedSlots,
    declinedSlots,
  };
};
