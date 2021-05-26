import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { breakpoint } from '../common/style';
import { Reservation } from '../common/types';
import { localizedValue, parseDate } from '../common/util';

type Props = {
  reservations?: Reservation[];
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const InfoText = styled.div`
  margin-top: var(--spacing-l);
  font-size: var(--fontsize-heading-m);
`;

const TwoColLayout = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-gap: 0.5em;
  grid-template-columns: 2fr 9fr;
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const reservationLine = (
  reservation: Reservation,
  t: TFunction,
  language: string
) => {
  const begin = parseDate(reservation.begin);
  const end = parseDate(reservation.end);
  return (
    <TwoColLayout>
      <span>
        {t('common.dateLong', { date: begin })}{' '}
        {t('common.time', { date: begin })}-{t('common.time', { date: end })}
      </span>
      <span>
        {reservation.reservationUnit
          .map((ru) => localizedValue(ru.name, language))
          .join(',')}
      </span>
    </TwoColLayout>
  );
};

const ReservationList = ({ reservations }: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const sortedReservations = reservations?.sort(
    (r1, r2) => parseDate(r1.begin).getTime() - parseDate(r2.begin).getTime()
  );
  return (
    <Container>
      <InfoText>{t('ReservationList.granted')}:</InfoText>
      {sortedReservations
        ?.filter((res) => res.state === 'confirmed')
        .map((reservation) => {
          return reservationLine(reservation, t, i18n.language);
        })}
      <InfoText>{t('ReservationList.denied')}:</InfoText>
      {sortedReservations
        ?.filter((res) => res.state === 'denied')
        .map((reservation) => {
          return reservationLine(reservation, t, i18n.language);
        })}
    </Container>
  );
};

export default ReservationList;
