import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ShowAllContainer } from "ui/src/components";
import { SearchButton, SearchButtonContainer } from "ui/src/components/SearchButton";
import { mapFormToSearchParams } from "ui/src/modules/search";
import {
  ControlledMultiSelectFilter,
  ControlledSearchFilter,
  ControlledSelectFilter,
} from "@/components/QueryParamFilters";
import { SearchTags } from "@/components/SearchTags";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { translateTag } from "@/modules/search";
import type { ApplicationRoundFilterUnitFragment, MunicipalityChoice, Priority, ReserveeType } from "@gql/gql-types";

type UnitFilterQueryType = ApplicationRoundFilterUnitFragment;

interface FilterProps {
  hideSearchTags: string[];
  units: UnitFilterQueryType[];
  isLoading?: boolean;
}

type SearchFormValues = {
  unit: number;
  priority: Priority[];
  order: number[];
  search: string;
  municipality: MunicipalityChoice[];
  applicantType: ReserveeType[];
  ageGroup: number[];
  purpose: number[];
};

export function Filters({ hideSearchTags, units, isLoading }: FilterProps): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  const defaultValues: SearchFormValues = mapParamsToForm(searchParams, units);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });
  const { handleSubmit, control, reset } = form;
  useEffect(() => {
    const newValues = mapParamsToForm(searchParams, units);
    reset(newValues);
  }, [reset, searchParams, units]);

  const onSubmit = (values: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(values));
  };

  const originalOptions = useFilterOptions();
  const options = {
    ...originalOptions,
    /// Remove units that the user has no access to or don't have any applications
    units: units.map((unit) => ({ label: unit.nameFi ?? "", value: unit.pk ?? 0 })),
  };

  const initiallyOpen =
    defaultValues.municipality.length > 0 ||
    defaultValues.applicantType.length > 0 ||
    defaultValues.ageGroup.length > 0 ||
    defaultValues.purpose.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ShowAllContainer
        showAllLabel={t("filters:moreFilters")}
        showLessLabel={t("filters:lessFilters")}
        maximumNumber={4}
        initiallyOpen={initiallyOpen}
      >
        <ControlledSelectFilter control={control} name="unit" options={options.units} />
        <ControlledMultiSelectFilter control={control} name="priority" options={options.priorityChoices} />
        <ControlledMultiSelectFilter control={control} name="order" options={options.orderChoices} />
        <ControlledSearchFilter control={control} name="search" />
        <ControlledMultiSelectFilter control={control} name="municipality" options={options.municipalities} />
        <ControlledMultiSelectFilter control={control} name="applicantType" options={options.reserveeTypes} />
        <ControlledMultiSelectFilter control={control} name="ageGroup" options={options.ageGroups} />
        <ControlledMultiSelectFilter control={control} name="purpose" options={options.reservationPurposes} />
      </ShowAllContainer>
      <SearchButtonContainer>
        <SearchTags hide={hideSearchTags} translateTag={translateTag(t, options)} />
        <SearchButton isLoading={isLoading} />
      </SearchButtonContainer>
    </form>
  );
}

function mapParamsToForm(params: ReadonlyURLSearchParams, units: UnitFilterQueryType[]): SearchFormValues {
  const {
    unitFilter,
    orderFilter,
    priorityFilter,
    applicantTypeFilter,
    municipalityFilter,
    purposeFilter,
    ageGroupFilter,
    textFilter,
  } = getFilterSearchParams({ searchParams: params });

  const firstUnit = unitFilter?.[0];
  return {
    unit: firstUnit ?? (units.length > 0 ? (units[0]?.pk ?? 0) : 0),
    priority: priorityFilter ?? [],
    order: orderFilter ?? [],
    search: textFilter ?? "",
    municipality: municipalityFilter ?? [],
    applicantType: applicantTypeFilter ?? [],
    ageGroup: ageGroupFilter ?? [],
    purpose: purposeFilter ?? [],
  };
}

export const APPLICATION_ROUND_FILTER_UNIT_FRAGMENT = gql`
  fragment ApplicationRoundFilterUnit on UnitNode {
    id
    pk
    nameFi
  }
`;
