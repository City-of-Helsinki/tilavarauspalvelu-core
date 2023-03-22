import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import type {
  Query,
  QueryUnitsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import type { UseFormReturn } from "react-hook-form";
import { generateReservations } from "./ReservationsList";
import type { RecurringReservationForm } from "./RecurringReservationSchema";
import { useNotification } from "../../../context/NotificationContext";
import { RECURRING_RESERVATION_UNIT_QUERY } from "../queries";

export const useMultipleReservation = (
  form: UseFormReturn<RecurringReservationForm>,
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices = ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
) => {
  const { watch } = form;

  const selectedReservationParams = watch([
    "startingDate",
    "endingDate",
    "startingTime",
    "endingTime",
    "repeatPattern",
    "repeatOnDays",
  ]);

  return useMemo(
    () =>
      generateReservations(
        {
          startingDate: selectedReservationParams[0],
          endingDate: selectedReservationParams[1],
          startingTime: selectedReservationParams[2],
          endingTime: selectedReservationParams[3],
          repeatPattern: selectedReservationParams[4],
          repeatOnDays: selectedReservationParams[5],
        },
        interval
      ),
    [selectedReservationParams, interval]
  );
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
