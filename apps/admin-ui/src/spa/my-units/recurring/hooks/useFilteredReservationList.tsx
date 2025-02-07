import { useMemo } from "react";
import {
  type ReservationsInIntervalFragment,
  ReservationTypeChoice,
  useReservationTimesInReservationUnitQuery,
  type Maybe,
} from "@gql/gql-types";
import { isValidDate, toApiDate } from "common/src/common/util";
import { addDays, addMinutes, startOfDay } from "date-fns";
import {
  type CollisionInterval,
  doesIntervalCollide,
  reservationToInterval,
} from "@/helpers";
import { type NewReservationListItem } from "@/component/ReservationsList";
import {
  base64encode,
  filterNonNullable,
  timeToMinutes,
} from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";

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
    recurringReservation {
      id
      pk
    }
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
      reservations(beginDate: $beginDate, endDate: $endDate, state: $state) {
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

  const reservationSet = filterNonNullable(data?.reservationUnit?.reservations);
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

// Could also be reworked to work the other way around, return list of collisions, not list of items
// TODO this should be debounced because keypress message handler is taking 200ms+
export function useFilteredReservationList({
  items,
  reservationUnitPk,
  begin,
  end,
  startTime,
  endTime,
  reservationType,
  existingRecurringPk,
}: {
  items: NewReservationListItem[];
  reservationUnitPk?: number;
  begin: Date;
  end: Date;
  startTime: string;
  endTime: string;
  reservationType: ReservationTypeChoice;
  existingRecurringPk?: Maybe<number>;
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
    if (items.length === 0) {
      return [];
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const isReservationInsideRange = (
      reservationToMake: NewReservationListItem,
      interval: CollisionInterval
    ) => {
      const type = interval.type ?? ReservationTypeChoice.Blocked;
      const interval2 = listItemToInterval(
        reservationToMake.date,
        startMin,
        endMin,
        type,
        reservationToMake.buffers
      );
      if (interval2 && interval) {
        return doesIntervalCollide(interval2, interval);
      }
      return false;
    };

    return items.map((x) =>
      reservations.find((y) => {
        if (
          existingRecurringPk != null &&
          y.recurringReservationPk === existingRecurringPk
        ) {
          return false;
        }
        return isReservationInsideRange(x, y);
      })
        ? { ...x, isOverlapping: true }
        : x
    );
  }, [items, reservations, startTime, endTime, existingRecurringPk]);

  return { reservations: data, refetch };
}

// unsafe
function listItemToInterval(
  date: Date,
  startTime: number,
  endTime: number,
  type: ReservationTypeChoice,
  buffers?: { before?: number; after?: number }
): CollisionInterval {
  const start = addMinutes(startOfDay(date), startTime);
  const end = addMinutes(startOfDay(date), endTime);
  if (!isValidDate(start) && !isValidDate(end)) {
    throw new Error("Invalid date");
  }
  const before =
    type !== ReservationTypeChoice.Blocked ? (buffers?.before ?? 0) : 0;
  const after =
    type !== ReservationTypeChoice.Blocked ? (buffers?.after ?? 0) : 0;
  return {
    start,
    end,
    buffers: {
      before,
      after,
    },
    type,
  };
}
