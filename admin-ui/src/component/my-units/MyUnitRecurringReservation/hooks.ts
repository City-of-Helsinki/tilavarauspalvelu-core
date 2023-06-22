import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { toApiDate } from "common/src/common/util";
import type {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitsArgs,
  ReservationType,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import type { UseFormReturn } from "react-hook-form";
import type { RecurringReservationForm } from "app/schemas";
import { addDays, addSeconds } from "date-fns";
import { generateReservations } from "./generateReservations";
import { useNotification } from "../../../context/NotificationContext";
import { RECURRING_RESERVATION_UNIT_QUERY } from "../queries";
import { GET_RESERVATIONS_IN_INTERVAL } from "./queries";
import { NewReservationListItem } from "../../ReservationsList";
import { convertToDate, isOverlapping } from "./utils";

export const useMultipleReservation = ({
  form,
  reservationUnit,
  interval = ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
}: {
  form: UseFormReturn<RecurringReservationForm>;
  reservationUnit?: ReservationUnitType;
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices;
}) => {
  const { watch } = form;

  // NOTE useMemo is useless here, watcher already filters out unnecessary runs
  const result = generateReservations(
    {
      startingDate: watch("startingDate"),
      endingDate: watch("endingDate"),
      startTime: watch("startTime"),
      endTime: watch("endTime"),
      repeatPattern: watch("repeatPattern"),
      repeatOnDays: watch("repeatOnDays"),
    },
    interval
  );

  const isBlocked = watch("type") === "BLOCKED";

  return {
    ...result,
    reservations: result.reservations.map((item) => ({
      ...item,
      buffers: {
        before:
          watch("bufferTimeBefore") && !isBlocked
            ? reservationUnit?.bufferTimeBefore ?? 0
            : 0,
        after:
          watch("bufferTimeAfter") && !isBlocked
            ? reservationUnit?.bufferTimeAfter ?? 0
            : 0,
      },
    })),
  };
};

// NOTE pks are integers even though the query uses strings
export const useRecurringReservationsUnits = (unitId: number) => {
  const { notifyError } = useNotification();

  const { loading, data } = useQuery<Query, QueryUnitsArgs>(
    RECURRING_RESERVATION_UNIT_QUERY,
    {
      variables: {
        pk: [String(unitId)],
        offset: 0,
      },
      onError: (err) => {
        notifyError(err.message);
      },
    }
  );

  const unit = data?.units?.edges[0];
  const reservationUnits = unit?.node?.reservationUnits?.filter(
    (item): item is ReservationUnitType => !!item
  );

  return { loading, reservationUnits };
};

type TimeInterval = {
  begin: Date;
  end: Date;
  buffers: {
    before: number;
    after: number;
  };
};

const reservationToInterval = (x: ReservationType): TimeInterval | undefined =>
  x.begin && x.end
    ? {
        begin: new Date(x.begin),
        end: new Date(x.end),
        buffers: {
          before: x.bufferTimeBefore ?? 0,
          after: x.bufferTimeAfter ?? 0,
        },
      }
    : undefined;

export const useReservationsInInterval = ({
  begin,
  end,
  reservationUnitPk,
}: {
  begin: Date;
  end: Date;
  reservationUnitPk?: number;
}) => {
  const { notifyError } = useNotification();

  const apiStart = toApiDate(begin);
  // NOTE backend error, it returns all till 00:00 not 23:59
  const apiEnd = toApiDate(addDays(end, 1));

  // NOTE unlike array fetches this fetches a single element with an included array
  // so it doesn't have the 100 limitation of array fetch nor does it have pagination
  const { loading, data, refetch } = useQuery<
    Query,
    QueryReservationUnitByPkArgs & ReservationUnitByPkTypeReservationsArgs
  >(GET_RESERVATIONS_IN_INTERVAL, {
    skip:
      !reservationUnitPk ||
      Number.isNaN(reservationUnitPk) ||
      !apiStart ||
      !apiEnd,
    variables: {
      pk: reservationUnitPk,
      from: apiStart,
      to: apiEnd,
    },
    fetchPolicy: "no-cache",
    onError: (err) => {
      notifyError(err.message);
    },
  });

  const reservations = useMemo(
    () =>
      data?.reservationUnitByPk?.reservations
        ?.map((x) => (x ? reservationToInterval(x) : undefined))
        ?.filter((x): x is TimeInterval => x != null) ?? [],
    [data]
  );

  return { reservations, loading, refetch };
};

export const useFilteredReservationList = ({
  items,
  reservationUnitPk,
  begin,
  end,
}: {
  items: NewReservationListItem[];
  reservationUnitPk?: number;
  begin: Date;
  end: Date;
}) => {
  const { reservations, refetch } = useReservationsInInterval({
    reservationUnitPk,
    begin,
    end,
  });

  const isReservationInsideRange = (
    res: NewReservationListItem,
    range: TimeInterval
  ) => {
    const startDate = convertToDate(res.date, res.startTime);
    const endDate = convertToDate(res.date, res.endTime);
    const bufferBefore = Math.max(
      res.buffers?.before ?? 0,
      range.buffers.before
    );
    const bufferAfter = Math.max(res.buffers?.after ?? 0, range.buffers.after);
    if (startDate && endDate) {
      return isOverlapping(
        {
          begin: addSeconds(startDate, -bufferBefore),
          end: addSeconds(endDate, bufferAfter),
        },
        range
      );
    }
    return false;
  };

  const res = useMemo(() => {
    if (reservations.length === 0) {
      return items;
    }
    const tested = items.map((x) =>
      reservations.find((y) => isReservationInsideRange(x, y))
        ? { ...x, isOverlapping: true }
        : x
    );
    return tested;
  }, [items, reservations]);

  return { reservations: res, refetch };
};
