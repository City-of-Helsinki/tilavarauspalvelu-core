import React from "react";
import { AutoGrid } from "common/styled";
import { SearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";

export function Filters(): JSX.Element {
  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "search":
        return value;
      default:
        return "";
    }
  };

  return (
    <>
      <AutoGrid>
        <SearchFilter name="search" labelKey="unit" />
      </AutoGrid>
      <SearchTags hide={[]} translateTag={translateTag} />
    </>
  );
}
