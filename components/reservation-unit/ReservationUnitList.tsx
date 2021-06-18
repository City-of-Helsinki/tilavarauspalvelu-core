import {
  Button,
  IconPlusCircle,
  Notification as HDSNotification,
} from "hds-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getReservationUnit } from "../../modules/api";
import {
  ApplicationEvent,
  ApplicationRound,
  OptionType,
  ReservationUnit,
} from "../../modules/types";
import Modal from "../common/Modal";
import ReservationUnitModal from "./ReservationUnitModal";
import ReservationUnitCard from "./ReservationUnitCard";

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
  minSize?: number;
};

const MainContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);
`;

const Notification = styled(HDSNotification)`
  --notification-z-index: 0 !important;
`;

const ReservationUnitList = ({
  selectedReservationUnits,
  applicationEvent,
  form,
  fieldName,
  applicationRound,
  options,
  minSize,
}: Props): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const [reservationUnits, setReservationUnits] = useState(
    [] as ReservationUnit[]
  );

  const handleAdd = (ru: ReservationUnit) => {
    setReservationUnits([...reservationUnits, ru]);
  };

  const isValid = (units: ReservationUnit[]) => {
    const error = units
      .map((resUnit) => minSize && resUnit.maxPersons < minSize)
      .find((a) => a);
    return !error;
  };

  useEffect(() => {
    form.setValue(
      fieldName,
      reservationUnits.map((resUnit, index) => {
        return {
          reservationUnitId: resUnit.id,
          priority: index,
          maxPersons: resUnit.maxPersons,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits]);

  useEffect(() => {
    const valid = isValid(reservationUnits);
    if (valid) {
      form.clearErrors([fieldName]);
    } else {
      form.setError(fieldName, { type: "reservationUnitTooSmall" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits, minSize]);

  useEffect(() => {
    let isMounted = true;
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
        setReservationUnits(
          data.filter((ru) =>
            applicationRound.reservationUnitIds.includes(ru.id)
          )
        );
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [
    selectedReservationUnits,
    applicationEvent.eventReservationUnits,
    applicationRound,
  ]);

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
      <Notification
        size="small"
        label={t("reservationUnitList:infoReservationUnits")}
      >
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            key={ru.id}
            invalid={(minSize && ru.maxPersons < minSize) || false}
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
          onClick={() => setShowModal(true)}
        >
          {t("reservationUnitList:add")}
        </Button>
      </ButtonContainer>
      <Modal
        handleClose={() => {
          setShowModal(false);
        }}
        show={showModal}
        closeButtonKey="reservationUnitModal:returnToApplication"
      >
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
