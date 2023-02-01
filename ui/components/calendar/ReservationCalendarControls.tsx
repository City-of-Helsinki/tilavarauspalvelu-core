import React, { useContext, useEffect, useState, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled, { CSSProperties } from "styled-components";
import {
  differenceInMinutes,
  differenceInSeconds,
  format,
  isValid,
  parseISO,
  subMinutes,
} from "date-fns";
import {
  Button,
  DateInput,
  IconAngleDown,
  IconAngleUp,
  Select,
} from "hds-react";
import { trim, trimStart } from "lodash";
import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  convertHMSToSeconds,
  secondsToHms,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { useLocalStorage } from "react-use";
import { Transition } from "react-transition-group";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  getDayIntervals,
} from "common/src/calendar/util";
import { ApplicationRound, Language, OptionType } from "common/types/common";
import {
  fontBold,
  fontMedium,
  fontRegular,
} from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ApplicationRoundType,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import { MediumButton } from "../../styles/util";
import { DataContext, ReservationProps } from "../../context/DataContext";
import { getDurationOptions } from "../../modules/reservation";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import LoginFragment from "../LoginFragment";
import { useDebounce } from "../../hooks/useDebounce";
import { capitalize, formatDurationMinutes } from "../../modules/util";

type Props<T> = {
  reservationUnit: ReservationUnitByPkType;
  begin?: string;
  end?: string;
  resetReservation: () => void;
  isSlotReservable: (start: Date, end: Date) => boolean;
  setCalendarFocusDate: (date: Date) => void;
  activeApplicationRounds: ApplicationRound[] | ApplicationRoundType[];
  createReservation?: (arg: ReservationProps) => void;
  setErrorMsg: (msg: string) => void;
  handleEventChange: (
    event: CalendarEvent<T>,
    skipLengthCheck?: boolean
  ) => boolean;
  mode: "create" | "edit";
  customAvailabilityValidation?: (start: Date) => boolean;
  shouldCalendarControlsBeVisible?: boolean;
  setShouldCalendarControlsBeVisible?: (value: boolean) => void;
  isAnimated?: boolean;
};

const Wrapper = styled.div`
  border-top: 1px solid var(--color-black-50);
`;

const TogglerTop = styled.div``;

const TogglerBottom = styled.div`
  display: flex;
  align-self: flex-end;
  justify-content: flex-end;
  min-width: 177px;
  padding-bottom: var(--spacing-xs);

  button {
    width: 100%;
    max-width: 177px;
  }
`;

const ToggleControls = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-m);
  width: 100%;
  padding: var(--spacing-3-xs) var(--spacing-3-xs) 0;
  box-sizing: border-box;
`;

const ToggleButton = styled.button`
  background: var(--color-white);
  border: 0;
  cursor: pointer;
`;

const TogglerLabel = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xs) 0;
`;

const TogglerDate = styled.div`
  line-height: var(--lineheight-l);
  ${fontBold}
`;

const TogglerPrice = styled.div`
  line-height: var(--lineheight-l);
`;

const Content = styled.div<{ $isAnimated: boolean }>`
  display: grid;
  gap: var(--spacing-xs);
  align-items: flex-end;
  padding: 0;
  grid-template-columns: repeat(2, 1fr);

  ${({ $isAnimated }) =>
    $isAnimated &&
    `
    max-height: 0;
    transition: max-height 0.5s ease-out;

    &.entering,
    &.entered {
      max-height: 300px;
      padding: var(--spacing-s) 0 var(--spacing-m) 0;
    }

    &.exiting,
    &.entering {
      overflow-y: hidden;
    }
  `}

  button {
    width: 100% !important;
  }

  h3 {
    margin-top: 0;
  }

  label {
    ${fontMedium};
  }

  @media (min-width: ${breakpoints.m}) {
    > *:nth-child(5) {
      grid-column: 3/3;
    }

    grid-template-columns: repeat(4, 24%);
    gap: var(--spacing-xs);
    justify-content: space-between;
  }

  @media (min-width: ${breakpoints.xl}) {
    > *:nth-child(5) {
      grid-column: unset;
    }

    grid-template-columns: 154px 120px 100px minmax(100px, 1fr) 100px 140px;
  }
`;

const StyledSelect = styled(Select)`
  & > div:nth-of-type(2) {
    line-height: var(--lineheight-l);
  }

  ul {
    transform: unset;
    bottom: 54px;
    left: -2px;
    border-top: var(--border-width) solid var(--dropdown-border-color-focus);
    border-bottom: var(--divider-width) solid var(--menu-divider-color);

    li {
      white-space: nowrap;
    }
  }
`;

const PriceWrapper = styled.div`
  ${fontMedium};
  align-self: flex-end;
  order: 2;

  @media (min-width: ${breakpoints.m}) {
    order: unset;
  }
`;

const Label = styled.div`
  margin-bottom: var(--spacing-2-xs);
`;

const Price = styled.div`
  ${fontRegular};
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-s);
  padding-bottom: var(--spacing-3-xs);
`;

const ResetButton = styled(Button).attrs({
  variant: "secondary",
  style: {
    /* eslint-disable @typescript-eslint/naming-convention */
    "--border-color": "var(--color-black)",
    "--color": "var(--color-black)",
    /* eslint-enable */
  } as CSSProperties,
})`
  white-space: nowrap;
  order: 1;

  > span {
    margin: 0 !important;
    padding-right: var(--spacing-3-xs);
    padding-left: var(--spacing-3-xs);
  }

  @media (min-width: ${breakpoints.m}) {
    order: unset;
  }
`;

const SubmitButtonWrapper = styled.div`
  order: 3;
`;

const SubmitButton = styled(MediumButton)`
  white-space: nowrap;

  > span {
    margin: 0 !important;
    padding-right: var(--spacing-3-xs);
    padding-left: var(--spacing-3-xs);
  }

  @media (min-width: ${breakpoints.m}) {
    order: unset;
  }
`;

const ReservationCalendarControls = <T extends Record<string, unknown>>({
  reservationUnit,
  begin,
  end,
  resetReservation,
  isSlotReservable,
  setCalendarFocusDate,
  activeApplicationRounds,
  createReservation,
  setErrorMsg,
  handleEventChange,
  mode,
  customAvailabilityValidation,
  shouldCalendarControlsBeVisible,
  setShouldCalendarControlsBeVisible,
  isAnimated = false,
}: Props<T>): JSX.Element => {
  const { t, i18n } = useTranslation();

  const durationOptions = useMemo(() => {
    const options = getDurationOptions(
      reservationUnit.minReservationDuration,
      reservationUnit.maxReservationDuration
    );
    return [{ value: "0:00", label: "" }, ...options];
  }, [
    reservationUnit.minReservationDuration,
    reservationUnit.maxReservationDuration,
  ]);

  const { reservation, setReservation } = useContext(DataContext);
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<OptionType | null>(
    durationOptions[0]
  );
  const [isReserving, setIsReserving] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  const [_, setStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  useEffect(() => {
    if (!reservation) {
      setStartTime(null);
    }
  }, [reservation]);

  const debouncedStartTime = useDebounce(begin, 200);
  const debouncedEndTime = useDebounce(end, 200);

  useEffect(() => {
    if (setShouldCalendarControlsBeVisible) {
      setAreControlsVisible(shouldCalendarControlsBeVisible);
    }
  }, [setShouldCalendarControlsBeVisible, shouldCalendarControlsBeVisible]);

  useEffect(() => {
    if (debouncedStartTime && debouncedEndTime) {
      const newDate = new Date(debouncedStartTime);

      const newStartTime = `${newDate.getHours()}:${newDate
        .getMinutes()
        .toString()
        .padEnd(2, "0")}`;
      const diff = secondsToHms(
        differenceInSeconds(
          new Date(debouncedEndTime),
          new Date(debouncedStartTime)
        )
      );
      const durationHMS = `${diff.h || "0"}:${String(diff.m).padEnd(2, "0")}`;
      const newDuration = durationOptions.find((n) => n.value === durationHMS);

      setDate(newDate);
      setStartTime(newStartTime);
      setDuration(newDuration);
    }
  }, [debouncedStartTime, debouncedEndTime, setDate, durationOptions]);

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
        doBuffersCollide(
          {
            start: startDate,
            end: endDate,
            bufferTimeBefore: reservationUnit.bufferTimeBefore,
            bufferTimeAfter: reservationUnit.bufferTimeAfter,
          },
          reservationUnit.reservations
        )
      ) {
        setErrorMsg(t("reservationCalendar:errors.bufferCollision"));
      }

      if (
        doReservationsCollide(
          {
            start: startDate,
            end: endDate,
          },
          reservationUnit.reservations
        )
      ) {
        setErrorMsg(t(`reservationCalendar:errors.collision`));
      } else if (
        !areSlotsReservable(
          [startDate, subMinutes(endDate, 1)],
          reservationUnit.openingHours?.openingTimes,
          reservationUnit.reservationBegins
            ? new Date(reservationUnit.reservationBegins)
            : undefined,
          reservationUnit.reservationEnds
            ? new Date(reservationUnit.reservationEnds)
            : undefined,
          reservationUnit.reservationsMinDaysBefore,
          activeApplicationRounds
        ) ||
        (customAvailabilityValidation &&
          !customAvailabilityValidation(startDate))
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

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeInForm", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:timeInForm", {
    date: end && parseISO(end),
  });

  const togglerLabel = (() => {
    const dateStr = trim(
      `${beginDate} ${beginTime}-${
        endDate !== beginDate ? endDate : ""
      }${endTime}`,
      "-"
    );
    const durationStr = formatDurationMinutes(
      differenceInMinutes(new Date(end), new Date(begin))
    );

    return `${dateStr}, ${durationStr}`;
  })();

  const price = getReservationUnitPrice({
    reservationUnit,
    pricingDate: date,
    minutes: convertHMSToSeconds(`0${duration?.value}:00`) / 60,
    trailingZeros: true,
  });

  const submitButton = createReservation ? (
    <SubmitButtonWrapper>
      <LoginFragment
        isActionDisabled={!isReservable}
        actionCallback={() => {
          setStoredReservation({ ...reservation, pk: reservationUnit.pk });
        }}
        componentIfAuthenticated={
          <SubmitButton
            onClick={() => {
              setIsReserving(true);
              createReservation(reservation);
            }}
            disabled={!isReservable || isReserving}
            data-test="reservation__button--submit"
          >
            {t("reservationCalendar:makeReservation")}
          </SubmitButton>
        }
      />
    </SubmitButtonWrapper>
  ) : null;

  return (
    <Wrapper data-testid="reservation-unit__reservation-controls--wrapper">
      <TogglerTop>
        <ToggleControls>
          <TogglerLabel>
            {isReservable ? (
              areControlsVisible ? (
                <div>&nbsp;</div>
              ) : (
                <>
                  <TogglerDate>{capitalize(togglerLabel)}</TogglerDate>
                  <TogglerPrice>
                    {t("reservationUnit:price")}: {price}
                  </TogglerPrice>
                </>
              )
            ) : (
              t("reservationCalendar:selectTime")
            )}
          </TogglerLabel>
          <ToggleButton
            onClick={() => {
              setAreControlsVisible(!areControlsVisible);
              if (shouldCalendarControlsBeVisible) {
                setShouldCalendarControlsBeVisible(!areControlsVisible);
              }
            }}
            data-testid="reservation-unit__reservation-controls--toggle-button"
          >
            {areControlsVisible ? (
              <IconAngleDown aria-label={t("common:showLess")} size="m" />
            ) : (
              <IconAngleUp aria-label={t("common:showMore")} size="m" />
            )}
          </ToggleButton>
        </ToggleControls>
      </TogglerTop>
      <TogglerBottom>
        {isReservable && !areControlsVisible && submitButton}
      </TogglerBottom>
      <Transition
        mountOnEnter
        unmountOnExit
        timeout={isAnimated ? 500 : 0}
        in={areControlsVisible}
      >
        {(state) => (
          <Content className={state} $isAnimated={isAnimated}>
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
              label={t("reservationCalendar:startDate")}
              language={i18n.language as Language}
              minDate={new Date()}
            />
            <StyledSelect
              key={`startTime-${startTime}`}
              id="reservation__input--start-time"
              label={t("reservationCalendar:startTime")}
              onChange={(val: OptionType) => setStartTime(val.value as string)}
              options={startingTimesOptions}
              value={startingTimesOptions.find((n) => n.value === startTime)}
            />
            <StyledSelect
              id="reservation__input--duration"
              label={t("reservationCalendar:duration")}
              onChange={(val: OptionType) => {
                setDuration(val);
              }}
              options={durationOptions}
              value={duration}
            />
            <PriceWrapper>
              {isReservable && (
                <>
                  <Label>{t("reservationUnit:price")}:</Label>
                  <Price data-testid="reservation__price--value">{price}</Price>
                </>
              )}
            </PriceWrapper>
            <ResetButton
              onClick={() => {
                setStartTime(null);
                resetReservation();
                setReservation(null);
              }}
              disabled={!startTime}
            >
              {t("searchForm:resetForm")}
            </ResetButton>
            {mode === "create" && submitButton}
          </Content>
        )}
      </Transition>
    </Wrapper>
  );
};

export default ReservationCalendarControls;
