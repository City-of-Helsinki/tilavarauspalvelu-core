import { getNextAvailableTime, getPossibleTimesForDay } from "@/modules/reservationUnit";
import type { AvailableTimesProps, GetPossibleTimesForDayProps } from "@/modules/reservationUnit";

/**
 * Hook that calculates available reservation times for a given date and duration
 * Returns both the available time slots for a specific day and the next available time
 * @param date - Focus date to check for available times
 * @param duration - Desired reservation duration in minutes
 * @param reservableTimes - Reservable time ranges
 * @param reservationUnit - Reservation unit to check availability for
 * @param activeApplicationRounds - Active application rounds that may block times
 * @param blockingReservations - Existing reservations that block times
 * @returns Object containing startingTimeOptions for the day and nextAvailableTime
 */
export function useAvailableTimes({
  date: focusDate,
  duration,
  reservableTimes,
  reservationUnit,
  activeApplicationRounds,
  blockingReservations,
}: Omit<GetPossibleTimesForDayProps, "reservationUnit"> & {
  reservationUnit: AvailableTimesProps["reservationUnit"];
}) {
  const common = {
    duration,
    reservableTimes,
    reservationUnit,
    activeApplicationRounds,
    blockingReservations,
  } as const;
  const startingTimeOptions = getPossibleTimesForDay({
    ...common,
    date: focusDate,
  });
  const nextAvailableTime = getNextAvailableTime({
    ...common,
    start: focusDate,
  });

  return {
    startingTimeOptions,
    nextAvailableTime,
  };
}
