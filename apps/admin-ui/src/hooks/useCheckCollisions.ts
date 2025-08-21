import { ReservationTypeChoice, useReservationsByReservationUnitQuery } from "@gql/gql-types";
import { errorToast } from "common/src/components/toast";
import { combineAffectingReservations, doesIntervalCollide, reservationToInterval } from "@/helpers";
import { createNodeId } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";

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
  start: Date | null;
  end: Date | null;
  buffers: {
    before: number;
    after: number;
  };
  reservationType: ReservationTypeChoice;
}) {
  const { t } = useTranslation();
  const today = new Date();

  const { data, loading } = useReservationsByReservationUnitQuery({
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk || !start || !end,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk),
      pk: reservationUnitPk,
      beginDate: toApiDate(start ?? today) ?? "",
      endDate: toApiDate(end ?? today) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const collisions = reservations
    .filter((x) => x?.pk !== reservationPk)
    .map((x) => reservationToInterval({ ...x, reservationSeries: null }, reservationType))
    .filter((x) => {
      if (x == null) {
        return false;
      }
      if (start == null || end == null) {
        return false;
      }
      const buff = x.type === ReservationTypeChoice.Blocked ? { before: 0, after: 0 } : buffers;
      return doesIntervalCollide({ start, end, buffers: buff }, x);
    });

  return { isLoading: loading, hasCollisions: collisions.length > 0 };
}

// this is used by both the check collisions and the calendar
export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  query ReservationsByReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date!
    $endDate: Date!
    $state: [ReservationStateChoice!]
  ) {
    reservationUnit(id: $id) {
      id
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...CalendarReservation
        ...CombineAffectedReservations
      }
    }
    affectingReservations(forReservationUnits: [$pk], state: $state, beginDate: $beginDate, endDate: $endDate) {
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
    beginsAt
    endsAt
    state
    type
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
    accessType
    reservationSeries {
      id
      pk
    }
  }
`;
