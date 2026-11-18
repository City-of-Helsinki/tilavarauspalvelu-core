import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { TFunction } from "next-i18next/pages";
import {
  primaryFill,
  primaryIndicator,
  secondaryFill,
  secondaryIndicator,
} from "@ui/components/WeeklyPatternCalendar/styles";
import { fontBold } from "@ui/styled";
import { ControlledSelect } from "ui/src/components/form";
import type { ReservableTimeSlots } from "ui/src/modules/suitableTimes";
import { priorityKey, toAvailability } from "ui/src/modules/suitableTimes";
import { formatClock, formatClockRange } from "ui/src/modules/time-helpers";
import type { Weekday } from "@gql/gql-types";
import type { ApplicationPage2FormValues, SuitableTimeRangeFormValues } from "./form";
import {
  addTimeRange,
  findOutsideListed,
  findTooShortListed,
  listEndOptions,
  listOpenWeekdays,
  listStartOptions,
  listTimeRanges,
  removeTimeRange,
} from "./timeSelectorModule";

const Fieldset = styled.fieldset`
  min-inline-size: 0; /* fieldsets default to min-content, which would overflow the grid column */
  display: grid;
  gap: var(--spacing-s);
  margin: 0;
  padding: var(--spacing-s);
  border: 1px solid var(--color-black-50);
`;

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-s);

  > :not(button) {
    flex: 1 1 10rem;
  }
`;

const TimeList = styled.ul`
  display: grid;
  gap: var(--spacing-3-xs);
  margin: var(--spacing-xs) 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
  }
`;

const TimeListItem = styled.li<{ $priority?: "primary" | "secondary" }>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-s);
  padding-left: var(--spacing-m);
  border-radius: var(--spacing-3-xs);
  ${({ $priority }) => $priority === "primary" && primaryFill}
  ${({ $priority }) => $priority === "primary" && primaryIndicator}
  ${({ $priority }) => $priority === "secondary" && secondaryFill}
  ${({ $priority }) => $priority === "secondary" && secondaryIndicator}
  ${({ $priority }) => $priority === "secondary" && "border: 1px solid var(--color-black-50);"}
  /* A too short time, drawn as in the calendar: primary in solid error red with white text, secondary in light error
     red with an error red outline and black text. */
  &[data-invalid] {
    background: ${({ $priority }) => ($priority === "secondary" ? "var(--color-error-light)" : "rgb(from var(--color-error) r g b / .7)")};
    color: ${({ $priority }) => ($priority === "secondary" ? "var(--color-black)" : "var(--color-white)")};
    ${({ $priority }) => $priority === "secondary" && "box-shadow: inset 0 0 0 1px var(--color-error);"}
  }
`;

const RemoveButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  line-height: 1;
  padding: 0 0 2px;
  height: 30px;
  width: 30px;
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-bold), sans-serif;
  background-color: transparent;
  border: 0;
  color: inherit;
  transition:
    scale 0.2s ease-in-out,
    background-color 0.2s ease-in-out;
  ${fontBold}
  &:hover {
    color: inherit;
    scale: 1.5;
    background-color: transparent;
  }
`;

/** A time as the list (and the calendar's error message) names it, e.g. "Tuesday 14:00–15:00". */
export function describeTime(t: TFunction, day: Weekday, begin: number, end: number): string {
  const dayName = t(`common:weekdayLongEnum.${day}`);
  return `${dayName} ${formatClockRange(begin, end)}`;
}

function toClockOption(minutes: number): { value: number; label: string } {
  return { value: minutes, label: formatClock(minutes) };
}

type TimePickerValues = { weekday: Weekday | null; from: number | null; to: number | null };

// An hour, the length a new time gets by default, when the opening hours allow it.
const DEFAULT_LENGTH_MINUTES = 60;

/**
 * The picked time, moved onto the opening hours: a closed day becomes the first open day, a start that day doesn't
 * open becomes its first open start, and an end the start can't reach becomes an hour after the start (or as far as
 * the opening hours reach). Picks that are still open are kept.
 */
function toOpenPick(openingHours: ReservableTimeSlots, { weekday, from, to }: TimePickerValues): TimePickerValues {
  const openWeekdayList = listOpenWeekdays(openingHours);
  const day = weekday != null && openWeekdayList.includes(weekday) ? weekday : (openWeekdayList[0] ?? null);
  if (day == null) {
    return { weekday: null, from: null, to: null };
  }
  const startList = listStartOptions(openingHours, day);
  const start = from != null && startList.includes(from) ? from : (startList[0] ?? null);
  if (start == null) {
    return { weekday: day, from: null, to: null };
  }
  const endList = listEndOptions(openingHours, day, start);
  const preferredEnd = start + DEFAULT_LENGTH_MINUTES;
  const fallbackEnd = endList.includes(preferredEnd) ? preferredEnd : (endList.at(-1) ?? null);
  const end = to != null && endList.includes(to) ? to : fallbackEnd;
  return { weekday: day, from: start, to: end };
}

type SuitableTimeRangeFormProps = {
  id: string;
  index: number;
  openingHours: ReservableTimeSlots;
};

/** The same task as the calendar, done with form fields. It is an equal alternative to the calendar. */
export function SuitableTimeRangeForm({
  id,
  index,
  openingHours,
}: Readonly<SuitableTimeRangeFormProps>): React.ReactElement {
  const { t } = useTranslation();
  const { getValues, setValue, watch } = useFormContext<ApplicationPage2FormValues>();

  // The pickers only build the next time to add, so they keep their own form, apart from the application's.
  const picker = useForm<TimePickerValues>({
    defaultValues: toOpenPick(openingHours, { weekday: null, from: null, to: null }),
  });
  const weekday = picker.watch("weekday");
  const from = picker.watch("from");
  const to = picker.watch("to");
  // After a pick, or when the opening hours change, move the picks that are no longer open onto the open times.
  const syncPicker = () => {
    const next = toOpenPick(openingHours, picker.getValues());
    picker.setValue("weekday", next.weekday);
    picker.setValue("from", next.from);
    picker.setValue("to", next.to);
  };
  // The parent builds the opening hours anew on each render, so compare them by content, not by reference.
  const openingHoursKey = JSON.stringify(toAvailability(openingHours));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the opening hours change, not on each pick
  useEffect(syncPicker, [openingHoursKey]);

  const dayOptionList = useMemo(
    () => listOpenWeekdays(openingHours).map((day) => ({ value: day, label: t(`common:weekdayLongEnum.${day}`) })),
    [openingHours, t]
  );
  const fromOptionList =
    weekday == null ? [] : listStartOptions(openingHours, weekday).map((minutes) => toClockOption(minutes));
  const toOptionList =
    weekday == null || from == null
      ? []
      : listEndOptions(openingHours, weekday, from).map((minutes) => toClockOption(minutes));

  const [status, setStatus] = useState("");

  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const ranges = watch(fieldName) ?? [];
  const priority = watch(`applicationSections.${index}.priority`);
  const listed = listTimeRanges(ranges);
  const minDuration = watch(`applicationSections.${index}.minDuration`);
  const tooShort = findTooShortListed(listed, minDuration);
  const outside = findOutsideListed(listed, openingHours);
  // Outside the opening hours is the more basic problem: such a time can't be applied for at all, whatever its length.
  const problemOf = (position: number) => {
    if (outside[position]) {
      return t("application:TimeSelector.form.outsideOpeningHours");
    }
    if (tooShort[position]) {
      return t("application:TimeSelector.form.tooShort");
    }
    return null;
  };

  const describe = (day: Weekday, begin: number, end: number) => describeTime(t, day, begin, end);

  const save = (next: SuitableTimeRangeFormValues[]) => {
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  };

  const handleAdd = () => {
    if (weekday == null || from == null || to == null) {
      return;
    }
    const next = addTimeRange(
      getValues(fieldName),
      { weekday, beginMinutes: from, endMinutes: to, priority },
      openingHours
    );
    if (!next) {
      return;
    }
    save(next);
    setStatus(`${t("application:TimeSelector.announcements.painted")}: ${describe(weekday, from, to)}`);
  };

  const handleRemove = (position: number) => {
    const removed = listed[position];
    if (!removed) {
      return;
    }
    save(removeTimeRange(getValues(fieldName), position));
    setStatus(
      `${t("application:TimeSelector.announcements.erased")}: ${describe(removed.weekday, removed.beginMinutes, removed.endMinutes)}`
    );
  };

  return (
    <Fieldset id={id} data-testid={`time-selector__form-${index}`}>
      <p>{t("application:TimeSelector.form.priorityNote")}</p>
      <Fields>
        <ControlledSelect
          id={`${id}-day`}
          name="weekday"
          control={picker.control}
          label={t("application:TimeSelector.form.day")}
          options={dayOptionList}
          afterChange={syncPicker}
        />
        <ControlledSelect
          id={`${id}-from`}
          name="from"
          control={picker.control}
          label={t("application:TimeSelector.form.from")}
          options={fromOptionList}
          afterChange={syncPicker}
        />
        <ControlledSelect
          id={`${id}-to`}
          name="to"
          control={picker.control}
          label={t("application:TimeSelector.form.to")}
          options={toOptionList}
        />
        <Button
          type="button"
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          onClick={handleAdd}
          disabled={weekday == null || from == null || to == null}
        >
          {t("application:TimeSelector.form.add")}
        </Button>
      </Fields>
      <div>
        <p id={`${id}-list-label`}>{t("application:TimeSelector.form.listLabel")}</p>
        {listed.length === 0 ? (
          <p>{t("application:TimeSelector.form.empty")}</p>
        ) : (
          <TimeList aria-labelledby={`${id}-list-label`}>
            {listed.map(({ weekday: day, beginMinutes, endMinutes, data }, position) => (
              <TimeListItem
                key={`${day}-${beginMinutes}`}
                $priority={priorityKey(data.priority)}
                data-invalid={problemOf(position) ? "" : undefined}
              >
                <span>
                  {describe(day, beginMinutes, endMinutes)},{" "}
                  {t(`application:TimeSelector.legend.${priorityKey(data.priority)}`)}
                  {problemOf(position) && ` - (${problemOf(position)}!)`}
                </span>
                <RemoveButton
                  type="button"
                  size={ButtonSize.Small}
                  variant={ButtonVariant.Secondary}
                  onClick={() => handleRemove(position)}
                  aria-label={t("application:TimeSelector.form.removeTime", {
                    time: describe(day, beginMinutes, endMinutes),
                  })}
                >
                  ×
                </RemoveButton>
              </TimeListItem>
            ))}
          </TimeList>
        )}
      </div>
      <div role="status" aria-live="polite">
        {status}
      </div>
    </Fieldset>
  );
}
