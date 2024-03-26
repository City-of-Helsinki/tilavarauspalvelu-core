import {
  type Query,
  type QueryReservationUnitArgs,
  type ReservationNode,
  ReservationTypeChoice,
  ReservationUnitNodeReservationSetArgs,
} from "common/types/gql-types";
import { useQuery } from "@apollo/client";
import { useNotification } from "@/context/NotificationContext";
import { doesIntervalCollide, reservationToInterval } from "@/helpers";
import { RESERVATIONS_BY_RESERVATIONUNIT } from "./queries";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";

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
  const { data, loading } = useQuery<
    Query,
    QueryReservationUnitArgs & ReservationUnitNodeReservationSetArgs
  >(RESERVATIONS_BY_RESERVATIONUNIT, {
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk || !start || !end,
    variables: {
      id,
      beginDate: toApiDate(start ?? today) ?? "",
      endDate: toApiDate(end ?? today) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      notifyError("Varauksia ei voitu hakea");
    },
  });

  const reservations = filterNonNullable(data?.reservationUnit?.reservationSet);
  const collisions =
    end && start
      ? reservations
          .filter((x) => x?.pk !== reservationPk)
          .filter((x): x is ReservationNode => x != null)
          .map((x) => reservationToInterval(x, reservationType))
          .filter((x) => {
            if (x == null) return false;
            const buff =
              x.type === ReservationTypeChoice.Blocked
                ? { before: 0, after: 0 }
                : buffers;
            return doesIntervalCollide({ start, end, buffers: buff }, x);
          })
      : [];

  return { isLoading: loading, hasCollisions: collisions.length > 0 };
}

export default useCheckCollisions;
