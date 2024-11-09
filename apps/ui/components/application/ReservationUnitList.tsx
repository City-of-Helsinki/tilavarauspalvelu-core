import { Button, IconPlusCircle, Notification } from "hds-react";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import type {
  ApplicationQuery,
  ReservationUnitCardFieldsFragment,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { filterNonNullable } from "common/src/helpers";
import Modal from "../common/Modal";
import type { ApplicationFormValues } from "./Form";
import { ReservationUnitCard } from "./reservation-unit-card";
import { Flex } from "common/styles/util";
import { ReservationUnitModalContent } from "./reservation-unit-modal-content";
import { breakpoints } from "common";

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;
type ReservationUnitType = ReservationUnitCardFieldsFragment;

type OptionType =
  | { value: string; label: string }
  | { value: number; label: string };
type OptionTypes = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  index: number;
  applicationRound: AppRoundNode;
  options: OptionTypes;
  minSize?: number;
};

// selected reservation units are applicationEvent.eventReservationUnits
// available reservation units are applicationRound.reservationUnits
export function ReservationUnitList({
  index,
  applicationRound,
  options,
  minSize,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const form = useFormContext<ApplicationFormValues>();
  const { clearErrors, setError, watch, setValue, formState } = form;
  const { errors } = formState;

  const isValid = (units: typeof applicationRound.reservationUnits) => {
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

  const fieldName = `applicationSections.${index}.reservationUnits` as const;

  const reservationUnits = watch(fieldName);
  const setReservationUnits = (units: number[]) => {
    setValue(fieldName, units);
  };

  // TODO these could be prefiltered on the Page level similar to the addition of a new application section
  // but requires a bit different mechanic because forms are separate from the selected resservation units hook that uses session storage
  const avail = filterNonNullable(applicationRound.reservationUnits);
  const currentReservationUnits = filterNonNullable(
    reservationUnits.map((pk) => avail.find((ru) => ru.pk === pk))
  );

  useEffect(() => {
    const valid = isValid(currentReservationUnits);
    if (valid) {
      clearErrors([`applicationSections.${index}.reservationUnits`]);
    } else {
      setError(fieldName, { message: "reservationUnitTooSmall" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits, minSize]);

  const handleAdd = (ru: ReservationUnitType) => {
    if (ru.pk == null) {
      return;
    }
    setReservationUnits([...reservationUnits, ru.pk]);
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
    if (reservationUnit.pk == null) {
      return;
    }
    const from = reservationUnits.indexOf(reservationUnit.pk);
    const to = from - 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnitType) => {
    if (reservationUnit.pk == null) {
      return;
    }
    const from = reservationUnits.indexOf(reservationUnit.pk);
    const to = from + 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  // Only checking for the required error here, other errors are handled in the ReservationUnitCard
  const unitErros = errors.applicationSections?.[index]?.reservationUnits;
  const hasNoUnitsError = unitErros != null && unitErros.message === "Required";

  return (
    <Flex>
      {hasNoUnitsError && (
        <Notification
          type="error"
          label={t("application:error.noReservationUnits")}
          size="small"
        >
          {t("application:error.noReservationUnits")}
        </Notification>
      )}
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
      <IconButton
        onClick={() => setShowModal(true)}
        icon={<IconPlusCircle aria-hidden="true" />}
        label={t("reservationUnitList:add")}
      />
      <Modal
        show={showModal}
        handleClose={() => setShowModal(false)}
        maxWidth={breakpoints.l}
        fullHeight
        actions={
          <Flex $align="flex-end">
            <Button onClick={() => setShowModal(false)}>
              {t("reservationUnitModal:returnToApplication")}
            </Button>
          </Flex>
        }
      >
        <ReservationUnitModalContent
          currentReservationUnits={currentReservationUnits}
          applicationRound={applicationRound}
          handleAdd={handleAdd}
          handleRemove={remove}
          options={options}
        />
      </Modal>
    </Flex>
  );
}
