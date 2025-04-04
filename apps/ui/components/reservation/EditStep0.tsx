import React from "react";
import type {
  BlockingReservationFieldsFragment,
  EditPageReservationFragment,
} from "@gql/gql-types";
import { differenceInMinutes } from "date-fns";
import { Button, ButtonVariant, IconArrowRight, IconCross } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H4 } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  convertFormToFocustimeSlot,
  createDateTime,
  getDurationOptions,
  isReservationEditable,
  isUserAllowedToMoveReservationHere,
} from "@/modules/reservation";
import {
  getPossibleTimesForDay,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import { type UseFormReturn } from "react-hook-form";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import {
  convertLanguageCode,
  fromUIDate,
  getTranslationSafe,
} from "common/src/common/util";
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { ReservationTimePicker } from "./ReservationTimePicker";
import { QuickReservation } from "../reservation-unit/QuickReservation";
import { getNextAvailableTime } from "../reservation-unit/utils";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { Sanitize } from "common/src/components/Sanitize";
import { PinkBox as PinkBoxBase } from "./styles";
import { getReservationPath } from "@/modules/urls";
import { gql } from "@apollo/client";
import ErrorComponent from "next/error";

type Props = {
  reservation: EditPageReservationFragment;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  blockingReservations: readonly BlockingReservationFieldsFragment[];
  nextStep: () => void;
};

const StyledCalendarWrapper = styled.div`
  grid-column: 1 / -1;
  margin-bottom: 0;
  @media (min-width: ${breakpoints.l}) {
    grid-column: span 1;
    grid-row: 2 / span 2;
  }
`;

const Form = styled.form`
  grid-column: 1;
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
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-column-start: unset;
    grid-column-end: -1;
    grid-row: 1;
  }
`;

const StyledQuickReservation = styled(QuickReservation)`
  grid-column: 1 / -1;
  grid-row: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-column-start: unset;
    grid-column-end: -1;
    grid-row: 2;
  }
`;

const PinkBox = styled(PinkBoxBase)`
  grid-column: 1 / -1;
  grid-row: -1;
  @media (min-width: ${breakpoints.l}) {
    grid-column: span 1 / -1;
    grid-row: 3 / -1;
  }
`;

export function EditStep0({
  reservation,
  reservationForm,
  nextStep,
  blockingReservations,
}: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnits[0];
  const activeApplicationRounds = reservationUnit?.applicationRounds ?? [];
  const originalBegin = new Date(reservation.begin);
  const originalEnd = new Date(reservation.end);

  const { watch, handleSubmit, formState } = reservationForm;
  const { dirtyFields } = formState;
  // skip control fields
  const isDirty = dirtyFields.date || dirtyFields.time || dirtyFields.duration;

  const reservableTimes = useReservableTimes(reservationUnit);

  const submitReservation = (data: PendingReservationFormType) => {
    if (reservationUnit == null) {
      throw new Error("No reservation unit found");
    }
    const slot = convertFormToFocustimeSlot({
      data,
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      blockingReservations,
    });
    if (!slot.isReservable) {
      return;
    }
    const { start, end } = slot;
    const isFree = isReservationUnitFreeOfCharge(
      reservationUnit.pricings,
      start
    );

    const isNewReservationValid =
      isReservationEditable(reservation) &&
      isUserAllowedToMoveReservationHere({
        isFree,
        range: { start, end },
        reservableTimes,
        reservationUnit,
        activeApplicationRounds,
        blockingReservations,
      });

    if (isNewReservationValid) {
      nextStep();
    }
  };

  const durationValue =
    watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const dateValue = watch("date");
  const timeValue = watch("time");

  if (reservationUnit == null) {
    return <ErrorComponent statusCode={404} />;
  }

  const focusDate = createDateTime(dateValue, timeValue);
  const durationOptions = getDurationOptions(reservationUnit, t);
  const focusSlot = convertFormToFocustimeSlot({
    data: watch(),
    reservationUnit,
    reservableTimes,
    activeApplicationRounds,
    blockingReservations,
  });
  const startingTimeOptions = getPossibleTimesForDay({
    reservableTimes,
    interval: reservationUnit?.reservationStartInterval,
    date: fromUIDate(watch("date") ?? "") ?? new Date(),
    reservationUnit,
    activeApplicationRounds,
    durationValue,
    blockingReservations,
  });

  const nextAvailableTime = getNextAvailableTime({
    start: focusDate,
    reservableTimes,
    duration: durationValue,
    reservationUnit,
    activeApplicationRounds,
    blockingReservations,
  });

  const lang = convertLanguageCode(i18n.language);
  const termsOfUse = getTranslationSafe(reservationUnit, "termsOfUse", lang);

  return (
    <>
      <StyledReservationInfoCard
        reservation={reservation}
        bgColor="gold"
        disableImage
      />
      {/* TODO on mobile in the design this is after the calendar but before action buttons */}
      {termsOfUse !== "" && (
        <PinkBox>
          <H4 as="h2" $marginTop="none">
            {t("reservations:reservationInfoBoxHeading")}
          </H4>
          <Sanitize html={termsOfUse} />
        </PinkBox>
      )}
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
          reservationUnit={reservationUnit}
          reservableTimes={reservableTimes}
          activeApplicationRounds={activeApplicationRounds}
          reservationForm={reservationForm}
          isReservationQuotaReached={false}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
          blockingReservations={blockingReservations}
        />
      </StyledCalendarWrapper>
      <Form noValidate onSubmit={handleSubmit(submitReservation)}>
        <Actions>
          <ButtonLikeLink
            href={getReservationPath(reservation.pk)}
            data-testid="reservation-edit__button--cancel"
          >
            <IconCross />
            {t("common:stop")}
          </ButtonLikeLink>
          <Button
            type="submit"
            variant={ButtonVariant.Primary}
            iconEnd={<IconArrowRight />}
            disabled={!focusSlot.isReservable || !isDirty}
            data-testid="reservation__button--continue"
          >
            {t("common:next")}
          </Button>
        </Actions>
      </Form>
    </>
  );
}

export const EDIT_PAGE_RESERVATION_UNIT_FRAGMENT = gql`
  fragment EditPageReservationUnit on ReservationUnitNode {
    id
    ...IsReservableFields
    pricings {
      ...PricingFields
    }
    ...TermsOfUse
    ...ReservationTimePickerFields
    ...MetadataSets
    applicationRounds(ongoing: true) {
      id
      reservationPeriodBegin
      reservationPeriodEnd
    }
  }
`;

export const EDIT_PAGE_RESERVATION_FRAGMENT = gql`
  fragment EditPageReservation on ReservationNode {
    id
    pk
    begin
    end
    ...CanReservationBeChanged
    ...ReservationInfoCard
    ...MetaFields
    reservationUnits {
      ...EditPageReservationUnit
    }
  }
`;
