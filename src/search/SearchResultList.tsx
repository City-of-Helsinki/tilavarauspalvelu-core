import { Button, IconMap, IconMenuHamburger, Select } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { getReservationUnits } from '../common/api';
import { ReservationUnit } from '../common/types';
import ReservationUnitCard from './ReservationUnitCard';

interface Props {
  // only text search is now implemented!
  search: string;
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

const SearchResultList = ({ search }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [reservationUnits, setReservationUnits] = useState<ReservationUnit[]>(
    []
  );

  useEffect(() => {
    async function fetchData() {
      const units = await getReservationUnits({ search });
      setReservationUnits(units);
    }
    fetchData();
  }, [search]);
  return (
    <>
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
          <ReservationUnitCard reservationUnit={ru} key={ru.id} />
        ))}
      </ListContainer>
    </>
  );
};

export default SearchResultList;
