import React, { type ReactElement } from "react";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";
import { DateInput } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

const DateRangeFilterWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  {/* Reserve room for label with no text so that the inputs are shown in the same row + avoid double border between
   the inputs */}
  [class*="DateInput-module_wrapper"]:nth-child(2) {
    [class*="TextInput-module_inputWrapper"] {
      margin-top: 28px;
      input {
        border-left: 0;
      }
    }
  }
`;

interface ControlledDateRangeFilterProps<T extends FieldValues> extends Omit<UseControllerProps<T>, "name"> {
  nameBegin: Path<T>;
  nameEnd: Path<T>;
  control: Control<T>;
}

export function ControlledDateRangeFilter<T extends FieldValues>({
  nameBegin,
  nameEnd,
  control,
}: ControlledDateRangeFilterProps<T>): ReactElement {
  const { t } = useTranslation("filters");
  const { field: fieldBegin } = useController({ name: nameBegin, control });
  const { field: fieldEnd } = useController({ name: nameEnd, control });

  const beginFilter = fieldBegin.value;
  const endFilter = fieldEnd.value;

  const handleChange = (val: string, paramName: string) => {
    if (paramName === nameBegin) {
      fieldBegin.onChange(val);
    } else if (paramName === nameEnd) {
      fieldEnd.onChange(val);
    }
  };

  const names = { begin: nameBegin, end: nameEnd };
  return (
    <DateRangeFilterWrapper>
      <DateInput
        language="fi"
        id={names.begin}
        label={t(`label.${names.begin}`)}
        placeholder={t(`placeholder.${names.begin}`)}
        onChange={(val: string) => handleChange(val, names.begin)}
        value={beginFilter ?? ""}
      />
      <DateInput
        language="fi"
        id={names.end}
        label={t(`label.${names.end}`)}
        placeholder={t(`placeholder.${names.end}`)}
        onChange={(val: string) => handleChange(val, names.end)}
        value={endFilter ?? ""}
      />
    </DateRangeFilterWrapper>
  );
}
