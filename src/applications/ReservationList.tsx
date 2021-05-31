import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Reservation } from '../common/types';
import { parseDate } from '../common/util';
import { Strong } from '../common/Typography';

type Props = {
  reservations?: Reservation[];
  groupName: string;
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const InfoText = styled.div`
  margin-top: var(--spacing-layout-l);
  margin-bottom: var(--spacing-m);
  font-size: var(--fontsize-heading-s);
`;

const Table = styled.table`
  width: 50%;

  th {
    text-align: left;
  }
  tr {
    height: var(--spacing-layout-s);
  }
`;

const reservationLine = (reservation: Reservation, t: TFunction) => {
  const begin = parseDate(reservation.begin);
  const end = parseDate(reservation.end);
  return (
    <tr>
      <td>{t(`common.weekDayLong.${begin.getDay()}`)} </td>
      <td>{t('common.dateLong', { date: begin })} </td>
      <td>
        {t('common.time', { date: begin })}-{t('common.time', { date: end })}
      </td>
    </tr>
  );
};

const ReservationList = ({
  reservations,
  groupName,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const sortedReservations = reservations?.sort(
    (r1, r2) => parseDate(r1.begin).getTime() - parseDate(r2.begin).getTime()
  );

  const tableHeader = (
    <tr>
      <th>{t('ReservationList.headerWeekday')}</th>
      <th>{t('ReservationList.headerDate')}</th>
      <th>{t('ReservationList.headerTime')}</th>
    </tr>
  );
  return (
    <Container>
      <InfoText>
        <Strong>{t('ReservationList.granted', { groupName })}</Strong>
      </InfoText>
      <Table>
        {tableHeader}
        {sortedReservations
          ?.filter((res) => res.state === 'confirmed')
          .map((reservation) => {
            return reservationLine(reservation, t);
          })}
      </Table>
      <InfoText>
        <Strong>{t('ReservationList.denied')}</Strong>
      </InfoText>
      <Table>
        {tableHeader}
        {sortedReservations
          ?.filter((res) => res.state === 'denied')
          .map((reservation) => {
            return reservationLine(reservation, t);
          })}
      </Table>
    </Container>
  );
};

export default ReservationList;
