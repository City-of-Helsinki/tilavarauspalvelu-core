import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAvailableTimes, getOpenDays } from "common/src/calendar/util";
import { chunkArray, toUIDate } from "common/src/common/util";
import { Language, OptionType } from "common/types/common";
import {
  addDays,
  addHours,
  addMinutes,
  differenceInMinutes,
  isBefore,
  isSameDay,
  isValid,
} from "date-fns";
import { Button, DateInput, IconAngleDown, Select, TimeInput } from "hds-react";
import { padStart } from "lodash";

import { useTranslation } from "react-i18next";
import { useLocalStorage } from "react-use";
import styled from "styled-components";
import { fontBold, fontMedium, H4 } from "common/src/common/typography";
import { ReservationProps } from "../../context/DataContext";
import { ReservationUnitByPkType } from "../../modules/gql-types";
import { getDurationOptions } from "../../modules/reservation";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import { formatDate } from "../../modules/util";
import { MediumButton } from "../../styles/util";
import Carousel from "../Carousel";
import LoginFragment from "../LoginFragment";

type Props = {
  isReservationUnitReservable: boolean;
  createReservation: (arg: ReservationProps) => void;
  reservationUnit: ReservationUnitByPkType;
  scrollPosition: number;
  isSlotReservable: (arg1: Date, arg2: Date, arg3?: boolean) => boolean;
  setErrorMsg: (arg: string) => void;
  idPrefix: string;
};

const mobileBreakpoint = "400px";
const timeItems = 24;

const Wrapper = styled.div`
  background-color: var(--color-gold-light);
  margin-bottom: var(--spacing-l);
  padding: var(--spacing-m);
  max-width: 400px;
`;

const Heading = styled(H4)`
  margin: var(--spacing-3-xs) 0 var(--spacing-l) 0;
`;

const Selects = styled.div`
  & > *:first-child {
    grid-column: 1/-1;
  }

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-m);

  label {
    white-space: nowrap;
    ${fontMedium};
  }

  @media (min-width: ${mobileBreakpoint}) {
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

const Price = styled.div`
  display: flex;
  flex-direction: row;
  align-self: flex-end;
  gap: var(--spacing-3-xs);
  padding-bottom: var(--spacing-3-xs);
  grid-column: -1/1;

  @media (min-width: ${mobileBreakpoint}) {
    grid-column: unset;
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

  @media (min-width: ${mobileBreakpoint}) {
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

const CarouselButton = styled(Button).attrs({
  "data-testid": "slot-carousel-button",
})<{
  $disabled: boolean;
  $side: "left" | "right";
}>`
  &&& {
    --color-bus: transparent;
    --color-bus-dark: transparent;
    --min-size: 0;

    & > span {
      margin: 0;
      padding: 0;
    }

    ${({ $disabled }) =>
      $disabled
        ? `
    display: none !important;
  `
        : `
    &:hover {
      opacity: 0.7;
    }
    opacity: 1;
  `};

    background-color: var(--color-gold-light);
    margin: 0;
    padding: 0;

    svg {
      color: black;
      transform: scale(1.5);
    }
  }
`;

const StyledSelect = styled(Select)`
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

const QuickReservation = ({
  isSlotReservable,
  isReservationUnitReservable,
  createReservation,
  reservationUnit,
  scrollPosition,
  setErrorMsg,
  idPrefix,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const { minReservationDuration, maxReservationDuration } =
    reservationUnit || {};

  const durationOptions = useMemo(
    () => getDurationOptions(minReservationDuration, maxReservationDuration),
    [minReservationDuration, maxReservationDuration]
  );

  const nextHour: Date = useMemo(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    now.setHours(now.getHours() + 1);
    return now;
  }, []);

  const [localReservation, setLocalReservation] =
    useState<ReservationProps>(null);
  const [date, setDate] = useState(() => {
    const result = new Date();
    result.setHours(0, 0, 0, 0);
    return result;
  });
  const [time, setTime] = useState<string>(
    formatDate(nextHour.toISOString(), "HH:mm")
  );
  const [duration, setDuration] = useState<OptionType>(
    durationOptions.find((n) => n.value === "1:00") || durationOptions[0]
  );
  const [slot, setSlot] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  const price: string = useMemo(() => {
    const [hours, minutes] =
      duration?.value.toString().split(":").map(Number) || [];
    const length = hours * 60 + minutes;
    return getReservationUnitPrice(reservationUnit, date, length);
  }, [duration?.value, reservationUnit, date]);

  const [storedReservation, setStoredReservation, removeStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  useEffect(() => {
    if (storedReservation) {
      const { begin, end } = storedReservation;
      setLocalReservation(storedReservation);
      const newDate = new Date(storedReservation.begin);
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
      };
      setLocalReservation(res);
    }
  }, [date, duration, slot]);

  const availableTimes = useCallback(
    (day: Date, fromStartOfDay = false): string[] => {
      const [durationHours, durationMinutes] =
        duration?.value.toString().split(":").map(Number) || [];
      const [timeHours, timeMinutesRaw] = fromStartOfDay
        ? [0, 0]
        : time.split(":").map(Number);

      const timeMinutes = timeMinutesRaw > 59 ? 59 : timeMinutesRaw;
      return getAvailableTimes(reservationUnit, day)
        .map((n) => {
          const [slotHours, slotMinutes] = n.split(":").map(Number);
          const start = new Date(day);
          start.setHours(slotHours, slotMinutes, 0, 0);
          const end = addMinutes(
            addHours(start, durationHours),
            durationMinutes
          );
          const startTime = new Date(day);
          startTime.setHours(timeHours, timeMinutes, 0, 0);

          return isSlotReservable(start, end) && !isBefore(start, startTime)
            ? n
            : null;
        })
        .filter((n) => !!n);
    },
    [time, duration, reservationUnit, isSlotReservable]
  );

  const getNextAvailableTime = useCallback(
    (after: Date): Date => {
      let nextAvailableTime: Date;
      const openDays = getOpenDays(reservationUnit);

      if (openDays?.length < 1) return null;

      for (let i = 0; nextAvailableTime === undefined; i++) {
        const day = addDays(after, i);
        day.setHours(0, 0, 0, 0);
        const availableTimesForDay = availableTimes(day, true);
        if (availableTimesForDay.length > 0) {
          const [hours, minutes] = availableTimesForDay[0]
            .split(":")
            .map(Number);
          day.setHours(hours, minutes, 0, 0);
          nextAvailableTime = day;
        }
        const lastDay = openDays.slice(-1)[0];
        if (isSameDay(day, lastDay)) {
          nextAvailableTime = null;
        }
      }

      return nextAvailableTime;
    },
    [availableTimes, reservationUnit]
  );

  const timeChunks: string[][] = useMemo(() => {
    const itemsPerChunk = 8;
    return chunkArray(availableTimes(date), itemsPerChunk).slice(
      0,
      timeItems / itemsPerChunk
    );
  }, [availableTimes, date]);

  const nextAvailableTime = useMemo(
    () => getNextAvailableTime(date),
    [date, getNextAvailableTime]
  );

  if (
    !reservationUnit.openingHours ||
    !minReservationDuration ||
    !maxReservationDuration
  ) {
    return null;
  }

  return (
    <Wrapper id={`quick-reservation-${idPrefix}`}>
      <Heading>{t("reservationCalendar:quickReservation.heading")}</Heading>
      <Selects>
        <DateInput
          id={`${idPrefix}-quick-reservation-date`}
          label={t("reservationCalendar:quickReservation.date")}
          initialMonth={new Date()}
          language={i18n.language as Language}
          onChange={(val, valueAsDate) => {
            if (isValid(valueAsDate) && valueAsDate.getFullYear() > 1970) {
              setSlot(null);
              setDate(valueAsDate);
            }
          }}
          value={toUIDate(date)}
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
          key={`durationSelect-${duration.value}`}
          id={`${idPrefix}-quick-reservation-duration`}
          label={t("reservationCalendar:quickReservation.duration")}
          options={durationOptions}
          onChange={(val: OptionType) => setDuration(val)}
          defaultValue={duration}
        />
        {price && slot && (
          <Price data-testid="quick-reservation-price">
            {t("reservationUnit:price")}: <PriceValue>{price}</PriceValue>
          </Price>
        )}
      </Selects>
      <Subheading>
        {t("reservationCalendar:quickReservation.subheading")}
      </Subheading>
      <Times>
        {availableTimes(date).length > 0 ? (
          <Slots>
            <StyledCarousel
              hideCenterControls
              wrapAround={false}
              button={CarouselButton}
            >
              {timeChunks.map((chunk: string[], index: number) => (
                <SlotGroup key={chunk[0]}>
                  {chunk.map((val: string) => (
                    <Slot $active={slot === val} key={val}>
                      <SlotButton
                        data-testid="quick-reservation-slot"
                        onClick={() => setSlot(slot === val ? null : val)}
                      >
                        {val}
                      </SlotButton>
                    </Slot>
                  ))}
                  {availableTimes(date).length > timeItems &&
                    index + 1 === timeChunks.length && (
                      <CalendarLink
                        href="javascript:void(0)"
                        onClick={() => {
                          window.scroll({
                            top: scrollPosition,
                            left: 0,
                            behavior: "smooth",
                          });
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
                <a
                  data-testid="quick-reservation-next-available-time"
                  href="javascript:void(0)"
                  onClick={() => {
                    const nextTime = toUIDate(nextAvailableTime, "HH:mm");
                    nextAvailableTime.setHours(0, 0, 0, 0);
                    setDate(nextAvailableTime);
                    setTime(nextTime);
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
                  setIsReserving(true);
                  createReservation(localReservation);
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

export default QuickReservation;
