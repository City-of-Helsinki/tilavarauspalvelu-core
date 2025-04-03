import {
  type CalendarReservationFragment,
  type Maybe,
  ReservationStateChoice,
  ReservationTypeChoice,
  useReservationsByReservationUnitQuery,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { toApiDate } from "common/src/common/util";
import { errorToast } from "common/src/common/toast";
import { base64encode } from "common/src/helpers";
// TODO move the import
import { type CalendarEventType } from "@/spa/reservations/[id]/eventStyleGetter";
import { combineAffectingReservations } from "@/helpers";

// TODO there is an issue here with denied "Blocked" reservations shown in the Calendar as regular "Blocked" reservations
// so it looks confusing. It works properly if we want to show the reservation itself even if it's denied, but there should
// be either different styling or handling of "Blocked" reservations that are denied.
export function useReservationCalendarData({
  begin,
  end,
  reservationUnitPk,
  reservationPk,
}: {
  begin: Date;
  end: Date;
  reservationUnitPk: Maybe<number> | undefined;
  reservationPk: Maybe<number> | undefined;
}) {
  const { t } = useTranslation();

  const today = new Date();

  const id = base64encode(`ReservationUnitNode:${reservationUnitPk}`);
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
        ReservationStateChoice.Confirmed,
        ReservationStateChoice.RequiresHandling,
        ReservationStateChoice.Denied,
        ReservationStateChoice.WaitingForPayment,
      ],
    },
    onError: () => {
      errorToast({ text: "Varauksia ei voitu hakea" });
    },
  });

  const blockedName = t("ReservationUnits.reservationState.RESERVATION_CLOSED");

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const events =
    reservations
      .filter((r) => shouldBeShownInTheCalendar(r, reservationPk))
      .map((r) => convertReservationToCalendarEvent(r, blockedName)) ?? [];

  return { ...rest, events };
}

// TODO This would be better if we combined two GQL queries, one for the reservation itself
// and other that includes the states (now we are fetching a lot of things we don't need)
function shouldBeShownInTheCalendar(
  r: CalendarReservationFragment,
  ownPk: Maybe<number> | undefined
) {
  return (
    r.state === ReservationStateChoice.Confirmed ||
    r.state === ReservationStateChoice.RequiresHandling ||
    r.pk === ownPk
  );
}

function convertReservationToCalendarEvent(
  // NOTE funky because we are converting affectedReservations also and they don't have reservationUnit
  // but these are passed to event handlers that allow changing the reservation that requires a reservationUnit
  // affected don't have event handlers so empty reservationUnit is fine
  r: CalendarReservationFragment,
  blockedName: string
): CalendarEventType {
  const title =
    getEventName({
      type: r.type,
      title: getReservationTitle(r),
      blockedName,
    }) ?? undefined;

  return {
    title,
    event: {
      ...r,
      name: r.name?.trim() !== "" ? r.name : "No name",
      recurringReservation: null,
    },
    start: new Date(r.begin),
    end: new Date(r.end),
  };
}

function getEventName({
  type,
  title,
  blockedName = null,
}: {
  type: Maybe<ReservationTypeChoice>;
  title: string;
  blockedName: Maybe<string>;
}): string | null {
  return type === ReservationTypeChoice.Blocked ? blockedName : title.trim();
}

function getReservationTitle(
  r: Pick<CalendarReservationFragment, "reserveeName">
): string {
  return r.reserveeName ?? "";
}
