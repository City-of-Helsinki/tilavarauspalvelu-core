import React from "react";
import { IconSize, IconSortAscending, IconSortDescending, Option, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { breakpoints } from "ui/src/modules/const";
import { convertOptionToHDS, getLocalizationLang } from "ui/src/modules/helpers";
import { Flex, fontMedium, focusStyles } from "ui/src/styled";
import { useSearchModify } from "@/hooks/useSearchValues";

export const SORTING_OPTIONS = [
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

function validateSorting(value: string | null): (typeof SORTING_OPTIONS)[number]["value"] {
  if (SORTING_OPTIONS?.some((option) => option.value === value)) {
    return value as (typeof SORTING_OPTIONS)[number]["value"];
  }
  return "name";
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
  })).map(convertOptionToHDS);

  const isOrderingAsc = searchValues.get("order") !== "desc";
  const value = validateSorting(searchValues.get("sort"));

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchValues);
    params.set("sort", sort);
    handleRouteChange(params);
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const params = new URLSearchParams(searchValues);
    params.set("order", order);
    handleRouteChange(params);
  };

  const handleSelect = (options: Option[]) => {
    const val = options.find((option) => option.selected)?.value;
    if (val != null) {
      handleSort(val);
    }
  };

  const toggleOrder = () => {
    if (isOrderingAsc) {
      handleOrderChange("desc");
    } else {
      handleOrderChange("asc");
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
