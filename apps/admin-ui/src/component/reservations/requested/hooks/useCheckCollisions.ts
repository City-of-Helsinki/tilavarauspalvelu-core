import { type Query, ReservationTypeChoice } from "common/types/gql-types";
import { useQuery } from "@apollo/client";
import { useNotification } from "@/context/NotificationContext";
import { doesIntervalCollide, reservationToInterval } from "@/helpers";
import { RESERVATIONS_BY_RESERVATIONUNITS } from "./queries";
import {
  base64encode,
  concatAffectedReservations,
  filterNonNullable,
} from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { ReservationUnitWithAffectingArgs } from "common/src/queries/fragments";

function useCheckCollisions({
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
  const { notifyError } = useNotification();

  const today = new Date();

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  const { data, loading } = useQuery<Query, ReservationUnitWithAffectingArgs>(
    RESERVATIONS_BY_RESERVATIONUNITS,
    {
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
        notifyError("Varauksia ei voitu hakea");
      },
    }
  );

  const reservationSet = filterNonNullable(
    data?.reservationUnit?.reservationSet
  );
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = concatAffectedReservations(
    reservationSet,
    affectingReservations,
    reservationUnitPk ?? 0
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

export default useCheckCollisions;
