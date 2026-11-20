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
import { convertWeekday } from "@ui/modules/conversion";
import { Flex, fontBold, H5 } from "@ui/styled";
import { ControlledSelect } from "ui/src/components/form";
import { breakpoints, WEEKDAYS_SORTED } from "ui/src/modules/const";
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

const StyledFieldset = styled.fieldset`
  min-inline-size: 0; /* fieldsets default to min-content, which would overflow the grid column */
  margin: 0;
  padding: var(--spacing-s) 0;
  border: none;
`;

const FormControls = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-3-xs);
`;

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;

  align-items: flex-end;
  gap: var(--spacing-3-xs);
`;

const TimeList = styled.ul<{ $cols: number }>`
  display: grid;
  gap: var(--spacing-3-xs);
  margin: var(--spacing-xs) 0 0;
  padding: 0;
  list-style: none;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(auto-fill, auto);
  grid-auto-flow: column;
  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(50px, auto));
  }
`;

const EmptyList = styled.div`
  font-style: italic;
  margin: var(--spacing-m) 0 0;
`;

const TimeListItem = styled.li<{ $priority?: "primary" | "secondary"; $weekday?: number }>`
  position: relative;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: stretch;
  gap: var(--spacing-s);
  font-size: var(--fontsize-body-m);
  line-height: 1.2;
  padding: var(--spacing-3-xs) 0 var(--spacing-3-xs) var(--spacing-m);
  border-radius: var(--spacing-3-xs);
  grid-column: 1;
  ${({ $priority }) => $priority === "primary" && primaryFill}
  ${({ $priority }) => $priority === "primary" && primaryIndicator}
  ${({ $priority }) => $priority === "secondary" && secondaryFill}
  ${({ $priority }) => $priority === "secondary" && secondaryIndicator}
  ${({ $priority }) => $priority === "secondary" && "border: 1px solid var(--color-black-50);"}
  /* A too short time, drawn as in the calendar: primary in solid error red with white text, secondary in light error
     red with an error red outline and black text. */
  &[data-invalid] {
    background: ${({ $priority }) => ($priority === "secondary" ? "var(--color-error-light)" : "var(--color-error)")};
    color: ${({ $priority }) => ($priority === "secondary" ? "var(--color-black)" : "var(--color-white)")};
    ${({ $priority }) => $priority === "secondary" && "box-shadow: inset 0 0 0 1px var(--color-error);"}
    text-decoration: line-through;
  }
  @media (min-width: ${breakpoints.s}) {
    grid-column: ${({ $weekday }) => $weekday};
  }
`;

const Ellipsis = styled.span`
  display: inline-block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  [data-invalid] & {
    text-decoration: line-through;
  }
  @media (min-width: ${breakpoints.s}) {
    max-width: calc(100% - var(--spacing-s));
  }
`;

const RemoveButton = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  line-height: 1;
  padding: 0 0 2px;
  --min-size: 20px;
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

const Status = styled.div`
  width: 0;
  height: 0;
  overflow: hidden;
`;

const ShowBig = styled.span`
  @media (min-width: ${breakpoints.s}) {
    @media (max-width: ${breakpoints.m}) {
      display: none;
    }
  }
`;

const ShowSmall = styled.span`
  display: none;
  @media (min-width: ${breakpoints.s}) {
    @media (max-width: ${breakpoints.m}) {
      display: inline-block;
    }
  }
`;

/** A time as the list (and the calendar's error message) names it, e.g. "Tuesday 14:00–15:00". */
export function describeTime(
  t: TFunction,
  day: Weekday,
  begin: number,
  end: number,
  variant?: "short" | "long"
): string {
  const dayName = t(`common:weekday${variant === "short" ? "Short" : "Long"}Enum.${day}`);
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
  const days = listOpenWeekdays(openingHours);
  const day = weekday != null && days.includes(weekday) ? weekday : (days[0] ?? null);
  if (day == null) {
    return { weekday: null, from: null, to: null };
  }
  const starts = listStartOptions(openingHours, day);
  const start = from != null && starts.includes(from) ? from : (starts[0] ?? null);
  if (start == null) {
    return { weekday: day, from: null, to: null };
  }
  const ends = listEndOptions(openingHours, day, start);
  const preferredEnd = start + DEFAULT_LENGTH_MINUTES;
  const fallbackEnd = ends.includes(preferredEnd) ? preferredEnd : (ends.at(-1) ?? null);
  const end = to != null && ends.includes(to) ? to : fallbackEnd;
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
  // Runs only when the opening hours change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(syncPicker, [openingHoursKey]);

  // Every day is listed, so that none seems to be missing, but the days without open times can't be picked.
  const openDays = useMemo(() => listOpenWeekdays(openingHours), [openingHours]);
  const dayOptions = useMemo(
    () =>
      WEEKDAYS_SORTED.map((day) => ({
        value: day,
        label: t(`common:weekdayLongEnum.${day}`),
        disabled: !openDays.includes(day),
      })),
    [openDays, t]
  );
  const fromOptions =
    weekday == null ? [] : listStartOptions(openingHours, weekday).map((minutes) => toClockOption(minutes));
  const toOptions =
    weekday == null || from == null
      ? []
      : listEndOptions(openingHours, weekday, from).map((minutes) => toClockOption(minutes));

  const [status, setStatus] = useState("");

  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const ranges = watch(fieldName) ?? [];
  const priority = watch(`applicationSections.${index}.priority`);
  const listed = listTimeRanges(ranges);
  const minDuration = watch(`applicationSections.${index}.minDuration`);
  // Unique weekdays in the listed user selections, used to place the times in columns in the list.
  const selectedWeekdays = [...new Set(listed.map(({ weekday }) => convertWeekday(weekday)))];

  // Outside the opening hours is the more basic problem: such a time can't be applied for at all, whatever its length.
  const problemOf = (position: number) => {
    if (findOutsideListed(listed, openingHours)[position]) {
      return t("application:TimeSelector.form.outsideOpeningHours");
    }
    if (findTooShortListed(listed, minDuration)[position]) {
      return t("application:TimeSelector.form.tooShort");
    }
    return null;
  };

  const getSlotContent = (day: Weekday, begin: number, end: number, variant?: "short" | "long") => {
    const timeString = describeTime(t, day, begin, end, variant === "short" ? "short" : "long");
    return (
      <>
        <Ellipsis>{timeString.split(" ")[0]}</Ellipsis>
        <br />
        <span>{timeString.split(" ")[1]}</span>
      </>
    );
  };

  const save = (next: SuitableTimeRangeFormValues[]) => {
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  };

  const handleAdd = () => {
    if (weekday == null || from == null || to == null) {
      return;
    }
    // The pickers only offer open times, so this is always added.
    const next = addTimeRange(
      getValues(fieldName),
      { weekday, beginMinutes: from, endMinutes: to, priority },
      openingHours
    );
    if (!next) {
      return;
    }
    save(next);
    setStatus(`${t("application:TimeSelector.announcements.painted")}: ${describeTime(t, weekday, from, to)}`);
  };

  const handleRemove = (position: number) => {
    const removed = listed[position];
    if (!removed) {
      return;
    }
    save(removeTimeRange(getValues(fieldName), position));
    setStatus(
      `${t("application:TimeSelector.announcements.erased")}: ${describeTime(t, removed.weekday, removed.beginMinutes, removed.endMinutes)}`
    );
  };

  return (
    <StyledFieldset id={id} data-testid={`time-selector__form-${index}`}>
      <FormControls>
        <Fields>
          <ControlledSelect
            id={`${id}-day`}
            name="weekday"
            control={picker.control}
            label={t("application:TimeSelector.form.day")}
            options={dayOptions}
            disabled={openDays.length === 0}
            afterChange={syncPicker}
          />
          <ControlledSelect
            id={`${id}-from`}
            name="from"
            control={picker.control}
            label={t("application:TimeSelector.form.from")}
            options={fromOptions}
            afterChange={syncPicker}
          />
          <ControlledSelect
            id={`${id}-to`}
            name="to"
            control={picker.control}
            label={t("application:TimeSelector.form.to")}
            options={toOptions}
          />
        </Fields>
        <Button
          type="button"
          size={ButtonSize.Medium}
          variant={ButtonVariant.Secondary}
          onClick={handleAdd}
          disabled={weekday == null || from == null || to == null}
        >
          {t("application:TimeSelector.form.add")}
        </Button>
      </FormControls>
      <Flex $gap="3-xs" $direction="column">
        {listed.length === 0 ? (
          <EmptyList>{t("application:TimeSelector.form.empty")}</EmptyList>
        ) : (
          <>
            <H5 id={`${id}-list-label`}>{t("application:TimeSelector.form.listLabel")}</H5>
            <TimeList aria-labelledby={`${id}-list-label`} $cols={selectedWeekdays.length}>
              {listed.map(({ weekday: day, beginMinutes, endMinutes, data }, position) => (
                <TimeListItem
                  key={`${day}-${beginMinutes}`}
                  $priority={priorityKey(data.priority)}
                  $weekday={selectedWeekdays.indexOf(convertWeekday(day)) + 1}
                  data-invalid={problemOf(position) ? "" : undefined}
                  aria-invalid={problemOf(position) ? "true" : undefined}
                  aria-errormessage="#time-selector__error-summary"
                >
                  <ShowSmall>{getSlotContent(day, beginMinutes, endMinutes, "short")}</ShowSmall>
                  <ShowBig>{getSlotContent(day, beginMinutes, endMinutes)}</ShowBig>
                  <RemoveButton
                    type="button"
                    size={ButtonSize.Small}
                    variant={ButtonVariant.Secondary}
                    onClick={() => handleRemove(position)}
                    aria-label={t("application:TimeSelector.form.removeTime", {
                      time: describeTime(t, day, beginMinutes, endMinutes),
                    })}
                  >
                    ×
                  </RemoveButton>
                </TimeListItem>
              ))}
            </TimeList>
          </>
        )}
      </Flex>
      <Status role="status" aria-live="polite">
        {status}
      </Status>
    </StyledFieldset>
  );
}
