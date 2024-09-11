import { breakpoints } from "common/src/common/style";
import type { PendingReservation } from "@/modules/types";
import type {
  ApplicationRoundFieldsFragment,
  ReservationQuery,
  ReservationUnitPageQuery,
} from "@gql/gql-types";
import { differenceInMinutes } from "date-fns";
import { Button, IconArrowRight, IconCross } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { filterNonNullable } from "common/src/helpers";
import {
  canReservationTimeBeChanged,
  convertFormToFocustimeSlot,
  createDateTime,
  getDurationOptions,
} from "@/modules/reservation";
import {
  getPossibleTimesForDay,
  getReservationUnitPrice,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import { CalendarWrapper } from "../reservation-unit/ReservationUnitStyles";
import { type UseFormReturn } from "react-hook-form";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { fromUIDate } from "common/src/common/util";
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { ReservationTimePicker } from "./ReservationTimePicker";
import { QuickReservation } from "../reservation-unit/QuickReservation";
import { getNextAvailableTime } from "../reservation-unit/utils";
import { ReservationInfoCard } from "./ReservationInfoCard";

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

const StyledCalendarWrapper = styled(CalendarWrapper)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 3;
    grid-column: 1 / -2;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
  }
`;

const StyledReservationInfoCard = styled(ReservationInfoCard)`
  grid-column: 1 / -1;
  grid-row: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-column-start: unset;
    grid-column-end: -1;
    grid-row: 2;
  }
`;
const StyledQuickReservation = styled(QuickReservation)`
  grid-column: 1 / -1;
  grid-row: 4;
  @media (min-width: ${breakpoints.m}) {
    grid-column-start: unset;
    grid-column-end: -1;
    grid-row: 3 / -1;
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

  const resUnit = getWithoutThisReservation(reservationUnit, reservation);

  const submitReservation = (data: PendingReservationFormType) => {
    const slot = convertFormToFocustimeSlot({
      data,
      reservationUnit: resUnit,
      reservableTimes,
      activeApplicationRounds,
    });
    if (!slot.isReservable) {
      return;
    }
    const { start, end } = slot;
    const isFree = isReservationUnitFreeOfCharge(
      reservationUnit.pricings,
      start
    );
    const newReservation: PendingReservation = {
      begin: start.toISOString(),
      end: end.toISOString(),
      price: isFree
        ? "0"
        : (getReservationUnitPrice({
            reservationUnit,
            pricingDate: start,
            minutes: 0,
          }) ?? undefined),
    };

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

  const durationValue =
    watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const dateValue = watch("date");
  const timeValue = watch("time");

  const focusDate = createDateTime(dateValue, timeValue);
  const durationOptions = getDurationOptions(reservationUnit, t);
  const focusSlot = convertFormToFocustimeSlot({
    data: watch(),
    reservationUnit: resUnit,
    reservableTimes,
    activeApplicationRounds,
  });
  const startingTimeOptions = getPossibleTimesForDay({
    reservableTimes,
    interval: reservationUnit?.reservationStartInterval,
    date: fromUIDate(watch("date") ?? "") ?? new Date(),
    reservationUnit: resUnit,
    activeApplicationRounds,
    durationValue,
  });

  const nextAvailableTime = getNextAvailableTime({
    start: focusDate,
    reservableTimes,
    duration: durationValue,
    reservationUnit: resUnit,
    activeApplicationRounds,
  });

  return (
    <>
      <StyledReservationInfoCard
        reservation={reservation}
        type="confirmed"
        disableImage
      />
      <StyledQuickReservation
        reservationUnit={reservationUnit}
        reservationForm={reservationForm}
        durationOptions={durationOptions}
        startingTimeOptions={startingTimeOptions}
        nextAvailableTime={nextAvailableTime}
        focusSlot={focusSlot}
        submitReservation={submitReservation}
        // edit page has different submit button (and no login)
        LoginAndSubmit={<div />}
        // no subvention possibility
        // if it is subventioned -> it requires handling -> can't be edited
        subventionSuffix={undefined}
      />
      <StyledCalendarWrapper>
        <ReservationTimePicker
          reservationUnit={resUnit}
          reservableTimes={reservableTimes}
          activeApplicationRounds={activeApplicationRounds}
          reservationForm={reservationForm}
          isReservationQuotaReached={false}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
        />
      </StyledCalendarWrapper>
      <form
        noValidate
        onSubmit={handleSubmit(submitReservation)}
        style={{
          gridColumn: "1 / -2",
        }}
      >
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
            iconRight={<IconArrowRight aria-hidden />}
            disabled={!focusSlot.isReservable || !isDirty}
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
