import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "common/src/components";
import { useReservationUnitTypes, useUnitOptions } from "@/hooks";
import { ReservationUnitPublishingState } from "@gql/gql-types";
import { MultiSelectFilter, SearchFilter, RangeNumberFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";
import { Flex } from "common/styled";
import { type TagOptionsList, translateTag } from "@/modules/search";

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  [class*="ShowAllContainer__ToggleButtonContainer"] {
    margin-top: 0;
  }
`;

export function Filters(): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitStateOptions = Object.values(ReservationUnitPublishingState)
    .filter((x) => x !== ReservationUnitPublishingState.Archived)
    .map((s) => ({
      value: s,
      label: t(`reservationUnit:state.${s}`),
    }));

  const { options: unitOptions } = useUnitOptions();
  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();
  const { options: unitGroupOptions } = useUnitGroupOptions();

  const options: TagOptionsList = {
    reservationUnitTypes: reservationUnitTypeOptions,
    units: unitOptions,
    unitGroups: unitGroupOptions,
    reservationUnitStates: reservationUnitStateOptions,
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

  return (
    <Flex $gap="2-xs">
      <MoreWrapper showAllLabel={t("filters:moreFilters")} showLessLabel={t("filters:lessFilters")} maximumNumber={4}>
        <SearchFilter name="search" labelKey="reservationUnit" />
        <MultiSelectFilter options={unitOptions} name="unit" />
        <MultiSelectFilter options={reservationUnitTypeOptions} name="reservationUnitType" />
        <MultiSelectFilter options={reservationUnitStateOptions} name="reservationUnitState" />
        <RangeNumberFilter label={t("filters:label.maxPersons")} minName="maxPersonsGte" maxName="maxPersonsLte" />
        <RangeNumberFilter label={t("filters:label.surfaceArea")} minName="surfaceAreaGte" maxName="surfaceAreaLte" />
      </MoreWrapper>
      <SearchTags hide={[]} translateTag={translateTag(t, options)} />
    </Flex>
  );
}
