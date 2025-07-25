import React from "react";
import { AutoGrid } from "common/styled";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { translateTag } from "@/modules/search";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { SearchButton, SearchButtonContainer } from "../SearchButton";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { mapFormToSearchParams } from "common/src/modules/search";

type SearchFormValues = {
  search: string;
  unitGroup: number[];
};

export function Filters(): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();

  const options = useFilterOptions();

  const form = useForm<SearchFormValues>({
    defaultValues: {
      search: "",
      unitGroup: [],
    },
  });

  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };
  const { handleSubmit, control } = form;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <AutoGrid>
        <ControlledSearchFilter control={control} name="search" labelKey="unit" />
        <ControlledMultiSelectFilter control={control} name="unitGroup" options={options.unitGroups} />
      </AutoGrid>
      <SearchButtonContainer>
        <SearchTags hide={[]} translateTag={translateTag(t, options)} />
        <SearchButton />
      </SearchButtonContainer>
    </form>
  );
}
