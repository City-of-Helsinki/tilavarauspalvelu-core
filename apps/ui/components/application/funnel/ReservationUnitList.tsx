import React, { useRef } from "react";
import {
  Button,
  ButtonPresetTheme,
  ButtonSize,
  ButtonVariant,
  Dialog,
  IconArrowUndo,
  IconPlus,
  Notification,
  NotificationSize,
} from "hds-react";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import { useController } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import type { ApplicationReservationUnitListFragment, OrderedReservationUnitCardFragment } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { Flex } from "common/styled";
import { ErrorText } from "common/src/components/ErrorText";
import { useSearchParams } from "next/navigation";
import { useSearchModify } from "@/hooks/useSearchValues";
import type { OptionsListT } from "common/src/modules/search";
import { FixedDialog } from "@/styled/FixedDialog";
import { OrderedReservationUnitCard } from "./OrderedReservationUnitCard";
import { ReservationUnitModalContent } from "./ReservationUnitModalContent";

type ReservationUnitType = Pick<OrderedReservationUnitCardFragment, "pk">;

export interface ReservationUnitListProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  applicationRound: Readonly<ApplicationReservationUnitListFragment>;
  options: Readonly<OptionsListT>;
  minSize?: number;
  error?: string;
}

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

// selected reservation units are applicationEvent.eventReservationUnits
// available reservation units are applicationRound.reservationUnits
export function ReservationUnitList<T extends FieldValues>({
  name,
  control,
  applicationRound,
  options,
  minSize,
  error,
}: Readonly<ReservationUnitListProps<T>>): JSX.Element {
  const { t } = useTranslation();
  const ref = useRef<HTMLButtonElement>(null);
  const { handleRouteChange } = useSearchModify();
  const searchValues = useSearchParams();

  const { field } = useController({
    name,
    control,
  });
  const { value, onChange } = field;

  const showModal = searchValues.get("modalShown") === name;
  const setShowModal = (show: boolean) => {
    const params = new URLSearchParams(searchValues);
    if (show) {
      params.set("modalShown", name);
    } else {
      params.delete("modalShown");
    }
    handleRouteChange(params);
  };

  const handleAdd = (ru: ReservationUnitType) => {
    if (ru.pk == null) {
      return;
    }
    onChange([...value, ru.pk]);
  };

  const handleRemove = (ru: ReservationUnitType) => {
    onChange(value.filter((pk: T) => Number(pk) !== ru.pk));
  };

  const moveUp = (reservationUnit: ReservationUnitType) => {
    if (reservationUnit.pk == null) {
      return;
    }
    const from = value.indexOf(reservationUnit.pk);
    const to = from - 1;
    onChange(move(value, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnitType) => {
    if (reservationUnit.pk == null) {
      return;
    }
    const from = value.indexOf(reservationUnit.pk);
    const to = from + 1;
    onChange(move(value, from, to));
  };

  // Form only stores pks so turn those into Card Fragments
  const avail = filterNonNullable(applicationRound.reservationUnits);
  const selected: typeof avail = filterNonNullable(value.map((pk: T) => avail.find((ru) => ru.pk === Number(pk))));

  return (
    <Flex>
      <Notification size={NotificationSize.Small} label={t("reservationUnitList:infoReservationUnits")}>
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      {error && <ErrorText data-testid="ReservationUnitList__error">{error}</ErrorText>}
      <Flex $gap="m" $direction="column" aria-live="polite">
        {selected.map((ru, i, all) => (
          <OrderedReservationUnitCard
            key={`reservation-unit_${ru.pk}`}
            error={
              minSize != null && ru.maxPersons != null && minSize > ru.maxPersons
                ? t("application:validation.reservationUnitTooSmall")
                : undefined
            }
            onDelete={handleRemove}
            reservationUnit={ru}
            order={i}
            first={i === 0}
            last={i === all.length - 1}
            onMoveDown={moveDown}
            onMoveUp={moveUp}
            data-testid={`ReservationUnitList__ordered-reservation-unit-card-${ru.pk}`}
          />
        ))}
      </Flex>
      <Flex $alignItems="center">
        <Button
          ref={ref}
          iconStart={<IconPlus />}
          variant={ButtonVariant.Supplementary}
          theme={ButtonPresetTheme.Black}
          size={ButtonSize.Small}
          onClick={() => setShowModal(true)}
        >
          {t("reservationUnitList:add")}
        </Button>
      </Flex>
      <FixedDialog
        id={name}
        isOpen={showModal}
        close={() => setShowModal(false)}
        $fixedHeight
        $maxWidth="xl"
        focusAfterCloseRef={ref}
        scrollable
        closeButtonLabelText={t("common:close")}
        aria-labelledby="modal-header"
      >
        <Dialog.Header id="modal-header" title={t("reservationUnitModal:heading")} />
        <Dialog.Content>
          <ReservationUnitModalContent
            currentReservationUnits={selected}
            applicationRound={applicationRound}
            handleAdd={handleAdd}
            handleRemove={handleRemove}
            options={options}
          />
        </Dialog.Content>
        <Dialog.ActionButtons style={{ justifyContent: "flex-end" }}>
          <Button
            iconStart={<IconArrowUndo />}
            onClick={() => setShowModal(false)}
            variant={ButtonVariant.Supplementary}
          >
            {t("reservationUnitModal:returnToApplication")}
          </Button>
        </Dialog.ActionButtons>
      </FixedDialog>
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
