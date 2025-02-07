import { generateReservations } from "../generateReservations";
import { ReservationTypeChoice, type Maybe } from "@gql/gql-types";
import type { TimeSelectionForm } from "@/schemas";
import { getBufferTime } from "@/helpers";

type ReservationUnitBufferType = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
};

// This is only used in recurring form so we can rework it
// we want to remove the early generation of reservations
export function useMultipleReservation({
  values,
  reservationUnit,
}: {
  values: TimeSelectionForm & {
    type?: ReservationTypeChoice;
    bufferTimeBefore?: boolean;
    bufferTimeAfter?: boolean;
  };
  reservationUnit?: Maybe<ReservationUnitBufferType>;
}) {
  // NOTE useMemo is useless here, watcher already filters out unnecessary runs
  const result = generateReservations({
    startingDate: values.startingDate,
    endingDate: values.endingDate,
    startTime: values.startTime,
    endTime: values.endTime,
    repeatPattern: values.repeatPattern,
    repeatOnDays: values.repeatOnDays,
  });

  return result.map((item) => ({
    ...item,
    buffers: {
      before: values.bufferTimeBefore
        ? getBufferTime(reservationUnit?.bufferTimeBefore, values.type)
        : 0,
      after: values.bufferTimeAfter
        ? getBufferTime(reservationUnit?.bufferTimeBefore, values.type)
        : 0,
    },
  }));
}
