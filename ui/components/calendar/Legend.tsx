import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";

type Props = {
  items?: LegendItem[];
};

type LegendItem = {
  title: string;
  color: string;
};

const Wrapper = styled.div`
  display: flex;
  margin-bottom: var(--spacing-l);
  gap: var(--spacing-3-xl);

  @media (min-width: ${breakpoint.l}) {
    justify-content: space-between;
  }
`;

const LegendItem = styled.div<{ $color: string }>`
  &:before {
    content: "";
    display: block;
    background-color: ${({ $color }) => $color};
    border: 1px solid var(--color-black-40);
    width: 34px;
    height: 34px;
    position: relative;
    left: calc(50% - 18px);
  }

  display: grid;
  align-content: center;
  column-gap: var(--spacing-xl);
  gap: var(--spacing-3-xs);
`;

const LegendTitle = styled.div`
  display: block;
  white-space: nowrap;
  font-size: var(--fontsize-body-s);
`;

const defaultItems: LegendItem[] = [
  {
    title: "free",
    color: "var(--color-white)",
  },
  {
    title: "unavailable",
    color: "var(--color-black-10)",
  },
  {
    title: "busy",
    color: "var(--color-brick-dark)",
  },
];

const Legend = ({ items = defaultItems }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper aria-hidden>
      {items.map(({ title, color }) => (
        <LegendItem key={title} $color={color}>
          <LegendTitle>{t(`reservationCalendar:legend.${title}`)}</LegendTitle>
        </LegendItem>
      ))}
    </Wrapper>
  );
};
export default Legend;
