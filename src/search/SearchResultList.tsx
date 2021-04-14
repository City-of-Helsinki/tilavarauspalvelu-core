import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import useReservationUnitsList from '../common/hook/useReservationUnitList';
import { ReservationUnit } from '../common/types';
import Container from '../component/Container';
import StartApplicationBar from '../component/StartApplicationBar';
import ReservationUnitCard from './ReservationUnitCard';

interface Props {
  reservationUnits: ReservationUnit[];
}

const HitCount = styled.div`
  margin-top: var(--spacing-layout-s);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const ListContainer = styled.div`
  margin-top: var(--spacing-layout-s);
`;

const SearchResultList = ({ reservationUnits }: Props): JSX.Element => {
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
  } = useReservationUnitsList();

  const { t } = useTranslation();
  return (
    <>
      <Container id="searchResultList">
        <HitCount>
          {reservationUnits.length
            ? t('SearchResultList.count', { count: reservationUnits.length })
            : t('SearchResultList.noResults')}
        </HitCount>
        <ListContainer>
          {reservationUnits.map((ru) => (
            <ReservationUnitCard
              selectReservationUnit={selectReservationUnit}
              containsReservationUnit={containsReservationUnit}
              removeReservationUnit={removeReservationUnit}
              reservationUnit={ru}
              key={ru.id}
            />
          ))}
        </ListContainer>
      </Container>
      <StartApplicationBar count={selectedReservationUnits.length} />
    </>
  );
};

export default SearchResultList;
