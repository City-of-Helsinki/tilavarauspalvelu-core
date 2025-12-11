import { useTranslation } from "next-i18next";
import { errorToast } from "ui/src/components/toast";
import { formatApiDate } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import { combineAffectingReservations } from "@/modules/helpers";
import type { CalendarEventType } from "@/modules/reservation";
import { ReservationStateChoice, ReservationTypeChoice, useReservationsByReservationUnitQuery } from "@gql/gql-types";
import type { CalendarReservationFragment, Maybe } from "@gql/gql-types";

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

  const { data, ...rest } = useReservationsByReservationUnitQuery({
    fetchPolicy: "no-cache",
    skip: !reservationUnitPk,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk ?? 0),
      pk: reservationUnitPk ?? 0,
      beginDate: formatApiDate(begin ?? today) ?? "",
      endDate: formatApiDate(end ?? today) ?? "",
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

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const events =
    reservations
      .filter((r) => shouldBeShownInTheCalendar(r, reservationPk))
      .map((r) => convertReservationToCalendarEvent(r, blockedName)) ?? [];

  return { ...rest, events };
}

function shouldBeShownInTheCalendar(r: CalendarReservationFragment, ownPk: Maybe<number> | undefined) {
  return (
    r.state === ReservationStateChoice.Confirmed ||
    r.state === ReservationStateChoice.RequiresHandling ||
    r.pk === ownPk
  );
}

function convertReservationToCalendarEvent(r: CalendarReservationFragment, blockedName: string): CalendarEventType {
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
