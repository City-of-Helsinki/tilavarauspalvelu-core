import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "common/src/components";
import { useReservationUnitTypes, useUnitOptions, useReservationUnitOptions } from "@/hooks";
import { Flex } from "common/styled";
import {
  CheckboxFilter,
  DateRangeFilter,
  MultiSelectFilter,
  RangeNumberFilter,
  SearchFilter,
  SelectFilter,
} from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { OrderStatusWithFree, ReservationTypeChoice, ReservationStateChoice } from "@gql/gql-types";
import { type TagOptionsList, translateTag } from "@/modules/search";

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

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

  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();

  const stateOptions = Object.values(ReservationStateChoice)
    .filter((s) => s !== ReservationStateChoice.Created)
    .map((s) => ({
      value: s,
      label: t(`reservation:state.${s}`),
    }));

  const paymentStatusOptions = Object.values(OrderStatusWithFree).map((s) => ({
    value: s,
    label: t(`translation:orderStatus.${s}`),
  }));

  const reservationTypeOptions = Object.values(ReservationTypeChoice).map((s) => ({
    value: s,
    label: t(`filters:reservationTypeChoice.${s}`),
  }));

  const { options: unitOptions } = useUnitOptions();

  const { options: reservationUnitOptions } = useReservationUnitOptions();

  const recurringOptions = [
    { value: "only", label: t("filters:label.onlyRecurring") },
    { value: "onlyNot", label: t("filters:label.onlyNotRecurring") },
  ];

  const options: TagOptionsList = {
    reservationUnitTypes: reservationUnitTypeOptions,
    stateChoices: stateOptions,
    reservationUnits: reservationUnitOptions,
    units: unitOptions,
    // Not needed on this page
    orderChoices: [],
    priorityChoices: [],
    reservationUnitStates: [],
    unitGroups: [],
    equipments: [],
    purposes: [],
    ageGroups: [],
    municipalities: [],
  };

  return (
    <Flex>
      <MoreWrapper showAllLabel={t("filters:moreFilters")} showLessLabel={t("filters:lessFilters")} maximumNumber={4}>
        <MultiSelectFilter options={reservationTypeOptions} name="reservationType" />
        <MultiSelectFilter options={stateOptions} name="state" />
        <MultiSelectFilter options={reservationUnitOptions} name="reservationUnit" />
        <SearchFilter name="search" labelKey="searchReservation" />
        <DateRangeFilter name="date" />
        <MultiSelectFilter options={unitOptions} name="unit" />
        <MultiSelectFilter options={reservationUnitTypeOptions} name="reservationUnitType" />
        <RangeNumberFilter label={t("filters:label.price")} minName="minPrice" maxName="maxPrice" />
        <MultiSelectFilter name="orderStatus" options={paymentStatusOptions} />
        <DateRangeFilter name="createdAt" />
        <SelectFilter name="recurring" options={recurringOptions} clearable />
        <CheckboxFilter name="freeOfCharge" />
      </MoreWrapper>
      <SearchTags
        translateTag={translateTag(t, options)}
        defaultTags={defaultFilters}
        clearButtonLabel={clearButtonLabel}
        clearButtonAriaLabel={clearButtonAriaLabel}
      />
    </Flex>
  );
}
