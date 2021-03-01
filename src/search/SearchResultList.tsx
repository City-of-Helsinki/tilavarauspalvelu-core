import { Button, IconMap, IconMenuHamburger, Select } from 'hds-react';
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

interface OptionType {
  label: string;
}

const options = [] as OptionType[];

const HitCount = styled.div`
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const ButtonContainer = styled.div`
  display: flex;
  margin-top: var(--spacing-m);

  & > :last-child {
    margin-left: auto;
  }
`;

const StyledButton = styled(Button)`
  --background-color: var(--color-black-90);
  --border-color: var(color-black-90);
  --background-color-hover: var(--color-black);
  --background-color-focus: var(--color-black);
  --background-color-hover-focus: var(--color-black-90);

  margin-right: var(--spacing-m);
`;

const StyledSecondaryButton = styled(Button)`
  --background-color: transparent;
  --border-color: var(--color-black);
  --background-color-hover: var(--color-black-10);
  --background-color-hover-focus: var(--color-black-10);
  --color: var(--color-black);
  --color-focus: var(--color-black-10);

  margin-right: var(--spacing-l);
`;

const Order = styled.div`
  & button {
    min-width: 11em;
  }

  & > div {
    margin-left: var(--spacing-m);
  }
`;

const ListContainer = styled.div`
  margin-top: var(--spacing-layout-s);
`;

const SearchResultList = ({ reservationUnits }: Props): JSX.Element => {
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    containsReservationUnit,
  } = useReservationUnitsList();

  const { t } = useTranslation();
  return (
    <>
      <Container id="searchResultList">
        <HitCount>
          {t('SearchResultList.count', { count: reservationUnits.length })}
        </HitCount>
        <ButtonContainer>
          <StyledButton theme="black" iconLeft={<IconMenuHamburger />}>
            {t('SearchResultList.listButton')}
          </StyledButton>
          <StyledSecondaryButton
            disabled
            variant="secondary"
            iconLeft={<IconMap />}>
            {t('SearchResultList.mapButton')}
          </StyledSecondaryButton>
          <Order className="align-vertically">
            <span>{t('SearchResultList.sortButtonLabel')}:</span>
            <Select
              placeholder={t('SearchResultList.sortButtonPlaceholder')}
              disabled
              options={options}
              label=""
            />
          </Order>
        </ButtonContainer>
        <ListContainer>
          {reservationUnits.map((ru) => (
            <ReservationUnitCard
              selectReservationUnit={selectReservationUnit}
              containsReservationUnit={containsReservationUnit}
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
