import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "common/src/components";
import { ReservationUnitPublishingState } from "@gql/gql-types";
import {
  ControlledSearchFilter,
  ControlledMultiSelectFilter,
  ControlledRangeNumberFilter,
} from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { Flex } from "common/styled";
import { type TagOptionsList, translateTag } from "@/modules/search";
import { SearchButton, SearchButtonContainer } from "@/component/SearchButton";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { filterNonNullable, toNumber } from "common/src/helpers";
import { transformReservationUnitState } from "common/src/conversion";
import { useFilterOptions } from "@/hooks/useFilterOptions";

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

function mapParamsToForm(params: URLSearchParams): SearchFormValues {
  return {
    search: params.get("search") ?? "",
    unit: params
      .getAll("unit")
      .map((u) => Number(u))
      .filter((u) => u > 0),
    reservationUnitType: params
      .getAll("reservationUnitType")
      .map((u) => Number(u))
      .filter((u) => u > 0),
    reservationUnitState: filterNonNullable(
      params.getAll("reservationUnitState").map((state) => transformReservationUnitState(state))
    ),
    maxPersonsGte: toNumber(params.get("maxPersonsGte")) ?? undefined,
    maxPersonsLte: toNumber(params.get("maxPersonsLte")) ?? undefined,
    surfaceAreaGte: toNumber(params.get("surfaceAreaGte")) ?? undefined,
    surfaceAreaLte: toNumber(params.get("surfaceAreaLte")) ?? undefined,
  };
}

function mapFormToSearchParams(data: SearchFormValues): URLSearchParams {
  const params = new URLSearchParams();
  if (data.search) {
    params.set("search", data.search);
  }
  for (const u of data.unit) {
    if (u > 0) {
      params.append("unit", u.toString());
    }
  }
  for (const u of data.reservationUnitType) {
    params.append("reservationUnitType", u.toString());
  }
  for (const s of data.reservationUnitState) {
    params.append("reservationUnitState", s.toString());
  }
  if (data.maxPersonsGte) {
    params.set("maxPersonsGte", data.maxPersonsGte.toString());
  }
  if (data.maxPersonsLte) {
    params.set("maxPersonsLte", data.maxPersonsLte.toString());
  }
  if (data.surfaceAreaGte) {
    params.set("surfaceAreaGte", data.surfaceAreaGte.toString());
  }
  if (data.surfaceAreaLte) {
    params.set("surfaceAreaLte", data.surfaceAreaLte.toString());
  }
  return params;
}

export function Filters(): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  const options = useFilterOptions();
  const defaultValues = mapParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });
  const tagOptions: TagOptionsList = {
    ...options,
    // Not needed on this page
    orderChoices: [],
    priorityChoices: [],
    stateChoices: [],
    reservationUnits: [],
    equipments: [],
    purposes: [],
    ageGroups: [],
    municipalities: [],
  };

  const onSubmit = (data: SearchFormValues) => {
    const params = mapFormToSearchParams(data);
    setSearchParams(params);
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
        <SearchTags hide={[]} translateTag={translateTag(t, tagOptions)} />
        <SearchButton />
      </SearchButtonContainer>
    </Flex>
  );
}
