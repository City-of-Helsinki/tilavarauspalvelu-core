import React from "react";
import { useTranslation } from "next-i18next";
import styled, { css, FlattenSimpleInterpolation } from "styled-components";
import { truncatedText } from "../../styles/util";

type LegendItemT = {
  title: string;
  color?: string;
  border?: string;
  css?: FlattenSimpleInterpolation;
};

type Props = {
  items?: LegendItemT[];
};

const Wrapper = styled.div`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-l);
  width: 100%;
  gap: var(--spacing-s) var(--spacing-xs);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const LegendItem = styled.div<{
  $color?: string;
  $border?: string;
  $inlineCss?: FlattenSimpleInterpolation;
}>`
  &:before {
    content: "";
    display: block;
    background-color: ${({ $color }) => $color};
    ${({ $border }) =>
      $border
        ? `border: 2px solid ${$border}`
        : "border: 1px solid var(--color-black-20)"};
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
  },
  {
    title: "busy",
    color: "var(--tilavaraus-event-reservation-color)",
    border: "var(--tilavaraus-event-reservation-border)",
  },
  {
    title: "unavailable",
    color: "var(--color-black-10)",
    border: "transparent",
  },
  {
    title: "free",
    color: "var(--color-white)",
  },
  {
    title: "timeIndicator",
    border: "transparent",
    css: css`
      border-top: 4px dotted #551a8b;
      top: 20px;
    `,
  },
] as const;

export function Legend({ items = defaultItems }: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper aria-hidden>
      {items.map(({ title, color, border, css: inlineCss }) => (
        <LegendItem
          key={title}
          $color={color}
          $border={border}
          $inlineCss={inlineCss}
        >
          <LegendTitle>{t(`reservationCalendar:legend.${title}`)}</LegendTitle>
        </LegendItem>
      ))}
    </Wrapper>
  );
}
