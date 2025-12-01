import React, { useEffect } from "react";
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
  const [characterCount, setCharacterCount] = React.useState({ amount: 0, tooLong: false });
  useEffect(() => {
    setCharacterCount({
      amount: charCount(value, maxLength).amount,
      tooLong: !!maxLength && charCount(value, maxLength).amount > maxLength,
    });
  }, [value, maxLength]);
  const { amount, tooLong } = characterCount;
  return (
    <CounterWrapper style={style} className={className}>
      <span className={tooLong ? "error" : ""}>{amount}</span> / {maxLength} {t("forms:characters")}
    </CounterWrapper>
  );
}
