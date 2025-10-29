import { generateReservations } from "@/modules/generateReservations";
import type { Maybe } from "@gql/gql-types";
import type { RescheduleReservationSeriesForm } from "@/schemas";
import { getBufferTime } from "@/modules/helpers";

type ReservationUnitBufferType = {
  bufferTimeBefore: number;
  bufferTimeAfter: number;
};

interface GenerateReservationsProps {
  values: RescheduleReservationSeriesForm;
  reservationUnit: Maybe<ReservationUnitBufferType>;
}

// This is only used in recurring form so we can rework it
// we want to remove the early generation of reservations
function useGenerateReservations({ values, reservationUnit }: GenerateReservationsProps) {
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
      before: getBufferTime(reservationUnit?.bufferTimeBefore, values.type, values.enableBufferTimeBefore),
      after: getBufferTime(reservationUnit?.bufferTimeBefore, values.type, values.enableBufferTimeAfter),
    },
  }));
}

export { useGenerateReservations as useMultipleReservation };
