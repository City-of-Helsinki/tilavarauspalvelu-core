import React from "react";
import { toUIDate } from "common/src/common/util";
import styled from "styled-components";
import { z } from "zod";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { timeSelectionSchema } from "./RecurringReservationSchema";
import { toMondayFirst } from "../../../common/util";

type NewReservationListItem = {
  date: Date;
  startTime: string;
  endTime: string;
};

type Props = {
  items: NewReservationListItem[];
};

// In the UI spec parent container max height is 22rem, but overflow forces us to define child max-height
const ListWrapper = styled.div`
  max-height: 18.5rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledList = styled.ul`
  list-style-type: none;
  border: none;
  padding: 0 var(--spacing-s);
`;

const StyledListItem = styled.li`
  padding: var(--spacing-s) 0;
  border-bottom: 1px solid var(--color-black-20);
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  text-transform: capitalize;
`;

const ReservationList = ({ items }: Props) => {
  if (!items.length) return null;

  return (
    <ListWrapper>
      <StyledList>
        {items.map((item) => (
          <StyledListItem
            key={`${item.date}-${item.startTime}-${item.endTime}`}
          >
            <Wrapper>{`${toUIDate(item.date, "cccccc d.M.yyyy")}, ${
              item.startTime
            }-${item.endTime}`}</Wrapper>
          </StyledListItem>
        ))}
      </StyledList>
    </ListWrapper>
  );
};

const validator = timeSelectionSchema;

type GenInputType = z.infer<typeof validator>;

// NOTE Custom UTC date code because taking only the date part of Date results
// in the previous date in UTC+2 timezone
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const eachDayOfInterval = (start: number, end: number, stepDays = 1) => {
  if (end < start || stepDays < 1) {
    return [];
  }
  const daysWithoutCeil = (end - start) / (MS_IN_DAY * stepDays);
  const days = Math.ceil(daysWithoutCeil);
  return Array.from(Array(days)).map(
    (_, i) => i * (MS_IN_DAY * stepDays) + start
  );
};

// epoch is Thue (4)
// TODO this could be combined with monday first
type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const dayOfWeek: (t: number) => WeekDay = (time: number) =>
  ((Math.floor(time / MS_IN_DAY) + 4) % 7) as WeekDay;

const intervalToNumber = (
  i: ReservationUnitsReservationUnitReservationStartIntervalChoices
) => {
  switch (i) {
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins:
      return 15;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins:
      return 30;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_60Mins:
      return 60;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins:
      return 90;
    default:
      return 0;
  }
};

// Returning the zod validation result also for error handling
const generateReservations = (
  props: GenInputType,
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices
) => {
  // Refine the schema to check intervals
  // NOTE A starting interval that doesn't match the ReservationUnit configuration will be rejected by the backend.
  const vals = timeSelectionSchema
    .refine(
      (s) =>
        Number(s.startingTime.substring(3)) % intervalToNumber(interval) === 0,
      {
        path: ["startingTime"],
        message: `Starting time has to be in ${intervalToNumber(
          interval
        )} minutes increments.`,
      }
    )
    .refine((s) => Number(s.endingTime.substring(3)) % 15 === 0, {
      path: ["endingTime"],
      message: "End time has to be increment of 15 minutes.",
    })
    .safeParse(props);

  if (!vals.success) {
    return {
      ...vals,
      reservations: [],
    };
  }

  const {
    startingDate,
    startingTime,
    endingDate,
    endingTime,
    repeatPattern,
    repeatOnDays,
  } = vals.data;

  const utcDate = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  try {
    const min = (a: number, b: number) => (a < b ? a : b);
    const max = (a: number, b: number) => (a > b ? a : b);
    const sDay = max(utcDate(new Date()), utcDate(startingDate));

    // end date with time 23:59:59
    const eDay = utcDate(endingDate) + (MS_IN_DAY - 1);
    const firstWeek = eachDayOfInterval(sDay, min(sDay + MS_IN_DAY * 7, eDay));

    return {
      ...vals,
      reservations: firstWeek
        .filter((time) => repeatOnDays.includes(toMondayFirst(dayOfWeek(time))))
        .map((x) =>
          eachDayOfInterval(x, eDay, repeatPattern.value === "weekly" ? 7 : 14)
        )
        .reduce((acc, x) => [...acc, ...x], [])
        .map((day) => ({
          date: new Date(day),
          startTime: startingTime,
          endTime: endingTime,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("exception: ", e);
    // Date throws => don't crash
  }

  return {
    ...vals,
    reservations: [],
  };
};

export { ReservationList, generateReservations };
export type { NewReservationListItem };
