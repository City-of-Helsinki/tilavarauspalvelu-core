import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled, { CSSProperties } from "styled-components";
import {
  differenceInMinutes,
  differenceInSeconds,
  format,
  isValid,
  max,
  min,
  parseISO,
  addMinutes,
  isSameDay,
} from "date-fns";
import {
  Button,
  DateInput,
  IconAngleDown,
  IconAngleUp,
  IconCross,
  Select,
} from "hds-react";
import { maxBy, trim, trimStart } from "lodash";
import { CalendarEvent } from "common/src/calendar/Calendar";
import { secondsToHms, toUIDate } from "common/src/common/util";
import { useLocalStorage } from "react-use";
import { Transition } from "react-transition-group";
import {
  RoundPeriod,
  doBuffersCollide,
  doReservationsCollide,
  getDayIntervals,
  isRangeReservable,
} from "common/src/calendar/util";
import type { OptionType, PendingReservation } from "common/types/common";
import {
  fontBold,
  fontMedium,
  fontRegular,
} from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationUnitByPkType } from "common/types/gql-types";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import { MediumButton, truncatedText } from "@/styles/util";
import { ReservationProps } from "@/context/DataContext";
import { getDurationOptions } from "@/modules/reservation";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import LoginFragment from "../LoginFragment";
import { useDebounce } from "@/hooks/useDebounce";
import { capitalize, formatDurationMinutes } from "@/modules/util";

type Props<T> = {
  reservationUnit: ReservationUnitByPkType;
  initialReservation: PendingReservation | null;
  setInitialReservation: (reservation: PendingReservation | null) => void;
  isSlotReservable: (start: Date, end: Date) => boolean;
  isReserving: boolean;
  setCalendarFocusDate: (date: Date) => void;
  activeApplicationRounds: RoundPeriod[];
  createReservation?: (arg: ReservationProps) => void;
  setErrorMsg: (msg: string | null) => void;
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
    grid-template-columns: repeat(4, 24%);
    gap: var(--spacing-xs);
    justify-content: space-between;
    padding-bottom: var(--spacing-s);
  }

  @media (min-width: ${breakpoints.xl}) {
    grid-template-columns: 154px 120px 100px minmax(100px, 1fr) 100px auto;
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
  variant: "supplementary",
  iconLeft: <IconCross aria-hidden />,
  style: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "--color": "var(--color-black)",
  } as CSSProperties,
})<{ $isLast: boolean }>`
  white-space: nowrap;
  order: 1;

  svg {
    min-width: 24px;
  }

  @media (min-width: ${breakpoints.m}) {
    order: unset;
    grid-column: ${({ $isLast }) => ($isLast ? "4" : "3")} / 4;
  }

  @media (min-width: ${breakpoints.xl}) {
    grid-column: unset;

    svg {
      display: none;
    }
  }
`;

const SelectButton = styled(Button)`
  order: 7;
  ${truncatedText}

  @media (min-width: ${breakpoints.m}) {
    display: none;
    grid-column: 4/4;
  }

  @media (min-width: ${breakpoints.xl}) {
    grid-column: unset;
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

const StyledSelect = styled(Select<OptionType>)`
  & > div:nth-of-type(2) {
    line-height: var(--lineheight-l);
  }

  button > span {
    white-space: nowrap;
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

const ReservationCalendarControls = <T extends Record<string, unknown>>({
  reservationUnit,
  initialReservation,
  setInitialReservation,
  isSlotReservable,
  isReserving,
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

  const { begin, end } = initialReservation || {};
  const {
    minReservationDuration,
    maxReservationDuration,
    reservationStartInterval,
  } = reservationUnit;

  const durationOptions = useMemo(() => {
    const options = getDurationOptions(
      minReservationDuration ?? 0,
      maxReservationDuration ?? 0,
      reservationStartInterval
    );
    return [{ value: "0:00", label: "" }, ...options];
  }, [
    minReservationDuration,
    maxReservationDuration,
    reservationStartInterval,
  ]);

  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<OptionType | null>(
    durationOptions[0]
  );
  const [areControlsVisible, setAreControlsVisible] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  const [_, setStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  useEffect(() => {
    if (!initialReservation) {
      setStartTime(null);
    }
  }, [initialReservation]);

  const debouncedStartTime = useDebounce(begin, 200);
  const debouncedEndTime = useDebounce(end, 200);

  useEffect(() => {
    if (setShouldCalendarControlsBeVisible) {
      setAreControlsVisible(shouldCalendarControlsBeVisible ?? false);
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
      setDuration(newDuration ?? null);
    }
  }, [debouncedStartTime, debouncedEndTime, setDate, durationOptions]);

  useEffect(() => {
    if (date != null && isValid(date) && startTime && duration) {
      const {
        bufferTimeBefore,
        bufferTimeAfter,
        reservableTimeSpans,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservations,
        reservationBegins,
        reservationEnds,
      } = reservationUnit;

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
        setInitialReservation({
          begin: startDate.toISOString(),
          end: endDate.toISOString(),
        });
      } else {
        setInitialReservation(null);
      }
      const res = filterNonNullable(reservations);
      if (
        doBuffersCollide(
          {
            start: startDate,
            end: endDate,
            isBlocked: false,
            bufferTimeBefore: bufferTimeBefore ?? undefined,
            bufferTimeAfter: bufferTimeAfter ?? undefined,
          },
          res
        )
      ) {
        setErrorMsg(t("reservationCalendar:errors.bufferCollision"));
      }

      const reservableTimes = filterNonNullable(reservableTimeSpans) ?? [];
      if (doReservationsCollide({ start: startDate, end: endDate }, res)) {
        setErrorMsg(t(`reservationCalendar:errors.collision`));
      } else if (
        !isRangeReservable({
          range: [startDate, addMinutes(endDate, -1)],
          reservableTimes,
          reservationBegins: reservationBegins
            ? new Date(reservationBegins)
            : undefined,
          reservationEnds: reservationEnds
            ? new Date(reservationEnds)
            : undefined,
          reservationsMinDaysBefore: reservationsMinDaysBefore ?? 0,
          reservationsMaxDaysBefore: reservationsMaxDaysBefore ?? 0,
          activeApplicationRounds,
          reservationStartInterval,
        }) ||
        (customAvailabilityValidation &&
          !customAvailabilityValidation(startDate))
      ) {
        setErrorMsg(t(`reservationCalendar:errors.unavailable`));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    date,
    startTime,
    duration?.value,
    reservationUnit,
    reservationStartInterval,
  ]);

  // TODO why?
  useEffect(() => {
    setInitialReservation(null);
  }, [setInitialReservation]);

  const {
    startTime: dayStartTime,
    endTime: dayEndTime,
  }: { startTime?: string; endTime?: string } = useMemo(() => {
    const timeframes = filterNonNullable(
      reservationUnit.reservableTimeSpans
    ).filter(
      (n) =>
        n?.startDatetime != null &&
        date != null &&
        isSameDay(new Date(n.startDatetime), date)
    );

    if (timeframes.length === 0) {
      return {
        startTime: undefined,
        endTime: undefined,
      };
    }

    const possibleStartTimes = timeframes
      .map((n) => n.startDatetime != null && new Date(n.startDatetime))
      .filter((n): n is Date => n != null);
    const first = min(possibleStartTimes);
    const possibleEndTimes = timeframes
      .map((n) => n.endDatetime && new Date(n.endDatetime))
      .filter((n): n is Date => n != null);
    const last = max(possibleEndTimes);

    return {
      startTime: first ? first.toISOString() : undefined,
      endTime: last ? last.toISOString() : undefined,
    };
  }, [reservationUnit?.reservableTimeSpans, date]);

  const startingTimesOptions: OptionType[] = useMemo(() => {
    const durations = durationOptions
      .filter((n) => n.label !== "")
      .map((n) => n.value);

    if (
      date == null ||
      dayStartTime == null ||
      dayEndTime == null ||
      durations == null
    ) {
      return [];
    }

    const durationInMinutes = (durations[0] as number) * 60;

    return getDayIntervals(
      format(new Date(dayStartTime), "HH:mm"),
      format(new Date(dayEndTime), "HH:mm"),
      reservationUnit.reservationStartInterval
    )
      .filter((n) => {
        const [hours, minutes] = n.split(":").map(Number);
        if (hours == null || minutes == null) return false;

        const d = new Date(date);
        d.setHours(hours, minutes);
        const e = addMinutes(d, durationInMinutes);
        return isSlotReservable(d, e);
      })
      .map((n) => ({
        label: trimStart(n.substring(0, 5), "0"),
        value: trimStart(n.substring(0, 5), "0"),
      }));
  }, [
    dayStartTime,
    dayEndTime,
    reservationUnit.reservationStartInterval,
    durationOptions,
    isSlotReservable,
    date,
  ]);

  const isReservable = useMemo(
    () =>
      !!duration &&
      !!initialReservation &&
      initialReservation?.begin &&
      initialReservation?.end &&
      isSlotReservable(
        new Date(initialReservation.begin),
        new Date(initialReservation.end)
      ),
    [duration, initialReservation, isSlotReservable]
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
      `${capitalize(beginDate)} ${beginTime}${
        endDate !== beginDate ? ` - ${capitalize(endDate)} ` : "-"
      }${endTime}`,
      "-"
    );
    const durationStr =
      end != null && begin != null
        ? formatDurationMinutes(
            differenceInMinutes(new Date(end), new Date(begin))
          )
        : "";

    return `${dateStr}, ${durationStr}`;
  })();

  const minutes =
    (Number.isNaN(Number(duration?.value)) ? 0 : Number(duration?.value)) * 60;
  const price =
    date != null
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: date,
          minutes,
          trailingZeros: true,
        })
      : undefined;

  const lastOpeningDate = maxBy(
    reservationUnit.reservableTimeSpans,
    (n) => n?.startDatetime
  );

  const submitButton = createReservation ? (
    <SubmitButtonWrapper>
      <LoginFragment
        isActionDisabled={!isReservable}
        actionCallback={() => {
          if (reservationUnit.pk != null && initialReservation != null) {
            setStoredReservation({
              ...initialReservation,
              pk: null,
              price: null,
              reservationUnitPk: reservationUnit.pk ?? 0,
            });
          }
        }}
        componentIfAuthenticated={
          <SubmitButton
            onClick={() => {
              if (reservationUnit.pk != null && initialReservation != null) {
                createReservation({
                  ...initialReservation,
                  price: null,
                  reservationUnitPk: reservationUnit.pk,
                });
              }
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
                  <TogglerDate>{togglerLabel}</TogglerDate>
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
              if (
                shouldCalendarControlsBeVisible &&
                setShouldCalendarControlsBeVisible != null
              ) {
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
                if (!val || !isValid(valueAsDate) || valueAsDate < new Date()) {
                  setInitialReservation(null);
                } else {
                  setDate(valueAsDate);
                  setCalendarFocusDate(valueAsDate);
                }
              }}
              value={date != null ? toUIDate(date) : ""}
              id="reservation__input--date"
              initialMonth={new Date()}
              label={t("reservationCalendar:startDate")}
              language={getLocalizationLang(i18n.language)}
              minDate={new Date()}
              maxDate={
                lastOpeningDate?.startDatetime
                  ? new Date(lastOpeningDate.startDatetime)
                  : new Date()
              }
            />
            <StyledSelect
              id="reservation__input--start-time"
              label={t("reservationCalendar:startTime")}
              onChange={(val: OptionType) => {
                if (val.value != null) {
                  setStartTime(val.value?.toString());
                }
              }}
              options={startingTimesOptions}
              value={startingTimesOptions.find((n) => n.value === startTime)}
            />
            <div data-testid="reservation__input--duration">
              <StyledSelect
                id="reservation__input--duration"
                label={t("reservationCalendar:duration")}
                onChange={(val: OptionType) => {
                  setDuration(val);
                }}
                options={durationOptions}
                value={duration}
              />
            </div>
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
                setDuration(null);
                setInitialReservation(null);
              }}
              disabled={!startTime}
              $isLast={mode === "edit"}
            >
              {t("searchForm:resetForm")}
            </ResetButton>
            {mode === "edit" && (
              <SelectButton
                onClick={() => setAreControlsVisible(false)}
                disabled={!startTime}
                data-testid="reservation__button--select-time"
              >
                {t("reservationCalendar:selectTime")}
              </SelectButton>
            )}
            {mode === "create" && submitButton}
          </Content>
        )}
      </Transition>
    </Wrapper>
  );
};

export default ReservationCalendarControls;
