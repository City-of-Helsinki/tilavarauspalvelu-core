import React from "react";
import { useTranslation } from "next-i18next";
import styled, { css, FlattenSimpleInterpolation } from "styled-components";
import { breakpoints } from "common/src/common/style";
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-l);
  width: 100%;
  gap: var(--spacing-s) var(--spacing-xs);

  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr 1fr 1fr;
  }

  @media (min-width: ${breakpoints.m}) {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.l}) {
    gap: var(--spacing-s);
  }
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
    width: 40px;
    height: 40px;
    position: relative;
    box-sizing: border-box;
    ${({ $inlineCss }) => $inlineCss}
  }

  display: flex;
  place-content: flex-start;
  gap: var(--spacing-xs) var(--spacing-xl);
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
    css: css`
      border-left: 2px solid var(--color-black-30);
    `,
  },
  {
    title: "free",
    color: "var(--color-white)",
  },
  {
    title: "buffer",
    color: "var(--color-black-5)",
    border: "transparent",
    css: css`
      border-top: 4px double var(--color-black-40);
      border-bottom: 4px double var(--color-black-40);
      height: 40px;
      padding: 4px 0;
    `,
  },
  {
    title: "timeIndicator",
    border: "transparent",
    css: css`
      border-top: 4px dotted #551a8b;
      top: 20px;
    `,
  },
];

const Legend = ({ items = defaultItems }: Props): JSX.Element => {
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
};
export default Legend;
