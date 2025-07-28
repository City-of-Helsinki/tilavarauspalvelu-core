import { useTranslation } from "next-i18next";
import { ShowAllContainer } from "common/src/components";
import { SearchTags } from "@/component/SearchTags";
import {
  ControlledMultiSelectFilter,
  ControlledSearchFilter,
  ControlledSelectFilter,
} from "@/component/QueryParamFilters";
import { translateTag } from "@/modules/search";
import { useForm } from "react-hook-form";
import { SearchButton, SearchButtonContainer } from "@/component/SearchButton";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { type ApplicationRoundFilterUnitFragment, MunicipalityChoice, ReserveeType } from "@gql/gql-types";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { filterNonNullable, mapParamToInterger, toNumber } from "common/src/helpers";
import { transformMunicipality, transformReserveeType } from "common/src/conversion";
import { useEffect } from "react";
import { gql } from "@apollo/client";
import { mapFormToSearchParams } from "common/src/modules/search";

type UnitFilterQueryType = ApplicationRoundFilterUnitFragment;

interface FilterProps {
  hideSearchTags: string[];
  units: UnitFilterQueryType[];
  isLoading?: boolean;
}

type SearchFormValues = {
  unit: number;
  // TODO replace with Priority
  priority: number[];
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

  const options = useFilterOptions();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ShowAllContainer
        showAllLabel={t("filters:moreFilters")}
        showLessLabel={t("filters:lessFilters")}
        maximumNumber={4}
      >
        <ControlledSelectFilter control={control} name="unit" options={options.units} />
        <ControlledMultiSelectFilter control={control} name="priority" options={options.priorityChoices} />
        <ControlledMultiSelectFilter control={control} name="order" options={options.orderChoices} />
        <ControlledSearchFilter control={control} name="search" />
        <ControlledMultiSelectFilter control={control} name="municipality" options={options.municipalities} />
        <ControlledMultiSelectFilter control={control} name="applicantType" options={options.reserveeTypes} />
        <ControlledMultiSelectFilter control={control} name="ageGroup" options={options.ageGroups} />
        <ControlledMultiSelectFilter control={control} name="purpose" options={options.purposes} />
      </ShowAllContainer>
      <SearchButtonContainer>
        <SearchTags hide={hideSearchTags} translateTag={translateTag(t, options)} />
        <SearchButton isLoading={isLoading} />
      </SearchButtonContainer>
    </form>
  );
}

// TODO cleanup these by using a generic conversion / sanitize function
// we can reuse the same for the search params -> gql query variables
function mapParamsToForm(params: URLSearchParams, units: UnitFilterQueryType[]): SearchFormValues {
  const unitFilter = toNumber(params.get("unit"));
  const applicantTypeFilter = filterNonNullable(params.getAll("applicantType").map(transformReserveeType));
  const priorityFilter = mapParamToInterger(params.getAll("priority"));
  const orderFilter = mapParamToInterger(params.getAll("order"));
  const ageGroupFilter = mapParamToInterger(params.getAll("ageGroup"), 1);
  const municipalityFilter = filterNonNullable(params.getAll("municipality").map(transformMunicipality));
  const purposeFilter = mapParamToInterger(params.getAll("purpose"), 1);

  return {
    unit: unitFilter ?? (units.length > 0 ? (units[0]?.pk ?? 0) : 0),
    priority: priorityFilter,
    order: orderFilter,
    search: params.get("search") ?? "",
    municipality: municipalityFilter,
    applicantType: applicantTypeFilter,
    ageGroup: ageGroupFilter,
    purpose: purposeFilter,
  };
}

export const APPLICATION_ROUND_FILTER_UNIT_FRAGMENT = gql`
  fragment ApplicationRoundFilterUnit on UnitNode {
    id
    pk
    nameFi
  }
`;
