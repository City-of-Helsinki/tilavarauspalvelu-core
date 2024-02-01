import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { OptionType, PendingReservation } from "common/types/common";
import {
  addDays,
  addHours,
  addMinutes,
  differenceInMinutes,
  isAfter,
  isBefore,
  isValid,
} from "date-fns";
import { DateInput, IconAngleDown, Select } from "hds-react";
import { padStart } from "lodash";
import { useTranslation } from "next-i18next";
import { useLocalStorage } from "react-use";
import styled from "styled-components";
import { chunkArray, toUIDate } from "common/src/common/util";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import { fontBold, fontMedium, H4 } from "common/src/common/typography";
import type { ReservationUnitType } from "common/types/gql-types";
import { breakpoints } from "common";
import { type ReservationProps } from "@/context/DataContext";
import { getDurationOptions } from "@/modules/reservation";
import {
  getPossibleTimesForDay,
  getReservationUnitPrice,
  isInTimeSpan,
} from "@/modules/reservationUnit";
import { formatDate, getPostLoginUrl } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import Carousel from "../Carousel";
import LoginFragment from "../LoginFragment";

export type QuickReservationSlotProps = {
  start: Date;
  end: Date;
};

type Props = {
  isReservationUnitReservable: boolean;
  createReservation: (arg: ReservationProps) => void;
  shouldUnselect: number;
  setInitialReservation: React.Dispatch<
    React.SetStateAction<PendingReservation | null>
  >;
  quickReservationSlot: QuickReservationSlotProps | null;
  setQuickReservationSlot: React.Dispatch<
    React.SetStateAction<QuickReservationSlotProps | null>
  >;
  reservationUnit: ReservationUnitType | null;
  isSlotReservable: (arg1: Date, arg2: Date, arg3?: boolean) => boolean;
  setErrorMsg: (arg: string) => void;
  calendarRef: React.RefObject<HTMLDivElement>;
  subventionSuffix?: (arg: string) => JSX.Element;
  apiBaseUrl: string;
};

const timeItems = 24;

const Wrapper = styled.div`
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

const StyledCarousel = styled(Carousel)`
  .slider-control-centerleft,
  .slider-control-centerright {
    top: 36px !important;
  }

  .slider-list {
    &:focus-visible {
      outline: none;
    }

    cursor: default !important;
  }
`;

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

const StyledSelect = styled(Select<OptionType>)`
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
  a {
    color: var(--color-bus) !important;
    ${fontMedium};
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

function pickMaybeDay(
  a: Date | undefined,
  b: Date | undefined,
  compF: (a: Date, b: Date) => boolean
): Date | undefined {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return compF(a, b) ? a : b;
}
// Returns a Date object with the first day of the given array of Dates
function dayMin(days: Array<Date | undefined>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isBefore);
  }, undefined);
}
function dayMax(days: Array<Date | undefined>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isAfter);
  }, undefined);
}

// Returns the last possible reservation date for the given reservation unit
function getLastPossibleReservationDate(
  reservationUnit?: ReservationUnitType
): Date | null {
  if (!reservationUnit) {
    return null;
  }
  const { reservationsMaxDaysBefore, reservableTimeSpans, reservationEnds } =
    reservationUnit;
  if (!reservableTimeSpans?.length) {
    return null;
  }

  const lastPossibleReservationDate =
    reservationsMaxDaysBefore != null && reservationsMaxDaysBefore > 0
      ? addDays(new Date(), reservationsMaxDaysBefore)
      : undefined;
  const reservationUnitNotReservable = reservationEnds
    ? new Date(reservationEnds)
    : undefined;
  const endDateTime = reservableTimeSpans.at(-1)?.endDatetime ?? undefined;
  const lastOpeningDate = endDateTime ? new Date(endDateTime) : new Date();
  return (
    dayMin([
      reservationUnitNotReservable,
      lastPossibleReservationDate,
      lastOpeningDate,
    ]) ?? null
  );
}

type AvailableTimesProps = {
  day: Date;
  duration: string;
  isSlotReservable: (start: Date, end: Date) => boolean;
  fromStartOfDay?: boolean;
  reservationUnit?: ReservationUnitType;
};

// Returns an array of available times for the given duration and day
// TODO this is really slow (especially if called from a loop)
function getAvailableTimesForDay({
  day,
  duration,
  isSlotReservable,
  reservationUnit,
}: AvailableTimesProps): string[] {
  if (reservationUnit == null) return [];
  const [durationHours, durationMinutes] =
    duration?.split(":").map(Number) || [];
  const [timeHours, timeMinutesRaw] = [0, 0];

  const timeMinutes = timeMinutesRaw > 59 ? 59 : timeMinutesRaw;
  const { reservableTimeSpans: spans, reservationStartInterval: interval } =
    reservationUnit;
  return getPossibleTimesForDay(spans, interval, day)
    .map((n) => {
      const [slotHours, slotMinutes] = n.split(":").map(Number);
      const start = new Date(day);
      start.setHours(slotHours, slotMinutes, 0, 0);
      const end = addMinutes(addHours(start, durationHours), durationMinutes);
      const startTime = new Date(day);
      startTime.setHours(timeHours, timeMinutes, 0, 0);

      return isSlotReservable(start, end) && !isBefore(start, startTime)
        ? n
        : null;
    })
    .filter((n): n is NonNullable<typeof n> => n != null);
}

// Returns the next available time, after the given time (Date object)
const getNextAvailableTime = (props: AvailableTimesProps): Date | null => {
  const { day: after, reservationUnit } = props;
  if (reservationUnit == null) {
    return null;
  }
  const {
    reservableTimeSpans,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
  } = reservationUnit;

  const today = addDays(new Date(), reservationsMinDaysBefore ?? 0);
  const possibleEndDay = getLastPossibleReservationDate(reservationUnit);
  const endDay = possibleEndDay ? addDays(possibleEndDay, 1) : undefined;
  const minDay = dayMax([today, after]) ?? today;

  // Find the first possible day
  const interval = filterNonNullable(reservableTimeSpans).find((x) =>
    isInTimeSpan(minDay, x)
  );
  if (!interval?.startDatetime || !interval.endDatetime) {
    return null;
  }
  if (endDay && endDay < new Date(interval.endDatetime) && endDay < minDay) {
    return null;
  }

  const startDay = dayMax([new Date(interval.startDatetime), minDay]) ?? minDay;
  const daysToGenerate = reservationsMaxDaysBefore ?? 180;
  const days = Array.from({ length: daysToGenerate }, (_, i) =>
    addDays(startDay, i)
  );

  // Find the first possible time for that day, continue for each day until we find one
  for (const day of days) {
    const availableTimesForDay = getAvailableTimesForDay({
      ...props,
      day,
      fromStartOfDay: true,
      reservationUnit,
    });
    if (availableTimesForDay.length > 0) {
      const [hours, minutes] = availableTimesForDay[0].split(":").map(Number);
      day.setHours(hours, minutes, 0, 0);
      return day;
    }
  }

  return null;
};

const QuickReservation = ({
  isSlotReservable,
  isReservationUnitReservable,
  createReservation,
  reservationUnit,
  setErrorMsg,
  subventionSuffix,
  shouldUnselect,
  setInitialReservation,
  quickReservationSlot,
  calendarRef,
  setQuickReservationSlot,
  apiBaseUrl,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const {
    minReservationDuration,
    maxReservationDuration,
    reservationStartInterval,
  } = reservationUnit || {};

  const durationOptions = useMemo(() => {
    if (
      minReservationDuration == null ||
      maxReservationDuration == null ||
      reservationStartInterval == null
    ) {
      return [];
    }
    return getDurationOptions(
      minReservationDuration ?? undefined,
      maxReservationDuration ?? undefined,
      reservationStartInterval,
      t
    );
  }, [
    minReservationDuration,
    maxReservationDuration,
    reservationStartInterval,
    t,
  ]);

  // TODO this should be on a timer
  const nextHour: Date = useMemo(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    now.setHours(now.getHours() + 1);
    return now;
  }, []);

  const [localReservation, setLocalReservation] =
    useState<ReservationProps | null>(null);
  const [date, setDate] = useState(() => {
    const result = new Date();
    result.setHours(0, 0, 0, 0);
    return result;
  });
  const [time, setTime] = useState<string>(
    formatDate(nextHour.toISOString(), "HH:mm")
  );
  const [duration, setDuration] = useState<OptionType | undefined>(
    durationOptions.find((n) => n.value === "1:00") ?? durationOptions[0]
  );
  const [slot, setSlot] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  const getPrice = useCallback(
    (asInt = false) => {
      const [hours, minutes] =
        duration?.value?.toString().split(":").map(Number) || [];
      if (
        reservationUnit == null ||
        date == null ||
        hours == null ||
        minutes == null
      ) {
        return null;
      }
      const length = hours * 60 + minutes;
      return getReservationUnitPrice({
        reservationUnit,
        pricingDate: date,
        minutes: length,
        trailingZeros: true,
        asInt,
      });
    },
    [duration?.value, reservationUnit, date]
  );

  // Store the reservation in local storage
  const [storedReservation, setStoredReservation, removeStoredReservation] =
    useLocalStorage<ReservationProps | null>("reservation");

  // If a stored reservation is found, set the according values and activate the slot
  useEffect(() => {
    if (storedReservation?.begin && storedReservation?.end) {
      const { begin, end } = storedReservation;
      setLocalReservation(storedReservation);
      const newDate = new Date(begin);
      newDate.setHours(0, 0, 0, 0);
      setDate(newDate);
      setTime(formatDate(storedReservation.begin, "HH:mm"));
      const newDuration = differenceInMinutes(new Date(end), new Date(begin));
      const durationHours = Math.floor(newDuration / 60);
      const durationMinutes = newDuration % 60;
      setDuration(
        durationOptions.find(
          (n) =>
            n.value ===
            `${durationHours}:${padStart(durationMinutes.toString(), 2, "0")}`
        )
      );
      setSlot(formatDate(begin, "HH:mm"));

      if (!isSlotReservable(new Date(begin), new Date(end))) {
        setErrorMsg(t("reservationUnit.reservationNotPossible"));
      }

      removeStoredReservation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the user selects a slot, set local reservation and quick reservation slot
  useEffect(() => {
    if (date && duration?.value && slot) {
      const [durationHours, durationMinutes] =
        duration?.value.toString().split(":").map(Number) || [];
      const [slotHours, slotMinutes] = slot.split(":").map(Number);
      const begin = new Date(date);
      begin.setHours(slotHours, slotMinutes, 0, 0);
      const end = addMinutes(addHours(begin, durationHours), durationMinutes);
      const res: ReservationProps = {
        begin: begin.toISOString(),
        end: end.toISOString(),
        price: null,
        reservationUnitPk: reservationUnit?.pk ?? null,
      };
      setLocalReservation(res);
      setQuickReservationSlot({ start: begin, end });
    }
    if (!slot && quickReservationSlot) {
      setLocalReservation(null);
      setQuickReservationSlot(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, duration, slot, reservationUnit?.pk, setQuickReservationSlot]);

  // If the parent component unselects the slot, unselect it here as well
  useEffect(() => {
    if (shouldUnselect) setSlot(null);
  }, [shouldUnselect]);

  // A map of all available times for the day, chunked into groups of 8
  const timeChunks: string[][] = useMemo(() => {
    const itemsPerChunk = 8;
    const availableTimesForDay = getAvailableTimesForDay({
      day: date,
      duration: duration?.value?.toString() ?? "00:00",
      isSlotReservable,
      reservationUnit: reservationUnit ?? undefined,
    });

    return chunkArray(availableTimesForDay, itemsPerChunk).slice(
      0,
      timeItems / itemsPerChunk
    );
  }, [date, reservationUnit, duration, isSlotReservable]);

  // NOTE useMemo has the same overhead as calling these multiple times during initial render
  // might be faster when user is interacting with the page because
  // a user action -> triggers render 6 times

  // the next available time after the selected time
  const nextAvailableTime = useMemo(
    () =>
      getNextAvailableTime({
        day: date,
        duration: duration?.value?.toString() ?? "00:00",
        isSlotReservable,
        reservationUnit: reservationUnit ?? undefined,
      }),
    [date, duration, isSlotReservable, reservationUnit]
  );

  // the available times for the selected day
  const dayTimes = useMemo(
    () =>
      getAvailableTimesForDay({
        day: date,
        duration: duration?.value?.toString() ?? "00:00",
        isSlotReservable,
        reservationUnit: reservationUnit ?? undefined,
      }),
    [date, duration, isSlotReservable, reservationUnit]
  );

  const lastPossibleDate = getLastPossibleReservationDate(
    reservationUnit ?? undefined
  );

  return (
    <Wrapper id="quick-reservation">
      <Heading>{t("reservationCalendar:quickReservation.heading")}</Heading>
      <Selects>
        <DateInput
          id="quick-reservation-date"
          label={t("reservationCalendar:startDate")}
          initialMonth={new Date()}
          language={getLocalizationLang(i18n.language)}
          onChange={(_val, valueAsDate) => {
            if (isValid(valueAsDate) && valueAsDate.getFullYear() > 1970) {
              setSlot(null);
              /* TODO what is the purpose of this? */
              const times = getAvailableTimesForDay({
                day: valueAsDate,
                duration: duration?.value?.toString() ?? "00:00",
                isSlotReservable,
                reservationUnit: reservationUnit ?? undefined,
                fromStartOfDay: true,
              });
              setDate(valueAsDate);
              if (times.length > 0) {
                setTime(times[0]);
              }
            }
          }}
          value={toUIDate(date)}
          minDate={new Date()}
          maxDate={lastPossibleDate ?? undefined}
        />
        <StyledSelect
          key={`durationSelect-${duration?.value}`}
          id="quick-reservation-duration"
          label={t("reservationCalendar:duration")}
          options={durationOptions}
          onChange={(val: OptionType) => setDuration(val)}
          defaultValue={duration}
        />
      </Selects>
      <Price data-testid="quick-reservation-price">
        {slot ? (
          <>
            {t("reservationUnit:price")}: <PriceValue>{getPrice()}</PriceValue>
            {getPrice(true) !== "0" && subventionSuffix?.("quick-reservation")}
          </>
        ) : null}
      </Price>

      <Subheading>
        {t("reservationCalendar:quickReservation.subheading")}
      </Subheading>
      <Times>
        {dayTimes.length > 0 ? (
          <Slots>
            <StyledCarousel
              hideCenterControls
              wrapAround={false}
              key={`${date}-${time}-${duration?.value}`}
            >
              {timeChunks.map((chunk: string[], index: number) => (
                <SlotGroup key={chunk[0]}>
                  {chunk.map((val: string) => (
                    <Slot $active={slot === val} key={val}>
                      <SlotButton
                        data-testid="quick-reservation-slot"
                        onClick={() => {
                          if (slot === val) {
                            setSlot(null);
                            setInitialReservation(null);
                          } else setSlot(val);
                        }}
                      >
                        {val}
                      </SlotButton>
                    </Slot>
                  ))}
                  {dayTimes.length > timeItems &&
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
            </StyledCarousel>
          </Slots>
        ) : (
          <NoTimes>
            <span>{t("reservationCalendar:quickReservation.noTimes")}</span>
            {nextAvailableTime && (
              <span>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- FIXME */}
                <a
                  data-testid="quick-reservation-next-available-time"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const nextTime = toUIDate(nextAvailableTime, "HH:mm");
                    nextAvailableTime.setHours(0, 0, 0, 0);
                    setDate(nextAvailableTime);
                    setTime(nextTime);

                    return false;
                  }}
                >
                  {t("reservationCalendar:quickReservation.nextAvailableTime")}
                </a>
              </span>
            )}
          </NoTimes>
        )}
      </Times>
      <ActionWrapper>
        <LoginFragment
          isActionDisabled={!slot || !isReservationUnitReservable}
          apiBaseUrl={apiBaseUrl}
          actionCallback={() => {
            setStoredReservation(localReservation);
          }}
          componentIfAuthenticated={
            isReservationUnitReservable && (
              <MediumButton
                disabled={!slot}
                onClick={() => {
                  if (localReservation != null) {
                    setIsReserving(true);
                    createReservation(localReservation);
                  }
                }}
                isLoading={isReserving}
                loadingText={t("reservationCalendar:makeReservationLoading")}
                data-test="quick-reservation__button--submit"
              >
                {t("reservationCalendar:makeReservation")}
              </MediumButton>
            )
          }
          returnUrl={getPostLoginUrl()}
        />
      </ActionWrapper>
    </Wrapper>
  );
};

export default QuickReservation;
