import { type IsReservableFieldsFragment } from "@/gql/gql-types";
import { type ReservableMap, type RoundPeriod } from "@/modules/reservable";
import { act, fireEvent } from "@testing-library/react";
import { ReservationStartInterval } from "common/gql/gql-types";
import { addDays } from "date-fns";
import wait from "waait";

export const arrowUpKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 38, key: "ArrowUp" });

export const arrowDownKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 40, key: "ArrowDown" });

export const enterKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 13, key: "Enter" });

export const escKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 27, key: "Escape" });

export const tabKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 9, key: "Tab" });

export const actWait = (amount?: number): Promise<void> =>
  act(() => wait(amount));

// re-export everything
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

type ReservationUnitType = Omit<
  IsReservableFieldsFragment,
  "reservableTimeSpans"
>;
type MockReservationUnitProps = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  reservableTimes?: ReservableMap;
  reservationSet?: IsReservableFieldsFragment["reservationSet"];
  interval?: ReservationStartInterval;
  maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
  minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
  activeApplicationRounds?: RoundPeriod[];
  reservationsMinDaysBefore?: number;
  reservationsMaxDaysBefore?: number;
};
/// create a mock for IsReservableFragment (not a full reservation unit)
export function createMockReservationUnit({
  bufferTimeBefore,
  bufferTimeAfter,
  reservationSet,
  interval,
  maxReservationDuration,
  minReservationDuration,
  reservationsMinDaysBefore,
  reservationsMaxDaysBefore,
}: MockReservationUnitProps): ReservationUnitType {
  const reservationUnit: ReservationUnitType = {
    reservationSet: reservationSet ?? [],
    bufferTimeBefore: 60 * 60 * (bufferTimeBefore ?? 0),
    bufferTimeAfter: 60 * 60 * (bufferTimeAfter ?? 0),
    maxReservationDuration: maxReservationDuration ?? 0,
    minReservationDuration: minReservationDuration ?? 0,
    reservationStartInterval:
      interval ?? ReservationStartInterval.Interval_15Mins,
    reservationsMaxDaysBefore: reservationsMaxDaysBefore ?? null,
    reservationsMinDaysBefore: reservationsMinDaysBefore ?? 0,
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationEnds: addDays(new Date(), 180).toISOString(),
  };
  return reservationUnit;
}
