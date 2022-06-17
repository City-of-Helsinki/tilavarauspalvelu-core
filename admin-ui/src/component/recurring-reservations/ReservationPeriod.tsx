import React from "react";
import styled from "styled-components";
import { IconCalendar } from "hds-react";
import { formatDate } from "../../common/util";

type Props = {
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
`;

export default function ReservationPeriod({
  reservationPeriodBegin,
  reservationPeriodEnd,
}: Props): JSX.Element {
  return (
    <Container>
      <IconCalendar />
      {formatDate(reservationPeriodBegin)}-{formatDate(reservationPeriodEnd)}
    </Container>
  );
}
