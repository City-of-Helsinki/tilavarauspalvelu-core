import React from "react";
import { useTranslation } from "next-i18next";
import styled, { css, RuleSet } from "styled-components";
import { Flex, truncatedText } from "ui/src/styled";

type LegendItemT = {
  title: string;
  color?: string;
  border?: string;
  css?: RuleSet<object>;
};

type Props = {
  items?: LegendItemT[];
};

const Wrapper = styled(Flex).attrs({
  $wrap: "wrap",
  $justifyContent: "space-between",
  $direction: "row",
})`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-l);
  width: 100%;
  gap: var(--spacing-s) var(--spacing-xs);
`;

const LegendItem = styled.div<{
  $color?: string;
  $border?: string;
  $inlineCss?: RuleSet<object>;
}>`
  &:before {
    content: "";
    display: block;
    background-color: ${({ $color }) => $color};
    ${({ $border }) => ($border ? `border: 2px solid ${$border}` : "border: 1px solid var(--color-black-20)")};
    width: 30px;
    height: 40px;
    position: relative;
    box-sizing: border-box;
    ${({ $inlineCss }) => $inlineCss}
  }

  display: flex;
  place-content: flex-start;
  gap: var(--spacing-3-xs);
  position: relative;
`;

const LegendTitle = styled.div`
  display: block;
  font-size: var(--fontsize-body-s);
  align-self: center;
  ${truncatedText}
`;

const defaultItems: LegendItemT[] = [
  {
    title: "initial",
    color: "var(--tilavaraus-event-initial-color)",
    border: "var(--tilavaraus-event-initial-border)",
    css: css`
      border-style: dashed;
    `,
  },
  {
    title: "busy",
    color: "var(--tilavaraus-event-reservation-color)",
    border: "var(--tilavaraus-event-reservation-border)",
  },
  {
    title: "unavailable",
    color: "var(--color-black-10)",
    border: "var(--color-black-20)",
    css: css`
      background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNSA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPG1hc2sgaWQ9Im1hc2swXzcxNzZfMTk1MTI4IiBzdHlsZT0ibWFzay10eXBlOmx1bWluYW5jZSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjM1IiBoZWlnaHQ9IjUwIj4KPHBhdGggZD0iTTM0Ljg3NDUgMEgwLjg3NDUxMlY1MEgzNC44NzQ1VjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L21hc2s+CjxwYXRoIGQ9Ik0zNC4yNzk3IC0wLjc3OTMzNkwtMiA1MUwxLjQ2OTM1IDUwLjc3ODlMMzYuNDA0MyAwLjg3NDUxN0wzNC4yNzk3IC0wLjc3OTMzNloiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTE3LjI3OTcgLTI1Ljc3OTNMLTE2LjY1NTMgMjQuMTI1TC0xNS41MzA3IDI1Ljc3ODlMMTguNDA0MyAtMjQuMTI1NUwxNy4yNzk3IC0yNS43NzkzWiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNNTEuMjc5NyAyNC4yMjA3TDE3LjM0NDcgNzQuMTI1TDE4LjQ2OTMgNzUuNzc4OUw1Mi40MDQzIDI1Ljg3NDVMNTEuMjc5NyAyNC4yMjA3WiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4=");
      background-size: auto 10px;
    `,
  },
  {
    title: "free",
    color: "var(--color-white)",
  },
  {
    title: "timeIndicator",
    border: "transparent",
    css: css`
      border-top: 2px solid var(--color-bus-dark);
      top: 20px;
    `,
  },
] as const;

export function Legend({ items = defaultItems }: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper aria-hidden>
      {items.map(({ title, color, border, css: inlineCss }) => (
        <LegendItem key={title} $color={color} $border={border} $inlineCss={inlineCss}>
          <LegendTitle>{t(`reservationCalendar:legend.${title}`)}</LegendTitle>
        </LegendItem>
      ))}
    </Wrapper>
  );
}
