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

import styles from '../Application.module.scss';

const ReservationUnitCard = ({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
}: {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
}): JSX.Element => {
  return (
    <div style={{ marginTop: 'var(--spacing-l)' }}>
      <div style={{ fontSize: 'var(--fontsize-heading-xs)', fontWeight: 700 }}>
        Vaihtoehto {order + 1}.
      </div>
      <div
        style={{
          gap: 'var(--spacing-l)',
          display: 'grid',
          gridTemplateColumns: '5fr 1fr',
          marginTop: 'var(--spacing-s)',
          alignItems: 'center',
        }}>
        <div
          style={{
            gap: 'var(--spacing-l)',
            backgroundColor: 'white',
            display: 'grid',
            gridTemplateColumns: '1fr 4fr 1fr 1fr',
            alignItems: 'center',
          }}>
          <img
            style={{ objectFit: 'cover' }}
            src={reservationUnit.images[0]?.imageUrl}
            width="76"
            height="99"
          />
          <div>
            <div
              style={{
                fontSize: 'var(--fontsize-heading-m)',
                fontWeight: 'bold',
              }}>
              {reservationUnit.name}
            </div>
            <div style={{ fontSize: 'var(--fontsize-heading-xs)' }}>
              {reservationUnit.location?.addressStreet},
              {reservationUnit.location?.addressZip}{' '}
              {reservationUnit.location?.addressCity}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyItems: 'center',
              fontSize: 'var(--fontsize-body-l)',
              fontWeight: 'bold',
            }}>
            <IconGroup />
            <span style={{ marginLeft: 'var(--spacing-xs)' }}>
              {reservationUnit.maxPersons}
            </span>
          </div>
          <div>
            <Button
              style={{ '--border-color': 'transparent' } as React.CSSProperties}
              variant="secondary"
              iconLeft={<IconTrash />}
              onClick={() => {
                onDelete(reservationUnit);
              }}>
              Poista
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
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
    <div style={{ marginTop: 'var(--spacing-l)' }}>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
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
      {t('hehe')}
    </div>
  );
};

export default ReservationUnitList;
