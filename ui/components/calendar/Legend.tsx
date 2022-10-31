import React from "react";
import { useTranslation } from "react-i18next";
import styled, { css, FlattenSimpleInterpolation } from "styled-components";
import { breakpoints } from "common/src/common/style";
import { truncatedText } from "../../styles/util";

type Props = {
  items?: LegendItem[];
  wrapBreakpoint?: string;
};

type LegendItem = {
  title: string;
  color?: string;
  border?: string;
  css?: FlattenSimpleInterpolation;
};

const Wrapper = styled.div<{ $wrapBreakpoint: string }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: var(--spacing-l);
  padding-top: var(--spacing-l);
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
    margin-top: var(--spacing-m);
    gap: var(--spacing-m);
  }

  ${({ $wrapBreakpoint }) =>
    $wrapBreakpoint &&
    css`
      @media (min-width: ${$wrapBreakpoint}) {
        flex-direction: column;
        position: absolute;
        top: 440px;
        left: calc(100% + var(--spacing-xl));
        width: unset;
        width: 200px;
      }
    `}
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
    height: 32px;
    position: relative;
    ${({ $inlineCss }) => $inlineCss}

    @media (min-width: ${breakpoints.l}) {
      width: 54px;
      height: 40px;
    }
  }

  display: flex;
  align-content: flex-start;
  justify-content: flex-start;
  column-gap: var(--spacing-xl);
  gap: var(--spacing-xs);
  position: relative;
`;

const LegendTitle = styled.div`
  display: block;
  font-size: var(--fontsize-body-s);
  align-self: center;
  ${truncatedText}
`;

const defaultItems: LegendItem[] = [
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
      height: 18px;
      padding: 4px 0;

      @media (min-width: ${breakpoints.l}) {
        height: 34px !important;
      }
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

const Legend = ({
  items = defaultItems,
  wrapBreakpoint,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper $wrapBreakpoint={wrapBreakpoint} aria-hidden>
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
