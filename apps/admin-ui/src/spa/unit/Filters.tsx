import React from "react";
import { AutoGrid } from "common/styled";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";

export function Filters(): JSX.Element {
  const { options: unitGroupOptions } = useUnitGroupOptions();

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "search":
        return value;
      case "unitGroup":
        return unitGroupOptions.find((option) => value === String(option.value))?.label ?? value;
      default:
        return "";
    }
  };

  return (
    <>
      <AutoGrid>
        <SearchFilter name="search" labelKey="unit" />
        <MultiSelectFilter name="unitGroup" options={unitGroupOptions} />
      </AutoGrid>
      <SearchTags hide={[]} translateTag={translateTag} />
    </>
  );
}
