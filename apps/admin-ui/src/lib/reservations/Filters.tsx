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
import { transformPaymentStatus, transformReservationState, transformReservationType } from "common/src/conversion";
import { filterNonNullable, mapParamToInterger, toNumber } from "common/src/helpers";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { mapFormToSearchParams } from "common/src/modules/search";

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
  freeOfCharge?: boolean;
};

// TODO replace with safer version that checks for valid values
// also a generice would be nice
function mapParamsToForm(params: URLSearchParams): SearchFormValues {
  return {
    reservationType: filterNonNullable(params.getAll("reservationType").map(transformReservationType)),
    state: filterNonNullable(params.getAll("state").map(transformReservationState)),
    reservationUnit: mapParamToInterger(params.getAll("reservationUnit"), 1),
    search: params.get("search") ?? undefined,
    dateGte: params.get("dateGte") ?? undefined,
    dateLte: params.get("dateLte") ?? undefined,
    unit: mapParamToInterger(params.getAll("unit"), 1),
    reservationUnitType: mapParamToInterger(params.getAll("reservationUnitType"), 1),
    minPrice: toNumber(params.get("minPrice")) ?? undefined,
    maxPrice: toNumber(params.get("maxPrice")) ?? undefined,
    orderStatus: filterNonNullable(params.getAll("orderStatus").map(transformPaymentStatus)),
    createdAtGte: params.get("createdAtGte") ?? undefined,
    createdAtLte: params.get("createdAtLte") ?? undefined,
    recurring:
      params.get("recurring") === "only" ? "only" : params.get("recurring") === "onlyNot" ? "onlyNot" : undefined,
    freeOfCharge: params.get("freeOfCharge") ? params.get("freeOfCharge") === "true" : undefined,
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
  const unitFilter = mapParamToInterger(searchParams.getAll("unit"), 1);
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
