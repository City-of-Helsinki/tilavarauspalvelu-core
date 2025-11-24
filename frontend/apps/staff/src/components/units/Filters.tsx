import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { SearchButton, SearchButtonContainer } from "ui/src/components/SearchButton";
import { mapParamToInteger } from "ui/src/modules/helpers";
import { mapFormToSearchParams } from "ui/src/modules/search";
import { AutoGrid } from "ui/src/styled";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/components/QueryParamFilters";
import { SearchTags } from "@/components/SearchTags";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { translateTag } from "@/modules/search";

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
