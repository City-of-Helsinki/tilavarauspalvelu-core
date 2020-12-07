import { Button, IconMap, IconMenuHamburger } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { getReservationUnits } from '../common/api';
import { ReservationUnit } from '../common/types';
import ReservationUnitCard from './ReservationUnitCard';
import styles from './SearchResultList.module.scss';
// import { useTranslation } from 'react-i18next';

interface Props {
  // only text search is now implemented!
  search: string;
}

const SearchResultList = ({ search }: Props): JSX.Element => {
  // const { t } = useTranslation();

  const [reservationUnits, setReservationUnits] = useState<ReservationUnit[]>(
    []
  );

  useEffect(() => {
    async function fetchData() {
      const units = await getReservationUnits({ search });
      setReservationUnits(units.concat(units).concat(units));
    }
    fetchData();
  }, [search]);
  return (
    <>
      <div className={styles.hitCount}>
        {reservationUnits.length} Hakutulosta
      </div>
      <Button className={styles.button} iconLeft={<IconMenuHamburger />}>
        Näytä listassa
      </Button>
      <Button
        disabled
        className={styles.buttonSecondary}
        variant="secondary"
        iconLeft={<IconMap />}>
        Näytä kartalla
      </Button>
      <div className={styles.listContainer}>
        {reservationUnits.map((ru) => (
          <ReservationUnitCard reservationUnit={ru} />
        ))}
      </div>
    </>
  );
};

export default SearchResultList;
