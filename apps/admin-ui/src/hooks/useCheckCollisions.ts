import {
  type CalendarReservationFragment,
  ReservationTypeChoice,
  useReservationsByReservationUnitQuery,
} from "@gql/gql-types";
import { errorToast } from "common/src/common/toast";
import { doesIntervalCollide, reservationToInterval } from "@/helpers";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";

export function useCheckCollisions({
  reservationPk,
  reservationUnitPk,
  start,
  end,
  buffers,
  reservationType,
}: {
  reservationPk?: number;
  reservationUnitPk: number;
  start?: Date;
  end?: Date;
  buffers: {
    before: number;
    after: number;
  };
  reservationType: ReservationTypeChoice;
}) {
  const today = new Date();

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);

  const { data, loading } = useReservationsByReservationUnitQuery({
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk || !start || !end,
    variables: {
      id,
      pk: reservationUnitPk,
      beginDate: toApiDate(start ?? today) ?? "",
      endDate: toApiDate(end ?? today) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: "Varauksia ei voitu hakea" });
    },
  });

  // TODO: copy paste from requested/hooks/index.ts
  function doesReservationAffectReservationUnit(
    reservation: CalendarReservationFragment,
    resUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
  }
  const reservationSet = filterNonNullable(data?.reservationUnit?.reservations);
  // NOTE we could use a recular concat here (we only have single reservationUnit here)
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = filterNonNullable(
    reservationSet?.concat(
      affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, reservationUnitPk ?? 0)
      ) ?? []
    )
  );

  const collisions = reservations
    .filter((x) => x?.pk !== reservationPk)
    .map((x) => reservationToInterval(x, reservationType))
    .filter((x) => {
      if (x == null) {
        return false;
      }
      if (start == null || end == null) {
        return false;
      }
      const buff =
        x.type === ReservationTypeChoice.Blocked
          ? { before: 0, after: 0 }
          : buffers;
      return doesIntervalCollide({ start, end, buffers: buff }, x);
    });

  return { isLoading: loading, hasCollisions: collisions.length > 0 };
}
