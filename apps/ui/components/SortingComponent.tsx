import React from "react";
import { Sorting } from "@/components/form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useSearchValues } from "@/hooks/useSearchValues";
import { type Url } from "next/dist/shared/lib/router/router";

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

  const handleRouteChange = (url: Url) => {
    router.replace(url, undefined, { shallow: true, scroll: false });
  };

  const handleSort = (sort: string) => {
    const params = {
      ...searchValues,
      sort,
    };
    handleRouteChange({ query: params });
  };
  const handleOrderChange = (order: "asc" | "desc") => {
    const params = {
      ...searchValues,
      order,
    };
    handleRouteChange({ query: params });
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
