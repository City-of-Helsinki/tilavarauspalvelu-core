import {
  type CalendarReservationFragment,
  State,
  ReservationTypeChoice,
  useReservationQuery,
  useReservationDenyReasonsQuery,
  useReservationsByReservationUnitQuery,
  useRecurringReservationQuery,
} from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import { toApiDate } from "common/src/common/util";
import { useNotification } from "@/context/NotificationContext";
import { base64encode, filterNonNullable } from "common/src/helpers";

export { default as useCheckCollisions } from "./useCheckCollisions";

const getEventName = (
  eventType?: ReservationTypeChoice | null,
  title?: string,
  blockedName?: string
) =>
  eventType === ReservationTypeChoice.Blocked ? blockedName : title?.trim();

const getReservationTitle = (r: CalendarReservationFragment) =>
  r.reserveeName ?? "";

function convertReservationToCalendarEvent(
  r: CalendarReservationFragment,
  blockedName: string
) {
  const title = getEventName(r.type, getReservationTitle(r), blockedName);
  return {
    title,
    event: {
      ...r,
      name: r.name?.trim() !== "" ? r.name : "No name",
    },
    // TODO use zod for datetime conversions
    start: new Date(r.begin),
    end: new Date(r.end),
  };
}

// TODO This would be better if we combined two GQL queries, one for the reservation itself
// and other that includes the states (now we are fetching a lot of things we don't need)
const shouldBeShownInTheCalendar = (
  r: CalendarReservationFragment,
  ownPk?: number
) =>
  r.state === State.Confirmed ||
  r.state === State.RequiresHandling ||
  r.pk === ownPk;

// TODO there is an issue here with denied "Blocked" reservations shown in the Calendar as regular "Blocked" reservations
// so it looks confusing. It works properly if we want to show the reservation itself even if it's denied, but there should
// be either different styling or handling of "Blocked" reservations that are denied.
export function useReservationData(
  begin: Date,
  end: Date,
  reservationUnitPk?: number,
  reservationPk?: number
) {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const today = new Date();

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  const { data, ...rest } = useReservationsByReservationUnitQuery({
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk,
    variables: {
      id,
      pk: reservationUnitPk ?? 0,
      beginDate: toApiDate(begin ?? today) ?? "",
      endDate: toApiDate(end ?? today) ?? "",
      // NOTE we need denied to show the past reservations
      state: [
        State.Confirmed,
        State.RequiresHandling,
        State.Denied,
        State.WaitingForPayment,
      ],
    },
    onError: () => {
      notifyError("Varauksia ei voitu hakea");
    },
  });

  const blockedName = t("ReservationUnits.reservationState.RESERVATION_CLOSED");

  function doesReservationAffectReservationUnit(
    reservation: CalendarReservationFragment,
    resUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
  }
  const reservationSet = filterNonNullable(
    data?.reservationUnit?.reservationSet
  );
  // NOTE we could use a recular concat here (we only have single reservationUnit here)
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = filterNonNullable(
    reservationSet?.concat(
      affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, reservationUnitPk ?? 0)
      ) ?? []
    )
  );

  const events =
    reservations
      .filter((r) => shouldBeShownInTheCalendar(r, reservationPk))
      .map((r) => convertReservationToCalendarEvent(r, blockedName)) ?? [];

  return { ...rest, events };
}

/// @param recurringPk fetch reservations related to this pk
/// @param state optionally only fetch some reservation states
/// @param limit allows to over fetch: 100 is the limit per query, larger amounts are done with multiple fetches
export function useRecurringReservations(recurringPk?: number) {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const id = base64encode(`RecurringReservationNode:${recurringPk}`);
  const { data, loading, refetch } = useRecurringReservationQuery({
    skip: !recurringPk,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    variables: { id },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const { recurringReservation } = data ?? {};
  const reservations = filterNonNullable(recurringReservation?.reservations);

  return {
    loading,
    reservations,
    recurringReservation,
    refetch,
  };
}

// TODO this has the same useState being local problems as useRecurringReservations
// used to have but it's not obvious because we don't mutate / refetch this.
// Cache it in Apollo InMemory cache instead.
export function useDenyReasonOptions() {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { data, loading } = useReservationDenyReasonsQuery({
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });
  const { reservationDenyReasons } = data ?? {};
  const denyReasonOptions = filterNonNullable(
    reservationDenyReasons?.edges.map((x) => x?.node)
  ).map((dr) => ({
    value: dr?.pk ?? 0,
    label: dr?.reasonFi ?? "",
  }));

  return { options: denyReasonOptions, loading };
}

/// @param id fetch reservation related to this pk
/// Overly complex because editing DENIED or past reservations is not allowed
/// but the UI makes no distinction between past and present instances of a recurrance.
/// If we don't get the next valid reservation for edits: the mutations work,
/// but the UI is not updated to show the changes (since it's looking at a past instance).
export const useReservationEditData = (pk?: string) => {
  const typename = "ReservationNode";
  const id = base64encode(`${typename}:${pk}`);
  const { data, loading, refetch } = useReservationQuery({
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
    .filter((x) => x.state === State.Confirmed);

  const nextRecurranceId = base64encode(
    `${typename}:${possibleReservations?.at(0)?.pk}` ?? 0
  );
  const { data: nextRecurrance, loading: nextReservationLoading } =
    useReservationQuery({
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
    data?.reservation?.reservationUnit?.find((x) => x != null) ?? undefined;

  return {
    reservation: reservation ?? undefined,
    reservationUnit,
    loading: loading || nextReservationLoading,
    refetch,
  };
};
