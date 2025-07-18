/**
 * Selector component for weekdays
 * TODO this not accessible
 */
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { WEEKDAYS_SORTED } from "common/src/const";
import { Flex } from "common/styled";
import { Weekday } from "@gql/gql-types";

const Day = styled.button`
  background-color: var(--color-black-5);
  border: 2px solid var(--color-black-5);
  border-radius: 1rem;
  color: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  font-size: var(--fontsize-body-s);

  &:hover,
  &:focus-within {
    cursor: pointer;
    filter: brightness(80%);
    outline: none;
  }

  &.active {
    background-color: var(--color-black-5);
    border: 2px solid var(--color-bus);
    color: var(--color-bus);
  }
`;

// Custom copy of HDS error field component which isn't exported
const ErrorText = styled.div`
  --icon-size: var(--fontsize-body-m);
  position: relative;
  color: var(--helper-color-invalid);
  display: flex;
  line-height: var(--lineheight-l);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  white-space: pre-line;

  & svg {
    margin-right: 0.5rem;
    max-width: 24px;
    max-height: 24px;
  }
`;

// TODO this is not a label
const Label = styled.p<{ $bold?: boolean }>`
  font-family: var(--fontsize-body-m);
  font-weight: ${({ $bold }) => ($bold ? "700" : "500")};
`;

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24v24H0z" />
      <path fill="currentColor" d="M12 3a9 9 0 110 18 9 9 0 010-18zm1 13v2h-2v-2h2zm0-10v8h-2V6h2z" />
    </g>
  </svg>
);

type Props = {
  label: string;
  value: Weekday[];
  disabled?: boolean;
  onChange: (value: Weekday[]) => void;
  errorText?: string;
};

export function WeekdaysSelector({ label, value = [], disabled = false, onChange, errorText }: Props) {
  const { t } = useTranslation();

  const handleDayToggle = (day: Weekday) => {
    if (value.includes(day)) {
      const vals = value.filter((d) => d !== day);
      onChange(vals);
    } else {
      const vals = [...value, day];
      onChange(vals);
    }
  };

  // NOTE This is not accessible (even with the role="checkbox")
  return (
    <div>
      <Label>{label}</Label>
      <Flex $gap="s" $direction="row">
        {WEEKDAYS_SORTED.map((weekday) => (
          <Day
            key={`weekday-${weekday}`}
            disabled={disabled}
            onClick={() => handleDayToggle(weekday)}
            className={value.includes(weekday) ? "active" : ""}
            type="button"
            aria-pressed={value.includes(weekday)}
          >
            {t(`dayShort.${weekday}`)}
          </Day>
        ))}
      </Flex>
      {!disabled && errorText && (
        <ErrorText>
          <WarningIcon /> {errorText}
        </ErrorText>
      )}
    </div>
  );
}
