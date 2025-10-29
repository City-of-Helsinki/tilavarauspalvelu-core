import React, { useMemo } from "react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button, ButtonVariant, IconAngleDown, IconAngleUp, IconCross, IconSize } from "hds-react";
import { maxBy } from "lodash-es";
import { parseUIDate, formatDateTimeRange } from "common/src/modules/date-utils";
import { Transition } from "react-transition-group";
import { Flex, fontBold, fontMedium, fontRegular, SemiBold } from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import type { ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import { type Control, type FieldValues, type SubmitHandler, useController, type UseFormReturn } from "react-hook-form";
import { PendingReservationFormType } from "@/components/reservation-unit/schema";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { useMedia } from "react-use";
import { type FocusTimeSlot } from "@/modules/reservation";
import { ControlledDateInput } from "common/src/components/form";
import { capitalize, getLocalizationLang } from "common/src/modules/helpers";

type CommonProps = {
  reservationUnit: ReservationTimePickerFieldsFragment;
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

const TogglerLabel = styled.div``;

const TogglerDate = styled.div`
  ${fontBold}
`;

const Content = styled.div<{ $isAnimated: boolean }>`
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
  const dateValue = useMemo(() => parseUIDate(formDate ?? ""), [formDate]);

  const duration = !Number.isNaN(Number(formDuration)) ? formDuration : (reservationUnit.minReservationDuration ?? 0);

  const price =
    dateValue != null
      ? getReservationUnitPrice({
          t,
          reservationUnit,
          pricingDate: dateValue,
          minutes: duration,
        })
      : null;

  const lastOpeningDate = maxBy(reservationUnit.reservableTimeSpans, (n) => n?.endDatetime);

  const areControlsVisible = watch("isControlsVisible");

  const submitButton = "submitButton" in rest ? rest.submitButton : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submitReservation)}
      data-testid="reservation-unit__reservation-controls--wrapper"
    >
      <ControlledToggler form={reservationForm} focusSlot={focusSlot} price={price} durationOptions={durationOptions} />
      {/* TODO the submit button part should be refactored so that we hide the other buttons instead of
       * adding a second submit button */}
      {focusSlot.isReservable && !areControlsVisible && <Flex $alignItems="flex-end">{submitButton}</Flex>}
      <Transition mountOnEnter unmountOnExit timeout={isMobile ? 500 : 0} in={areControlsVisible}>
        {(state) => (
          <Content className={state} $isAnimated={isMobile}>
            <ControlledDateInput
              name="date"
              control={control}
              label={t("reservationCalendar:startDate")}
              initialMonth={dateValue ?? new Date()}
              maxDate={lastOpeningDate?.endDatetime ? new Date(lastOpeningDate.endDatetime) : new Date()}
            />
            <div data-testid="calendar-controls__duration">
              <ControlledSelect
                id="calendar-controls__duration"
                name="duration"
                // react-hook-form has issues with typing generic Select
                control={control as unknown as Control<FieldValues>}
                label={t("reservationCalendar:duration")}
                options={durationOptions}
              />
            </div>
            <ControlledSelect
              id="calendar-controls__time"
              name="time"
              label={t("reservationCalendar:startTime")}
              // react-hook-form has issues with typing generic Select
              control={control as unknown as Control<FieldValues>}
              options={startingTimeOptions}
              placeholder={t("common:select")}
            />
            <PriceWrapper>
              {focusSlot.isReservable && price != null && (
                <Price data-testid="calendar-controls__price">
                  {t("common:price")}
                  {": "}
                  <SemiBold>{price}</SemiBold>
                </Price>
              )}
            </PriceWrapper>
            <Button
              onClick={() => reservationForm.reset()}
              disabled={!focusSlot}
              variant={ButtonVariant.Secondary}
              iconStart={<IconCross />}
            >
              {t("common:clear")}
            </Button>
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
  const { t, i18n } = useTranslation();
  const { control, watch } = form;

  const duration = watch("duration");

  const togglerLabel = (() => {
    if (!focusSlot.isReservable) {
      return t("reservationCalendar:selectTime");
    }
    const dateStr = capitalize(
      formatDateTimeRange(focusSlot.start, focusSlot.end, { locale: getLocalizationLang(i18n.language) })
    );
    const selected = durationOptions.find((opt) => opt.value === duration);
    const durationStr = selected?.label ?? "";

    return `${dateStr}, ${durationStr}`;
  })();

  const {
    field: { onChange, value },
  } = useController({
    name: "isControlsVisible",
    control,
  });

  return (
    <Flex $alignItems="flex-start" $justifyContent="space-between" $direction="row">
      <TogglerLabel>
        {focusSlot.isReservable ? (
          <TogglerLabelContent areControlsVisible={value} togglerLabel={togglerLabel} t={t} price={price} />
        ) : (
          t("reservationCalendar:selectTime")
        )}
      </TogglerLabel>
      <ToggleButton
        onClick={() => onChange(!value)}
        data-testid="calendar-controls__toggle-button"
        type="button"
        aria-label={value ? t("common:showLess") : t("common:showMore")}
      >
        {value ? <IconAngleDown size={IconSize.Medium} /> : <IconAngleUp size={IconSize.Medium} />}
      </ToggleButton>
    </Flex>
  );
}
