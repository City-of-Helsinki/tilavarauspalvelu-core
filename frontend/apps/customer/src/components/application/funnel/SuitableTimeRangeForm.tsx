import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { priorityKey, SUITABLE_TIME_STEP_MINUTES, SUITABLE_TIME_VISIBLE_HOURS } from "ui/src/modules/suitableTimes";
import { Weekday } from "@gql/gql-types";
import type { ApplicationPage2FormValues, SuitableTimeRangeFormValues } from "./form";
import { addTimeRange, listTimeRanges, removeTimeRange } from "./timeSelectorModule";
import type { DailyOpeningHours } from "./timeSelectorModule";

const Fieldset = styled.fieldset`
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
  gap: var(--spacing-xs);
  margin: 0;
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

const pad = (value: number) => value.toString().padStart(2, "0");
const formatClock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function minuteOptions(begin: number, end: number): number[] {
  const options: number[] = [];
  for (let minutes = begin; minutes <= end; minutes += SUITABLE_TIME_STEP_MINUTES) {
    options.push(minutes);
  }
  return options;
}

type Props = {
  id: string;
  index: number;
  openingHours: DailyOpeningHours;
};

/** The same task as the calendar, done with form fields. It is an equal alternative to the calendar. */
export function SuitableTimeRangeForm({ id, index, openingHours }: Props): React.ReactElement {
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

  const weekdayName = (day: Weekday) => t(`common:weekdayLongEnum.${day}`);
  const describe = (day: Weekday, begin: number, end: number) =>
    `${weekdayName(day)} ${formatClock(begin)}-${formatClock(end)}`;

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
                {weekdayName(day)}
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
              <li key={`${day}-${beginMinutes}`}>
                <span>
                  {describe(day, beginMinutes, endMinutes)},{" "}
                  {t(`application:TimeSelector.legend.${priorityKey(data.priority)}`)}
                </span>
                <Button
                  type="button"
                  size={ButtonSize.Small}
                  variant={ButtonVariant.Secondary}
                  onClick={() => handleRemove(position)}
                  aria-label={t("application:TimeSelector.form.removeTime", {
                    time: describe(day, beginMinutes, endMinutes),
                  })}
                >
                  {t("application:TimeSelector.form.remove")}
                </Button>
              </li>
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
