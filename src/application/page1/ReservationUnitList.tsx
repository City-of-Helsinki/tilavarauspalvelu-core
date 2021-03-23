import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconPlusCircle,
  IconTrash,
  Notification,
} from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { getReservationUnit } from '../../common/api';
import {
  ApplicationEvent,
  ApplicationRound,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import Modal from '../../component/Modal';
import ReservationUnitModal from './ReservationUnitModal';
import { getAddress, getMainImage, localizedValue } from '../../common/util';

type CardProps = {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
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
  grid-template-columns: 4fr 1fr;
  margin-top: var(--spacing-s);
  align-items: center;
`;

const CardContainer = styled.div`
  gap: var(--spacing-s);
  background-color: white;
  display: grid;
  grid-template-columns: 76px 5fr 1fr 1fr;
  align-items: center;
`;

const Image = styled.img`
  width: 76px;
  height: 99px;
  object-fit: cover;
`;

const Name = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const BuildingName = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-l);
`;

const Address = styled.div`
  font-size: var(--fontsize-body-s);
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
}: CardProps): JSX.Element => {
  const { i18n, t } = useTranslation();

  return (
    <NameCardContainer>
      <PreCardLabel>
        {t('ReservationUnitList.option')} {order + 1}.
      </PreCardLabel>
      <CardButtonContainer>
        <CardContainer>
          <Image
            src={getMainImage(reservationUnit)?.smallUrl}
            alt={t('common.imgAltForSpace', {
              name: localizedValue(reservationUnit.name, i18n.language),
            })}
          />
          <div>
            <Name>{localizedValue(reservationUnit.name, i18n.language)}</Name>
            <BuildingName>
              {localizedValue(reservationUnit.building.name, i18n.language)}
            </BuildingName>
            <Address>{getAddress(reservationUnit)}</Address>
          </div>
          <MaxPersonsContainer>
            <IconGroup aria-hidden />
            <MaxPersonsCountContainer>
              {reservationUnit.maxPersons}
            </MaxPersonsCountContainer>
          </MaxPersonsContainer>
          <div>
            <Button
              variant="supplementary"
              iconLeft={<IconTrash aria-hidden />}
              onClick={() => {
                onDelete(reservationUnit);
              }}>
              {t('ReservationUnitList.buttonRemove')}
            </Button>
          </div>
        </CardContainer>
        <ArrowContainer>
          <Circle passive={first}>
            <button
              className="button-reset"
              disabled={first}
              type="button"
              aria-label={t('ReservationUnitList.buttonUp')}
              onClick={() => onMoveUp(reservationUnit)}>
              <IconArrowUp aria-hidden size="m" />
            </button>
          </Circle>
          <Circle passive={last}>
            <button
              className="button-reset"
              aria-label={t('ReservationUnitList.buttonDown')}
              type="button"
              disabled={last}
              onClick={() => onMoveDown(reservationUnit)}>
              <IconArrowDown aria-hidden size="m" />
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
  participantCountOptions: OptionType[];
};

type Props = {
  selectedReservationUnits: ReservationUnit[];
  applicationEvent: ApplicationEvent;
  fieldName: string;
  form: ReturnType<typeof useForm>;
  applicationRound: ApplicationRound;
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
  applicationRound,
  options,
}: Props): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const [reservationUnits, setReservationUnits] = useState(
    [] as ReservationUnit[]
  );

  const handleAdd = (ru: ReservationUnit) => {
    setReservationUnits([...reservationUnits, ru]);
  };

  useEffect(() => {
    form.setValue(
      fieldName,
      reservationUnits.map((ru, index) => ({
        reservationUnitId: ru.id,
        priority: index,
      }))
    );
  }, [reservationUnits, fieldName, form]);

  useEffect(() => {
    let isMounted = true; // note this flag denote mount status
    let data;
    const fetchData = async () => {
      if (applicationEvent.eventReservationUnits?.length === 0) {
        data = selectedReservationUnits;
      } else {
        const promises = applicationEvent.eventReservationUnits.map(
          (eventUnit) => getReservationUnit(eventUnit.reservationUnitId)
        );
        data = await Promise.all(promises);
      }
      if (isMounted) {
        setReservationUnits(data);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedReservationUnits, applicationEvent.eventReservationUnits]);

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
      <Notification size="small">
        {t('ReservationUnitList.infoReservationUnits')}
      </Notification>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            key={ru.id}
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
        <Button
          variant="supplementary"
          iconLeft={<IconPlusCircle aria-hidden />}
          onClick={() => setShowModal(true)}>
          {t('ReservationUnitList.add')}
        </Button>
      </ButtonContainer>
      <Modal
        handleClose={() => {
          setShowModal(false);
        }}
        show={showModal}
        closeButtonKey="ReservationUnitModal.returnToApplication">
        <ReservationUnitModal
          currentReservationUnits={reservationUnits}
          applicationRound={applicationRound}
          handleAdd={handleAdd}
          handleRemove={remove}
          options={options}
        />
      </Modal>
    </MainContainer>
  );
};

export default ReservationUnitList;
