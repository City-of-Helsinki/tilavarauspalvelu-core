import React from "react";
import styled from "styled-components";
import { IconSortAscending, IconSortDescending, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common";
import { Flex } from "common/styles/util";

type OptionType = {
  label: string;
  value: string;
};
type Props = {
  value: string;
  sortingOptions: OptionType[];
  setSorting: (option: OptionType) => void;
  isOrderingAsc: boolean;
  setIsOrderingAsc: (val: boolean) => void;
  className?: string;
};

const Wrapper = styled(Flex).attrs({
  $align: "center",
  $direction: "row",
  $gap: "xs",
  $justify: "flex-end",
  $wrap: "wrap",
})`
  flex-grow: 1;

  padding: var(--spacing-xs);
  background-color: var(--color-black-5);

  label {
    ${fontMedium};
  }
`;

const OrderBtn = styled.button`
  border: 0;
  background: transparent;
  position: relative;
  top: 2px;
  cursor: pointer;

  svg {
    color: var(--color-bus);
  }
`;

// without min-width the select size changes depending on the content
// correct way would be calculate the width based on the content
const StyledSelect = styled(Select<OptionType>)`
  min-width: 230px;
  flex-grow: 1;
  @media (min-width: ${breakpoints.s}) {
    flex-grow: 0;
  }
`;

// NOTE this is not used anywhere except SortingComponent.tsx
export function Sorting({
  value,
  sortingOptions,
  setSorting,
  isOrderingAsc,
  setIsOrderingAsc,
}: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <OrderBtn
        type="button"
        onClick={() => setIsOrderingAsc(!isOrderingAsc)}
        aria-label={t(
          `search:sorting.action.${isOrderingAsc ? "descending" : "ascending"}`
        )}
        data-testid="sorting-button"
      >
        {isOrderingAsc ? (
          <IconSortAscending
            size="m"
            aria-label={t("search:sorting.ascendingLabel")}
          />
        ) : (
          <IconSortDescending
            size="m"
            aria-label={t("search:sorting.descendingLabel")}
          />
        )}
      </OrderBtn>
      <label htmlFor="search-form__button--sorting-toggle-button">
        {t("searchResultList:sortButtonLabel")}:
      </label>
      <StyledSelect
        label=""
        id="search-form__button--sorting"
        options={sortingOptions}
        onChange={setSorting}
        value={sortingOptions.find((option) => option.value === value)}
      />
    </Wrapper>
  );
}
