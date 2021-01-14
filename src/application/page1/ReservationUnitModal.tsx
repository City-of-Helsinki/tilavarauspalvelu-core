import {
  Button,
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  SearchInput,
} from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAsync } from 'react-use';
import { getReservationUnits } from '../../common/api';
import { ApplicationPeriod, ReservationUnit } from '../../common/types';

import styles from './ReservationUnitModal.module.scss';

const ReservationUnitCard = ({
  reservationUnit,
  handleAdd,
}: {
  reservationUnit: ReservationUnit;
  handleAdd: (ru: ReservationUnit) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <img
        alt={`Kuva tilasta ${reservationUnit.name}`}
        width="240"
        height="156"
        src={
          reservationUnit.images[0]?.imageUrl ||
          'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        }
      />
      <div className={styles.mainContent}>
        <span className={styles.name}>{reservationUnit.name}</span>
        <span className={styles.description}>
          {reservationUnit.spaces[0]?.name}
        </span>
        <span className={styles.bottom}>
          <IconInfoCircle />{' '}
          <span>{reservationUnit.reservationUnitType.name}</span>
          <IconGroup /> <span>{reservationUnit.maxPersons}</span>
          <IconLocation />{' '}
          <span>
            {reservationUnit.location?.addressStreet},{' '}
            {reservationUnit.location?.addressZip}{' '}
            {reservationUnit.location?.addressCity}
          </span>
        </span>
      </div>
      <div className={styles.actions}>
        <div style={{ flexGrow: 1 }} />
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleAdd(reservationUnit)}
          variant="secondary">
          {t('ReservationUnitModal.selectReservationUnit')}
        </Button>
      </div>
    </div>
  );
};

const ReservationUnitModal = ({
  applicationPeriod,
  handleAdd,
  currentReservationUnits,
}: {
  applicationPeriod: ApplicationPeriod;
  handleAdd: (ru: ReservationUnit) => void;
  currentReservationUnits: ReservationUnit[];
}): JSX.Element => {
  const [q, setQ] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReservationUnit[]>([]);

  const { t } = useTranslation();

  const results = useAsync(async () => {
    if (q === null) {
      return [];
    }
    return getReservationUnits({ search: q });
  }, [q]);

  const filtered = currentReservationUnits.concat(selected).map((ru) => ru.id);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.heading}>{t('ReservationUnitModal.heading')}</div>
      <span className={styles.text}>{applicationPeriod.name}</span>
      <SearchInput
        className={styles.searchInput}
        label={t('ReservationUnitModal.searchTermLabel')}
        onSubmit={(e) => {
          setQ(e);
        }}
      />
      <div className={styles.results}>
        {results.value
          ?.filter((ru) => !filtered.includes(ru.id))
          .map((ru) => {
            return (
              <ReservationUnitCard
                handleAdd={() => {
                  handleAdd(ru);
                  setSelected([...selected, ru]);
                }}
                reservationUnit={ru}
                key={ru.id}
              />
            );
          })}
      </div>
    </div>
  );
};

export default ReservationUnitModal;
