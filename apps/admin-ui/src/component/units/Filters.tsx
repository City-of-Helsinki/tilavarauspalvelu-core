import React, { useEffect } from "react";
import { AutoGrid } from "common/styled";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { translateTag } from "@/modules/search";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { SearchButton, SearchButtonContainer } from "common/src/components/SearchButton";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { mapFormToSearchParams } from "common/src/modules/search";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { mapParamToInteger } from "common/src/helpers";

type SearchFormValues = {
  search: string;
  unitGroup: number[];
};

function mapSearchParamsToForm(searchParams: ReadonlyURLSearchParams): SearchFormValues {
  return {
    search: searchParams.get("search") ?? "",
    unitGroup: mapParamToInteger(searchParams.getAll("unitGroup"), 1),
  };
}

export function Filters(): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  const options = useFilterOptions();

  const defaultValues = mapSearchParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });
  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    reset(mapSearchParamsToForm(searchParams));
  }, [reset, searchParams]);

  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };

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
