import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconAlertCircleFill } from "hds-react";
import {
  type FieldValues,
  Path,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { ControlledSelect } from "./ControlledSelect";
import { timeToMinutes } from "../../helpers";

interface TimeRangePickerProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, "name" | "disabled"> {
  names: { begin: Path<T>; end: Path<T> };
  error?: string;
  required?: { begin?: boolean; end?: boolean };
  disabled?: { begin?: boolean; end?: boolean };
  labels?: { begin?: string; end?: string };
  commonLabel?: string;
  placeholders?: { begin?: string; end?: string };
  clearable?: { begin?: boolean; end?: boolean };
}

interface PopulateTimesProps {
  beginHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

const StartBeforeEndError = styled.div`
  grid-column: span 2;
  color: var(--color-error);
  margin-top: var(--spacing-2-xs);
  display: flex;
`;

type Option = {
  label: string;
  value: string;
};
function populateTimes(populateTimesProps?: PopulateTimesProps): Option[] {
  const beginHour = populateTimesProps?.beginHour ?? 0;
  const endHour = populateTimesProps?.endHour ?? 23.98;
  const interval = populateTimesProps?.intervalMinutes ?? 30;
  const times: Option[] = [];
  let hour = beginHour ?? 0;
  let minute = beginHour % 1 ? (beginHour % 1) * 60 : 0;

  while (hour < endHour) {
    const label = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    times.push({
      label: `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
      value: label,
    });
    minute += interval;
    // Reset the minute counter, and increment the hour counter if necessary
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  // we need to add the minute times to the beginning of the duration options
  return times;
}

/*
 *  @brief A component for selecting a time range, checks for whether the end time is before the begin time
 *  @param {Control} control - the parent form's `control` object (required)
 *  @param {begin: Path<T>, end: Path<T>} name - the name objects for the time values (required)
 *  @param {begin?: boolean, end?: boolean} [name] - flags for whether the begin and/or end times are required (optional)
 *  @param {begin?: string, end?: string} [label] - the label text for the begin and/or end times (optional)
 *  @param {begin?: boolean, end?: boolean} [placeholder] - a function to execute upon clicking the button (optional)
 *  @param {begin?: boolean, end?: boolean} [clearable] -
 *  @returns {JSX.Element} Two `<Select>` components for selecting a begin and end time, populated by options from
 *  00:00 to 23:59 in 30min intervals. If the end time is before the begin time, an error message is displayed (the
 *  error is internal, and does not trigger invaliditiy of parent form). Returned elements don't have a wrapping
 *  element, so wrap the component in the parent form if needed.
 */
export function TimeRangePicker<T extends FieldValues>({
  control,
  names,
  required,
  labels,
  placeholders,
  clearable,
}: TimeRangePickerProps<T>): JSX.Element | null {
  const { field: beginField } = useController({
    control,
    name: names?.begin,
    rules: { required: required?.begin },
  });
  const { field: endField } = useController({
    control,
    name: names?.end,
    rules: { required: required?.end },
  });
  const { t } = useTranslation();

  const populatedTimeOptions = populateTimes();
  const endTimeIsBeforeStartTime =
    beginField.value &&
    endField.value &&
    timeToMinutes(beginField.value) >= timeToMinutes(endField.value);

  if (control == null) {
    return null;
  }

  return (
    <>
      <ControlledSelect
        name={names.begin}
        control={control}
        label={labels?.begin ?? t("common:beginLabel")}
        placeholder={placeholders?.begin}
        options={populatedTimeOptions}
        required={required?.begin}
        clearable={clearable?.begin}
        data-testid="search-form__filter--fields--timeBegin"
      />
      <ControlledSelect
        name={names.end}
        control={control}
        label={labels?.end ?? t("common:endLabel")}
        placeholder={placeholders?.end}
        options={populatedTimeOptions}
        required={required?.end}
        clearable={clearable?.end}
        data-testid="search-form__filter--fields--timeEnd"
      />
      {endTimeIsBeforeStartTime && (
        <StartBeforeEndError>
          <IconAlertCircleFill />
          <span>{t("searchForm:beginTimeIsBeforeEndTime")}</span>
        </StartBeforeEndError>
      )}
    </>
  );
}
