import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { OptionType, PendingReservation } from "common/types/common";
import {
  addDays,
  addHours,
  addMinutes,
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
} from "date-fns";
import { DateInput, IconAngleDown, Select, TimeInput } from "hds-react";
import { padStart } from "lodash";
import { useTranslation } from "next-i18next";
import { useLocalStorage } from "react-use";
import styled from "styled-components";
import { getDayIntervals } from "common/src/calendar/util";
import { chunkArray, toUIDate } from "common/src/common/util";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import { fontBold, fontMedium, H4 } from "common/src/common/typography";
import ClientOnly from "common/src/ClientOnly";
import { ReservationUnitByPkType } from "common/types/gql-types";
import { breakpoints } from "common";
import { type ReservationProps } from "@/context/DataContext";
import { getDurationOptions } from "@/modules/reservation";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import { formatDate } from "@/modules/util";
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
  reservationUnit: ReservationUnitByPkType | null;
  scrollPosition: number;
  isSlotReservable: (arg1: Date, arg2: Date, arg3?: boolean) => boolean;
  setErrorMsg: (arg: string) => void;
  idPrefix: string;
  subventionSuffix?: (arg: string) => JSX.Element;
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

const StyledTimeInput = styled(TimeInput)`
  > div > div {
    > div {
      margin: 0;
      width: var(--spacing-2-xs);
    }
    padding: 0 var(--spacing-xs) 0 var(--spacing-xs) !important;
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

// Returns a Date object with the first day of the given array of Dates
function dayMin(days: Array<Date | undefined>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return acc ? (isBefore(acc, day) ? acc : day) : day;
  }, undefined);
}

// Returns the last possible reservation date for the given reservation unit
function getLastPossibleReservationDate(
  reservationUnit: ReservationUnitByPkType
) {
  if (!reservationUnit || !reservationUnit.reservableTimeSpans?.length) {
    return undefined;
  }

  const lastPossibleReservationDate =
    reservationUnit.reservationsMaxDaysBefore != null &&
    reservationUnit.reservationsMaxDaysBefore > 0
      ? addDays(new Date(), reservationUnit.reservationsMaxDaysBefore)
      : undefined;
  const reservationUnitNotReservable = reservationUnit.reservationEnds
    ? new Date(reservationUnit.reservationEnds)
    : undefined;
  const endDateTime =
    reservationUnit?.reservableTimeSpans.at(-1)?.endDatetime ?? undefined;
  const lastOpeningDate = endDateTime ? new Date(endDateTime) : new Date();
  return dayMin([
    reservationUnitNotReservable,
    lastPossibleReservationDate,
    lastOpeningDate,
  ]);
}

type AvailableTimesProps = {
  day: Date;
  duration: string;
  time: string;
  isSlotReservable: (start: Date, end: Date) => boolean;
  fromStartOfDay?: boolean;
  reservationUnit?: ReservationUnitByPkType;
};

// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
// TODO should rewrite the timespans to be NonNullable and dates (and do the conversion early, not on each component render)
function getAvailableTimes(
  reservableTimeSpans: ReservationUnitByPkType["reservableTimeSpans"],
  reservationStartInterval: ReservationUnitByPkType["reservationStartInterval"],
  date: Date
): string[] {
  const allTimes: string[] = [];
  filterNonNullable(reservableTimeSpans)
    .filter(({ startDatetime, endDatetime }) => {
      if (!startDatetime) return false;
      if (!endDatetime) return false;
      const startDate = new Date(startDatetime);
      const endDate = new Date(endDatetime);
      // either we have per day open time, or we have a span of multiple days
      // another option would be to move the starting time to 00:00
      if (isSameDay(date, startDate)) return true;
      if (isBefore(date, startDate)) return false;
      if (isAfter(date, endDate)) return false;
      return true;
    })
    ?.forEach((rts) => {
      if (!rts?.startDatetime || !rts?.endDatetime) return;
      const intervals = getDayIntervals(
        format(new Date(rts.startDatetime), "HH:mm"),
        format(new Date(rts.endDatetime), "HH:mm"),
        reservationStartInterval
      );

      const times: string[] = intervals.map((val) => {
        const [startHours, startMinutes] = val.split(":");

        return `${startHours}:${startMinutes}`;
      });
      allTimes.push(...times);
    });

  return allTimes;
}

// Returns an array of available times for the given duration and day
// TODO this is really slow (especially if called from a loop)
function availableTimes({
  day,
  duration,
  time,
  isSlotReservable,
  reservationUnit,
  fromStartOfDay = false,
}: AvailableTimesProps): string[] {
  if (reservationUnit == null) return [];
  const [durationHours, durationMinutes] =
    duration?.split(":").map(Number) || [];
  const [timeHours, timeMinutesRaw] = fromStartOfDay
    ? [0, 0]
    : (!time ? "0:0" : time).split(":").map(Number);

  const timeMinutes = timeMinutesRaw > 59 ? 59 : timeMinutesRaw;
  const { reservableTimeSpans: spans, reservationStartInterval: interval } =
    reservationUnit;
  return getAvailableTimes(spans, interval, day)
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
const getNextAvailableTime = (
  props: {
    after: Date;
  } & Omit<AvailableTimesProps, "day">
): Date | null => {
  const { after, reservationUnit } = props;
  if (reservationUnit == null) {
    return null;
  }
  const { reservableTimeSpans } = reservationUnit;

  const today = new Date();
  const possibleEndDay = getLastPossibleReservationDate(reservationUnit);
  const endDay = possibleEndDay ? addDays(possibleEndDay, 1) : undefined;
  const openDays: Date[] = filterNonNullable(reservableTimeSpans)
    .map((rt) => new Date(String(rt.startDatetime)))
    .filter((date) => {
      if (!isAfter(date, after)) return false;
      if (!isAfter(date, today)) return false;
      return !(endDay && isAfter(date, endDay));
    });
  // Already sorted by date

  for (const day of openDays) {
    const availableTimesForDay = availableTimes({
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
  scrollPosition,
  setErrorMsg,
  idPrefix,
  subventionSuffix,
  shouldUnselect,
  setInitialReservation,
  quickReservationSlot,
  setQuickReservationSlot,
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
      reservationStartInterval
    );
  }, [
    minReservationDuration,
    maxReservationDuration,
    reservationStartInterval,
  ]);

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
    durationOptions.find((n) => n.value === "1:00") || durationOptions[0]
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
    const availableTimesForDay = availableTimes({
      day: date,
      duration: duration?.value?.toString() ?? "00:00",
      time,
      isSlotReservable,
      reservationUnit: reservationUnit ?? undefined,
    });

    return chunkArray(availableTimesForDay, itemsPerChunk).slice(
      0,
      timeItems / itemsPerChunk
    );
  }, [date, reservationUnit, time, duration, isSlotReservable]);

  // the next available time after the selected time
  const nextAvailableTime = getNextAvailableTime({
    after: date,
    time,
    duration: duration?.value?.toString() ?? "00:00",
    isSlotReservable,
    reservationUnit: reservationUnit ?? undefined,
  });

  // the available times for the selected day
  const dayTimes = availableTimes({
    day: date,
    time,
    duration: duration?.value?.toString() ?? "00:00",
    isSlotReservable,
    reservationUnit: reservationUnit ?? undefined,
  });

  if (
    !reservationUnit?.reservableTimeSpans ||
    !minReservationDuration ||
    !maxReservationDuration
  ) {
    return null;
  }

  const lastPossibleDate = getLastPossibleReservationDate(reservationUnit);

  return (
    <Wrapper id={`quick-reservation-${idPrefix}`}>
      <Heading>{t("reservationCalendar:quickReservation.heading")}</Heading>
      <Selects>
        <DateInput
          id={`${idPrefix}-quick-reservation-date`}
          label={t("reservationCalendar:quickReservation.date")}
          initialMonth={new Date()}
          language={getLocalizationLang(i18n.language)}
          onChange={(_val, valueAsDate) => {
            if (isValid(valueAsDate) && valueAsDate.getFullYear() > 1970) {
              setSlot(null);
              const times = availableTimes({
                day: valueAsDate,
                duration: duration?.value?.toString() ?? "00:00",
                time,
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
          maxDate={lastPossibleDate}
        />
        <StyledTimeInput
          key={`timeInput-${time}`}
          id={`${idPrefix}-quick-reservation-time`}
          label={t("reservationCalendar:quickReservation.time")}
          hoursLabel={t("common:hours")}
          minutesLabel={t("common:minutes")}
          defaultValue={time}
          onChange={(e) => {
            if (e.target.value.length !== 5) {
              return;
            }
            const [hours, minutes] = e.target.value.split(":").map(Number);
            const timeVal = `${
              hours > 23 ? "00" : padStart(hours.toString(), 2, "0")
            }:${minutes > 59 ? "00" : padStart(minutes.toString(), 2, "0")}`;

            setTime(timeVal);
          }}
        />
        <StyledSelect
          key={`durationSelect-${duration?.value}`}
          id={`${idPrefix}-quick-reservation-duration`}
          label={t("reservationCalendar:quickReservation.duration")}
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
              buttonVariant="small"
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
                            top: scrollPosition,
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
          actionCallback={() => {
            setStoredReservation(localReservation);
          }}
          componentIfAuthenticated={
            isReservationUnitReservable && (
              <MediumButton
                disabled={!slot || isReserving}
                onClick={() => {
                  if (localReservation != null) {
                    setIsReserving(true);
                    createReservation(localReservation);
                  }
                }}
                data-test="quick-reservation__button--submit"
              >
                {t("reservationCalendar:makeReservation")}
              </MediumButton>
            )
          }
        />
      </ActionWrapper>
    </Wrapper>
  );
};

export default (props: Props) => (
  <ClientOnly>
    <QuickReservation {...props} />
  </ClientOnly>
);
