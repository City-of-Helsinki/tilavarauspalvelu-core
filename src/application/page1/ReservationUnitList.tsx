import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconTrash,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReservationUnit } from '../../common/types';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../../context/SelectionsListContext';

import styles from './ReservationUnitList.module.scss';

const ReservationUnitCard = ({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  t,
}: {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
  t: (n: string) => string;
}): JSX.Element => {
  return (
    <div className={styles.nameCardContainer}>
      <div className={styles.preCardLabel}>
        {t('ReservationUnitList.option')} {order + 1}.
      </div>
      <div className={styles.cardButtonContainer}>
        <div className={styles.cardContainer}>
          <img
            className={styles.image}
            src={reservationUnit.images[0]?.imageUrl}
            width="76"
            height="99"
          />
          <div>
            <div className={styles.title}>{reservationUnit.name}</div>
            <div className={styles.address}>
              {reservationUnit.location?.addressStreet},
              {reservationUnit.location?.addressZip}{' '}
              {reservationUnit.location?.addressCity}
            </div>
          </div>
          <div className={styles.maxPersonsContainer}>
            <IconGroup />
            <span className={styles.maxPersonsCountContainer}>
              {reservationUnit.maxPersons}
            </span>
          </div>
          <div>
            <Button
              className={styles.deleteButton}
              variant="secondary"
              iconLeft={<IconTrash />}
              onClick={() => {
                onDelete(reservationUnit);
              }}>
              {t('ReservationUnitList.buttonRemove')}
            </Button>
          </div>
        </div>
        <div className={styles.arrowContainer}>
          <div
            className={`${styles.circle} ${first ? styles.passiveCircle : ''}`}>
            <button
              className="button-reset"
              disabled={first}
              type="button"
              onClick={() => onMoveUp(reservationUnit)}>
              <IconArrowUp size="m" />
            </button>
          </div>
          <div
            className={`${styles.circle} ${last ? styles.passiveCircle : ''}`}>
            <button
              className="button-reset"
              type="button"
              disabled={last}
              onClick={() => onMoveDown(reservationUnit)}>
              <IconArrowDown size="m" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReservationUnitList = (): JSX.Element => {
  const { t } = useTranslation();
  const {
    reservationUnits,
    removeReservationUnit,
    moveUp,
    moveDown,
  } = React.useContext(SelectionsListContext) as SelectionsListContextType;

  return (
    <div className={styles.mainContainer}>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            key={ru.id}
            t={t}
            onDelete={removeReservationUnit}
            reservationUnit={ru}
            order={index}
            first={index === 0}
            last={index === all.length - 1}
            onMoveDown={moveDown}
            onMoveUp={moveUp}
          />
        );
      })}
    </div>
  );
};

export default ReservationUnitList;
