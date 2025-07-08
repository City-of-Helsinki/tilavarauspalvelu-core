import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import { useReservationUnitTypes, useUnitOptions } from "@/hooks";
import { ReservationUnitPublishingState } from "@gql/gql-types";
import { MultiSelectFilter, SearchFilter, RangeNumberFilter } from "@/component/QueryParamFilters";
import { SearchTags } from "@/component/SearchTags";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";
import { Flex } from "common/styled";

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

  const reservationUnitStateOptions = Object.values(ReservationUnitPublishingState)
    .filter((x) => x !== ReservationUnitPublishingState.Archived)
    .map((s) => ({
      value: s,
      label: t(`reservationUnit:state.${s}`),
    }));

  const { options: unitOptions } = useUnitOptions();
  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();
  const { options: unitGroupOptions } = useUnitGroupOptions();

  function translateTag(tag: string, val: string): string {
    switch (tag) {
      case "unit":
        return unitOptions.find((u) => u.value === Number(val))?.label || val;
      case "unitGroup":
        return unitGroupOptions.find((u) => u.value === Number(val))?.label || val;
      case "reservationUnitType":
        return reservationUnitTypeOptions.find((u) => u.value === Number(val))?.label || val;
      case "reservationUnitState":
        return reservationUnitStateOptions.find((u) => u.value === val)?.label || val;
      case "maxPersonsGte":
        return t("filters:tag.maxPersonsGte", {
          value: val,
        });
      case "maxPersonsLte":
        return t("filters:tag.maxPersonsLte", {
          value: val,
        });
      case "surfaceAreaGte":
        return t("filters:tag.surfaceAreaGte", {
          value: val,
        });
      case "surfaceAreaLte":
        return t("filters:tag.surfaceAreaLte", {
          value: val,
        });
      default:
        return val;
    }
  }

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
      <SearchTags hide={[]} translateTag={translateTag} />
    </Flex>
  );
}

export default Filters;
