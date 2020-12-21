import { Button, IconMap, IconMenuHamburger, Select } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getReservationUnits } from '../common/api';
import { ReservationUnit } from '../common/types';
import ReservationUnitCard from './ReservationUnitCard';
import styles from './SearchResultList.module.scss';

interface Props {
  // only text search is now implemented!
  search: string;
}

interface OptionType {
  label: string;
}

const options = [] as OptionType[];

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
      <div className={styles.hitCount}>
        {t('SearchResultList.count', { count: reservationUnits.length })}
      </div>
      <div className={styles.buttonContainer}>
        <Button theme="black" iconLeft={<IconMenuHamburger />}>
          {t('SearchResultList.listButton')}
        </Button>
        <Button
          disabled
          className={styles.buttonSecondary}
          variant="secondary"
          iconLeft={<IconMap />}>
          {t('SearchResultList.mapButton')}
        </Button>
        <div className={`${styles.order} align-vertically`}>
          <span>{t('SearchResultList.sortButtonLabel')}:</span>
          <Select
            placeholder={t('SearchResultList.sortButtonPlaceholder')}
            disabled
            options={options}
            label=""
          />
        </div>
      </div>
      <div className={styles.listContainer}>
        {reservationUnits.map((ru) => (
          <ReservationUnitCard key={ru.id} reservationUnit={ru} />
        ))}
      </div>
    </>
  );
};

export default SearchResultList;
