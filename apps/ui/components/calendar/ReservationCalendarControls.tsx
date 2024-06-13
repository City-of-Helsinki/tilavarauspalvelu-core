import React, { useMemo } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { Button, IconAngleDown, IconAngleUp, IconCross } from "hds-react";
import { maxBy } from "lodash";
import { fromUIDate } from "common/src/common/util";
import { Transition } from "react-transition-group";
import {
  fontBold,
  fontMedium,
  fontRegular,
} from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import type { ReservationUnitPageQuery } from "@gql/gql-types";
import { truncatedText } from "@/styles/util";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import {
  capitalize,
  formatDateTimeRange,
  getSelectedOption,
} from "@/modules/util";
import {
  Controller,
  type Control,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import type { TimeRange } from "@/components/reservation-unit/QuickReservation";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";
import ControlledDateInput from "@/components/common/ControlledDateInput";
import { ControlledSelect } from "@/components/common/ControlledSelect";

export type FocusTimeSlot = TimeRange & {
  isReservable: boolean;
  durationMinutes: number;
};

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
type Props = {
  reservationUnit: QueryT;
  mode: string;
  isAnimated?: boolean;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  durationOptions: { label: string; value: number }[];
  startingTimeOptions: { label: string; value: string }[];
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
    grid-template-columns:
      154px 140px minmax(max-content, 190px) minmax(90px, 1fr)
      110px auto;
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

function TogglerLabelContent({
  areControlsVisible,
  togglerLabel,
  t,
  price,
}: {
  areControlsVisible: boolean;
  togglerLabel: string;
  t: TFunction;
  price?: string;
}) {
  if (areControlsVisible) {
    return <div>&nbsp;</div>;
  }
  return (
    <>
      <TogglerDate>{togglerLabel}</TogglerDate>
      <TogglerPrice>
        {t("reservationUnit:price")}: {price}
      </TogglerPrice>
    </>
  );
}

function ReservationCalendarControls({
  reservationUnit,
  mode,
  isAnimated = false,
  reservationForm,
  durationOptions,
  focusSlot,
  startingTimeOptions,
  submitReservation,
  LoginAndSubmit,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { control, watch, handleSubmit, setValue } = reservationForm;
  const formDate = watch("date");
  const formDuration = watch("duration");
  const date = new Date(formDate ?? "");
  const dateValue = useMemo(() => fromUIDate(formDate ?? ""), [formDate]);
  const duration = !Number.isNaN(Number(formDuration))
    ? Number(formDuration)
    : reservationUnit.minReservationDuration ?? 0;

  const togglerLabel = (() => {
    const dateStr = capitalize(
      formatDateTimeRange(t, focusSlot.start, focusSlot.end)
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

  const areControlsVisible = watch("isControlsVisible");

  return (
    <Wrapper data-testid="reservation-unit__reservation-controls--wrapper">
      <form noValidate onSubmit={handleSubmit(submitReservation)}>
        <TogglerTop>
          <Controller
            name="isControlsVisible"
            control={control}
            render={({ field }) => (
              <ToggleControls>
                <TogglerLabel>
                  {focusSlot.isReservable ? (
                    <TogglerLabelContent
                      areControlsVisible={field.value}
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
                    field.onChange(!field.value);
                  }}
                  data-testid="reservation-unit__reservation-controls--toggle-button"
                  type="button"
                >
                  {field.value ? (
                    <IconAngleDown aria-label={t("common:showLess")} size="m" />
                  ) : (
                    <IconAngleUp aria-label={t("common:showMore")} size="m" />
                  )}
                </ToggleButton>
              </ToggleControls>
            )}
          />
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
                control={control}
                label={t("reservationCalendar:startDate")}
                initialMonth={dateValue ?? new Date()}
                minDate={new Date()}
                maxDate={
                  lastOpeningDate?.endDatetime
                    ? new Date(lastOpeningDate.endDatetime)
                    : new Date()
                }
              />
              <div data-testid="reservation__input--duration">
                <StyledControlledSelect
                  name="duration"
                  // react-hook-form has issues with typing generic Select
                  control={control as unknown as Control<FieldValues>}
                  label={t("reservationCalendar:duration")}
                  options={durationOptions}
                />
              </div>
              <StyledControlledSelect
                name="time"
                label={t("reservationCalendar:startTime")}
                // react-hook-form has issues with typing generic Select
                control={control as unknown as Control<FieldValues>}
                options={startingTimeOptions}
                placeholder={t("common:select")}
              />
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
                  onClick={() => {
                    /* FIXME setValue doesn't work for some reason
                     * controllers do work
                     * */
                    const value = !areControlsVisible;
                    setValue("isControlsVisible", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                  }}
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
}

export default ReservationCalendarControls;
