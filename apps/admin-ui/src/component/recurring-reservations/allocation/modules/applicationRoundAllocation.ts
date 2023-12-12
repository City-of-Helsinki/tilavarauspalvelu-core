import { orderBy, padStart, sortBy, uniqBy } from "lodash";
import {
  type ApplicationEventScheduleNode,
  type ApplicationEventNode,
  ApplicationsApplicationApplicantTypeChoices,
  type ApplicationNode,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import type { ApplicationEventSchedulePriority } from "common/types/common";
import i18next from "i18next";
import type { OptionType } from "@/common/types";

const parseApplicationEventScheduleTime = (
  applicationEventSchedule: ApplicationEventScheduleNode
): string => {
  const weekday = i18next.t(`dayShort.${applicationEventSchedule?.day}`);
  return `${weekday} ${Number(
    applicationEventSchedule.begin.substring(0, 2)
  )}-${Number(applicationEventSchedule.end.substring(0, 2))}`;
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
  applicationEventSchedule: ApplicationEventScheduleNode
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
  applicationEventSchedule: ApplicationEventScheduleNode,
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

export const getSlotApplicationEventCount = (
  slots: string[],
  applicationEvents: ApplicationEventNode[] | null
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

type TimeSlotInput = {
  day: number;
  begin: string;
  end: string;
};
export const getTimeSlots = (
  applicationEventSchedules: TimeSlotInput[]
): string[] => {
  return applicationEventSchedules?.reduce<string[]>((acc, cur) => {
    const { day } = cur;
    const [startHours, startMinutes] = cur.begin.split(":").map(Number);
    const [endHours, endMinutes] = cur.end.split(":").map(Number);
    if (startHours > endHours) {
      return acc;
    }
    if (startHours === endHours && startMinutes >= endMinutes) {
      return acc;
    }
    if (Number.isNaN(startHours) || Number.isNaN(endHours)) {
      return acc;
    }
    // No NaN check for minutes because of equality checks

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
  }, []);
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
  application: ApplicationNode | undefined
): string => {
  return application?.applicantType ===
    ApplicationsApplicationApplicantTypeChoices.Individual
    ? `${application?.contactPerson?.firstName} ${application?.contactPerson?.lastName}`.trim()
    : application?.applicant?.name || "";
};

export const getSlotApplicationEvents = (
  slots: string[] | null,
  applicationEvents: ApplicationEventNode[] | null
): ApplicationEventNode[] => {
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
  applicationEventSchedules: ApplicationEventScheduleNode[],
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
  applicationEventSchedules: ApplicationEventScheduleNode[]
): string | null => {
  const starts = applicationEventSchedules.map((n) => n.begin).sort();
  return starts?.length > 0 ? starts[0] : null;
};

export const getSelectedApplicationEvents = (
  applicationEvents: ApplicationEventNode[],
  selection: string[] | null,
  priority: ApplicationEventSchedulePriority
): ApplicationEventNode[] => {
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
          o.applicationEventSchedules as ApplicationEventScheduleNode[],
          selection
        ),
      (o) =>
        getEarliestScheduleStart(
          o.applicationEventSchedules as ApplicationEventScheduleNode[]
        ),
      (o) => o.name,
    ],
    ["desc", "asc", "asc"]
  );
};

export const getApplicationEventScheduleTimeString = (
  applicationEventSchedules: ApplicationEventScheduleNode[],
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
  applicationEvents: ApplicationEventNode[] | null
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
    return getTimeSlots([allocationResult]);
  };

  const schedules = filterNonNullable(
    applicationEvents?.flatMap(
      (applicationEvent) => applicationEvent.applicationEventSchedules
    )
  );

  const { acceptedSlots, declinedSlots } =
    schedules.reduce<ApplicationEventScheduleResultStatuses>(
      (acc, cur) => {
        const { allocatedDay, allocatedBegin, allocatedEnd } = cur;

        if (!allocatedDay || !allocatedBegin || !allocatedEnd) {
          return acc;
        }
        const allocationResult = getResultTimeSlots(
          allocatedDay,
          allocatedBegin,
          allocatedEnd
        );
        acc.acceptedSlots = [...acc.acceptedSlots, ...allocationResult];

        /* TODO do we have declined slots?
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
      */
        return acc;
      },
      { acceptedSlots: [], declinedSlots: [] }
    );

  return {
    acceptedSlots,
    declinedSlots,
  };
};
