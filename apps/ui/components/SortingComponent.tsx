import React from "react";
import { Sorting } from "@/components/form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useSearchValues } from "@/hooks/useSearchValues";

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
    <Sorting
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
