import React from "react";
import { Sorting } from "@/components/form";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { useSearchModify } from "@/hooks/useSearchValues";

const SORTING_OPTIONS = [
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

function validateSorting(
  value: string | null
): (typeof SORTING_OPTIONS)[number]["value"] {
  if (SORTING_OPTIONS?.some((option) => option.value === value)) {
    return value as (typeof SORTING_OPTIONS)[number]["value"];
  }
  return "name";
}

export function SortingComponent() {
  const searchValues = useSearchParams();
  const { handleRouteChange } = useSearchModify();
  const { t } = useTranslation();

  const sortingOptions = SORTING_OPTIONS.map((option) => ({
    label: t(option.label),
    value: option.value,
  }));

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

  return (
    <Sorting
      value={value}
      sortingOptions={sortingOptions}
      setSorting={(val) => handleSort(val.value)}
      isOrderingAsc={isOrderingAsc}
      setIsOrderingAsc={(isAsc: boolean) =>
        handleOrderChange(isAsc ? "asc" : "desc")
      }
    />
  );
}
