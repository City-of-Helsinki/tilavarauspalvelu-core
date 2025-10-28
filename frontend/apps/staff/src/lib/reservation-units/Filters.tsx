import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { ShowAllContainer } from "ui/src/components";
import { SearchButton, SearchButtonContainer } from "ui/src/components/SearchButton";
import { mapFormToSearchParams } from "ui/src/modules/search";
import { Flex } from "ui/src/styled";
import {
  ControlledSearchFilter,
  ControlledMultiSelectFilter,
  ControlledRangeNumberFilter,
} from "@/components/QueryParamFilters";
import { SearchTags } from "@/components/SearchTags";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { type TagOptionsList, translateTag } from "@/modules/search";
import { ReservationUnitPublishingState } from "@gql/gql-types";

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  [class*="ShowAllContainer__ToggleButtonContainer"] {
    margin-top: 0;
  }
`;

type SearchFormValues = {
  search: string;
  unit: number[];
  reservationUnitType: number[];
  reservationUnitState: ReservationUnitPublishingState[];
  unitGroup: number[];
  maxPersonsGte?: number;
  maxPersonsLte?: number;
  surfaceAreaGte?: number;
  surfaceAreaLte?: number;
};

function mapParamsToForm(searchParams: ReadonlyURLSearchParams): SearchFormValues {
  const {
    unitFilter,
    reservationUnitTypeFilter,
    textFilter,
    reservationUnitStateFilter,
    unitGroupFilter,
    maxPersonsGteFilter: maxPersonsGte,
    maxPersonsLteFilter: maxPersonsLte,
    surfaceAreaGteFilter: surfaceAreaGte,
    surfaceAreaLteFilter: surfaceAreaLte,
  } = getFilterSearchParams({ searchParams });
  return {
    search: textFilter ?? "",
    unit: unitFilter ?? [],
    reservationUnitType: reservationUnitTypeFilter ?? [],
    reservationUnitState: reservationUnitStateFilter ?? [],
    unitGroup: unitGroupFilter ?? [],
    maxPersonsGte,
    maxPersonsLte,
    surfaceAreaGte,
    surfaceAreaLte,
  };
}

export function Filters({
  options,
  onChangedCriteria,
}: {
  options: TagOptionsList;
  onChangedCriteria: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  const defaultValues = mapParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });

  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };
  const { handleSubmit, control, reset } = form;
  useEffect(() => {
    reset(mapParamsToForm(searchParams));
    onChangedCriteria(); // can't have this in the dependency array, to stop infinite update loops
  }, [searchParams, reset]); // oxlint-disable-line exhaustive-deps
  const initiallyOpen =
    defaultValues.unitGroup != null ||
    defaultValues.maxPersonsGte != null ||
    defaultValues.maxPersonsLte != null ||
    defaultValues.surfaceAreaGte != null ||
    defaultValues.surfaceAreaLte != null;

  return (
    <Flex as="form" noValidate $gap="2-xs" onSubmit={handleSubmit(onSubmit)}>
      <MoreWrapper
        initiallyOpen={initiallyOpen}
        showAllLabel={t("filters:moreFilters")}
        showLessLabel={t("filters:lessFilters")}
        maximumNumber={4}
      >
        <ControlledSearchFilter control={control} name="search" labelKey="reservationUnit" />
        <ControlledMultiSelectFilter control={control} options={options.units} name="unit" />
        <ControlledMultiSelectFilter
          control={control}
          options={options.reservationUnitTypes}
          name="reservationUnitType"
        />
        <ControlledMultiSelectFilter
          control={control}
          options={options.reservationUnitStates}
          name="reservationUnitState"
        />
        <ControlledMultiSelectFilter control={control} name="unitGroup" options={options.unitGroups} />
        <ControlledRangeNumberFilter
          control={control}
          label={t("filters:label.maxPersons")}
          minName="maxPersonsGte"
          maxName="maxPersonsLte"
        />
        <ControlledRangeNumberFilter
          control={control}
          label={t("filters:label.surfaceArea")}
          minName="surfaceAreaGte"
          maxName="surfaceAreaLte"
        />
      </MoreWrapper>
      <SearchButtonContainer>
        <SearchTags hide={[]} translateTag={translateTag(t, options)} />
        <SearchButton />
      </SearchButtonContainer>
    </Flex>
  );
}
