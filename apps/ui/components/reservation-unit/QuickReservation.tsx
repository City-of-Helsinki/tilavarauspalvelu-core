import React, { useCallback, useMemo } from "react";
import type { OptionType } from "common/types/common";
import { IconAngleDown } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { chunkArray, toUIDate } from "common/src/common/util";
import { fontBold, fontMedium, H4 } from "common/src/common/typography";
import type { ReservationUnitType } from "common/types/gql-types";
import { breakpoints } from "common";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import Carousel from "../Carousel";
import { getLastPossibleReservationDate } from "@/components/reservation-unit/utils";
import type { FocusTimeSlot } from "@/components/calendar/ReservationCalendarControls";
import type { SubmitHandler, UseFormReturn } from "react-hook-form";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";
import ControlledDateInput from "@/components/common/ControlledDateInput";
import ControlledSelect from "@/components/common/ControlledSelect";

export type TimeRange = {
  start: Date;
  end: Date;
};

type Props = {
  reservationUnit: ReservationUnitType | null;
  calendarRef: React.RefObject<HTMLDivElement>;
  subventionSuffix: JSX.Element | undefined;
  reservationForm: UseFormReturn<{
    duration?: number;
    date?: string;
    time?: string;
  }>;
  durationOptions: OptionType[];
  startingTimeOptions: string[];
  focusSlot: FocusTimeSlot | null;
  nextAvailableTime: Date | null;
  submitReservation: SubmitHandler<PendingReservationFormType>;
  LoginAndSubmit: JSX.Element;
};

const timeItems = 24;

const Wrapper = styled.form`
  background-color: var(--color-gold-light);
  margin-bottom: var(--spacing-l);
  padding: var(--spacing-m);
  max-width: 400px;
`;

const Heading = styled(H4).attrs({ as: "h3" })`
  margin: var(--spacing-3-xs) 0 var(--spacing-l) 0;
`;

const Price = styled.div`
  & > * {
    display: inline-block;
  }
  padding-bottom: var(--spacing-m);
  height: var(--spacing-m);
  &:empty {
    display: none;
  }
`;

const Selects = styled.div`
  & > *:first-child {
    grid-column: 1/-1;
  }

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-l);

  label {
    white-space: nowrap;
    ${fontMedium};
  }

  @media (min-width: ${breakpoints.s}) {
    & > *:first-child {
      grid-column: unset;
    }

    grid-template-columns: 1fr 1fr;
  }
`;

const PriceValue = styled.div`
  ${fontBold}
`;

const Subheading = styled.div`
  font-size: var(--fontsize-heading-xs);
`;

const Times = styled.div`
  margin: var(--spacing-s) 0 var(--spacing-m);
`;

const Slots = styled.div``;

const SlotGroup = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 50px);
  gap: var(--spacing-s) var(--spacing-2-xs);
  justify-content: center;

  @media (min-width: ${breakpoints.s}) {
    gap: var(--spacing-s) var(--spacing-s);
  }
`;

const Slot = styled.li<{ $active: boolean }>`
  box-sizing: border-box;
  background-color: var(--color-white);
  font-size: var(--fontsize-body-s);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border-width: 2px;
  border-style: solid;
  border-color: ${({ $active }) =>
    $active ? "var(--color-black-80)" : "var(--color-white)"};
`;

const SlotButton = styled.button`
  background-color: transparent;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  user-select: none;
`;

const StyledSelect = styled(ControlledSelect)`
  li[role="option"] {
    white-space: nowrap;
  }

  #quick-reservation-duration-toggle-button {
    position: relative;

    > span {
      position: absolute;
      white-space: nowrap;
    }
  }
`;

const NoTimes = styled.div`
  button {
    color: var(--color-bus) !important;
    ${fontMedium};
    appearance: none;
    border: none;
    background-color: transparent;
  }

  display: flex;
  justify-content: space-between;
  gap: var(--spacing-m);
`;

const CalendarLink = styled.a`
  display: flex;
  margin-top: var(--spacing-xs);
  grid-column: 1/-1;
  align-items: center;
  justify-self: flex-end;
  color: var(--color-bus) !important;
  ${fontMedium};
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const QuickReservation = ({
  reservationUnit,
  subventionSuffix,
  calendarRef,
  reservationForm,
  focusSlot,
  durationOptions,
  startingTimeOptions,
  nextAvailableTime,
  submitReservation,
  LoginAndSubmit,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const { setValue, watch, handleSubmit } = reservationForm;
  const formDate = watch("date");
  const dateValue = useMemo(() => new Date(formDate ?? ""), [formDate]);
  const duration =
    watch("duration") ?? reservationUnit?.minReservationDuration ?? 0;

  const getPrice = useCallback(
    (asNumeral = false) => {
      if (reservationUnit == null || dateValue == null || duration == null) {
        return null;
      }
      return getReservationUnitPrice({
        reservationUnit,
        pricingDate: dateValue,
        minutes: duration,
        trailingZeros: true,
        asNumeral,
      });
    },
    [duration, reservationUnit, dateValue]
  );

  // A map of all available times for the day, chunked into groups of 8
  const timeChunks: string[][] = useMemo(() => {
    const itemsPerChunk = 8;

    return chunkArray(
      startingTimeOptions.map((opt) => (opt ? opt.toString() : "")),
      itemsPerChunk
    ).slice(0, timeItems / itemsPerChunk);
  }, [startingTimeOptions]);
  // Find out which slide has the slot that reflects the selected focusSlot
  let activeChunk = 0;
  for (let i = 0; i < timeChunks.length; i++) {
    if (
      timeChunks[i].some((item) => {
        return item === watch("time");
      })
    ) {
      activeChunk = i;
    }
  }

  const lastPossibleDate = getLastPossibleReservationDate(
    reservationUnit ?? undefined
  );
  return (
    <Wrapper
      id="quick-reservation"
      noValidate
      onSubmit={handleSubmit(submitReservation)}
    >
      <Heading>{t("reservationCalendar:quickReservation.heading")}</Heading>
      <Selects>
        <ControlledDateInput
          id="quick-reservation-date"
          name="date"
          control={reservationForm.control}
          label={t("reservationCalendar:startDate")}
          initialMonth={dateValue ?? new Date()}
          minDate={new Date()}
          maxDate={lastPossibleDate ?? undefined}
          disableConfirmation={false}
        />
        <StyledSelect
          name="duration"
          control={reservationForm.control}
          label={t("reservationCalendar:duration")}
          options={durationOptions}
        />
      </Selects>
      <Price data-testid="quick-reservation-price">
        {focusSlot?.isReservable && (
          <>
            {t("reservationUnit:price")}: <PriceValue>{getPrice()}</PriceValue>
            {getPrice(true) !== "0" && subventionSuffix}
          </>
        )}
      </Price>

      <Subheading>
        {t("reservationCalendar:quickReservation.subheading")}
      </Subheading>
      <Times>
        {startingTimeOptions.length > 0 ? (
          <Slots>
            <Carousel
              hideCenterControls
              wrapAround={false}
              slideIndex={activeChunk}
            >
              {timeChunks.map((chunk: string[], index: number) => (
                <SlotGroup key={chunk[0]}>
                  {chunk.map((value: string) => (
                    <Slot $active={watch("time") === value} key={value}>
                      <SlotButton
                        data-testid="quick-reservation-slot"
                        onClick={() => setValue("time", value)}
                        type="button"
                      >
                        {value}
                      </SlotButton>
                    </Slot>
                  ))}
                  {startingTimeOptions.length > timeItems &&
                    index + 1 === timeChunks.length && (
                      <CalendarLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          window.scroll({
                            top: calendarRef?.current?.parentElement?.offsetTop,
                            left: 0,
                            behavior: "smooth",
                          });

                          return false;
                        }}
                      >
                        {t("reservationCalendar:quickReservation.gotoCalendar")}
                        <IconAngleDown />
                      </CalendarLink>
                    )}
                </SlotGroup>
              ))}
            </Carousel>
          </Slots>
        ) : (
          <NoTimes>
            <span>{t("reservationCalendar:quickReservation.noTimes")}</span>
            {nextAvailableTime != null && (
              <span>
                <button
                  data-testid="quick-reservation-next-available-time"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setValue("date", toUIDate(nextAvailableTime));
                  }}
                >
                  {t("reservationCalendar:quickReservation.nextAvailableTime")}
                </button>
              </span>
            )}
          </NoTimes>
        )}
      </Times>
      <ActionWrapper>{LoginAndSubmit}</ActionWrapper>
    </Wrapper>
  );
};

export default QuickReservation;
