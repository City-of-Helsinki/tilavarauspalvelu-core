import React, { useEffect, useMemo, useState } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { Button, IconAngleDown, IconAngleUp, IconCross } from "hds-react";
import { maxBy, trim } from "lodash";
import { toUIDate } from "common/src/common/util";
import { Transition } from "react-transition-group";
import type { OptionType } from "common/types/common";
import {
  fontBold,
  fontMedium,
  fontRegular,
} from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationUnitType } from "common/types/gql-types";
import { MediumButton, truncatedText } from "@/styles/util";
import {
  getReservationUnitPrice,
  getTimeString,
} from "@/modules/reservationUnit";
import { capitalize, getSelectedOption } from "@/modules/util";
import type { SubmitHandler, UseFormReturn } from "react-hook-form";
import type { TimeRange } from "@/components/reservation-unit/QuickReservation";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";
import ControlledDateInput from "@/components/common/ControlledDateInput";
import ControlledSelect from "@/components/common/ControlledSelect";

export type FocusTimeSlot = TimeRange & {
  isReservable: boolean;
  durationMinutes: number;
};

type Props = {
  reservationUnit: ReservationUnitType;
  mode: string;
  shouldCalendarControlsBeVisible?: boolean;
  setShouldCalendarControlsBeVisible?: (value: boolean) => void;
  isAnimated?: boolean;
  reservationForm: UseFormReturn<{
    duration?: number;
    date?: string;
    time?: string;
  }>;
  durationOptions: OptionType[];
  startingTimeOptions: string[];
  focusSlot: FocusTimeSlot;
  submitReservation: SubmitHandler<PendingReservationFormType>;
  LoginAndSubmit?: JSX.Element;
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
    grid-template-columns: 154px 120px 140px minmax(100px, 1fr) 110px auto;
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

const Price = styled.div`
  display: flex;
  align-items: center;
  height: 58px;
  ${fontRegular};
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
`;

const ResetButton = styled(Button).attrs({
  variant: "secondary",
  iconLeft: <IconCross aria-hidden />,
})<{ $isLast: boolean }>`
  --color: var(--color-black);
  white-space: nowrap;
  order: 1;

  && {
    border: var(--border-width) solid var(--color-black-50) !important;
    &:hover,
    &:focus-within {
      border-color: var(--color-black) !important;
    }
  }

  span {
    ${fontRegular};
    padding-left: 0;
  }

  svg {
    min-width: 24px;
  }

  @media (min-width: ${breakpoints.m}) {
    order: unset;
    grid-column: ${({ $isLast }) => ($isLast ? "4" : "3")} / 4;
  }

  @media (min-width: ${breakpoints.xl}) {
    grid-column: unset;

    [class*="Button-module__icon"] {
      display: none;
    }
  }
`;

const SelectButton = styled(Button)`
  order: 7;
  ${truncatedText};

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

const StyledControlledSelect = styled(ControlledSelect)`
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

const TogglerLabelContent = ({
  areControlsVisible,
  togglerLabel,
  t,
  price,
}: {
  areControlsVisible: boolean;
  togglerLabel: string;
  t: TFunction;
  price?: string;
}) => {
  if (areControlsVisible) return <div>&nbsp;</div>;
  return (
    <>
      <TogglerDate>{togglerLabel}</TogglerDate>
      <TogglerPrice>
        {t("reservationUnit:price")}: {price}
      </TogglerPrice>
    </>
  );
};

const ReservationCalendarControls = ({
  reservationUnit,
  mode,
  shouldCalendarControlsBeVisible,
  setShouldCalendarControlsBeVisible,
  isAnimated = false,
  reservationForm,
  durationOptions,
  focusSlot,
  startingTimeOptions,
  submitReservation,
  LoginAndSubmit,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { watch, handleSubmit } = reservationForm;
  const { start, end } = focusSlot ?? {};
  const formDate = watch("date");
  const formDuration = watch("duration");
  const date = new Date(formDate ?? "");
  const dateValue = useMemo(() => new Date(formDate ?? ""), [formDate]);
  const focusDate = useMemo(
    () => focusSlot?.start ?? dateValue,
    [focusSlot, dateValue]
  );
  const duration = !Number.isNaN(Number(formDuration))
    ? Number(formDuration)
    : reservationUnit.minReservationDuration ?? 0;
  const time = watch("time") ?? getTimeString(focusDate);
  const [areControlsVisible, setAreControlsVisible] = useState(false);

  useEffect(() => {
    if (setShouldCalendarControlsBeVisible) {
      setAreControlsVisible(shouldCalendarControlsBeVisible ?? false);
    }
  }, [setShouldCalendarControlsBeVisible, shouldCalendarControlsBeVisible]);

  const startDate = t("common:dateWithWeekday", {
    date: start && toUIDate(start),
  });

  const startTime = t("common:timeInForm", {
    date: time,
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && toUIDate(end),
  });

  const endTime = t("common:timeInForm", {
    date: end && getTimeString(end),
  });

  const togglerLabel = (() => {
    const dateStr = trim(
      `${capitalize(startDate)} ${startTime}${
        endDate !== startDate ? ` - ${capitalize(endDate)} ` : "-"
      }${endTime}`,
      "-"
    );
    const durationStr =
      duration != null
        ? getSelectedOption(duration, durationOptions)?.label
        : "";

    return `${dateStr}, ${durationStr}`;
  })();

  const price =
    date != null && duration != null
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: date,
          minutes: duration,
          trailingZeros: true,
        })
      : undefined;

  const lastOpeningDate = maxBy(
    reservationUnit.reservableTimeSpans,
    (n) => n?.endDatetime
  );

  return (
    <Wrapper data-testid="reservation-unit__reservation-controls--wrapper">
      <form noValidate onSubmit={handleSubmit(submitReservation)}>
        <TogglerTop>
          <ToggleControls>
            <TogglerLabel>
              {focusSlot.isReservable ? (
                <TogglerLabelContent
                  areControlsVisible={areControlsVisible}
                  togglerLabel={togglerLabel}
                  t={t}
                  price={price}
                />
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
              type="button"
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
          {focusSlot.isReservable && !areControlsVisible && LoginAndSubmit}
        </TogglerBottom>
        <Transition
          mountOnEnter
          unmountOnExit
          timeout={isAnimated ? 500 : 0}
          in={areControlsVisible}
        >
          {(state) => (
            <Content className={state} $isAnimated={isAnimated}>
              <ControlledDateInput
                name="date"
                control={reservationForm.control}
                label={t("reservationCalendar:startDate")}
                initialMonth={dateValue ?? new Date()}
                minDate={new Date()}
                maxDate={
                  lastOpeningDate?.endDatetime
                    ? new Date(lastOpeningDate.endDatetime)
                    : new Date()
                }
              />
              <StyledControlledSelect
                name="time"
                label={t("reservationCalendar:startTime")}
                control={reservationForm.control}
                options={startingTimeOptions}
                disabled={!(startingTimeOptions?.length >= 1) && !time}
              />
              <div data-testid="reservation__input--duration">
                <StyledControlledSelect
                  name="duration"
                  control={reservationForm.control}
                  label={t("reservationCalendar:duration")}
                  options={durationOptions}
                />
              </div>
              <PriceWrapper>
                {focusSlot.isReservable && (
                  <>
                    <label htmlFor="price">{t("reservationUnit:price")}</label>
                    <Price id="price" data-testid="reservation__price--value">
                      {price}
                    </Price>
                  </>
                )}
              </PriceWrapper>
              <ResetButton
                onClick={() => reservationForm.reset()}
                disabled={!focusSlot}
                $isLast={mode === "edit"}
              >
                {t("searchForm:resetForm")}
              </ResetButton>
              {mode === "edit" && (
                <SelectButton
                  onClick={() => setAreControlsVisible(false)}
                  disabled={!focusSlot.isReservable}
                  data-testid="reservation__button--select-time"
                >
                  {t("reservationCalendar:selectTime")}
                </SelectButton>
              )}
              {mode === "create" && (
                <SubmitButtonWrapper>{LoginAndSubmit}</SubmitButtonWrapper>
              )}
            </Content>
          )}
        </Transition>
      </form>
    </Wrapper>
  );
};

export default ReservationCalendarControls;
