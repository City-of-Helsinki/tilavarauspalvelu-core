import {
  type IsReservableFieldsFragment,
  ReservationStartInterval,
} from "@/gql/gql-types";
import { ReservableMap, RoundPeriod } from "@/modules/reservable";
import { addDays, endOfDay, format, startOfDay, startOfToday } from "date-fns";

type ReservationUnitType = Omit<
  IsReservableFieldsFragment,
  "reservableTimeSpans"
>;
type MockReservationUnitProps = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  reservableTimes?: ReservableMap;
  interval?: ReservationStartInterval;
  maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
  minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
  activeApplicationRounds?: RoundPeriod[];
  reservationsMinDaysBefore?: number;
  reservationsMaxDaysBefore?: number | null;
};

export function createMockReservableTimes(): ReservableMap {
  const map: ReservableMap = new Map();
  for (let i = 0; i < 30; i++) {
    const date = addDays(startOfToday(), i);
    const key = format(date, "yyyy-MM-dd");
    // TODO need to have holes in this
    const value = [{ start: startOfDay(date), end: endOfDay(date) }];
    map.set(key, value);
  }
  return map;
}

/// create a mock for IsReservableFragment (not a full reservation unit)
export function createMockIsReservableFieldsFragment({
  bufferTimeBefore = 0,
  bufferTimeAfter = 0,
  interval = ReservationStartInterval.Interval_15Mins,
  maxReservationDuration = 0,
  minReservationDuration = 0,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = null,
}: MockReservationUnitProps): ReservationUnitType {
  const reservationUnit: ReservationUnitType = {
    id: "1",
    bufferTimeBefore: 60 * 60 * bufferTimeBefore,
    bufferTimeAfter: 60 * 60 * bufferTimeAfter,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval: interval,
    reservationsMaxDaysBefore,
    reservationsMinDaysBefore,
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationEnds: addDays(new Date(), 180).toISOString(),
  };
  return reservationUnit;
}
