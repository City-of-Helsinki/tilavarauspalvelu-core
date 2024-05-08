import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import { useUnitFilterOptions } from "../filters/UnitFilter";
import { AutoGrid } from "@/styles/layout";
import { useReservationUnitTypes } from "../filters/ReservationUnitTypeFilter";
import { ReservationUnitState } from "@gql/gql-types";
import {
  MultiSelectFilter,
  SearchFilter,
  RangeNumberFilter,
} from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-xs);
`;

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  [class*="ShowAllContainer__ToggleButtonContainer"] {
    margin-top: 0;
  }
`;

function Filters(): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitStateOptions = Object.values(ReservationUnitState)
    .filter((x) => x !== ReservationUnitState.Archived)
    .map((s) => ({
      value: s,
      label: t(`ReservationUnits.state.${s}`),
    }));

  const { options: unitOptions } = useUnitFilterOptions();
  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();

  function translateTag(tag: string, val: string): string {
    switch (tag) {
      case "unit":
        return unitOptions.find((u) => u.value === Number(val))?.label || val;
      case "reservationUnitType":
        return (
          reservationUnitTypeOptions.find((u) => u.value === Number(val))
            ?.label || val
        );
      case "reservationUnitState":
        return (
          reservationUnitStateOptions.find((u) => u.value === val)?.label || val
        );
      case "maxPersonsGte":
        return t("ReservationUnitsSearch.filters.maxPersonsGteTag", {
          value: val,
        });
      case "maxPersonsLte":
        return t("ReservationUnitsSearch.filters.maxPersonsLteTag", {
          value: val,
        });
      case "surfaceAreaGte":
        return t("ReservationUnitsSearch.filters.surfaceAreaGteTag", {
          value: val,
        });
      case "surfaceAreaLte":
        return t("ReservationUnitsSearch.filters.surfaceAreaLteTag", {
          value: val,
        });
      default:
        return val;
    }
  }

  return (
    <Wrapper>
      <AutoGrid>
        <SearchFilter name="search" labelKey="reservationUnit" />
        <MultiSelectFilter options={unitOptions} name="unit" />
        <MultiSelectFilter
          options={reservationUnitTypeOptions}
          name="reservationUnitType"
        />
        <MultiSelectFilter
          options={reservationUnitStateOptions}
          name="reservationUnitState"
        />
      </AutoGrid>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={0}
      >
        <AutoGrid>
          <RangeNumberFilter
            label={t("ReservationUnitsSearch.maxPersonsLabel")}
            minName="maxPersonsGte"
            maxName="maxPersonsLte"
          />
          <RangeNumberFilter
            label={t("ReservationUnitsSearch.surfaceAreaLabel")}
            minName="surfaceAreaGte"
            maxName="surfaceAreaLte"
          />
        </AutoGrid>
      </MoreWrapper>
      <SearchTags hide={[]} translateTag={translateTag} />
    </Wrapper>
  );
}

export default Filters;
