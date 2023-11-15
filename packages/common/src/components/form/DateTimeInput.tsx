import React from "react";
import { DateInput } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  useController,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from "react-hook-form";
import { TimeInput } from "./TimeInput";

const DateTimeWrapper = styled.div`
  display: grid;
  grid-template-columns: 4fr 3fr;
  gap: var(--spacing-m);
`;

interface DateTimeProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, "name" | "disabled"> {
  name: { date: Path<T>; time: Path<T> };
  required?: boolean;
  disabled?: boolean;
}

/// or if not it's so dump it should be in the form itself
/// NOTE HDS time component is utter garbage
/// It can never be reseted after creation (value === defaultValue, and it doesn't allow for refs).
/// Most apparent when async loading server data and then trying to reset the form.
/// TODO rework the TimeInput (either custom component or HDS upgrade)
const DateTimeInput = <T extends FieldValues>({
  control,
  name,
  required,
  disabled,
}: DateTimeProps<T>): JSX.Element => {
  const { t } = useTranslation();

  const { field: dateField } = useController({
    control,
    name: name.date,
    rules: { required },
  });

  const { field: timeField } = useController({
    control,
    name: name.time,
    rules: { required },
  });

  const handleTimeChange = (evt: React.FormEvent<HTMLInputElement>) => {
    timeField.onChange(evt.currentTarget.value);
  };

  return (
    <DateTimeWrapper>
      <DateInput
        language="fi"
        required={required}
        disabled={disabled}
        disableConfirmation
        label={t("common.date")}
        id={name.date}
        value={dateField.value}
        onChange={(v) => dateField.onChange(v)}
      />
      <TimeInput
        name={name.time}
        required={required}
        disabled={disabled}
        // label={t("common.time")}
        // hoursLabel="hours"
        // minutesLabel="minutes"
        value={timeField.value}
        label={t("common.time")}
        onChange={handleTimeChange}
      />
    </DateTimeWrapper>
  );
};

export { DateTimeInput };
