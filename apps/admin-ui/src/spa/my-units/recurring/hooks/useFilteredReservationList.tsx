import { useMemo } from "react";
import {
  type ReservationsInIntervalFragment,
  ReservationTypeChoice,
  useReservationTimesInReservationUnitQuery,
} from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { addDays } from "date-fns";
import {
  type CollisionInterval,
  doesIntervalCollide,
  reservationToInterval,
} from "@/helpers";
import { type NewReservationListItem } from "@/component/ReservationsList";
import { convertToDate } from "../utils";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";

// TODO this is only used for RecurringReservationForm, why? (the above query + hook also)

function listItemToInterval(
  item: NewReservationListItem,
  type: ReservationTypeChoice
): CollisionInterval | null {
  const start = convertToDate(item.date, item.startTime);
  const end = convertToDate(item.date, item.endTime);
  if (start && end) {
    return {
      start,
      end,
      buffers: {
        before:
          type !== ReservationTypeChoice.Blocked
            ? (item.buffers?.before ?? 0)
            : 0,
        after:
          type !== ReservationTypeChoice.Blocked
            ? (item.buffers?.after ?? 0)
            : 0,
      },
      type,
    };
  }
  return null;
}

// TODO there is multiples of these fragments (for each Calendar), should be unified
const RESERVATIONS_IN_INTERVAL_FRAGMENT = gql`
  fragment ReservationsInInterval on ReservationNode {
    id
    begin
    end
    bufferTimeBefore
    bufferTimeAfter
    type
    affectedReservationUnits
  }
`;

// TODO this query would not be needed if the Calendar query would be passed to the useCheckCollisions
export const GET_RESERVATIONS_IN_INTERVAL = gql`
  ${RESERVATIONS_IN_INTERVAL_FRAGMENT}
  query ReservationTimesInReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      id
      reservationSet(beginDate: $beginDate, endDate: $endDate, state: $state) {
        ...ReservationsInInterval
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationsInInterval
    }
  }
`;

function useReservationsInInterval({
  begin,
  end,
  reservationUnitPk,
  reservationType,
}: {
  begin: Date;
  end: Date;
  reservationUnitPk?: number;
  reservationType: ReservationTypeChoice;
}) {
  const apiStart = toApiDate(begin);
  // NOTE backend error, it returns all till 00:00 not 23:59
  const apiEnd = toApiDate(addDays(end, 1));

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  // NOTE unlike array fetches this fetches a single element with an included array
  // so it doesn't have the 100 limitation of array fetch nor does it have pagination
  const { loading, data, refetch } = useReservationTimesInReservationUnitQuery({
    skip:
      !reservationUnitPk ||
      Number.isNaN(reservationUnitPk) ||
      !apiStart ||
      !apiEnd,
    variables: {
      id,
      pk: reservationUnitPk ?? 0,
      state: RELATED_RESERVATION_STATES,
      beginDate: apiStart ?? "",
      endDate: apiEnd ?? "",
    },
    fetchPolicy: "no-cache",
    onError: (err) => {
      errorToast({ text: err.message });
    },
  });

  function doesReservationAffectReservationUnit(
    reservation: ReservationsInIntervalFragment,
    resUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
  }

  const reservationSet = filterNonNullable(
    data?.reservationUnit?.reservationSet
  );
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = filterNonNullable(
    reservationSet?.concat(
      affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, reservationUnitPk ?? 0)
      ) ?? []
    )
  )
    .map((x) => reservationToInterval(x, reservationType))
    .filter((x): x is CollisionInterval => x != null);

  return { reservations, loading, refetch };
}

export function useFilteredReservationList({
  items,
  reservationUnitPk,
  begin,
  end,
  reservationType,
}: {
  items: NewReservationListItem[];
  reservationUnitPk?: number;
  begin: Date;
  end: Date;
  reservationType: ReservationTypeChoice;
}) {
  const { reservations, refetch } = useReservationsInInterval({
    reservationUnitPk,
    begin,
    end,
    reservationType,
  });

  const data = useMemo(() => {
    if (reservations.length === 0) {
      return items;
    }
    const isReservationInsideRange = (
      reservationToMake: NewReservationListItem,
      interval: CollisionInterval
    ) => {
      const type = interval.type ?? ReservationTypeChoice.Blocked;
      const interval2 = listItemToInterval(reservationToMake, type);
      if (interval2 && interval) {
        return doesIntervalCollide(interval2, interval);
      }
      return false;
    };

    return items.map((x) =>
      reservations.find((y) => isReservationInsideRange(x, y))
        ? { ...x, isOverlapping: true }
        : x
    );
  }, [items, reservations]);

  return { reservations: data, refetch };
}
