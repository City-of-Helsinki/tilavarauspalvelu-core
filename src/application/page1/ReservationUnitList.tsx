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
import styled from 'styled-components';
import { useAsync } from 'react-use';
import { getReservationUnit } from '../../common/api';
import {
  ApplicationEvent,
  ApplicationPeriod,
  ReservationUnit,
} from '../../common/types';
import Modal from '../../component/Modal';
import ReservationUnitModal from './ReservationUnitModal';
import { OptionType } from '../../common/util';

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

const NameCardContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const PreCardLabel = styled.div`
  font-size: var(--fontsize-heading-xs);
  font-weight: 700;
`;

const CardButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 5fr 1fr;
  margin-top: var(--spacing-s);
  align-items: center;
`;

const CardContainer = styled.div`
  gap: var(--spacing-l);
  background-color: white;
  display: grid;
  grid-template-columns: 1fr 4fr 1fr 1fr;
  align-items: center;
`;

const Image = styled.img`
  object-fit: cover;
`;

const Title = styled.div`
  font-size: var(--fontsize-heading-m);
  font-weight: bold;
`;

const Address = styled.div`
  font-size: var(--fontsize-body-xs);
`;

const MaxPersonsContainer = styled.div`
  display: flex;
  justify-items: center;
  font-size: var(--fontsize-body-l);
  font-weight: bold;
`;

const MaxPersonsCountContainer = styled.span`
  margin-left: var(--spacing-xs);
`;

const DeleteButton = styled(Button)`
  --border-color: transparent;
`;

const ArrowContainer = styled.div`
  display: flex;
`;

const Circle = styled.div<{ passive: boolean }>`
  margin-left: var(--spacing-xs);
  height: var(--spacing-layout-m);
  width: var(--spacing-layout-m);
  background-color: ${(props) =>
    props.passive ? 'var(--color-black-10)' : 'var(--color-bus)'};
  color: ${(props) => (props.passive ? 'var(--color-black-50)' : 'white')};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

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
    <NameCardContainer>
      <PreCardLabel>
        {t('ReservationUnitList.option')} {order + 1}.
      </PreCardLabel>
      <CardButtonContainer>
        <CardContainer>
          <Image
            src={reservationUnit.images[0]?.imageUrl}
            width="76"
            height="99"
          />
          <div>
            <Title>{reservationUnit.name}</Title>
            <Address>
              {reservationUnit.location?.addressStreet},
              {reservationUnit.location?.addressZip}{' '}
              {reservationUnit.location?.addressCity}
            </Address>
          </div>
          <MaxPersonsContainer>
            <IconGroup />
            <MaxPersonsCountContainer>
              {reservationUnit.maxPersons}
            </MaxPersonsCountContainer>
          </MaxPersonsContainer>
          <div>
            <DeleteButton
              variant="secondary"
              iconLeft={<IconTrash />}
              onClick={() => {
                onDelete(reservationUnit);
              }}>
              {t('ReservationUnitList.buttonRemove')}
            </DeleteButton>
          </div>
        </CardContainer>
        <ArrowContainer>
          <Circle passive={first}>
            <button
              className="button-reset"
              disabled={first}
              type="button"
              onClick={() => onMoveUp(reservationUnit)}>
              <IconArrowUp size="m" />
            </button>
          </Circle>
          <Circle passive={last}>
            <button
              className="button-reset"
              type="button"
              disabled={last}
              onClick={() => onMoveDown(reservationUnit)}>
              <IconArrowDown size="m" />
            </button>
          </Circle>
        </ArrowContainer>
      </CardButtonContainer>
    </NameCardContainer>
  );
};

type OptionTypes = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
};

type Props = {
  selectedReservationUnits: ReservationUnit[];
  applicationEvent: ApplicationEvent;
  fieldName: string;
  form: ReturnType<typeof useForm>;
  applicationPeriod: ApplicationPeriod;
  options: OptionTypes;
};

const MainContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);
`;

const ReservationUnitList = ({
  selectedReservationUnits,
  applicationEvent,
  form,
  fieldName,
  applicationPeriod,
  options,
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
    <MainContainer>
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
      <ButtonContainer>
        <Button onClick={() => setShowModal(true)}>
          {t('ReservationUnitList.add')}
        </Button>
      </ButtonContainer>
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
          options={options}
        />
      </Modal>
    </MainContainer>
  );
};

export default ReservationUnitList;
