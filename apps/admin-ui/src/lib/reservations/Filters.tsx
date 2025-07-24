import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "common/src/components";
import { Flex } from "common/styled";
import {
  ControlledCheckboxFilter,
  ControlledMultiSelectFilter,
  ControlledSearchFilter,
  ControlledSelectFilter,
  ControlledDateRangeFilter,
  ControlledRangeNumberFilter,
} from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { OrderStatusWithFree, ReservationTypeChoice, ReservationStateChoice } from "@gql/gql-types";
import { type TagOptionsList, translateTag } from "@/modules/search";
import { useForm } from "react-hook-form";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { SearchButton, SearchButtonContainer } from "@/component/SearchButton";
import { useSearchParams } from "next/navigation";
import { transformReservationState, transformReservationType } from "common/src/conversion";
import { filterNonNullable } from "common/src/helpers";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { mapParamToNumber } from "@/helpers";

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

type SearchFormValues = {
  reservationType: ReservationTypeChoice[];
  state: ReservationStateChoice[];
  reservationUnit: number[];
  search?: string;
  dateGte?: string;
  dateLte?: string;
  unit: number[];
  reservationUnitType: number[];
  minPrice?: number;
  maxPrice?: number;
  orderStatus: OrderStatusWithFree[];
  createdAtGte?: string;
  createdAtLte?: string;
  recurring?: "only" | "onlyNot" | undefined;
  freeOfCharge: boolean;
};

// TODO the reverse of this (from search params to form values)
// TODO might just be better make this generic and copy all form values to search params (not specific keys)
function mapFormToSearchParams(data: SearchFormValues): URLSearchParams {
  const params = new URLSearchParams();
  if (data.search) {
    params.set("search", data.search);
  }
  if (data.dateGte) {
    params.set("dateGte", data.dateGte);
  }
  if (data.dateLte) {
    params.set("dateLte", data.dateLte);
  }
  if (data.unit.length > 0) {
    data.unit.forEach((unit) => params.append("unit", unit.toString()));
  }
  if (data.reservationUnitType.length > 0) {
    data.reservationUnitType.forEach((type) => params.append("reservationUnitType", type.toString()));
  }
  if (data.minPrice !== undefined) {
    params.set("minPrice", data.minPrice.toString());
  }
  if (data.maxPrice !== undefined) {
    params.set("maxPrice", data.maxPrice.toString());
  }
  if (data.orderStatus.length > 0) {
    data.orderStatus.forEach((status) => params.append("orderStatus", status));
  }
  if (data.createdAtGte) {
    params.set("createdAtGte", data.createdAtGte);
  }
  if (data.createdAtLte) {
    params.set("createdAtLte", data.createdAtLte);
  }
  if (data.recurring !== undefined) {
    params.set("recurring", data.recurring.toString());
  }
  if (data.freeOfCharge) {
    params.set("freeOfCharge", "true");
  }
  if (data.reservationType.length > 0) {
    data.reservationType.forEach((type) => params.append("reservationType", type));
  }
  if (data.state.length > 0) {
    data.state.forEach((state) => params.append("state", state));
  }
  if (data.reservationUnit.length > 0) {
    data.reservationUnit.forEach((unit) => params.append("reservationUnit", unit.toString()));
  }
  return params;
}

// TODO replace with safer version that checks for valid values
// also a generice would be nice
function mapParamsToForm(params: URLSearchParams): SearchFormValues {
  return {
    reservationType: filterNonNullable(params.getAll("reservationType").map(transformReservationType)),
    state: filterNonNullable(params.getAll("state").map(transformReservationState)),
    reservationUnit: params.getAll("reservationUnit").map(Number),
    search: params.get("search") ?? undefined,
    dateGte: params.get("dateGte") ?? undefined,
    dateLte: params.get("dateLte") ?? undefined,
    unit: params.getAll("unit").map(Number),
    reservationUnitType: params.getAll("reservationUnitType").map(Number),
    minPrice: params.has("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    orderStatus: params.getAll("orderStatus") as OrderStatusWithFree[],
    createdAtGte: params.get("createdAtGte") ?? undefined,
    createdAtLte: params.get("createdAtLte") ?? undefined,
    recurring:
      params.get("recurring") === "only" ? "only" : params.get("recurring") === "onlyNot" ? "onlyNot" : undefined,
    freeOfCharge: params.get("freeOfCharge") === "true",
  };
}

export function Filters({
  defaultFilters = [],
  clearButtonLabel,
  clearButtonAriaLabel,
}: Readonly<{
  defaultFilters?: Array<{ key: string; value: string | string[] }>;
  clearButtonLabel?: string;
  clearButtonAriaLabel?: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  // TODO this only filters the options after a search, have to use form data if we want to filter without searching
  const unitFilter = mapParamToNumber(searchParams.getAll("unit"), 1);
  const options = useFilterOptions(unitFilter);
  const tagOptions: TagOptionsList = {
    ...options,
  };

  const defaultValues = mapParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });
  const { handleSubmit, control, reset } = form;
  useEffect(() => {
    reset(mapParamsToForm(searchParams));
  }, [searchParams, reset]);

  const onSubmit = (data: SearchFormValues) => {
    const searchParams = mapFormToSearchParams(data);
    setSearchParams(searchParams);
  };

  return (
    <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)} $direction="column" $gap="s">
      <MoreWrapper showAllLabel={t("filters:moreFilters")} showLessLabel={t("filters:lessFilters")} maximumNumber={4}>
        <ControlledMultiSelectFilter
          control={control}
          options={options.reservationTypeChoices}
          name="reservationType"
        />
        <ControlledMultiSelectFilter control={control} options={options.stateChoices} name="state" />
        <ControlledMultiSelectFilter control={control} options={options.reservationUnits} name="reservationUnit" />
        <ControlledSearchFilter control={control} name="search" labelKey="searchReservation" />
        <ControlledDateRangeFilter control={control} nameBegin="dateGte" nameEnd="dateLte" />
        <ControlledMultiSelectFilter control={control} options={options.units} name="unit" />
        <ControlledMultiSelectFilter
          control={control}
          options={options.reservationUnitTypes}
          name="reservationUnitType"
        />
        <ControlledRangeNumberFilter
          control={control}
          label={t("filters:label.price")}
          minName="minPrice"
          maxName="maxPrice"
        />
        <ControlledMultiSelectFilter control={control} name="orderStatus" options={options.orderStatus} />
        <ControlledDateRangeFilter control={control} nameBegin="createdAtGte" nameEnd="createdAtLte" />
        <ControlledSelectFilter control={control} name="recurring" options={options.recurringChoices} clearable />
        <ControlledCheckboxFilter control={control} name="freeOfCharge" />
      </MoreWrapper>
      <SearchButtonContainer>
        <SearchTags
          translateTag={translateTag(t, tagOptions)}
          defaultTags={defaultFilters}
          clearButtonLabel={clearButtonLabel}
          clearButtonAriaLabel={clearButtonAriaLabel}
        />
        <SearchButton />
      </SearchButtonContainer>
    </Flex>
  );
}
