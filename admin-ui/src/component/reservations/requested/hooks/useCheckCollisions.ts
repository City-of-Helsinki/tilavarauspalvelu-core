import {
  Query,
  QueryReservationUnitByPkArgs,
  ReservationsReservationTypeChoices,
} from "common/types/gql-types";
import { useQuery } from "@apollo/client";
import { addSeconds, format } from "date-fns";
import { useNotification } from "app/context/NotificationContext";
import { RESERVATIONS_BY_RESERVATIONUNIT } from "./queries";

const useCheckCollisions = ({
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
  reservationType: ReservationsReservationTypeChoices;
}) => {
  const { notifyError } = useNotification();

  const { data, loading } = useQuery<
    Query,
    QueryReservationUnitByPkArgs & { from: string; to: string }
  >(RESERVATIONS_BY_RESERVATIONUNIT, {
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk || !start || !end,
    variables: {
      pk: reservationUnitPk,
      from: format(start ?? new Date(), "yyyy-MM-dd"),
      to: format(end ?? new Date(), "yyyy-MM-dd"),
    },
    onError: () => {
      notifyError("Varauksia ei voitu hakea");
    },
  });

  type Interval = {
    start: Date;
    end: Date;
    buffers: { before: number; after: number };
  };

  const collides = (a: Interval, b: Interval): boolean => {
    const aEndBuffer = Math.max(a.buffers.after, b.buffers.before);
    const bEndBuffer = Math.max(a.buffers.before, b.buffers.after);
    if (a.start < b.start && addSeconds(a.end, aEndBuffer) <= b.start)
      return false;
    if (a.start >= addSeconds(b.end, bEndBuffer) && a.end > b.end) return false;
    return true;
  };

  const reservations = data?.reservationUnitByPk?.reservations ?? [];
  const collisions =
    end && start
      ? reservations
          .filter((x) => x?.pk !== reservationPk)
          .map((x) =>
            x?.begin && x?.end
              ? {
                  start: new Date(x.begin),
                  end: new Date(x.end),
                  buffers: {
                    before:
                      reservationType !==
                        ReservationsReservationTypeChoices.Blocked &&
                      x.type !== ReservationsReservationTypeChoices.Blocked &&
                      x.bufferTimeBefore
                        ? x.bufferTimeBefore
                        : 0,
                    after:
                      reservationType !==
                        ReservationsReservationTypeChoices.Blocked &&
                      x.type !== ReservationsReservationTypeChoices.Blocked &&
                      x.bufferTimeAfter
                        ? x.bufferTimeAfter
                        : 0,
                  },
                  type: x.type ?? undefined,
                }
              : undefined
          )
          .filter((x) => {
            if (x == null) return false;
            const buff =
              x.type === ReservationsReservationTypeChoices.Blocked
                ? { before: 0, after: 0 }
                : buffers;
            return collides({ start, end, buffers: buff }, x);
          })
      : [];

  return { isLoading: loading, hasCollisions: collisions.length > 0 };
};

export default useCheckCollisions;
