import {
  type Maybe,
  type ReservationEditPageQuery,
  ReservationStateChoice,
  useReservationEditPageQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { useReservationSeries } from "@/hooks";

type ReservationType = NonNullable<ReservationEditPageQuery["reservation"]>;

/// @param id fetch reservation related to this pk
/// Overly complex because editing DENIED or past reservations is not allowed
/// but the UI makes no distinction between past and present instances of a recurrence.
/// If we don't get the next valid reservation for edits: the mutations work,
/// but the UI is not updated to show the changes (since it's looking at a past instance).
export function useReservationEditData(pk?: string): {
  reservation: Maybe<ReservationType> | undefined;
  loading: boolean;
  refetch: () => Promise<unknown>;
} {
  const id = base64encode(`ReservationNode:${pk}`);
  const { data, loading, refetch } = useReservationEditPageQuery({
    skip: !pk,
    fetchPolicy: "no-cache",
    variables: { id },
  });

  const recurringPk = data?.reservation?.reservationSeries?.pk;
  const { reservations: reservationSeries } = useReservationSeries(recurringPk);

  // NOTE have to be done like this instead of query params because of cache
  // real solution is to fix the cache, but without fixing passing query params
  // into it will break the reservation queries elsewhere.
  const possibleReservations = reservationSeries
    .filter((x) => new Date(x.beginsAt) > new Date())
    .filter((x) => x.state === ReservationStateChoice.Confirmed);

  const nextPk = possibleReservations?.at(0)?.pk ?? 0;
  const nextRecurrenceId = base64encode(`ReservationNode:${nextPk}`);
  const { data: nextRecurrence, loading: nextReservationLoading } = useReservationEditPageQuery({
    skip: nextPk === 0,
    fetchPolicy: "no-cache",
    variables: {
      id: nextRecurrenceId,
    },
  });

  const reservation = recurringPk ? nextRecurrence?.reservation : data?.reservation;

  return {
    reservation,
    loading: loading || nextReservationLoading,
    refetch,
  };
}
