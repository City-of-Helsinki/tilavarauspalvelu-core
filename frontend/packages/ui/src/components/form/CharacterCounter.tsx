import React from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { charCount } from "@ui/modules/helpers";
import { fontBold } from "@ui/styled";

interface CharacterCounterProps {
  value: string;
  maxLength?: number;
  style?: CSSProperties;
  className?: string;
}
const CounterWrapper = styled.div`
  .error {
    color: var(--color-error);
    ${fontBold}
  }
`;

export function CharacterCounter({ value, maxLength, style, className }: CharacterCounterProps) {
  const { t } = useTranslation();

  const amount = charCount(value, maxLength).amount;
  const tooLong = !!maxLength && charCount(value, maxLength).amount > maxLength;

  return (
    <CounterWrapper style={style} className={className}>
      <span className={tooLong ? "error" : ""}>{amount}</span> / {maxLength} {t("forms:characters")}
    </CounterWrapper>
  );
}
