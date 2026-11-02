import React, { useMemo } from "react";
import type { Control } from "react-hook-form";
import { Controller, useController, useFormContext, useWatch } from "react-hook-form";
import { gql } from "@apollo/client";
import { Button, ButtonSize, ButtonVariant, Notification, NotificationSize, RadioButton } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { arrow, WeeklyPatternLegend } from "@ui/components/WeeklyPatternCalendar/styles";
import type { WeeklyPatternCellInfo, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { WeeklyPatternCalendar } from "@ui/components/WeeklyPatternCalendar/WeeklyPatternCalendar";
import { ErrorText } from "ui/src/components/ErrorText";
import { ControlledSelect } from "ui/src/components/form";
import { successToast } from "ui/src/components/toast";
import { filterNonNullable } from "ui/src/modules/helpers";
import {
  fromPattern,
  priorityKey,
  SUITABLE_TIME_STEP_MINUTES,
  SUITABLE_TIME_VISIBLE_HOURS,
  toAvailability,
  toPattern,
} from "ui/src/modules/suitableTimes";
import type { SuitableTimeData } from "ui/src/modules/suitableTimes";
import { Flex } from "ui/src/styled";
import { Priority } from "@gql/gql-types";
import type { TimeSelectorFragment } from "@gql/gql-types";
import { TimePreview } from "@/components/application/funnel/TimePreview";
import type { ApplicationPage2FormValues } from "./form";
import { SuitableTimeRangeForm } from "./SuitableTimeRangeForm";

export type TimeSelectorProps = {
  index: number;
  reservationUnitOptions: Array<{ label: string; value: number }>;
  reservationUnitOpeningHours: Readonly<TimeSelectorFragment[]>;
  /**
   * The opening hours of every reservation unit in the section. A time that one of them opens can be applied for,
   * whichever unit is shown, so the calendar and the form both paint inside these.
   */
  sectionOpeningHours: Readonly<TimeSelectorFragment[]>;
};

export function TimeSelectorForm({
  index,
  reservationUnitOptions,
  reservationUnitOpeningHours,
  sectionOpeningHours,
}: TimeSelectorProps): React.ReactElement | null {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext<ApplicationPage2FormValues>();
  const applicationSections = useWatch({ name: "applicationSections", control });
  const priority = useWatch({ name: `applicationSections.${index}.priority`, control }) as Priority;
  const availability = useMemo(() => toAvailability(reservationUnitOpeningHours), [reservationUnitOpeningHours]);
  const paintable = useMemo(() => toAvailability(sectionOpeningHours), [sectionOpeningHours]);

  const copyCells = () => {
    // Normalising through the pattern drops the source section's primary keys, which must not leak to other sections.
    const times = fromPattern(toPattern(getValues(`applicationSections.${index}.suitableTimeRanges`)));
    for (const i of getValues("applicationSections").keys()) {
      setValue(`applicationSections.${i}.suitableTimeRanges`, times, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    }
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };

  const formId = `time-selector__form-${index}`;

  const enableCopyCells = filterNonNullable(applicationSections).length > 1;
  const onChange = (pattern: WeeklyPatternValue<SuitableTimeData>) => {
    setValue(`applicationSections.${index}.suitableTimeRanges`, fromPattern(pattern), {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const getStateLabel = (cell: WeeklyPatternCellInfo<SuitableTimeData>) =>
    t(`application:TimeSelector.legend.${cell.data ? priorityKey(cell.data.priority) : cell.availability}`);
  return (
    // NOTE flex inside a grid container breaks overflow-x
    <Flex style={{ display: "grid" }} $marginTop="m">
      <Notification label={t("application:Page2.info")} size={NotificationSize.Small} type="info">
        {t("application:Page2.info")}
      </Notification>
      <PrioritySelector index={index} control={control} />
      <ControlledSelect
        name={`applicationSections.${index}.reservationUnitPk`}
        label={t("application:Page2.reservationUnitSelectLabel")}
        control={control}
        options={reservationUnitOptions}
      />
      <Controller
        control={control}
        name={`applicationSections.${index}.suitableTimeRanges`}
        render={({ field }) => (
          <WeeklyPatternCalendar<SuitableTimeData>
            ref={field.ref}
            name={field.name}
            value={toPattern(field.value)}
            onChange={(pattern) => onChange(pattern)}
            onBlur={field.onBlur}
            step={SUITABLE_TIME_STEP_MINUTES}
            availability={availability}
            paintable={paintable}
            visibleHours={SUITABLE_TIME_VISIBLE_HOURS}
            brush={{ priority }}
            getStateLabel={(cell) => getStateLabel(cell)}
            getCellAppearance={({ priority: cellPriority }) =>
              cellPriority === Priority.Primary ? "primary" : "secondary"
            }
            announcements={{
              painted: t("application:TimeSelector.announcements.painted"),
              erased: t("application:TimeSelector.announcements.erased"),
            }}
            alternative={{ id: formId, label: t("application:TimeSelector.skipToForm") }}
            aria-label={t("application:TimeSelector.calendarLabel")}
          />
        )}
      />
      <WeeklyPatternLegend
        items={[
          { state: "open", label: t("application:TimeSelector.legend.open") },
          { state: "closed", label: t("application:TimeSelector.legend.closed") },
          { state: "unavailable", label: t("application:TimeSelector.legend.unavailable") },
        ]}
      />

      <SuitableTimeRangeForm id={formId} index={index} openingHours={sectionOpeningHours} />
      <div data-testid={`time-selector__preview-${index}`}>
        <TimePreview index={index} />
      </div>
      {enableCopyCells && (
        <div>
          <Button
            id={`time-selector__button--copy-cells-${index}`}
            variant={ButtonVariant.Secondary}
            onClick={copyCells}
            size={ButtonSize.Small}
          >
            {t("application:Page2.copyTimes")}
          </Button>
        </div>
      )}
      <ErrorMessage index={index} />
    </Flex>
  );
}

const RadioGroup = styled.fieldset`
  width: 100%;
  display: flex;
  flex-direction: row;
  border: none;
  padding: 0;
  margin: 0;
  gap: 80px;
`;

const PriorityRadioButton = styled(RadioButton)`
  position: relative;
  width: 50%;
  && {
    margin-top: 0;
  }
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    display: block;
    content: "";
    width: 30px;
    height: 30px;
    background-color: var(--color-bus);
    color: var(--color-white);
  }
  &:after {
    ${arrow};
    left: auto;
    right: 11px;
    top: 3px;
    border-bottom: 10px solid var(--color-white);
  }
  &:last-of-type {
    &:before {
      background-color: var(--color-engel);
      border: 1px solid var(--color-black);
    }
    &:after {
      border-bottom: none;
      border-top: 10px solid var(--color-black);
    }
  }
`;

function PrioritySelector({ index, control }: { index: number; control: Control<ApplicationPage2FormValues> }) {
  const { t } = useTranslation();
  const name = `applicationSections.${index}.priority` as const;
  const { field } = useController({ name, control });
  const priorityOptions = [Priority.Primary, Priority.Secondary].map((n) => ({
    label: t(`application:Page2.priorityLabels.${priorityKey(n)}`),
    value: n,
  }));
  return (
    <RadioGroup>
      {priorityOptions.map((opt) => {
        const checked = field.value === opt.value;
        return (
          <PriorityRadioButton
            id={`${name}.${opt.label}`}
            name={name}
            key={opt.label + checked}
            label={opt.label}
            onChange={() => field.onChange(opt.value)}
            checked={checked}
          />
        );
      })}
    </RadioGroup>
  );
}

function ErrorMessage({ index }: { index: number }): React.ReactElement | null {
  const { t } = useTranslation();
  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const { getFieldState } = useFormContext<ApplicationPage2FormValues>();
  const state = getFieldState(fieldName);
  if (!state.invalid) {
    return null;
  }
  const errorMsg = state.error?.message;
  const msg = errorMsg ? t(`application:validation.calendar.${errorMsg}`) : t("errors:general_error");

  return (
    <ErrorText
      size={NotificationSize.Medium}
      title={t("application:validation.calendar.title")}
      data-testid="application__page2--notification-min-duration"
    >
      {msg}
    </ErrorText>
  );
}

export const TIME_SELECTOR_FRAGMENT = gql`
  fragment TimeSelector on ApplicationRoundTimeSlotNode {
    id
    weekday
    isClosed
    reservableTimes {
      begin
      end
    }
  }
`;
