import React, { useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import { Controller, useController, useFormContext, useFormState, useWatch } from "react-hook-form";
import { gql } from "@apollo/client";
import { Button, ButtonSize, ButtonVariant, NotificationSize, RadioButton } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { arrow, WeeklyPatternLegend } from "@ui/components/WeeklyPatternCalendar/styles";
import type { WeeklyPatternCellInfo, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { WeeklyPatternCalendar } from "@ui/components/WeeklyPatternCalendar/WeeklyPatternCalendar";
import { breakpoints } from "@ui/modules/const";
import { ConfirmationDialog } from "ui/src/components/ConfirmationDialog";
import { ErrorText } from "ui/src/components/ErrorText";
import { ControlledSelect } from "ui/src/components/form";
import { errorToast, successToast } from "ui/src/components/toast";
import { formatDuration } from "ui/src/modules/date-utils";
import { filterNonNullable } from "ui/src/modules/helpers";
import {
  findTooShortReasons,
  fromPattern,
  isInsideOpeningHours,
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
import { OUTSIDE_OPENING_HOURS_ERROR } from "./form";
import type { ApplicationPage2FormValues } from "./form";
import { SuitableTimeRangeForm } from "./SuitableTimeRangeForm";
import { hasSameTimes } from "./timeSelectorModule";

export type TimeSelectorProps = {
  index: number;
  reservationUnitOptions: Array<{ label: string; value: number }>;
  reservationUnitOpeningHours: Readonly<TimeSelectorFragment[]>;
  /**
   * The opening hours of every reservation unit in the section. A time that one of them opens can be applied for,
   * whichever unit is shown, so the calendar and the form both paint inside these.
   */
  sectionOpeningHours: Readonly<TimeSelectorFragment[]>;
  /** `sectionOpeningHours` of every section, by section index, so copied times can be checked against them. */
  allSectionsOpeningHours: ReadonlyArray<Readonly<TimeSelectorFragment[]>>;
};

function sectionNames(sections: ReadonlyArray<{ section: { name: string } }>): string {
  return sections.map(({ section }) => section.name).join(", ");
}

export function TimeSelectorForm({
  index,
  reservationUnitOptions,
  reservationUnitOpeningHours,
  sectionOpeningHours,
  allSectionsOpeningHours,
}: TimeSelectorProps): React.ReactElement | null {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext<ApplicationPage2FormValues>();
  const applicationSections = useWatch({ name: "applicationSections", control });
  const priority = useWatch({ name: `applicationSections.${index}.priority`, control }) as Priority;
  const availability = useMemo(() => toAvailability(reservationUnitOpeningHours), [reservationUnitOpeningHours]);
  const paintable = useMemo(() => toAvailability(sectionOpeningHours), [sectionOpeningHours]);

  // Normalising through the pattern drops the source section's primary keys, which must not leak to other sections.
  const getCopiedTimes = () => fromPattern(toPattern(getValues(`applicationSections.${index}.suitableTimeRanges`)));
  const otherSections = () =>
    filterNonNullable(getValues("applicationSections").map((section, i) => (i === index ? null : { section, i })));

  // The other sections whose own times the copy would replace, asked about before copying.
  const [overwritten, setOverwritten] = useState<string | null>(null);
  const confirmCopyCells = () => {
    const times = getCopiedTimes();
    const replaced = otherSections().filter(
      ({ section }) => section.suitableTimeRanges.length > 0 && !hasSameTimes(section.suitableTimeRanges, times)
    );
    if (replaced.length > 0) {
      setOverwritten(sectionNames(replaced));
    } else {
      copyCells();
    }
  };

  const copyCells = () => {
    setOverwritten(null);
    const times = getCopiedTimes();
    for (const i of getValues("applicationSections").keys()) {
      setValue(`applicationSections.${i}.suitableTimeRanges`, times, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    }
    // The copies are kept even where another section's spaces aren't open, and marked there, so the user can see and
    // fix them in that section rather than lose them silently.
    const outside = otherSections().filter(({ i }) => !isInsideOpeningHours(times, allSectionsOpeningHours[i] ?? []));
    if (outside.length > 0) {
      errorToast({
        text: t("application:Page2.notification.copyCellsOutsideOpeningHours", { names: sectionNames(outside) }),
        dataTestId: "application__page2--notification-error",
      });
      return;
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

  // Seconds, like the form's own minimum duration check, which uses the same rules (findTooShortRuns), so this flags
  // exactly the runs that the form validation rejects.
  const minDuration = useWatch({ name: `applicationSections.${index}.minDuration`, control });
  // The calendar marks the run, adds the reason to its cells' accessible names, and shows it in a tooltip.
  const getRunError = (
    cell: WeeklyPatternCellInfo<SuitableTimeData>,
    dayRuns: WeeklyPatternValue<SuitableTimeData>
  ) => {
    // A time outside the section's opening hours, e.g. copied from another section, can't be applied for at all.
    if (cell.availability === "unavailable") {
      return t("application:TimeSelector.outsideOpeningHours");
    }
    if (minDuration <= 0) {
      return null;
    }
    const runs = dayRuns.map(({ beginMinutes, endMinutes, data }) => ({
      priority: data.priority,
      beginMinutes,
      endMinutes,
    }));
    const position = dayRuns.findIndex((run) => run.beginMinutes === cell.runBeginMinutes);
    const reason = findTooShortReasons(runs, minDuration)[position];
    if (!reason) {
      return null;
    }
    const duration = formatDuration(t, { seconds: cell.runEndMinutes * 60 - cell.runBeginMinutes * 60 }, false);
    const minDurationString = formatDuration(t, { seconds: minDuration }, false);
    // A buffer next to a too short primary time is fixed by lengthening that primary time, so say so.
    return reason === "nextToShortPrimary"
      ? t("application:TimeSelector.tooShortNextToPrimary", { minDuration: minDurationString, duration })
      : t("application:TimeSelector.tooShort", { minDuration: minDurationString, duration });
  };

  const getStateLabel = (cell: WeeklyPatternCellInfo<SuitableTimeData>) =>
    t(`application:TimeSelector.legend.${cell.data ? priorityKey(cell.data.priority) : cell.availability}`);
  return (
    // minmax(0, 1fr) instead of the implicit auto column: an auto track grows to its widest child's min-content
    // (e.g. a long reservation unit name in the select), which would push the whole accordion wider than the viewport.
    <Flex style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }} $marginTop="m">
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
            getRunError={(cell, dayRuns) => getRunError(cell, dayRuns)}
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
          { state: "invalid", label: t("application:TimeSelector.legend.invalid") },
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
            onClick={confirmCopyCells}
            size={ButtonSize.Small}
          >
            {t("application:Page2.copyTimes")}
          </Button>
          <ConfirmationDialog
            id={`time-selector__dialog--copy-cells-${index}`}
            isOpen={overwritten != null}
            heading={t("application:Page2.copyConfirm.heading")}
            content={t("application:Page2.copyConfirm.text", { names: overwritten })}
            acceptLabel={t("application:Page2.copyConfirm.accept")}
            onAccept={copyCells}
            onCancel={() => setOverwritten(null)}
          />
        </div>
      )}
      <ErrorMessage index={index} />
    </Flex>
  );
}

const RadioGroup = styled.fieldset`
  min-inline-size: 0; /* fieldsets default to min-content, which would overflow the grid column */
  display: flex;
  flex-direction: row;
  border: none;
  padding: 0;
  margin: 0;
  gap: var(--spacing-xl);
  legend {
    width: 100%;
    margin-bottom: var(--spacing-xs);
  }
  @media (max-width: ${breakpoints.m}) {
    flex-direction: column;
    gap: var(--spacing-m);
  }
`;

const PriorityRadioButton = styled(RadioButton)`
  text-align: center;
  color: var(--color-white);
  &:before {
    box-sizing: border-box;
    position: absolute;
    top: -3px;
    left: 35px;
    display: block;
    content: "";
    width: 30px;
    height: 30px;
    background-color: var(--color-bus);
    color: var(--color-white);
  }
  &:after {
    ${arrow};
    left: 45px;
    right: auto;
    top: 0;
    border-top: 10px solid var(--color-white);
  }

  &:not(:first-of-type) {
    margin-top: 0; /* override hds-react default margin-top */
  }

  &:last-of-type {
    margin-top: 0; /* override hds-react default margin-top */
    &:before {
      background-color: var(--color-engel);
      border: 1px solid var(--color-black);
    }
    &:after {
      border-bottom: none;
      border-top: 10px solid var(--color-black);
    }
  }

  label {
    margin-left: 40px;
  }

  && input + label::before,
  && input + label::after,
  && input:focus + label::before,
  && input:focus + label::after {
    left: -40px; /* override hds-react default left */
  }
`;

function PrioritySelector({
  index,
  control,
}: Readonly<{ index: number; control: Control<ApplicationPage2FormValues> }>) {
  const { t } = useTranslation();
  const { field } = useController({ name: `applicationSections.${index}.priority`, control });
  const priorityOptions = [Priority.Primary, Priority.Secondary].map((n) => ({
    label: t(`application:Page2.priorityLabels.${priorityKey(n)}`),
    value: n,
  }));
  return (
    <RadioGroup>
      <legend>{t("application:Page2.prioritySelectLabel")}</legend>
      {priorityOptions.map((opt) => (
        <PriorityRadioButton
          id={`applicationSections.${index}.priority.${opt.value}`}
          name={`applicationSections.${index}.priority`}
          key={opt.value}
          label={opt.label}
          onChange={() => field.onChange(opt.value)}
          checked={field.value === opt.value}
        />
      ))}
    </RadioGroup>
  );
}

function ErrorMessage({ index }: { index: number }): React.ReactElement | null {
  const { t } = useTranslation();
  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const { control, getFieldState } = useFormContext<ApplicationPage2FormValues>();
  // Subscribes to the field's validation, which finishes after the change that re-rendered this.
  const formState = useFormState({ control, name: fieldName });
  const state = getFieldState(fieldName, formState);
  if (!state.invalid) {
    return null;
  }
  const errorMsg = state.error?.message;
  const msg = errorMsg ? t(`application:validation.calendar.${errorMsg}`) : t("errors:general_error");

  return (
    <ErrorText
      size={NotificationSize.Medium}
      title={
        errorMsg === OUTSIDE_OPENING_HOURS_ERROR
          ? t("application:validation.calendar.outsideOpeningHoursTitle")
          : t("application:validation.calendar.title")
      }
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
