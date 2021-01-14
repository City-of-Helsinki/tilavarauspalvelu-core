import {
  Button,
  IconGroup,
  IconHeart,
  IconInfoCircle,
  IconLocation,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ReservationUnit } from '../common/types';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';
import styles from './ReservationUnitCard.module.scss';

interface Props {
  reservationUnit: ReservationUnit;
}

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;
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
        <span className={styles.name}>
          <Link to={`../reservation-unit/${reservationUnit.id}`}>
            {reservationUnit.name}
          </Link>
        </span>
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
        <IconHeart />
        <div style={{ flexGrow: 1 }} />
        <Button
          disabled={containsReservationUnit(reservationUnit)}
          iconLeft={<IconPlus />}
          onClick={() => addReservationUnit(reservationUnit)}
          variant="secondary">
          {t('common.selectReservationUnit')}
        </Button>
      </div>
    </div>
  );
};

export default ReservationUnitCard;
