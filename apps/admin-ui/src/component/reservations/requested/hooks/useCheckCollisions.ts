import {
  Query,
  QueryReservationUnitByPkArgs,
  ReservationsReservationTypeChoices,
  ReservationType,
} from "common/types/gql-types";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { useNotification } from "app/context/NotificationContext";
import { doesIntervalCollide, reservationToInterval } from "app/helpers";
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

  const reservations = data?.reservationUnitByPk?.reservations ?? [];
  const collisions =
    end && start
      ? reservations
          .filter((x) => x?.pk !== reservationPk)
          .filter((x): x is ReservationType => x != null)
          .map((x) => reservationToInterval(x, reservationType))
          .filter((x) => {
            if (x == null) return false;
            const buff =
              x.type === ReservationsReservationTypeChoices.Blocked
                ? { before: 0, after: 0 }
                : buffers;
            return doesIntervalCollide({ start, end, buffers: buff }, x);
          })
      : [];

  return { isLoading: loading, hasCollisions: collisions.length > 0 };
};

export default useCheckCollisions;
