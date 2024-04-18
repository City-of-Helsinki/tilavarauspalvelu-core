import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import { useUnitFilterOptions } from "../filters/UnitFilter";
import { AutoGrid } from "@/styles/layout";
import { useReservationUnitTypes } from "../filters/ReservationUnitTypeFilter";
import { MultiSelectFilter, SearchFilter } from "../QueryParamFilters";
import { TextInput } from "hds-react";
import { useSearchParams } from "react-router-dom";
import { SearchTags } from "../SearchTags";
import { ReservationUnitState } from "@gql/gql-types";

const RangeContrainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: top;
  text-align: center;
`;

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

export const emptyState = {
  reservationUnitType: [],
  unit: [],
  reservationUnitStates: [],
};

// TODO move to same place with other filters
function NumberFilter({ name }: { name: string }) {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value.length > 0) {
      params.set(name, e.target.value);
      setSearchParams(params, { replace: true });
    } else {
      params.delete(name);
      setSearchParams(params, { replace: true });
    }
  };

  const value = searchParams.get(name);
  return (
    <TextInput
      id={name}
      label=" "
      onChange={handleOnChange}
      value={value || ""}
      // TODO change the key (same as the other filters)
      placeholder={t(`ReservationUnitsSearch.${name}PlaceHolder`)}
      errorText={
        value !== "" && Number.isNaN(Number(value))
          ? t("ReservationUnitsSearch.notANumber")
          : undefined
      }
    />
  );
}

function Filters(): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitStateOptions = Object.values(ReservationUnitState).map(
    (s) => ({
      value: s,
      label: t(`ReservationUnits.state.${s}`),
    })
  );

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
          <div>
            <div>{t("ReservationUnitsSearch.maxPersonsLabel")}</div>
            <RangeContrainer>
              <NumberFilter name="maxPersonsGte" />
              <NumberFilter name="maxPersonsLte" />
            </RangeContrainer>
          </div>
          <div>
            <div>{t("ReservationUnitsSearch.surfaceAreaLabel")}</div>
            <RangeContrainer>
              <NumberFilter name="surfaceAreaGte" />
              <NumberFilter name="surfaceAreaLte" />
            </RangeContrainer>
          </div>
        </AutoGrid>
      </MoreWrapper>
      <SearchTags hide={[]} translateTag={translateTag} />
    </Wrapper>
  );
}

export default Filters;
