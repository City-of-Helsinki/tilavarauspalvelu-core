import { OptionType } from "common";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Select } from "hds-react";
import {
  type Control,
  type FieldValues,
  Path,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { truncatedText } from "@/styles/util";

export type TimeRangePickerProps = {
  onChangeEndTime: (date: OptionType | null) => void;
  onChangeStartTime: (date: OptionType | null) => void;
  labels?: { start?: string; end?: string };
  required?: { start?: boolean; end?: boolean };
  control: Control;
};

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  endName: Path<T>;
  name: { start: Path<T>; end: Path<T>}
  error?: string;
  required?: { start?: boolean; end?: boolean };
  disabled?: { start?: boolean; end?: boolean };
  label?: { start?: string; end?: string };
  placeholder?: { start?: string; end?: string };
  clearable?: { start?: boolean; end?: boolean };
}

interface PopulateTimeOptionsProps {
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

const StyledSelect = styled(Select<OptionType>)`
  &:first-child > div {
    border-right: none;
  }
  button {
    display: grid;
    text-align: left;
  }

  span {
    ${truncatedText}
  }

  label {
    height: 24px;
  }
  // Hide the label text for the end time select, since HDS adds a "*" to required field labels
  // TODO: Make this dynamic if we ever need to re-use this component
  &:last-child label span {
    display: none;
  }
`;

const StartBeforeEndError = styled.span`
  grid-column: span 2;
  color: var(--color-error);
  margin-top: var(--spacing-2-xs);
`;

const TimeRangePicker = <T extends FieldValues>({
  control,
  name,
  required,
  label,
  placeholder,
  clearable,
}: ControllerProps<T>) => {
  const { field: startField, fieldState: startFieldState } = useController({
    control,
    name: name?.start,
    rules: { required: required?.start },
  });
  const { field: endField, fieldState: endFieldState } = useController({
    control,
    name: name?.end,
    rules: { required: required?.end },
  });
  const { t } = useTranslation();

  const populateTimeOptions = (
    populateTimeProps?: PopulateTimeOptionsProps
  ): OptionType[] => {
    const startHour = populateTimeProps?.startHour ?? 0;
    const endHour = populateTimeProps?.endHour ?? 23.98;
    const interval = populateTimeProps?.intervalMinutes ?? 30;
    const times: OptionType[] = [];
    let hour = startHour ?? 0;
    let minute = startHour % 1 ? (startHour % 1) * 60 : 0;

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
        hour++;
      }
    }
    // we need to add the minute times to the beginning of the duration options
    return times as OptionType[];
  };

  const endTimeIsBeforeStartTime =
    startField.value &&
    endField.value &&
    startField.value.value >= endField.value.value;

  // TODO?: Format the value to match what API expects
  console.log(startField.value, endField.value);

  return (
    <>
      <StyledSelect
        {...startField}
        placeholder={placeholder?.start}
        options={populateTimeOptions()}
        label={label?.start ?? t("common:startLabel")}
        error={startFieldState.error && startFieldState.error.message}
        invalid={endTimeIsBeforeStartTime || startFieldState.invalid}
        required={required?.start}
        clearable={clearable?.start}
      />
      <StyledSelect
        {...endField}
        placeholder={placeholder?.end}
        options={populateTimeOptions()}
        label={label?.end ?? t("common:endLabel")}
        error={endFieldState.error && endFieldState.error.message}
        invalid={endTimeIsBeforeStartTime || endFieldState.invalid}
        required={required?.end}
        clearable={clearable?.end}
      />
      {endTimeIsBeforeStartTime && (
        <StartBeforeEndError>
          {t("searchForm:startTimeIsBeforeEndTime")}
        </StartBeforeEndError>
      )}
    </>
  );
};

export default TimeRangePicker;
