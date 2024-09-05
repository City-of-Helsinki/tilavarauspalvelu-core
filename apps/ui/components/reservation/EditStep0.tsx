import { breakpoints } from "common/src/common/style";
import type { PendingReservation } from "@/modules/types";
import type {
  ApplicationRoundFieldsFragment,
  ReservationQuery,
  ReservationUnitPageQuery,
} from "@gql/gql-types";
import { addMinutes, differenceInMinutes } from "date-fns";
import { Button, IconArrowRight, IconCross } from "hds-react";
import React, { useCallback } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { filterNonNullable } from "common/src/helpers";
import { canReservationTimeBeChanged } from "@/modules/reservation";
import { isRangeReservable } from "@/modules/reservable";
import {
  getPossibleTimesForDay,
  getReservationUnitPrice,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import { CalendarWrapper } from "../reservation-unit/ReservationUnitStyles";
import { type UseFormReturn } from "react-hook-form";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { fromUIDate, isValidDate } from "common/src/common/util";
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { ReservationTimePicker } from "./ReservationTimePicker";

type ReservationUnitNodeT = NonNullable<
  ReservationUnitPageQuery["reservationUnit"]
>;
type ReservationNodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  activeApplicationRounds: ApplicationRoundFieldsFragment[];
  nextStep: () => void;
  apiBaseUrl: string;
  isLoading: boolean;
};

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
  }
`;

/// To check availability for the reservation.
/// The check functions use the reservationUnit instead of a list of other reservations
/// so have to do some questionable edits.
function getWithoutThisReservation(
  reservationUnit: ReservationUnitNodeT,
  reservation: ReservationNodeT
): ReservationUnitNodeT {
  const otherReservations = filterNonNullable(
    reservationUnit?.reservationSet?.filter((n) => n?.pk !== reservation.pk)
  );
  return {
    ...reservationUnit,
    reservationSet: otherReservations,
  };
}

function calculateFocusSlot(
  date: string,
  timeValue: string,
  durationMinutes: number
): {
  start: Date;
  end: Date;
  durationMinutes: number;
} {
  if (!timeValue) {
    throw new Error("Invalid time value");
  }
  const [hours, minutes] = timeValue
    .split(":")
    .map(Number)
    .filter(Number.isFinite);
  if (hours == null || minutes == null) {
    throw new Error("Invalid time value");
  }
  const start = fromUIDate(date) ?? new Date();
  if (!isValidDate(start)) {
    throw new Error("Invalid date value");
  }
  start.setHours(hours, minutes, 0, 0);
  const end = addMinutes(start, durationMinutes);

  return {
    start,
    end,
    durationMinutes,
  };
}

export function EditStep0({
  reservation,
  reservationUnit,
  activeApplicationRounds,
  reservationForm,
  nextStep,
  isLoading,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const originalBegin = new Date(reservation.begin);
  const originalEnd = new Date(reservation.end);

  const { watch, handleSubmit, formState } = reservationForm;
  const { isDirty } = formState;

  const reservableTimes = useReservableTimes(reservationUnit);

  const isSlotAvailable = useCallback(
    (start: Date, end: Date): boolean => {
      const resUnit = getWithoutThisReservation(reservationUnit, reservation);
      return isRangeReservable({
        range: {
          start,
          end,
        },
        reservationUnit: resUnit,
        reservableTimes,
        activeApplicationRounds,
      });
    },
    [reservationUnit, reservableTimes, reservation, activeApplicationRounds]
  );

  const duration =
    watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const startingTimeOptions = getPossibleTimesForDay({
    reservableTimes,
    interval: reservationUnit?.reservationStartInterval,
    date: fromUIDate(watch("date") ?? "") ?? new Date(),
    reservationUnit,
    activeApplicationRounds,
    durationValue: duration,
  });

  const focusSlot = calculateFocusSlot(
    watch("date") ?? "",
    watch("time") ?? "",
    duration
  );
  const isReservable = isSlotAvailable(focusSlot.start, focusSlot.end);

  // TODO submit should be completely unnecessary
  // just disable nextStep button if the form is invalid
  // the form isn't submitted from this step at all
  const submitReservation = (_data: PendingReservationFormType) => {
    if (!focusSlot?.start || !focusSlot?.end) {
      return;
    }
    const { start } = focusSlot;
    const isFree = isReservationUnitFreeOfCharge(
      reservationUnit.pricings,
      start
    );
    const newReservation: PendingReservation = {
      begin: focusSlot.start.toISOString(),
      end: focusSlot.end.toISOString(),
      price: isFree
        ? "0"
        : (getReservationUnitPrice({
            reservationUnit,
            pricingDate: focusSlot.start,
            minutes: 0,
          }) ?? undefined),
    };

    const resUnit = getWithoutThisReservation(reservationUnit, reservation);

    const isNewReservationValid = canReservationTimeBeChanged({
      reservation,
      newReservation,
      reservableTimes,
      reservationUnit: resUnit,
      activeApplicationRounds,
    });

    if (isNewReservationValid) {
      nextStep();
    }
  };

  return (
    <>
      <CalendarWrapper>
        <ReservationTimePicker
          reservationUnit={reservationUnit}
          reservableTimes={reservableTimes}
          activeApplicationRounds={activeApplicationRounds}
          reservationForm={reservationForm}
          isReservationQuotaReached={false}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
        />
      </CalendarWrapper>
      <form noValidate onSubmit={handleSubmit(submitReservation)}>
        <Actions>
          <ButtonLikeLink
            href={`/reservations/${reservation.pk}`}
            data-testid="reservation-edit__button--cancel"
          >
            <IconCross aria-hidden />
            {t("reservations:cancelEditReservationTime")}
          </ButtonLikeLink>
          <Button
            variant="primary"
            size="small"
            iconRight={<IconArrowRight aria-hidden />}
            disabled={!isReservable || !isDirty}
            type="submit"
            data-testid="reservation-edit__button--continue"
            isLoading={isLoading}
            loadingText={t("reservationCalendar:nextStepLoading")}
          >
            {t("reservationCalendar:nextStep")}
          </Button>
        </Actions>
      </form>
    </>
  );
}
