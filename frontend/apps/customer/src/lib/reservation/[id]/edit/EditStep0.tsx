import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { Button, ButtonVariant, IconArrowRight, IconCross } from "hds-react";
import { useTranslation } from "next-i18next";
import ErrorComponent from "next/error";
import styled from "styled-components";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import { Sanitize } from "ui/src/components/Sanitize";
import { breakpoints } from "ui/src/modules/const";
import { getTranslationSafe } from "ui/src/modules/util";
import { H4 } from "ui/src/styled";
import { getLocalizationLang } from "@ui/modules/helpers";
import { QuickReservation } from "@/components/QuickReservation";
import { ReservationTimePicker, ReservationInfoCard } from "@/components/reservation";
import { useAvailableTimes } from "@/hooks";
import { useBlockingReservations } from "@/hooks/useBlockingReservations";
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { isRangeReservable } from "@/modules/reservable";
import {
  convertFormToFocustimeSlot,
  createDateTime,
  getDurationOptions,
  isReservationEditable,
} from "@/modules/reservation";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { type PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { getReservationPath } from "@/modules/urls";
import { PinkBox as PinkBoxBase } from "@/styled/reservation";
import type { EditPageReservationFragment } from "@gql/gql-types";

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

type EditStep0Props = {
  reservation: EditPageReservationFragment;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  nextStep: () => void;
};

// Non null assertion to simplify types
function EditStep0Wrapped(props: EditStep0Props): JSX.Element {
  const reservationUnit = props.reservation.reservationUnit;
  if (reservationUnit == null) {
    return <ErrorComponent statusCode={404} />;
  }
  return <EditStep0 {...props} reservationUnit={reservationUnit} />;
}

type ReservationUnitT = NonNullable<EditPageReservationFragment["reservationUnit"]>;

function EditStep0({
  reservation,
  reservationForm,
  reservationUnit,
  nextStep,
}: EditStep0Props & {
  reservationUnit: ReservationUnitT;
}): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const activeApplicationRounds = reservationUnit.applicationRounds;
  const originalBegin = new Date(reservation.beginsAt);
  const originalEnd = new Date(reservation.endsAt);

  const { blockingReservations } = useBlockingReservations(reservationUnit.pk, reservation.pk);

  const { watch, handleSubmit, formState } = reservationForm;
  const { dirtyFields } = formState;
  // skip control fields
  const isDirty = dirtyFields.date || dirtyFields.time || dirtyFields.duration;

  const reservableTimes = useReservableTimes(reservationUnit);

  const submitReservation = (data: PendingReservationFormType) => {
    if (reservationUnit == null) {
      throw new Error("No reservation unit found");
    }
    if (!isReservationEditable(reservation)) {
      throw new Error("Reservation is not editable");
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
    const isFree = isReservationUnitFreeOfCharge(reservationUnit.pricings, start);
    if (!isFree) {
      throw new Error("Reservation unit is not free of charge");
    }

    const isNewReservationValid = isRangeReservable({
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

  const durationValue = watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const dateValue = watch("date");
  const timeValue = watch("time");
  const { startingTimeOptions, nextAvailableTime } = useAvailableTimes({
    date: createDateTime(dateValue, timeValue),
    duration: durationValue,
    reservableTimes,
    reservationUnit,
    activeApplicationRounds,
    blockingReservations,
  });

  const durationOptions = getDurationOptions(reservationUnit, t);
  const focusSlot = convertFormToFocustimeSlot({
    data: watch(),
    reservationUnit,
    reservableTimes,
    activeApplicationRounds,
    blockingReservations,
  });

  const lang = getLocalizationLang(i18n.language);
  const notesWhenReserving = getTranslationSafe(reservationUnit, "notesWhenApplying", lang);

  return (
    <>
      <StyledReservationInfoCard reservation={reservation} bgColor="gold" disableImage />
      {/* TODO on mobile in the design this is after the calendar but before action buttons */}
      {notesWhenReserving !== "" && (
        <PinkBox>
          <H4 as="h2" $marginTop="none">
            {t("reservations:reservationInfoBoxHeading")}
          </H4>
          <Sanitize html={notesWhenReserving} />
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
          reservationForm={reservationForm}
          isReservationQuotaReached={false}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
          blockingReservations={blockingReservations}
        />
      </StyledCalendarWrapper>
      <Form noValidate onSubmit={handleSubmit(submitReservation)}>
        <Actions>
          <ButtonLikeLink href={getReservationPath(reservation.pk)} data-testid="reservation-edit__button--cancel">
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

export { EditStep0Wrapped as EditStep0 };

export const EDIT_PAGE_RESERVATION_UNIT_FRAGMENT = gql`
  fragment EditPageReservationUnit on ReservationUnitNode {
    id
    ...IsReservableFields
    pricings {
      ...PricingFields
    }
    ...TermsOfUse
    ...ReservationTimePickerFields
    reservationForm
    applicationRounds(ongoing: true) {
      id
      reservationPeriodBeginDate
      reservationPeriodEndDate
    }
  }
`;

export const EDIT_PAGE_RESERVATION_FRAGMENT = gql`
  fragment EditPageReservation on ReservationNode {
    id
    pk
    beginsAt
    endsAt
    ...CanReservationBeChanged
    ...ReservationInfoCard
    ...ReservationFormFields
    reservationUnit {
      ...EditPageReservationUnit
    }
  }
`;
