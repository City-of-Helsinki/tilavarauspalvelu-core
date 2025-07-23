import React from "react";
import { AutoGrid } from "common/styled";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";
import { translateTag, type TagOptionsList } from "@/modules/search";
import { useTranslation } from "next-i18next";

export function Filters(): JSX.Element {
  const { t } = useTranslation();
  const { options: unitGroupOptions } = useUnitGroupOptions();

  const options: TagOptionsList = {
    unitGroups: unitGroupOptions,
    // Not needed on this page
    orderChoices: [],
    priorityChoices: [],
    reservationUnitStates: [],
    reservationUnitTypes: [],
    units: [],
    stateChoices: [],
    reservationUnits: [],
    equipments: [],
    purposes: [],
    ageGroups: [],
    municipalities: [],
  };

  return (
    <>
      <AutoGrid>
        <SearchFilter name="search" labelKey="unit" />
        <MultiSelectFilter name="unitGroup" options={unitGroupOptions} />
      </AutoGrid>
      <SearchTags hide={[]} translateTag={translateTag(t, options)} />
    </>
  );
}
