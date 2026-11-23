import React, { useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import { Controller, useController, useFormContext, useWatch } from "react-hook-form";
import { gql } from "@apollo/client";
import { Button, ButtonSize, ButtonVariant, RadioButton, Tabs } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { arrow, WeeklyPatternLegend } from "@ui/components/WeeklyPatternCalendar/styles";
import type { WeeklyPatternCellInfo, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { WeeklyPatternCalendar } from "@ui/components/WeeklyPatternCalendar/WeeklyPatternCalendar";
import { breakpoints } from "@ui/modules/const";
import { ConfirmationDialog } from "ui/src/components/ConfirmationDialog";
import { ControlledSelect } from "ui/src/components/form";
import { successToast, toast } from "ui/src/components/toast";
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

const TimeSelectorRoot = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-m);
  margin-top: var(--spacing-m);
  padding-bottom: var(--spacing-m);
  border-bottom: 1px solid var(--color-black-50);
`;

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
      toast({
        text: t("application:Page2.notification.copyCellsOutsideOpeningHours", { names: sectionNames(outside) }),
        dataTestId: "application__page2--notification-alert",
        type: "alert",
      });
      return;
    }
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };

  const formId = `time-selector__form-${index}`;

  const isCopyTimesEnabled = filterNonNullable(applicationSections).length > 1 && getCopiedTimes().length > 0;
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
    const toDuration = (run: { beginMinutes: number; endMinutes: number }) =>
      formatDuration(t, { seconds: (run.endMinutes - run.beginMinutes) * 60 }, false);
    const minDurationString = formatDuration(t, { seconds: minDuration }, false);
    if (reason === "nextToShortPrimary") {
      // A buffer next to a too short primary time is fixed by lengthening that primary time, so say so and name the
      // primary time's duration, found as findTooShortReasons finds it: the touching run before, else the one after.
      const run = runs[position];
      const isShortPrimary = (other: (typeof runs)[number] | undefined): other is (typeof runs)[number] =>
        other?.priority === Priority.Primary && (other.endMinutes - other.beginMinutes) * 60 < minDuration;
      const before = runs[position - 1];
      const after = runs[position + 1];
      const primary =
        isShortPrimary(before) && before.endMinutes === run?.beginMinutes
          ? before
          : isShortPrimary(after) && after.beginMinutes === run?.endMinutes
            ? after
            : undefined;
      const duration = toDuration(primary ?? { beginMinutes: cell.runBeginMinutes, endMinutes: cell.runEndMinutes });
      return t("application:TimeSelector.tooShortNextToPrimary", { minDuration: minDurationString, duration });
    }
    const duration = toDuration({ beginMinutes: cell.runBeginMinutes, endMinutes: cell.runEndMinutes });
    return t("application:TimeSelector.tooShort", { minDuration: minDurationString, duration });
  };

  const getStateLabel = (cell: WeeklyPatternCellInfo<SuitableTimeData>) =>
    t(`application:TimeSelector.legend.${cell.data ? priorityKey(cell.data.priority) : cell.availability}`);
  return (
    <TimeSelectorRoot>
      <PrioritySelector index={index} control={control} />
      <Tabs>
        <Tabs.TabList>
          <Tabs.Tab>{t("application:TimeSelector.calendarLabel")}</Tabs.Tab>
          <Tabs.Tab>{t("application:TimeSelector.formLabel")}</Tabs.Tab>
        </Tabs.TabList>
        <Tabs.TabPanel>
          <Flex style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }} $marginTop="m">
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
          </Flex>
        </Tabs.TabPanel>
        <Tabs.TabPanel>
          <SuitableTimeRangeForm id={formId} index={index} openingHours={sectionOpeningHours} />
        </Tabs.TabPanel>
      </Tabs>

      {isCopyTimesEnabled && (
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
    </TimeSelectorRoot>
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
    border-bottom: 10px solid var(--color-white);
  }

  &:not(:first-of-type) {
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
