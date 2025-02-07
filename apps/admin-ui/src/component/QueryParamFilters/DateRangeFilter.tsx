import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { DateInput } from "hds-react";
import React from "react";
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

export function DateRangeFilter({ name }: { name: string }) {
  const names = {
    begin: `${name}Gte`,
    end: `${name}Lte`,
  };
  const { t } = useTranslation();
  const [searchParams, setParams] = useSearchParams();
  const beginFilter = searchParams.get(names.begin);
  const endFilter = searchParams.get(names.end);

  const handleChange = (val: string, paramName: string) => {
    const params = new URLSearchParams(searchParams);
    if (val.length > 0) {
      params.set(paramName, val);
      setParams(params, { replace: true });
    } else {
      setParams(params, { replace: true });
    }
  };

  return (
    <DateRangeFilterWrapper>
      <DateInput
        language="fi"
        id={names.begin}
        label={t(`filters.label.${names.begin}`)}
        placeholder={t(`filters.placeholder.${names.begin}`)}
        onChange={(val: string) => handleChange(val, names.begin)}
        value={beginFilter ?? ""}
      />
      <DateInput
        language="fi"
        id={names.end}
        label={t(`filters.label.${names.end}`)}
        placeholder={t(`filters.placeholder.${names.end}`)}
        onChange={(val: string) => handleChange(val, names.end)}
        value={endFilter ?? ""}
      />
    </DateRangeFilterWrapper>
  );
}
