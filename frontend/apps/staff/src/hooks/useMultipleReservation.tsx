import { ReservationTypeChoice } from "@gql/gql-types";
import type { Maybe } from "@gql/gql-types";
import { generateReservations } from "@/modules/generateReservations";
import { getBufferTime } from "@/modules/helpers";
import type { RescheduleReservationSeriesForm } from "@/schemas";

type ReservationUnitBufferType = {
  bufferTimeBefore: number;
  bufferTimeAfter: number;
};

interface GenerateReservationsProps {
  values: Partial<RescheduleReservationSeriesForm>;
  reservationUnit: Maybe<ReservationUnitBufferType>;
}

// This is only used in recurring form so we can rework it
// we want to remove the early generation of reservations
function useGenerateReservations({ values, reservationUnit }: GenerateReservationsProps) {
  // NOTE useMemo is useless here, watcher already filters out unnecessary runs
  const result = generateReservations({
    startingDate: values.startingDate ?? "",
    endingDate: values.endingDate ?? "",
    startTime: values.startTime ?? "",
    endTime: values.endTime ?? "",
    repeatPattern: values.repeatPattern ?? "weekly",
    repeatOnDays: values.repeatOnDays ?? [],
  });

  const type = values.type ?? ReservationTypeChoice.Staff;
  return result.map((item) => ({
    ...item,
    buffers: {
      before: getBufferTime(reservationUnit?.bufferTimeBefore, type, values.enableBufferTimeBefore),
      after: getBufferTime(reservationUnit?.bufferTimeBefore, type, values.enableBufferTimeAfter),
    },
  }));
}

export { useGenerateReservations as useMultipleReservation };
