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
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import {
  capitalize,
  formatDateTimeRange,
  getSelectedOption,
} from "@/modules/util";
import {
  useController,
  type Control,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { useMedia } from "react-use";
import { type FocusTimeSlot } from "@/modules/reservation";
import { ControlledDateInput } from "common/src/components/form";
import { Flex } from "common/styles/util";

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
type CommonProps = {
  reservationUnit: QueryT;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  durationOptions: { label: string; value: number }[];
  startingTimeOptions: { label: string; value: string }[];
  focusSlot: FocusTimeSlot;
  submitReservation: SubmitHandler<PendingReservationFormType>;
};
type Props =
  | (CommonProps & {
      mode: "create";
      submitButton: JSX.Element;
    })
  | (CommonProps & {
      mode: "edit";
    });

const ToggleButton = styled.button`
  background: var(--color-white);
  border: 0;
  cursor: pointer;
`;

const TogglerLabel = styled.div`
  padding: var(--spacing-xs) 0;
`;

const TogglerDate = styled.div`
  ${fontBold}
`;

const Content = styled.div<{ $isAnimated: boolean }>`
  /* kinda clean solution to the problem, scales effortlessly
   * causes no pop-out because the content doesn't fit etc.
   * TODO: fix some positions so for example submit button is always aligned to the bottom right
   * TODO: there is empty space on the row of the toggle button
   * */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--spacing-xs);
  /* buttons and selects are different sizes, dont stretch them */
  align-items: end;

  /* TODO not fan of the animation, it's jerky and the submit button disappears and reappears
   * because it's rendered twice (inside and out of the accordion)
   * cleaner would be to use visibility transition or custom transform-y to bring the new elements
   * from the top while pushing the submit button down.
   */
  ${({ $isAnimated }) =>
    $isAnimated &&
    `
    max-height: 0;
    transition: max-height 0.5s ease-out;

    &.entering,
    &.entered {
      max-height: 600px;
      padding: var(--spacing-s) 0 var(--spacing-m) 0;
    }

    &.exiting,
    &.entering {
      overflow-y: hidden;
    }
  `}

  /* necessary but not a fan of doing it like this, make a separate component or use html defaults */
  label {
    ${fontMedium};
  }
`;

const PriceWrapper = styled.div`
  display: grid;
  grid-template-columns: subgrid;
`;

const Price = styled.div`
  ${fontRegular};
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
`;

const ResetButton = styled(Button).attrs({
  variant: "secondary",
  iconLeft: <IconCross aria-hidden />,
})<{ $isLast?: boolean }>`
  && {
    --border-color: var(--color-black-50);
    --font-family: var(--font-regular);
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
  price: string | null;
}) {
  if (areControlsVisible) {
    return <div>&nbsp;</div>;
  }
  return (
    <>
      <TogglerDate>{togglerLabel}</TogglerDate>
      <div>
        {t("common:price")}: {price}
      </div>
    </>
  );
}

export function ReservationCalendarControls({
  reservationUnit,
  mode,
  reservationForm,
  durationOptions,
  focusSlot,
  startingTimeOptions,
  submitReservation,
  ...rest
}: Props): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const { control, watch, handleSubmit } = reservationForm;
  const formDate = watch("date");
  const formDuration = watch("duration");
  const dateValue = useMemo(() => fromUIDate(formDate ?? ""), [formDate]);

  const duration = !Number.isNaN(Number(formDuration))
    ? Number(formDuration)
    : (reservationUnit.minReservationDuration ?? 0);

  const price =
    dateValue != null && duration != null
      ? getReservationUnitPrice({
          t,
          reservationUnit,
          pricingDate: dateValue,
          minutes: duration,
        })
      : null;

  const lastOpeningDate = maxBy(
    reservationUnit.reservableTimeSpans,
    (n) => n?.endDatetime
  );

  const areControlsVisible = watch("isControlsVisible");

  const submitButton = "submitButton" in rest ? rest.submitButton : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submitReservation)}
      data-testid="reservation-unit__reservation-controls--wrapper"
    >
      <ControlledToggler
        form={reservationForm}
        focusSlot={focusSlot}
        price={price}
        durationOptions={durationOptions}
      />
      {/* TODO the submit button part should be refactored so that we hide the other buttons instead of
       * adding a second submit button */}
      {focusSlot.isReservable && !areControlsVisible && (
        <Flex $align="flex-end">{submitButton}</Flex>
      )}
      <Transition
        mountOnEnter
        unmountOnExit
        timeout={isMobile ? 500 : 0}
        in={areControlsVisible}
      >
        {(state) => (
          <Content className={state} $isAnimated={isMobile}>
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
              <ControlledSelect
                name="duration"
                // react-hook-form has issues with typing generic Select
                control={control as unknown as Control<FieldValues>}
                label={t("reservationCalendar:duration")}
                options={durationOptions}
              />
            </div>
            <ControlledSelect
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
                  {/* TODO for doesn't work with div either change it to disabled input or remove it */}
                  <label htmlFor="price">{t("common:price")}</label>
                  <Price id="price" data-testid="reservation__price--value">
                    {price}
                  </Price>
                </>
              )}
            </PriceWrapper>
            <ResetButton
              onClick={() => reservationForm.reset()}
              disabled={!focusSlot}
            >
              {t("searchForm:resetForm")}
            </ResetButton>
            {mode === "create" && submitButton ? (
              <Flex
                style={{
                  gridColumnEnd: "-1",
                }}
              >
                {submitButton}
              </Flex>
            ) : null}
          </Content>
        )}
      </Transition>
    </form>
  );
}

function ControlledToggler({
  form,
  focusSlot,
  price,
  durationOptions,
}: {
  form: UseFormReturn<PendingReservationFormType>;
  focusSlot: FocusTimeSlot;
  price: string | null;
  durationOptions: { label: string; value: number }[];
}): JSX.Element {
  const { t } = useTranslation();
  const { control, watch } = form;

  const duration = watch("duration");

  const togglerLabel = (() => {
    if (!focusSlot.isReservable) {
      return t("reservationCalendar:selectTime");
    }
    const dateStr = capitalize(
      formatDateTimeRange(t, focusSlot.start, focusSlot.end)
    );
    const durationStr = getSelectedOption(duration, durationOptions)?.label;

    return `${dateStr}, ${durationStr}`;
  })();

  const {
    field: { onChange, value },
  } = useController({
    name: "isControlsVisible",
    control,
  });

  return (
    <Flex $align="flex-start" $justify="space-between" $direction="row">
      <TogglerLabel>
        {focusSlot.isReservable ? (
          <TogglerLabelContent
            areControlsVisible={value}
            togglerLabel={togglerLabel}
            t={t}
            price={price}
          />
        ) : (
          t("reservationCalendar:selectTime")
        )}
      </TogglerLabel>
      <ToggleButton
        onClick={() => onChange(!value)}
        data-testid="reservation-unit__reservation-controls--toggle-button"
        type="button"
      >
        {value ? (
          <IconAngleDown aria-label={t("common:showLess")} size="m" />
        ) : (
          <IconAngleUp aria-label={t("common:showMore")} size="m" />
        )}
      </ToggleButton>
    </Flex>
  );
}
