import {
  type AvailableTimesProps,
  getNextAvailableTime,
  getPossibleTimesForDay,
  type GetPossibleTimesForDayProps,
} from "@/modules/reservationUnit";

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
