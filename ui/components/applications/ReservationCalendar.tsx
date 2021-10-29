import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Calendar, { CalendarEvent } from "../calendar/Calendar";
import { reservationUnitPath } from "../../modules/const";
import { breakpoint } from "../../modules/style";
import {
  ApplicationEvent,
  Reservation,
  ReservationUnit,
} from "../../modules/types";
import ExternalLink from "../reservation-unit/ExternalLink";
import { localizedValue, parseDate } from "../../modules/util";

type Props = {
  reservations?: Reservation[];
  begin: Date;
  applicationEvent?: ApplicationEvent;
  reservationUnit: ReservationUnit;
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const Legends = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 3fr 1fr 7fr;
  gap: 1em;

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 3fr;
  }
`;

const Ok = styled.div`
  color: var(--color-white);
  padding: var(--spacing-xs);
  height: var(--spacing-m);
  width: var(--spacing-layout-xl);
  background-color: var(--color-success-dark);
`;

const Cancelled = styled.div`
  color: var(--color-white);
  padding: var(--spacing-xs);
  height: var(--spacing-m);
  text-decoration: line-through;
  width: var(--spacing-layout-xl);
  background-color: var(--color-error-dark);
`;

const Label = styled.div`
  padding: var(--spacing-xs);
  height: var(--spacing-m);
`;

const ReservationCalendar = ({
  begin,
  reservations,
  applicationEvent,
  reservationUnit,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const events = reservations?.map((reservation: Reservation) => {
    const event = {
      title: `${
        reservation.state === "cancelled"
          ? `${t("reservationCalendar:prefixForCancelled")}: `
          : ""
      } ${
        applicationEvent?.name ? `${applicationEvent.name}: ` : ""
      }${localizedValue(reservationUnit.name, i18n.language)}`,
      start: parseDate(reservation.begin),
      end: parseDate(reservation.end),
      allDay: false,
      event: reservation,
    };

    return event as CalendarEvent;
  });

  return (
    <Container>
      <Calendar events={events} begin={begin} />
      <Legends>
        <Ok>11.00-12.00</Ok>
        <Label>{t("reservationCalendar:legend.okLabel")}</Label>
        <Cancelled>11.00-12.45</Cancelled>
        <Label>{t("reservationCalendar:legend.cancelledLabel")}</Label>
      </Legends>
      <ExternalLink
        href={reservationUnitPath(reservationUnit.id)}
        name={t("reservationCalendar:linkToResourceUnitLabel")}
      />
    </Container>
  );
};

export default ReservationCalendar;
