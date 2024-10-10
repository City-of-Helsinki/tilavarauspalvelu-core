import React from "react";
import styled from "styled-components";
import { IconSortAscending, IconSortDescending, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common";

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

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

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

const StyledSelect = styled(Select<OptionType>)`
  min-width: 230px;
  flex-grow: 1;
  @media (min-width: ${breakpoints.s}) {
    padding-left: var(--spacing-s);
    flex-grow: 0;
  }
`;

export function Sorting({
  value,
  sortingOptions,
  setSorting,
  isOrderingAsc,
  setIsOrderingAsc,
  className,
}: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper className={className}>
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
