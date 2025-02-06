import {
  Button,
  ButtonVariant,
  IconArrowUndo,
  IconPlus,
  Notification,
  NotificationSize,
} from "hds-react";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import type {
  ApplicationReservationUnitListFragment,
  ReservationUnitCardFieldsFragment,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { filterNonNullable } from "common/src/helpers";
import Modal from "../common/Modal";
import { type ApplicationPage1FormValues } from "./form";
import { OrderedReservationUnitCard } from "./OrderedReservationUnitCard";
import { Flex } from "common/styles/util";
import { ReservationUnitModalContent } from "./ReservationUnitModalContent";
import { breakpoints } from "common";
import { gql } from "@apollo/client";
import ClientOnly from "common/src/ClientOnly";

type ReservationUnitType = ReservationUnitCardFieldsFragment;
export type OptionType = { value: number; label: string };
export type OptionTypes = {
  ageGroupOptions?: OptionType[];
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  index: number;
  applicationRound: ApplicationReservationUnitListFragment;
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

  const form = useFormContext<ApplicationPage1FormValues>();
  const { clearErrors, setError, watch, setValue, formState } = form;
  const { errors } = formState;

  const isValid = (
    units: ApplicationReservationUnitListFragment["reservationUnits"]
  ) => {
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
      clearErrors([fieldName]);
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
  const unitErrors = errors.applicationSections?.[index]?.reservationUnits;
  const hasNoUnitsError =
    unitErrors != null && unitErrors.message === "Required";

  return (
    <Flex>
      {hasNoUnitsError && (
        <Notification
          type="error"
          label={t("application:error.noReservationUnits")}
          size={NotificationSize.Small}
        >
          {t("application:error.noReservationUnits")}
        </Notification>
      )}
      <Notification
        size={NotificationSize.Small}
        label={t("reservationUnitList:infoReservationUnits")}
      >
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      <ClientOnly>
        <Flex $gap="m" $direction="column">
          {currentReservationUnits.map((ru, i, all) => (
            <OrderedReservationUnitCard
              key={ru.pk}
              invalid={
                minSize != null &&
                ru.maxPersons != null &&
                minSize > ru.maxPersons
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
        </Flex>
      </ClientOnly>
      <Flex $alignItems="center">
        <IconButton
          onClick={() => setShowModal(true)}
          icon={<IconPlus />}
          label={t("reservationUnitList:add")}
        />
      </Flex>
      <Modal
        show={showModal}
        handleClose={() => setShowModal(false)}
        maxWidth={breakpoints.l}
        fullHeight
        actions={
          <Flex $alignItems="center">
            <Button
              iconStart={<IconArrowUndo />}
              onClick={() => setShowModal(false)}
              variant={ButtonVariant.Supplementary}
            >
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

export const APPLICATION_RESERVATION_UNIT_LIST_FRAGMENT = gql`
  fragment ApplicationReservationUnitList on ApplicationRoundNode {
    id
    pk
    nameFi
    nameSv
    nameEn
    reservationUnits {
      id
      pk
      nameFi
      nameSv
      nameEn
      minPersons
      maxPersons
      images {
        ...Image
      }
      unit {
        id
        pk
        nameFi
        nameSv
        nameEn
      }
    }
  }
`;
