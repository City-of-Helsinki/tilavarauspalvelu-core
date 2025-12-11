import React from "react";
import { useController } from "react-hook-form";
import type { FieldValues, Path, UseControllerProps } from "react-hook-form";
import { startOfDay } from "date-fns/startOfDay";
import { DateInput } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { TimeInput } from "./TimeInput";

const DateTimeWrapper = styled.div`
  display: grid;
  grid-template-columns: 4fr 3fr;
  gap: var(--spacing-m);
`;

interface DateTimeProps<T extends FieldValues> extends Omit<UseControllerProps<T>, "name" | "disabled"> {
  name: { date: Path<T>; time: Path<T> };
  minDate?: Date;
  required?: boolean;
  disabled?: boolean;
  translateError?: (error?: string) => string | undefined;
}

export function DateTimeInput<T extends FieldValues>({
  control,
  name,
  required,
  minDate,
  disabled,
  translateError,
}: DateTimeProps<T>): JSX.Element {
  const { t } = useTranslation();

  const { field: dateField, fieldState: dateFieldState } = useController({
    control,
    name: name.date,
    rules: { required },
  });
  const { error: dateError } = dateFieldState;

  const { field: timeField, fieldState: timeFieldState } = useController({
    control,
    name: name.time,
    rules: { required },
  });
  const { error: timeError } = timeFieldState;

  const handleTimeChange = (evt: React.FormEvent<HTMLInputElement>) => {
    timeField.onChange(evt.currentTarget.value);
    // touch the date field to clear errors
    dateField.onBlur();
  };

  return (
    <DateTimeWrapper>
      <DateInput
        language="fi"
        ref={dateField.ref}
        required={required}
        disabled={disabled}
        minDate={minDate && startOfDay(minDate)}
        disableConfirmation
        label={t("common:date")}
        id={name.date}
        value={dateField.value}
        onChange={(v) => dateField.onChange(v)}
        errorText={translateError?.(dateError?.message) ?? dateError?.message}
        invalid={!!dateError?.message}
      />
      <TimeInput
        name={name.time}
        ref={timeField.ref}
        required={required}
        disabled={disabled}
        value={timeField.value}
        label={t("common:time")}
        onChange={handleTimeChange}
        error={translateError?.(timeError?.message) ?? timeError?.message}
      />
    </DateTimeWrapper>
  );
}
