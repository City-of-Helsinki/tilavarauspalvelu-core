import {
  Button,
  IconGroup,
  IconHeart,
  IconInfoCircle,
  IconLocation,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { ReservationUnit } from '../common/types';
import styles from './ReservationUnitCard.module.scss';

interface Props {
  reservationUnit: ReservationUnit;
}

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  // const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <img
        alt={`Kuva tilasta ${reservationUnit.name}`}
        width="240"
        height="156"
        src="https://api.hel.fi/respa/resource_image/671?dim=250x156"
      />
      <div className={styles.mainContent}>
        <span className={styles.name}>{reservationUnit.name}</span>
        <span className={styles.description}>
          {reservationUnit.spaces[0]?.name}
        </span>
        <span className={styles.bottom}>
          <IconInfoCircle />
          <span>Nuorisotalo</span>
          <IconGroup /> <span>10</span>
          <IconLocation /> <span>Linnanrakentajantie 2</span>
        </span>
      </div>
      <div className={styles.actions}>
        <IconHeart />
        <div style={{ flexGrow: 1 }} />
        <Button iconLeft={<IconPlus />} variant="secondary">
          Valitse tila
        </Button>
      </div>
    </div>
  );
};

export default ReservationUnitCard;
