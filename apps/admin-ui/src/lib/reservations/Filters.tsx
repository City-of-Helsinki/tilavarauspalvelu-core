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
import { translateTag } from "@/modules/search";
import { useForm } from "react-hook-form";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { SearchButton, SearchButtonContainer } from "common/src/components/SearchButton";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { mapParamToInteger } from "common/src/helpers";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { mapFormToSearchParams } from "common/src/modules/search";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";

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

function mapParamsToForm(searchParams: ReadonlyURLSearchParams): SearchFormValues {
  const {
    unitFilter,
    reservationStatusFilter,
    reservationUnitFilter,
    reservationTypeFilter,
    reservationUnitTypeFilter,
    orderStatusFilter,
    textFilter,
    recurringFilter,
    dateGteFilter: dateGte,
    dateLteFilter: dateLte,
    minPriceFilter: minPrice,
    maxPriceFilter: maxPrice,
    createdAtGteFilter: createdAtGte,
    createdAtLteFilter: createdAtLte,
    freeOfChargeFilter: freeOfCharge,
  } = getFilterSearchParams({ searchParams });

  return {
    reservationType: reservationTypeFilter ?? [],
    state: reservationStatusFilter ?? [],
    reservationUnit: reservationUnitFilter ?? [],
    search: textFilter,
    dateGte,
    dateLte,
    unit: unitFilter ?? [],
    reservationUnitType: reservationUnitTypeFilter ?? [],
    minPrice,
    maxPrice,
    orderStatus: orderStatusFilter ?? [],
    createdAtGte,
    createdAtLte,
    freeOfCharge,
    recurring: recurringFilter,
  };
}

interface FilterProps {
  defaultFilters?: ReadonlyArray<{ key: string; value: string | string[] }>;
  clearButtonLabel?: string;
  clearButtonAriaLabel?: string;
}

export function Filters({
  defaultFilters = [],
  clearButtonLabel,
  clearButtonAriaLabel,
}: Readonly<FilterProps>): JSX.Element {
  const { t } = useTranslation();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  // TODO this only filters the options after a search, have to use form data if we want to filter without searching
  const unitFilter = mapParamToInteger(searchParams.getAll("unit"), 1);
  const options = useFilterOptions(unitFilter);

  const defaultValues = mapParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });
  const { handleSubmit, control, reset } = form;
  useEffect(() => {
    reset(mapParamsToForm(searchParams));
  }, [searchParams, reset]);

  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };

  const initiallyOpen =
    defaultValues.dateLte != null ||
    defaultValues.unit.length > 0 ||
    defaultValues.reservationUnitType.length > 0 ||
    defaultValues.minPrice != null ||
    defaultValues.maxPrice != null ||
    defaultValues.orderStatus.length > 0 ||
    defaultValues.createdAtGte != null ||
    defaultValues.createdAtLte != null ||
    defaultValues.recurring != null ||
    defaultValues.freeOfCharge != null;
  return (
    <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)} $direction="column" $gap="s">
      <MoreWrapper
        showAllLabel={t("filters:moreFilters")}
        showLessLabel={t("filters:lessFilters")}
        maximumNumber={4}
        initiallyOpen={initiallyOpen}
      >
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
          translateTag={translateTag(t, options)}
          defaultTags={defaultFilters}
          clearButtonLabel={clearButtonLabel}
          clearButtonAriaLabel={clearButtonAriaLabel}
        />
        <SearchButton />
      </SearchButtonContainer>
    </Flex>
  );
}
