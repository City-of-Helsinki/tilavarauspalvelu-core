import React from "react";
import { useTranslation } from "next-i18next";
import { IconSize, IconSortAscending, IconSortDescending, Select } from "hds-react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import type { Option } from "hds-react";
import { breakpoints } from "ui/src/modules/const";
import { convertOptionToHDS, getLocalizationLang } from "ui/src/modules/helpers";
import { Flex, fontMedium, focusStyles } from "ui/src/styled";
import { useSearchModify } from "@/hooks/useSearchValues";

export const SORTING_OPTIONS = [
  {
    label: "search:sorting.label.relevance",
    value: "relevance",
  },
  {
    label: "search:sorting.label.name",
    value: "name",
  },
  {
    label: "search:sorting.label.type",
    value: "typeRank",
  },
  {
    label: "search:sorting.label.unit",
    value: "unitName",
  },
] as const;

function validateSorting(value: string | null, hasTextSearch: boolean): (typeof SORTING_OPTIONS)[number]["value"] {
  if (SORTING_OPTIONS?.some((option) => option.value === value)) {
    return value as (typeof SORTING_OPTIONS)[number]["value"];
  }
  return hasTextSearch ? "relevance" : "name";
}

const Wrapper = styled(Flex).attrs({
  $alignItems: "center",
  $direction: "row",
  $gap: "xs",
  $justifyContent: "flex-end",
  $wrap: "wrap",
})`
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

  ${focusStyles};
  color: var(--color-bus);
  &:hover {
    color: var(--color-bus-dark);
  }
`;

// without min-width the select size changes depending on the content
// correct way would be calculate the width based on the content
const StyledSelect = styled(Select)`
  /* we want to align the Select horizontally here */
  && {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    & > * {
      margin: 0;
    }
  }

  flex-grow: 1;
  @media (min-width: ${breakpoints.s}) {
    flex-grow: 0;
    min-width: 300px;
  }
`;

export function SortingComponent() {
  const searchValues = useSearchParams();
  const { handleRouteChange } = useSearchModify();
  const { t, i18n } = useTranslation();
  const language = getLocalizationLang(i18n.language);

  const sortingOptions = SORTING_OPTIONS.map((option) => ({
    label: t(option.label),
    value: option.value,
  })).map((option) => convertOptionToHDS(option));

  const isOrderingAsc = searchValues.get("order") !== "desc";
  const hasTextSearch = (searchValues.get("textSearch") ?? "").trim() !== "";
  const value = validateSorting(searchValues.get("sort"), hasTextSearch);

  const handleSort: (sort: string) => Promise<void> = async (sort) => {
    const params = new URLSearchParams(searchValues);
    params.set("sort", sort);
    await handleRouteChange(params);
  };

  const handleOrderChange: (order: "asc" | "desc") => Promise<void> = async (order) => {
    const params = new URLSearchParams(searchValues);
    params.set("order", order);
    await handleRouteChange(params);
  };

  const handleSelect: (options: Option[]) => void = (options) => {
    const val = options.find((option) => option.selected)?.value;
    if (val != null) {
      void handleSort(val);
    }
  };

  const toggleOrder: () => Promise<void> = async () => {
    if (isOrderingAsc) {
      await handleOrderChange("desc");
    } else {
      await handleOrderChange("asc");
    }
  };
  const sortValue = sortingOptions.find((option) => option.value === value)?.value;

  return (
    <Wrapper>
      <OrderBtn
        type="button"
        onClick={toggleOrder}
        aria-label={t(`search:sorting.action.${isOrderingAsc ? "descending" : "ascending"}`)}
        data-testid="sorting-button"
      >
        {isOrderingAsc ? (
          <IconSortAscending
            size={IconSize.Medium}
            aria-label={t("search:sorting.ascendingLabel")}
            aria-hidden="false"
          />
        ) : (
          <IconSortDescending
            size={IconSize.Medium}
            aria-label={t("search:sorting.descendingLabel")}
            aria-hidden="false"
          />
        )}
      </OrderBtn>
      <StyledSelect
        texts={{
          label: t("searchResultList:sortButtonLabel"),
          language,
        }}
        options={sortingOptions}
        onChange={handleSelect}
        value={sortValue}
      />
    </Wrapper>
  );
}
