import React from "react";
import styled from "styled-components";
import { IconSortAscending, IconSortDescending, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { OptionType } from "../../modules/types";
import { fontMedium } from "../../modules/style/typography";

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
  justify-content: space-between;
  gap: var(--spacing-m);

  label {
    ${fontMedium};
  }
`;

const LeftBlock = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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

const StyledSelect = styled(Select)`
  min-width: 230px;
`;

const Sorting = ({
  value,
  sortingOptions,
  setSorting,
  isOrderingAsc,
  setIsOrderingAsc,
  className,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper className={className}>
      <LeftBlock>
        <OrderBtn
          type="button"
          onClick={() => setIsOrderingAsc(!isOrderingAsc)}
          aria-label={t(
            `search:sorting.action.${
              isOrderingAsc ? "descending" : "ascending"
            }`
          )}
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
      </LeftBlock>
      <StyledSelect
        label=""
        id="search-form__button--sorting"
        options={sortingOptions}
        onChange={setSorting}
        value={sortingOptions.find((option) => option.value === value)}
      />
    </Wrapper>
  );
};

export default Sorting;
export type SortingProps = Props;
