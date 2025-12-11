import type { CalendarEvent } from "ui/src/components/calendar/Calendar";
import type { EventStyleType } from "@/modules/calendarStyling";
import {
  BLOCKED,
  CALENDAR_LEGENDS,
  CONFIRMED,
  CALENDAR_EVENT_BASE_STYLE,
  INTERSECTING_RESERVATION_UNIT,
  STAFF_RESERVATION,
  UNCONFIRMED,
  WAITING_PAYMENT,
} from "@/modules/calendarStyling";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import type { ReservationUnitReservationsFragment } from "@gql/gql-types";

const selected_legends = new Set([
  "CONFIRMED",
  "WAITING_PAYMENT",
  "UNCONFIRMED",
  "STAFF_RESERVATION",
  "INTERSECTING_RESERVATION_UNIT",
  "PAUSE",
  "CLOSED",
  "NOT_RESERVABLE",
  "RESERVABLE",
  "RESERVATION_UNIT_RELEASED",
  "RESERVATION_UNIT_DRAFT",
]);
export const legend: EventStyleType[] = CALENDAR_LEGENDS.filter((x) => selected_legends.has(x.key));

type CalendarEventType = CalendarEvent<ReservationUnitReservationsFragment>;
// TODO: merge this with eventStyleGetter in admin-ui/src/lib/reservations/[id]/eventStyleGetter.ts
export const eventStyleGetter =
  (currentReservationUnitPk: number) =>
  ({
    event,
  }: CalendarEventType): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isCurrentReservationUnit = event?.reservationUnit?.pk === currentReservationUnitPk;

    const isConfirmed = event?.state === ReservationStateChoice.Confirmed;
    const isWaitingForPayment = event?.state === ReservationStateChoice.WaitingForPayment;

    const isBlocked = event?.type === ReservationTypeChoice.Blocked;
    const isStaff = event?.type === ReservationTypeChoice.Staff;

    const style = {
      ...CALENDAR_EVENT_BASE_STYLE,
    };

    if (isConfirmed && isBlocked) {
      Object.assign(style, BLOCKED.style);
    } else if (isConfirmed && isStaff) {
      Object.assign(style, STAFF_RESERVATION.style);
    } else if (isWaitingForPayment) {
      Object.assign(style, WAITING_PAYMENT.style);
    } else if (isConfirmed) {
      Object.assign(style, CONFIRMED.style);
    } else {
      Object.assign(style, UNCONFIRMED.style);
    }

    // Apply over any previous styles
    if (!isCurrentReservationUnit) {
      Object.assign(style, INTERSECTING_RESERVATION_UNIT.style);
    }

    return {
      style,
    };
  };
