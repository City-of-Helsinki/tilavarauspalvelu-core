import {
  ReservationStateChoice,
  useReservationPageQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { useRecurringReservations } from "@/hooks";

/// @param id fetch reservation related to this pk
/// Overly complex because editing DENIED or past reservations is not allowed
/// but the UI makes no distinction between past and present instances of a recurrance.
/// If we don't get the next valid reservation for edits: the mutations work,
/// but the UI is not updated to show the changes (since it's looking at a past instance).
export function useReservationEditData(pk?: string) {
  const typename = "ReservationNode";
  const id = base64encode(`${typename}:${pk}`);
  const { data, loading, refetch } = useReservationPageQuery({
    skip: !pk,
    fetchPolicy: "no-cache",
    variables: { id },
  });

  const recurringPk = data?.reservation?.recurringReservation?.pk ?? undefined;
  const { reservations: recurringReservations } =
    useRecurringReservations(recurringPk);

  // NOTE have to be done like this instead of query params because of cache
  // real solution is to fix the cache, but without fixing passing query params
  // into it will break the reservation queries elsewhere.
  const possibleReservations = recurringReservations
    .filter((x) => new Date(x.begin) > new Date())
    .filter((x) => x.state === ReservationStateChoice.Confirmed);

  const nextRecurranceId = base64encode(
    `${typename}:${possibleReservations?.at(0)?.pk ?? 0}`
  );
  const { data: nextRecurrance, loading: nextReservationLoading } =
    useReservationPageQuery({
      skip: !possibleReservations?.at(0)?.pk,
      fetchPolicy: "no-cache",
      variables: {
        id: nextRecurranceId,
      },
    });

  const reservation = recurringPk
    ? nextRecurrance?.reservation
    : data?.reservation;
  const reservationUnit =
    data?.reservation?.reservationUnits?.find((x) => x != null) ?? undefined;

  return {
    reservation: reservation ?? undefined,
    reservationUnit,
    loading: loading || nextReservationLoading,
    refetch,
  };
}
