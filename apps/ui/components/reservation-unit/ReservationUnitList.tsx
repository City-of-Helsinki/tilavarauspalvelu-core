import { IconPlusCircle, Notification as HDSNotification } from "hds-react";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { OptionType } from "common/types/common";
import {
  ApplicationEventType,
  ApplicationRoundType,
  ReservationUnitType,
} from "common/types/gql-types";
import { IconButton } from "common/src/components";
import { filterNonNullable } from "common/src/helpers";
import Modal from "../common/Modal";
import ReservationUnitModal from "./ReservationUnitModal";
import ReservationUnitCard from "./ReservationUnitCard";
import { ApplicationFormValues } from "../application/Form";

type OptionTypes = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  index: number;
  applicationRound: ApplicationRoundType;
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

// selected reservation units are applicationEvent.eventReservationUnits
// available reservation units are applicationRound.reservationUnits
const ReservationUnitList = ({
  index,
  applicationRound,
  options,
  minSize,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const form = useFormContext<ApplicationFormValues>();
  const { clearErrors, setError, watch, setValue } = form;

  const isValid = (units: ReservationUnitType[]) => {
    const error = units
      .map(
        (resUnit) =>
          minSize != null &&
          resUnit.maxPersons != null &&
          resUnit.maxPersons < minSize
      )
      .find((a) => a);
    return !error;
  };

  const fieldName = `applicationEvents.${index}.reservationUnits` as const;

  const reservationUnits = watch(fieldName);
  const setReservationUnits = (units: number[]) => {
    setValue(fieldName, units);
  };

  const availableReservationUnits = filterNonNullable(
    applicationRound.reservationUnits
  );
  const currentReservationUnits =
    reservationUnits
      .map((pk) => availableReservationUnits.find((ru) => ru.pk === pk))
      .filter((n): n is ReservationUnitType => n != null) ?? [];

  useEffect(() => {
    const valid = isValid(currentReservationUnits);
    if (valid) {
      clearErrors([`applicationEvents.${index}.reservationUnits`]);
    } else {
      setError(fieldName, { type: "reservationUnitTooSmall" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits, minSize]);

  const handleAdd = (ru: ReservationUnitType) => {
    setReservationUnits([...reservationUnits, ru.pk!]);
  };

  const move = (units: number[], from: number, to: number): number[] => {
    const copy = [...units];
    const i = units[from];
    copy.splice(from, 1);
    copy.splice(to, 0, i);
    return copy;
  };

  const remove = (reservationUnit: ReservationUnitType) => {
    setReservationUnits([
      ...reservationUnits.filter((pk) => pk !== reservationUnit.pk),
    ]);
  };

  const moveUp = (reservationUnit: ReservationUnitType) => {
    const from = reservationUnits.indexOf(reservationUnit.pk!);
    const to = from - 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnitType) => {
    const from = reservationUnits.indexOf(reservationUnit.pk!);
    const to = from + 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  return (
    <MainContainer>
      <Notification
        size="small"
        label={t("reservationUnitList:infoReservationUnits")}
      >
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      {currentReservationUnits.map((ru, i, all) => (
        <ReservationUnitCard
          key={ru.pk}
          invalid={
            minSize != null && ru.maxPersons != null && minSize > ru.maxPersons
          }
          onDelete={remove}
          reservationUnit={ru}
          order={i}
          first={i === 0}
          last={i === all.length - 1}
          onMoveDown={moveDown}
          onMoveUp={moveUp}
        />
      ))}
      <ButtonContainer>
        <IconButton
          onClick={() => setShowModal(true)}
          icon={<IconPlusCircle aria-hidden />}
          label={t("reservationUnitList:add")}
        />
      </ButtonContainer>
      <Modal
        handleClose={() => {
          setShowModal(false);
        }}
        show={showModal}
        closeButtonKey="reservationUnitModal:returnToApplication"
      >
        <ReservationUnitModal
          currentReservationUnits={currentReservationUnits}
          applicationRound={applicationRound}
          handleAdd={handleAdd}
          handleRemove={remove}
          options={options}
        />
      </Modal>
    </MainContainer>
  );
};

export { ReservationUnitList };
