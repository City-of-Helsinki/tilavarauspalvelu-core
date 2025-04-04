import {
  ReservationTypeChoice,
  useReservationsByReservationUnitQuery,
} from "@gql/gql-types";
import { errorToast } from "common/src/common/toast";
import {
  combineAffectingReservations,
  doesIntervalCollide,
  reservationToInterval,
} from "@/helpers";
import { base64encode } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { gql } from "@apollo/client";

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

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const collisions = reservations
    .filter((x) => x?.pk !== reservationPk)
    .map((x) =>
      reservationToInterval(
        { ...x, recurringReservation: null },
        reservationType
      )
    )
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

// this is used by both the check collisions and the calendar
export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  query ReservationsByReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      id
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...CalendarReservation
        ...CombineAffectedReservations
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...CalendarReservation
      ...CombineAffectedReservations
    }
  }
`;

export const CALENDAR_RESERVATION_FRAGMENT = gql`
  fragment CalendarReservation on ReservationNode {
    id
    user {
      id
      email
    }
    name
    reserveeName
    pk
    begin
    end
    state
    type
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
    accessType
    recurringReservation {
      id
      pk
    }
  }
`;
