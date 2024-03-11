import React, { useEffect, useState } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { isValid, parseISO, startOfDay } from "date-fns";
import {
  Button,
  DateInput,
  IconAngleDown,
  IconAngleUp,
  IconCross,
  Select,
} from "hds-react";
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
import { getLocalizationLang } from "common/src/helpers";
import { MediumButton, truncatedText } from "@/styles/util";
import {
  getReservationUnitPrice,
  getTimeString,
} from "@/modules/reservationUnit";
import LoginFragment from "../LoginFragment";
import {
  capitalize,
  formatDuration,
  getPostLoginUrl,
  getSelectedOption,
} from "@/modules/util";
import type { SubmitHandler, UseFormReturn } from "react-hook-form";
import type { TimeRange } from "@/components/reservation-unit/QuickReservation";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";

export type FocusTimeSlot = TimeRange & {
  isReservable: boolean;
  durationMinutes: number;
};

type Props = {
  reservationUnit: ReservationUnitType;
  isReserving: boolean;
  mode: string;
  shouldCalendarControlsBeVisible?: boolean;
  setShouldCalendarControlsBeVisible?: (value: boolean) => void;
  apiBaseUrl: string;
  isAnimated?: boolean;
  reservationForm: UseFormReturn<{
    duration?: number;
    date?: string;
    time?: string;
  }>;
  durationOptions: OptionType[];
  availableTimesForDay: string[];
  startingTimeOptions: OptionType[];
  focusSlot: FocusTimeSlot;
  storeReservationForLogin: () => void;
  submitReservation: SubmitHandler<PendingReservationFormType>;
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
    grid-template-columns: 154px 105px 140px minmax(100px, 1fr) 110px auto;
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
  apiBaseUrl,
  isAnimated = false,
  reservationForm,
  durationOptions,
  focusSlot,
  storeReservationForLogin,
  startingTimeOptions,
  submitReservation,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const { setValue, watch, handleSubmit } = reservationForm;
  const { start, end } = focusSlot ?? {};
  const formDate = watch("date");
  const formDuration = watch("duration");
  const date = new Date(formDate ?? "");
  const duration = Number.isNaN(Number(formDuration))
    ? reservationUnit.minReservationDuration ?? 0
    : Number(formDuration);
  const time = watch("time") ?? getTimeString();
  const selectedDuration: OptionType = getSelectedOption(
    duration,
    durationOptions
  ) as OptionType;
  const selectedTime = getSelectedOption(time.toString(), startingTimeOptions);
  const [areControlsVisible, setAreControlsVisible] = useState(false);

  useEffect(() => {
    if (setShouldCalendarControlsBeVisible) {
      setAreControlsVisible(shouldCalendarControlsBeVisible ?? false);
    }
  }, [setShouldCalendarControlsBeVisible, shouldCalendarControlsBeVisible]);

  const startDate = t("common:dateWithWeekday", {
    date: start && parseISO(start.toISOString()),
  });

  const startTime = t("common:timeInForm", {
    date: start && parseISO(start.toISOString()),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end.toISOString()),
  });

  const endTime = t("common:timeInForm", {
    date: end && parseISO(end.toISOString()),
  });

  const togglerLabel = (() => {
    const dateStr = trim(
      `${capitalize(startDate)} ${startTime}${
        endDate !== startDate ? ` - ${capitalize(endDate)} ` : "-"
      }${endTime}`,
      "-"
    );
    const durationStr = duration != null ? formatDuration(duration, t) : "";

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

  const submitButton =
    mode === "create" ? (
      <SubmitButtonWrapper>
        <LoginFragment
          isActionDisabled={!focusSlot.isReservable}
          apiBaseUrl={apiBaseUrl}
          actionCallback={() => storeReservationForLogin()}
          componentIfAuthenticated={
            <SubmitButton
              type="submit"
              disabled={!focusSlot.isReservable}
              isLoading={reservationForm.formState.isSubmitting}
              loadingText={t("reservationCalendar:makeReservationLoading")}
              data-test="reservation__button--submit"
            >
              {t("reservationCalendar:makeReservation")}
            </SubmitButton>
          }
          returnUrl={getPostLoginUrl()}
        />
      </SubmitButtonWrapper>
    ) : null;

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
          {focusSlot.isReservable && !areControlsVisible && submitButton}
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
                    val &&
                    isValid(valueAsDate) &&
                    valueAsDate > startOfDay(new Date())
                  ) {
                    setValue("date", valueAsDate.toISOString());
                  }
                }}
                value={date != null ? toUIDate(date) : ""}
                id="reservation__input--date"
                initialMonth={new Date()}
                label={t("reservationCalendar:startDate")}
                language={getLocalizationLang(i18n.language)}
                minDate={new Date()}
                maxDate={
                  lastOpeningDate?.endDatetime
                    ? new Date(lastOpeningDate.endDatetime)
                    : new Date()
                }
              />
              <StyledSelect
                id="reservation__input--start-time"
                key={`startTimeSelect-${selectedTime?.value}`}
                label={t("reservationCalendar:startTime")}
                onChange={(val: OptionType) => {
                  setValue("time", val.value?.toString());
                }}
                options={startingTimeOptions}
                defaultValue={selectedTime}
                disabled={!(startingTimeOptions?.length >= 1)}
              />
              <div data-testid="reservation__input--duration">
                <StyledSelect
                  key={`durationSelect-${selectedDuration?.value}`}
                  id="reservation__input--duration"
                  label={t("reservationCalendar:duration")}
                  onChange={(val: OptionType) =>
                    setValue("duration", Number(val.value))
                  }
                  options={durationOptions}
                  defaultValue={selectedDuration}
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
                disabled={!selectedTime}
                $isLast={mode === "edit"}
              >
                {t("searchForm:resetForm")}
              </ResetButton>
              {mode === "edit" && (
                <SelectButton
                  onClick={() => setAreControlsVisible(false)}
                  disabled={!selectedTime}
                  data-testid="reservation__button--select-time"
                >
                  {t("reservationCalendar:selectTime")}
                </SelectButton>
              )}
              {mode === "create" && submitButton}
            </Content>
          )}
        </Transition>
      </form>
    </Wrapper>
  );
};

export default ReservationCalendarControls;
