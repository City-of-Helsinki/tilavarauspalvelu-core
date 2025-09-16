import {
  type CalendarReservationFragment,
  type Maybe,
  ReservationStateChoice,
  ReservationTypeChoice,
  useReservationsByReservationUnitQuery,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { toApiDate } from "common/src/common/util";
import { errorToast } from "common/src/components/toast";
import { createNodeId } from "common/src/helpers";
import type { CalendarEventType } from "@/modules/reservation";
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

  const { data, ...rest } = useReservationsByReservationUnitQuery({
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk ?? 0),
      pk: reservationUnitPk ?? 0,
      beginDate: toApiDate(begin) ?? "",
      endDate: toApiDate(end) ?? "",
      // NOTE we need denied to show the past reservations
      state: [
        ReservationStateChoice.Confirmed,
        ReservationStateChoice.RequiresHandling,
        ReservationStateChoice.Denied,
        ReservationStateChoice.WaitingForPayment,
      ],
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const blockedName = t("reservationUnit:reservationState.RESERVATION_CLOSED");

  const reservations =
    data?.node != null && "reservations" in data.node
      ? combineAffectingReservations({ ...data, node: data.node }, reservationUnitPk)
      : [];

  const events =
    reservations
      .filter((r) => shouldBeShownInTheCalendar(r, reservationPk))
      .map((r) => convertReservationToCalendarEvent(r, blockedName)) ?? [];

  return { ...rest, events };
}

// TODO This would be better if we combined two GQL queries, one for the reservation itself
// and other that includes the states (now we are fetching a lot of things we don't need)
function shouldBeShownInTheCalendar(r: CalendarReservationFragment, ownPk: Maybe<number> | undefined) {
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
      reservationSeries: null,
    },
    start: new Date(r.beginsAt),
    end: new Date(r.endsAt),
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

function getReservationTitle(r: Pick<CalendarReservationFragment, "reserveeName">): string {
  return r.reserveeName ?? "";
}
