import { useMemo } from "react";
import { ReservationTypeChoice, type Maybe, useReservationsByReservationUnitQuery } from "@gql/gql-types";
import { isValidDate, formatApiDate, timeToMinutes } from "common/src/date-utils";
import { addDays, addMinutes, startOfDay } from "date-fns";
import {
  type CollisionInterval,
  combineAffectingReservations,
  doesIntervalCollide,
  reservationToInterval,
} from "@/helpers";
import { type NewReservationListItem } from "@/component/ReservationsList";
import { createNodeId } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { errorToast } from "common/src/components/toast";
import { useTranslation } from "next-i18next";

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
  const { t } = useTranslation();
  const apiStart = formatApiDate(begin);
  // NOTE backend error, it returns all till 00:00 not 23:59
  const apiEnd = formatApiDate(addDays(end, 1));
  const isIntervalValid = begin < end;
  const isValidQuery =
    isIntervalValid && reservationUnitPk != null && reservationUnitPk > 0 && apiStart != null && apiEnd != null;

  // NOTE unlike array fetches this fetches a single element with an included array
  // so it doesn't have the 100 limitation of array fetch nor does it have pagination
  // NOTE Reuse the query (useCheckCollisions), even though it's a bit larger than we need
  const { loading, data, refetch } = useReservationsByReservationUnitQuery({
    skip: !isValidQuery,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk ?? 0),
      pk: reservationUnitPk ?? 0,
      state: RELATED_RESERVATION_STATES,
      beginDate: apiStart ?? "",
      endDate: apiEnd ?? "",
    },
    fetchPolicy: "no-cache",
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const reservations = combineAffectingReservations(data, reservationUnitPk)
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
  existingReservationSeriesPk,
}: {
  items: NewReservationListItem[];
  reservationUnitPk?: number;
  begin: Date;
  end: Date;
  startTime: string;
  endTime: string;
  reservationType: ReservationTypeChoice;
  existingReservationSeriesPk?: Maybe<number>;
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
    const isReservationInsideRange = (reservationToMake: NewReservationListItem, interval: CollisionInterval) => {
      const type = interval.type ?? ReservationTypeChoice.Blocked;
      const interval2 = listItemToInterval(reservationToMake.date, startMin, endMin, type, reservationToMake.buffers);
      if (interval2 && interval) {
        return doesIntervalCollide(interval2, interval);
      }
      return false;
    };

    return items.map((x) =>
      reservations.find((y) => {
        if (existingReservationSeriesPk != null && y.reservationSeriesPk === existingReservationSeriesPk) {
          return false;
        }
        return isReservationInsideRange(x, y);
      })
        ? { ...x, isOverlapping: true }
        : x
    );
  }, [items, reservations, startTime, endTime, existingReservationSeriesPk]);

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
  const before = type !== ReservationTypeChoice.Blocked ? (buffers?.before ?? 0) : 0;
  const after = type !== ReservationTypeChoice.Blocked ? (buffers?.after ?? 0) : 0;
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
