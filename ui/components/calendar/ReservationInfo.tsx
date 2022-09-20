import React, { useContext, useEffect, useState, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { differenceInSeconds, format, isValid, subMinutes } from "date-fns";
import { DateInput, Select } from "hds-react";
import { trimStart } from "lodash";
import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  convertHMSToSeconds,
  secondsToHms,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { useLocalStorage } from "react-use";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  getDayIntervals,
} from "common/src/calendar/util";
import { ApplicationRound, Language, OptionType } from "common/types/common";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";
import { ReservationUnitByPkType } from "../../modules/gql-types";
import { DataContext, ReservationProps } from "../../context/DataContext";
import { fontMedium, fontRegular } from "../../modules/style/typography";
import { getDurationOptions } from "../../modules/reservation";
import { getPrice } from "../../modules/reservationUnit";
import LoginFragment from "../LoginFragment";

type Props<T> = {
  reservationUnit: ReservationUnitByPkType;
  begin?: string;
  end?: string;
  resetReservation: () => void;
  isSlotReservable: (start: Date, end: Date) => boolean;
  setCalendarFocusDate: (date: Date) => void;
  activeApplicationRounds: ApplicationRound[];
  createReservation: (arg: ReservationProps) => void;
  setErrorMsg: (msg: string) => void;
  isReservationUnitReservable: boolean;
  handleEventChange: (
    event: CalendarEvent<T>,
    skipLengthCheck?: boolean
  ) => boolean;
};

const Wrapper = styled.div`
  display: grid;
  gap: var(--spacing-s);
  align-items: flex-start;
  max-width: 300px;

  button {
    order: unset;
  }

  h3 {
    margin-top: 0;
  }

  label {
    ${fontMedium};
  }

  @media (min-width: ${breakpoint.m}) {
    grid-template-columns: 190px 160px 120px auto;
    gap: var(--spacing-l);
    max-width: unset;

    button {
      max-width: 10rem;
    }
  }

  @media (min-width: ${breakpoint.l}) {
    button {
      max-width: unset;
    }
  }
`;

const StyledSelect = styled(Select)`
  & > div:nth-of-type(2) {
    line-height: var(--lineheight-l);
  }
`;

const PriceWrapper = styled.div`
  ${fontMedium};
  align-self: flex-end;
  white-space: nowrap;
`;

const Price = styled.div`
  ${fontRegular};
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-xl);
`;

const ReservationInfo = <T extends Record<string, unknown>>({
  reservationUnit,
  begin,
  end,
  resetReservation,
  isSlotReservable,
  setCalendarFocusDate,
  activeApplicationRounds,
  createReservation,
  setErrorMsg,
  isReservationUnitReservable,
  handleEventChange,
}: Props<T>): JSX.Element => {
  const { t, i18n } = useTranslation();

  const durationOptions = useMemo(
    () =>
      getDurationOptions(
        reservationUnit.minReservationDuration,
        reservationUnit.maxReservationDuration
      ),
    [
      reservationUnit.minReservationDuration,
      reservationUnit.maxReservationDuration,
    ]
  );

  const { reservation, setReservation } = useContext(DataContext);
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<OptionType | null>(
    durationOptions[0]
  );
  const [isReserving, setIsReserving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  const [_, setStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  useEffect(() => {
    if (!reservation) {
      setStartTime(null);
    }
  }, [reservation]);

  useEffect(() => {
    if (begin && end) {
      const newDate = new Date(begin);

      const newStartTime = `${newDate.getHours()}:${newDate
        .getMinutes()
        .toString()
        .padEnd(2, "0")}`;
      const diff = secondsToHms(
        differenceInSeconds(new Date(end), new Date(begin))
      );
      const durationHMS = `${diff.h || "0"}:${String(diff.m).padEnd(2, "0")}`;
      const newDuration = durationOptions.find((n) => n.value === durationHMS);

      setDate(newDate);
      setStartTime(newStartTime);
      setDuration(newDuration);
    }
  }, [begin, end, setDate, durationOptions]);

  useEffect(() => {
    if (isValid(date) && startTime && duration) {
      setErrorMsg(null);
      const startDate = new Date(date);
      const endDate = new Date(date);
      const [hours, minutes] = startTime.split(":");
      const [durationHours, durationMinutes] = String(duration.value).split(
        ":"
      );
      startDate.setHours(Number(hours), Number(minutes));
      endDate.setHours(
        Number(hours) + Number(durationHours),
        Number(minutes) + Number(durationMinutes)
      );

      if (isSlotReservable(startDate, endDate)) {
        handleEventChange({
          start: startDate,
          end: endDate,
        });
        setReservation({
          pk: null,
          begin: startDate.toISOString(),
          end: endDate.toISOString(),
          price: null,
        });
      } else {
        setReservation({ pk: null, begin: null, end: null, price: null });
        resetReservation();
      }
      if (
        doBuffersCollide(reservationUnit.reservations, {
          start: startDate,
          end: endDate,
          bufferTimeBefore: reservationUnit.bufferTimeBefore,
          bufferTimeAfter: reservationUnit.bufferTimeAfter,
        })
      ) {
        setErrorMsg(t("reservationCalendar:errors.bufferCollision"));
      }

      if (
        doReservationsCollide(reservationUnit.reservations, {
          start: startDate,
          end: endDate,
        })
      ) {
        setErrorMsg(t(`reservationCalendar:errors.collision`));
      } else if (
        !areSlotsReservable(
          [startDate, subMinutes(endDate, 1)],
          reservationUnit.openingHours?.openingTimes,
          activeApplicationRounds,
          reservationUnit.reservationBegins,
          reservationUnit.reservationEnds,
          reservationUnit.reservationsMinDaysBefore
        )
      ) {
        setErrorMsg(t(`reservationCalendar:errors.unavailable`));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, duration?.value]);

  useEffect(() => {
    setReservation({ pk: null, begin: null, end: null, price: null });
  }, [setReservation]);

  const {
    startTime: dayStartTime,
    endTime: dayEndTime,
  }: { startTime?: string; endTime?: string } = useMemo(() => {
    return (
      reservationUnit.openingHours?.openingTimes?.find(
        (n) => n.date === toApiDate(date)
      ) || { startTime: null, endTime: null }
    );
  }, [reservationUnit.openingHours?.openingTimes, date]);

  const startingTimesOptions: OptionType[] = useMemo(() => {
    if (!dayStartTime || !dayEndTime) return [];
    const [startHours, startMinutes] = dayStartTime.split(":").map(Number);
    const [endHours, endMinutes] = dayEndTime.split(":").map(Number);
    const startDate = new Date().setUTCHours(startHours, startMinutes);
    const endDate = new Date().setUTCHours(endHours, endMinutes);

    return getDayIntervals(
      format(startDate, "HH:mm"),
      format(endDate, "HH:mm"),
      reservationUnit.reservationStartInterval
    ).map((n) => ({
      label: trimStart(n.substring(0, 5).replace(":", "."), "0"),
      value: trimStart(n.substring(0, 5), "0"),
    }));
  }, [dayStartTime, dayEndTime, reservationUnit.reservationStartInterval]);

  const isReservable = useMemo(
    () =>
      !!duration &&
      !!reservation &&
      reservation?.begin &&
      reservation?.end &&
      isSlotReservable(new Date(reservation.begin), new Date(reservation.end)),
    [duration, reservation, isSlotReservable]
  );

  return (
    <Wrapper>
      <DateInput
        onChange={(val, valueAsDate) => {
          if (
            !val ||
            !isValid(valueAsDate) ||
            toApiDate(valueAsDate) < toApiDate(new Date())
          ) {
            resetReservation();
          } else {
            setDate(valueAsDate);
            setCalendarFocusDate(valueAsDate);
          }
        }}
        value={toUIDate(date)}
        id="reservation__input--date"
        initialMonth={new Date()}
        label={`${t("reservationCalendar:startDate")} *`}
        language={i18n.language as Language}
      />
      <StyledSelect
        key={`startTime-${startTime}`}
        id="reservation__input--start-time"
        label={`${t("reservationCalendar:startTime")} *`}
        onChange={(val: OptionType) => setStartTime(val.value as string)}
        options={startingTimesOptions}
        value={startingTimesOptions.find((n) => n.value === startTime)}
      />
      <StyledSelect
        id="reservation__input--duration"
        label={`${t("reservationCalendar:duration")} *`}
        onChange={(val: OptionType) => {
          setDuration(val);
        }}
        options={durationOptions}
        value={duration}
      />
      <PriceWrapper>
        {isReservable && (
          <>
            <div>{t("reservationUnit:price")}:</div>
            <Price data-testid="reservation__price--value">
              {getPrice(
                reservationUnit,
                convertHMSToSeconds(`0${duration?.value}:00`) / 60
              )}
            </Price>
          </>
        )}
      </PriceWrapper>
      <LoginFragment
        isActionDisabled={!isReservable}
        actionCallback={() => {
          setStoredReservation({ ...reservation, pk: reservationUnit.pk });
        }}
        componentIfAuthenticated={
          isReservationUnitReservable && (
            <MediumButton
              onClick={() => {
                setIsReserving(true);
                createReservation(reservation);
              }}
              disabled={!isReservable || isReserving}
              data-test="reservation__button--submit"
            >
              {t("reservationCalendar:makeReservation")}
            </MediumButton>
          )
        }
      />
    </Wrapper>
  );
};

export default ReservationInfo;
