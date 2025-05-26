import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  ButtonVariant,
  IconArrowUndo,
  IconPlus,
  Notification,
  NotificationSize,
} from "hds-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import type {
  ApplicationReservationUnitListFragment,
  OrderedReservationUnitCardFragment,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { filterNonNullable } from "common/src/helpers";
import { Flex } from "common/styled";
import { breakpoints } from "common/src/const";
import { ErrorText } from "common/src/components/ErrorText";
import { Modal } from "@/components/Modal";
import { OrderedReservationUnitCard, ReservationUnitModalContent } from ".";
import { type ApplicationPage1FormValues } from "./form";
import { useSearchParams } from "next/navigation";
import { useSearchModify } from "@/hooks/useSearchValues";

type ReservationUnitType = OrderedReservationUnitCardFragment;
export type OptionType = Readonly<{ value: number; label: string }>;
type OptionListType = Readonly<{ value: number; label: string }[]>;
export type OptionTypes = Readonly<{
  ageGroupOptions?: OptionListType;
  purposeOptions: OptionListType;
  reservationUnitTypeOptions: OptionListType;
  unitOptions: OptionListType;
}>;

type Props = {
  index: number;
  applicationRound: ApplicationReservationUnitListFragment;
  options: OptionTypes;
  minSize?: number;
};

function isValid(
  units: ApplicationReservationUnitListFragment["reservationUnits"],
  minSize: number
) {
  const error = units
    .map(
      (resUnit) =>
        minSize != null &&
        resUnit.maxPersons != null &&
        resUnit.maxPersons < minSize
    )
    .find((a) => a);
  return !error;
}

// selected reservation units are applicationEvent.eventReservationUnits
// available reservation units are applicationRound.reservationUnits
export function ReservationUnitList({
  index,
  applicationRound,
  options,
  minSize,
}: Readonly<Props>): JSX.Element {
  const { t } = useTranslation();

  const { handleRouteChange } = useSearchModify();
  const searchValues = useSearchParams();

  const form = useFormContext<ApplicationPage1FormValues>();
  const { clearErrors, setError, watch, setValue, formState } = form;
  const { errors } = formState;

  const fieldName = `applicationSections.${index}.reservationUnits` as const;

  const reservationUnits = watch(fieldName);
  const setReservationUnits = (units: number[]) => {
    setValue(fieldName, units);
  };

  const showModal = searchValues.get("modalShown") === fieldName;
  const setShowModal = (show: boolean) => {
    const params = new URLSearchParams(searchValues);
    if (show) {
      params.set("modalShown", fieldName);
    } else {
      params.delete("modalShown");
    }
    handleRouteChange(params);
  };

  // TODO these could be prefiltered on the Page level similar to the addition of a new application section
  // but requires a bit different mechanic because forms are separate from the selected resservation units hook that uses session storage
  const avail = filterNonNullable(applicationRound.reservationUnits);
  const currentReservationUnits = filterNonNullable(
    reservationUnits.map((pk) => avail.find((ru) => ru.pk === pk))
  );

  useEffect(() => {
    const valid = isValid(currentReservationUnits, minSize ?? 0);
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
    const i = units[from];
    if (i == null) {
      return units;
    }
    const copy = [...units];
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
        <ErrorText>{t("application:validation.noReservationUnits")}</ErrorText>
      )}
      <Notification
        size={NotificationSize.Small}
        label={t("reservationUnitList:infoReservationUnits")}
      >
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      <Flex $gap="m" $direction="column" aria-live="polite">
        {currentReservationUnits.map((ru, i, all) => (
          <OrderedReservationUnitCard
            key={ru.pk}
            error={
              minSize != null &&
              ru.maxPersons != null &&
              minSize > ru.maxPersons
                ? t("application:validation.reservationUnitTooSmall")
                : undefined
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
      <Flex $alignItems="center">
        <IconButton
          onClick={() => setShowModal(true)}
          icon={<IconPlus />}
          label={t("reservationUnitList:add")}
        />
      </Flex>
      {createPortal(
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
        </Modal>,
        document.body
      )}
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
      ...OrderedReservationUnitCard
      minPersons
      maxPersons
      unit {
        id
        pk
      }
    }
  }
`;
