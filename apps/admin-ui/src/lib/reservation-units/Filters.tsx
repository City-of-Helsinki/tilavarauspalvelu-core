import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "common/src/components";
import type { ReservationUnitPublishingState } from "@gql/gql-types";
import {
  ControlledSearchFilter,
  ControlledMultiSelectFilter,
  ControlledRangeNumberFilter,
} from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { Flex } from "common/styled";
import { translateTag } from "@/modules/search";
import type { TagOptionsList } from "@/modules/search";
import { SearchButton, SearchButtonContainer } from "common/src/components/SearchButton";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { mapFormToSearchParams } from "common/src/modules/search";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";

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
    maxPersonsGte,
    maxPersonsLte,
    surfaceAreaGte,
    surfaceAreaLte,
  };
}

export function Filters({ options }: { options: TagOptionsList }): JSX.Element {
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
  }, [searchParams, reset]);
  const initiallyOpen =
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
