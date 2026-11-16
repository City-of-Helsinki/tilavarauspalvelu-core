import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { TFunction } from "next-i18next/pages";
import { primaryFill, secondaryFill } from "@ui/components/WeeklyPatternCalendar/styles";
import { fontBold } from "@ui/styled";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import type { ReservableTimeSlots } from "ui/src/modules/suitableTimes";
import { priorityKey, SUITABLE_TIME_STEP_MINUTES, SUITABLE_TIME_VISIBLE_HOURS } from "ui/src/modules/suitableTimes";
import { formatClock, formatClockRange } from "ui/src/modules/time-helpers";
import { Weekday } from "@gql/gql-types";
import type { ApplicationPage2FormValues, SuitableTimeRangeFormValues } from "./form";
import {
  addTimeRange,
  findOutsideListed,
  findTooShortListed,
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

  legend {
    padding: 0 var(--spacing-2-xs);
    font-family: var(--font-bold), sans-serif;
  }
`;

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-s);

  label {
    display: grid;
    gap: var(--spacing-3-xs);
  }

  select {
    min-height: 56px;
    padding: 0 var(--spacing-s);
    border: 2px solid var(--color-black-50);
    background: var(--color-white);
    font-size: var(--fontsize-body-l);
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-s);
  padding-left: var(--spacing-2-xs);
  border-radius: var(--spacing-3-xs);
  ${({ $priority }) => $priority === "primary" && primaryFill}
  ${({ $priority }) => $priority === "secondary" && secondaryFill}

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

function minuteOptions(begin: number, end: number): number[] {
  const options: number[] = [];
  for (let minutes = begin; minutes <= end; minutes += SUITABLE_TIME_STEP_MINUTES) {
    options.push(minutes);
  }
  return options;
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

  const { beginMinutes: dayBegin, endMinutes: dayEnd } = SUITABLE_TIME_VISIBLE_HOURS;
  const [weekday, setWeekday] = useState<Weekday>(Weekday.Monday);
  const [from, setFrom] = useState(dayBegin);
  const [to, setTo] = useState(dayBegin + 60);
  const [errorKey, setErrorKey] = useState<"endAfterStart" | "outsideReservable" | null>(null);
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
    if (to <= from) {
      setErrorKey("endAfterStart");
      return;
    }
    const next = addTimeRange(
      getValues(fieldName),
      { weekday, beginMinutes: from, endMinutes: to, priority },
      openingHours
    );
    if (!next) {
      setErrorKey("outsideReservable");
      return;
    }
    setErrorKey(null);
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
      <legend>{t("application:TimeSelector.form.legend")}</legend>
      <p>{t("application:TimeSelector.form.priorityNote")}</p>
      <Fields>
        <label>
          {t("application:TimeSelector.form.day")}
          <select value={weekday} onChange={(event) => setWeekday(event.target.value as Weekday)}>
            {WEEKDAYS_SORTED.map((day) => (
              <option key={day} value={day}>
                {t(`common:weekdayLongEnum.${day}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("application:TimeSelector.form.from")}
          <select value={from} onChange={(event) => setFrom(Number(event.target.value))}>
            {minuteOptions(dayBegin, dayEnd - SUITABLE_TIME_STEP_MINUTES).map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatClock(minutes)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("application:TimeSelector.form.to")}
          <select value={to} onChange={(event) => setTo(Number(event.target.value))}>
            {minuteOptions(dayBegin + SUITABLE_TIME_STEP_MINUTES, dayEnd).map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatClock(minutes)}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" size={ButtonSize.Small} variant={ButtonVariant.Secondary} onClick={handleAdd}>
          {t("application:TimeSelector.form.add")}
        </Button>
      </Fields>
      {errorKey && <p role="alert">{t(`application:TimeSelector.form.errors.${errorKey}`)}</p>}
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
