import React from "react";
import { breakpoints } from "common/src/common/style";
import styled from "styled-components";
import { Sorting } from "@/components/form";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useSearchValues } from "@/hooks/useSearchValues";

const StyledSorting = styled(Sorting)`
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
  align-items: center;
  flex-wrap: wrap;

  padding: var(--spacing-xs);
  background-color: var(--color-black-5);

  gap: var(--spacing-xs);
  @media (width > ${breakpoints.m}) {
    padding: var(--spacing-m);
    gap: var(--spacing-m);
  }
`;

export function SortingComponent() {
  const searchValues = useSearchValues();
  const { t } = useTranslation();
  const router = useRouter();

  const sortingOptions = [
    {
      label: t("search:sorting.label.name"),
      value: "name",
    },
    {
      label: t("search:sorting.label.type"),
      value: "typeRank",
    },
    {
      label: t("search:sorting.label.unit"),
      value: "unitName",
    },
  ];

  const isOrderingAsc = searchValues.order !== "desc";

  const value =
    searchValues.sort != null && !Array.isArray(searchValues.sort)
      ? searchValues.sort
      : "name";

  return (
    <StyledSorting
      value={value}
      sortingOptions={sortingOptions}
      setSorting={(val) => {
        const params = {
          ...searchValues,
          sort: val.value,
        };
        router.replace({ query: params });
      }}
      isOrderingAsc={isOrderingAsc}
      setIsOrderingAsc={(isAsc: boolean) => {
        const params = {
          ...searchValues,
          order: isAsc ? "asc" : "desc",
        };
        router.replace({ query: params });
      }}
    />
  );
}
