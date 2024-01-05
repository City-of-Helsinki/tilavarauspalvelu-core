import React, { ReactNode } from "react";
import { Button } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

interface IProps {
  children: ReactNode;
}

const Filters = styled.div`
  & > button {
    margin-right: var(--spacing-m);

    span {
      display: none;

      @media (min-width: ${breakpoints.s}) {
        display: inline;
      }
    }
  }

  svg {
    display: inline;
    min-width: 20px;
  }

  background-color: var(--tilavaraus-admin-gray);
  padding: 0 var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: var(--tilavaraus-admin-stack-sticky-filters);
`;

interface IFilterBtn {
  $filterControlsAreOpen: boolean;
  $filtersActive: boolean;
}

export const FilterBtn = styled(Button)<IFilterBtn>`
  --background-color-disabled: transparent;
  --border-color-disabled: transparent;
  --color-disabled: var(--color-black-50);
  --color-bus: var(--filter-button-color);
  --color-bus-dark: var(--filter-button-color);

  /* TODO this is weird why are we overriding colour-white? */
  --color-white: ${({ $filtersActive }) =>
    $filtersActive ? "white" : "var(--tilavaraus-admin-content-text-color)"};
  --filter-button-color: ${({ $filtersActive, $filterControlsAreOpen }) =>
    $filtersActive
      ? "var(--tilavaraus-admin-blue-dark)"
      : $filterControlsAreOpen
        ? "var(--color-silver)"
        : "transparent"};

  ${({ $filtersActive }) =>
    $filtersActive &&
    `
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: bold;
  `}
`;

const FilterContainer = ({ children }: IProps): JSX.Element => {
  return <Filters>{children}</Filters>;
};

export default FilterContainer;
