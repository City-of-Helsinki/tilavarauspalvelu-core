import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconTrash,
} from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAsync } from 'react-use';
import { getReservationUnit } from '../../common/api';
import {
  ApplicationEvent,
  ApplicationPeriod,
  ReservationUnit,
} from '../../common/types';
import Modal from '../../component/Modal';

import styles from './ReservationUnitList.module.scss';
import ReservationUnitModal from './ReservationUnitModal';

type CardProps = {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
  t: (n: string) => string;
};

const ReservationUnitCard = ({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  t,
}: CardProps): JSX.Element => {
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

type Props = {
  selectedReservationUnits: ReservationUnit[];
  applicationEvent: ApplicationEvent;
  fieldName: string;
  form: ReturnType<typeof useForm>;
  applicationPeriod: ApplicationPeriod;
};

const ReservationUnitList = ({
  selectedReservationUnits,
  applicationEvent,
  form,
  fieldName,
  applicationPeriod,
}: Props): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const [reservationUnits, setReservationUnits] = useState(
    [] as ReservationUnit[]
  );

  // selected in dialog
  const [selected, setSelected] = useState<ReservationUnit[]>([]);

  const handleAdd = (ru: ReservationUnit) => {
    setSelected([...selected, ru]);
  };

  useEffect(() => {
    form.setValue(
      fieldName,
      reservationUnits.map((ru, index) => ({
        reservationUnit: ru.id,
        priority: index,
      }))
    );
  }, [reservationUnits, fieldName, form]);

  useAsync(async () => {
    let data;
    if (applicationEvent.eventReservationUnits.length === 0) {
      data = selectedReservationUnits;
    } else {
      const promises = applicationEvent.eventReservationUnits.map((id) =>
        getReservationUnit(id.reservationUnit)
      );
      data = await Promise.all(promises);
    }
    setReservationUnits(data);
    return data;
  }, [applicationEvent.eventReservationUnits]);

  const move = (
    units: ReservationUnit[],
    from: number,
    to: number
  ): ReservationUnit[] => {
    const copy = [...units];
    const i = units[from];
    copy.splice(from, 1);
    copy.splice(to, 0, i);
    return copy;
  };

  const remove = (reservationUnit: ReservationUnit) => {
    setReservationUnits([
      ...reservationUnits.filter((ru) => ru.id !== reservationUnit.id),
    ]);
  };

  const moveUp = (reservationUnit: ReservationUnit) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from - 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnit) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from + 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const { t } = useTranslation();

  return (
    <div className={styles.mainContainer}>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            key={ru.id}
            t={t}
            onDelete={remove}
            reservationUnit={ru}
            order={index}
            first={index === 0}
            last={index === all.length - 1}
            onMoveDown={moveDown}
            onMoveUp={moveUp}
          />
        );
      })}
      <div className={styles.buttonContainer}>
        <Button onClick={() => setShowModal(true)}>
          {t('ReservationUnitList.add')}
        </Button>
      </div>
      <Modal
        okLabel={t('ReservationUnitModal.okButton')}
        handleClose={(add: boolean) => {
          setShowModal(false);
          if (add) {
            setReservationUnits([...reservationUnits, ...selected]);
          }
          setSelected([]);
        }}
        show={showModal}>
        <ReservationUnitModal
          currentReservationUnits={reservationUnits}
          applicationPeriod={applicationPeriod}
          handleAdd={handleAdd}
        />
      </Modal>
    </div>
  );
};

export default ReservationUnitList;
