import React from "react";
import { AutoGrid } from "common/styled";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";
import { translateTag, type TagOptionsList } from "@/modules/search";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { SearchButton, SearchButtonContainer } from "../SearchButton";

type SearchFormValues = {
  search: string;
  unitGroup: number[];
};

export function Filters(): JSX.Element {
  const { t } = useTranslation();
  const { options: unitGroupOptions } = useUnitGroupOptions();
  const setSearchParams = useSetSearchParams();

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

  const form = useForm<SearchFormValues>({
    defaultValues: {
      search: "",
      unitGroup: [],
    },
  });

  const onSubmit = (data: SearchFormValues) => {
    const params = new URLSearchParams();
    if (data.search) {
      params.set("search", data.search);
    }
    for (const grp of data.unitGroup) {
      if (grp > 0) {
        params.append("unitGroup", grp.toString());
      }
    }
    setSearchParams(params);
  };
  const { handleSubmit, control } = form;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <AutoGrid>
        <ControlledSearchFilter control={control} name="search" labelKey="unit" />
        <ControlledMultiSelectFilter control={control} name="unitGroup" options={unitGroupOptions} />
      </AutoGrid>
      <SearchButtonContainer>
        <SearchTags hide={[]} translateTag={translateTag(t, options)} />
        <SearchButton />
      </SearchButtonContainer>
    </form>
  );
}
