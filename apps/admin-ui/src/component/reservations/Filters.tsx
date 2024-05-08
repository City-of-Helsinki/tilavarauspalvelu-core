import React from "react";
import { DateInput } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import { useReservationUnitTypes } from "../filters/ReservationUnitTypeFilter";
import { useUnitFilterOptions } from "../filters/UnitFilter";
import { useReservationUnitOptions } from "../filters/ReservationUnitFilter";
import { AutoGrid } from "@/styles/layout";
import {
  MultiSelectFilter,
  RangeNumberFilter,
  SearchFilter,
} from "../QueryParamFilters";
import { useSearchParams } from "react-router-dom";
import { SearchTags } from "../SearchTags";
import { OrderStatus, State } from "@gql/gql-types";
import { fromUIDate, isValidDate } from "common/src/common/util";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
`;

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

function DateInputFilter({ name }: { name: string }) {
  const { t } = useTranslation();
  const [searchParams, setParams] = useSearchParams();

  const filter = searchParams.get(name);

  const handleChange = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val.length > 0) {
      params.set(name, val);
      setParams(params, { replace: true });
    } else {
      setParams(params, { replace: true });
    }
  };

  const label = t(`filters.label.${name}`);
  // TODO make the translation empty. no placeholder on purpose
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <DateInput
      language="fi"
      // TODO ids should be unique and the name nor the tr key is not
      id={name}
      label={label}
      placeholder={placeholder}
      disableConfirmation
      onChange={(val: string) => handleChange(val)}
      value={filter ?? ""}
    />
  );
}

export function Filters({
  defaultFilters = [],
}: {
  defaultFilters?: Array<{ key: string; value: string | string[] }>;
}): JSX.Element {
  const { t } = useTranslation();

  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();
  // TODO is there some states that should not be available in the filters?
  const stateOptions = Object.values(State).map((s) => ({
    value: s,
    label: t(`RequestedReservation.state.${s}`),
  }));
  // TODO is there some states that should not be available in the filters?
  const paymentStatusOptions = Object.values(OrderStatus).map((s) => ({
    value: s,
    label: t(`Payment.status.${s}`),
  }));

  const { options: unitOptions } = useUnitFilterOptions();
  const { options: reservationUnitOptions } = useReservationUnitOptions();

  // TODO unkown parameters should be null right? not empty string? or does it matter
  function translateTag(tag: string, val: string): string {
    switch (tag) {
      case "reservationUnitType":
        return (
          reservationUnitTypeOptions.find((x) => x.value === Number(val))
            ?.label ?? ""
        );
      case "state":
        return stateOptions.find((x) => x.value === val)?.label ?? "";
      case "paymentStatus":
        return paymentStatusOptions.find((x) => x.value === val)?.label ?? "";
      case "reservationUnit":
        return (
          reservationUnitOptions.find((x) => x.value === Number(val))?.label ??
          ""
        );
      case "unit":
        return unitOptions.find((x) => x.value === Number(val))?.label ?? "";
      case "minPrice":
        return `${t("filters.label.minPrice")} ${val} €`;
      case "maxPrice":
        return `${t("filters.label.maxPrice")} ${val} €`;
      case "begin": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return `${t("filters.label.begin")} ${val}`;
      }
      case "end": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return `${t("filters.label.end")} ${val}`;
      }
      default:
        return val;
    }
  }

  return (
    <Wrapper>
      <AutoGrid>
        <MultiSelectFilter
          options={reservationUnitTypeOptions}
          name="reservationUnitType"
        />
        <MultiSelectFilter options={stateOptions} name="state" />
        <MultiSelectFilter options={unitOptions} name="unit" />
        <SearchFilter name="search" labelKey="searchReservation" />
        <MultiSelectFilter
          options={paymentStatusOptions}
          name="paymentStatus"
        />
        <MultiSelectFilter
          options={reservationUnitOptions}
          name="reservationUnit"
        />
        <DateInputFilter name="begin" />
        <DateInputFilter name="end" />
      </AutoGrid>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={0}
      >
        <AutoGrid>
          <RangeNumberFilter
            label={t("filters.label.price")}
            minName="minPrice"
            maxName="maxPrice"
          />
        </AutoGrid>
      </MoreWrapper>
      <SearchTags translateTag={translateTag} defaultTags={defaultFilters} />
    </Wrapper>
  );
}
