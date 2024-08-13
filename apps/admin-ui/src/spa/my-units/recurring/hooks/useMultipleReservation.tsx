import { generateReservations } from "../generateReservations";
import { ReservationStartInterval, type Maybe } from "@gql/gql-types";
import type { UseFormReturn } from "react-hook-form";
import type { RecurringReservationForm } from "@/schemas";

type ReservationUnitBufferType = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
};

export function useMultipleReservation({
  form,
  reservationUnit,
  interval = ReservationStartInterval.Interval_15Mins,
}: {
  form: UseFormReturn<RecurringReservationForm>;
  reservationUnit?: Maybe<ReservationUnitBufferType>;
  interval?: ReservationStartInterval;
}) {
  const { watch } = form;

  // NOTE useMemo is useless here, watcher already filters out unnecessary runs
  const result = generateReservations(
    {
      startingDate: watch("startingDate"),
      endingDate: watch("endingDate"),
      startTime: watch("startTime"),
      endTime: watch("endTime"),
      repeatPattern: watch("repeatPattern"),
      repeatOnDays: watch("repeatOnDays"),
    },
    interval
  );

  const isBlocked = watch("type") === "BLOCKED";

  return {
    ...result,
    reservations: result.reservations.map((item) => ({
      ...item,
      buffers: {
        before:
          watch("bufferTimeBefore") && !isBlocked
            ? (reservationUnit?.bufferTimeBefore ?? 0)
            : 0,
        after:
          watch("bufferTimeAfter") && !isBlocked
            ? (reservationUnit?.bufferTimeAfter ?? 0)
            : 0,
      },
    })),
  };
}
