import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Select } from "hds-react";
import {
  type FieldValues,
  Path,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { type OptionType } from "../../../types/common";
import { truncatedText } from "../../../styles/styledComponentUtils";
import { removeRefParam } from "../../reservation-form/util";

interface TimeRangePickerProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, "name"> {
  name: { begin: Path<T>; end: Path<T> };
  error?: string;
  required?: { begin?: boolean; end?: boolean };
  disabled?: { begin?: boolean; end?: boolean };
  label?: { begin?: string; end?: string };
  placeholder?: { begin?: string; end?: string };
  clearable?: { begin?: boolean; end?: boolean };
}

interface PopulateTimesProps {
  beginHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

const StyledSelect = styled(Select<OptionType>)`
  button {
    display: grid;
    text-align: left;
  }

  span {
    ${truncatedText}
  }
`;

const StartBeforeEndError = styled.span`
  grid-column: span 2;
  color: var(--color-error);
  margin-top: var(--spacing-2-xs);
`;

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
const TimeRangePicker = <T extends FieldValues>({
  control,
  name,
  required,
  label,
  placeholder,
  clearable,
}: TimeRangePickerProps<T>): JSX.Element => {
  const { field: beginField, fieldState: beginFieldState } = useController({
    control,
    name: name?.begin,
    rules: { required: required?.begin },
  });
  const { field: endField, fieldState: endFieldState } = useController({
    control,
    name: name?.end,
    rules: { required: required?.end },
  });
  const { t } = useTranslation();

  const getSelectedOption = (
    optionValue: number | null,
    optionList: OptionType[]
  ): OptionType | null => {
    const returnOption = optionList.find((o) => o.value === optionValue);
    return returnOption ?? null;
  };

  const populateTimes = (
    populateTimesProps?: PopulateTimesProps
  ): OptionType[] => {
    const beginHour = populateTimesProps?.beginHour ?? 0;
    const endHour = populateTimesProps?.endHour ?? 23.98;
    const interval = populateTimesProps?.intervalMinutes ?? 30;
    const times: OptionType[] = [];
    let hour = beginHour ?? 0;
    let minute = beginHour % 1 ? (beginHour % 1) * 60 : 0;

    while (hour < endHour) {
      times.push({
        label: `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`,
        value: hour + minute / 60,
      });
      minute += interval;
      // Reset the minute counter, and increment the hour counter if necessary
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }
    // we need to add the minute times to the beginning of the duration options
    return times as OptionType[];
  };

  const populatedTimeOptions = populateTimes();
  const endTimeIsBeforeStartTime =
    beginField.value &&
    endField.value &&
    beginField.value.value >= endField.value.value;

  // Format the value to seconds
  // TODO: check what format the API expects
  const formatTimeToApi = (time: number) => {
    return time !== null ? time * 60 * 60 : null;
  };

  return (
    <>
      <StyledSelect
        {...removeRefParam(beginField)}
        label={label?.begin ?? t("common:beginLabel")}
        options={populatedTimeOptions}
        placeholder={placeholder?.begin}
        required={required?.begin}
        error={beginFieldState.error && beginFieldState.error.message}
        clearable={clearable?.begin}
        invalid={endTimeIsBeforeStartTime || beginFieldState.invalid}
        value={getSelectedOption(beginField.value, populatedTimeOptions)}
        onChange={(e) => {
          beginField.onChange(e !== null ? e.currentTarget.value : null);
        }}
      />
      <StyledSelect
        {...removeRefParam(endField)}
        label={label?.end ?? t("common:endLabel")}
        options={populatedTimeOptions}
        placeholder={placeholder?.end}
        required={required?.end}
        error={endFieldState.error && endFieldState.error.message}
        clearable={clearable?.end}
        invalid={endTimeIsBeforeStartTime || endFieldState.invalid}
        value={getSelectedOption(beginField.value, populatedTimeOptions)}
        onChange={(e) => {
          endField.onChange(e !== null ? formatTimeToApi(e.value) : null);
        }}
      />
      {endTimeIsBeforeStartTime && (
        <StartBeforeEndError>
          {t("searchForm:beginTimeIsBeforeEndTime")}
        </StartBeforeEndError>
      )}
    </>
  );
};

export default TimeRangePicker;
