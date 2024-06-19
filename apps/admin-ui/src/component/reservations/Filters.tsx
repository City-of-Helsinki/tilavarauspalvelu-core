import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import {
  useReservationUnitTypes,
  useUnitOptions,
  useReservationUnitOptions,
} from "@/hooks";
import { AutoGrid } from "@/styles/layout";
import {
  CheckboxFilter,
  DateRangeFilter,
  MultiSelectFilter,
  RangeNumberFilter,
  SearchFilter,
  SelectFilter,
} from "../QueryParamFilters";
import { SearchTags } from "../SearchTags";
import {
  OrderStatusWithFree,
  ReservationTypeChoice,
  State,
} from "@gql/gql-types";
import { fromUIDate, isValidDate } from "common/src/common/util";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
`;

const MoreWrapper = styled(ShowAllContainer)`
  margin-top: var(--spacing-s);
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
    margin-top: var(--spacing-s);
  }
`;

export function Filters({
  defaultFilters = [],
}: {
  defaultFilters?: Array<{ key: string; value: string | string[] }>;
}): JSX.Element {
  const { t } = useTranslation();

  const { options: reservationUnitTypeOptions } = useReservationUnitTypes();

  const stateOptions = Object.values(State)
    .filter((s) => s !== State.Created)
    .map((s) => ({
      value: s,
      label: t(`RequestedReservation.state.${s}`),
    }));

  const paymentStatusOptions = Object.values(OrderStatusWithFree)
    .filter((s) => s !== OrderStatusWithFree.Expired)
    .map((s) => ({
      value: s,
      label: t(`orderStatus.${s}`),
    }));

  const reservationTypeOptions = Object.values(ReservationTypeChoice).map(
    (s) => ({
      value: s,
      label: t(`filters.reservationTypeChoice.${s}`),
    })
  );

  const { options: unitOptions } = useUnitOptions();
  const { options: reservationUnitOptions } = useReservationUnitOptions();
  const recurringOptions = [
    { value: "only", label: t("filters.label.onlyRecurring") },
    { value: "onlyNot", label: t("filters.label.onlyNotRecurring") },
  ];

  function translateTag(tag: string, val: string): string {
    switch (tag) {
      case "reservationType":
        return t(`filters.tag.reservationType`, {
          type: t(`filters.reservationTypeChoice.${val}`),
        });
      case "reservationUnitType":
        return t("filters.tag.reservationUnitType", {
          type: reservationUnitTypeOptions.find((x) => x.value === Number(val))
            ?.label,
        });
      case "state":
        return t("filters.tag.state", {
          state: stateOptions.find((x) => x.value === val)?.label ?? "",
        });
      case "reservationUnit":
        return (
          reservationUnitOptions.find((x) => x.value === Number(val))?.label ??
          ""
        );
      case "unit":
        return unitOptions.find((x) => x.value === Number(val))?.label ?? "";
      case "minPrice":
        return t("filters.tag.minPrice", { price: val });
      case "maxPrice":
        return t("filters.tag.maxPrice", { price: val });
      case "dateGte": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters.tag.dateGte", { date: val });
      }
      case "dateLte": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters.tag.dateLte", { date: val });
      }
      case "createdAtGte": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters.tag.createdAtGte", { date: val });
      }
      case "createdAtLte": {
        const d = fromUIDate(val);
        if (d == null || !isValidDate(d)) {
          return "";
        }
        return t("filters.tag.createdAtLte", { date: val });
      }
      case "orderStatus":
        if (val === "-") {
          return t("filters.noPaymentStatus");
        }
        return t("filters.tag.orderStatus", {
          status: t(`orderStatus.${val}`),
        });
      case "recurring":
        return t(`filters.label.${val}Recurring`);
      case "freeOfCharge":
        return t("filters.label.freeOfCharge");
      case "search":
        return t("filters.tag.search", { search: val });
      default:
        return val;
    }
  }

  return (
    <Wrapper>
      <AutoGrid>
        <MultiSelectFilter
          options={reservationTypeOptions}
          name="reservationType"
        />
        <MultiSelectFilter options={stateOptions} name="state" />
        <MultiSelectFilter
          options={reservationUnitOptions}
          name="reservationUnit"
        />
        <SearchFilter name="search" labelKey="searchReservation" />
      </AutoGrid>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={0}
      >
        <AutoGrid>
          <DateRangeFilter name="date" />
          <MultiSelectFilter options={unitOptions} name="unit" />
          <MultiSelectFilter
            options={reservationUnitTypeOptions}
            name="reservationUnitType"
          />
          <RangeNumberFilter
            label={t("filters.label.price")}
            minName="minPrice"
            maxName="maxPrice"
          />
          <MultiSelectFilter
            name="orderStatus"
            options={paymentStatusOptions}
          />
          <DateRangeFilter name="createdAt" />
          <SelectFilter
            name="recurring"
            label={t("filters.label.isRecurring")}
            options={recurringOptions}
            clearable
          />
          <CheckboxFilter name="freeOfCharge" />
        </AutoGrid>
      </MoreWrapper>
      <SearchTags translateTag={translateTag} defaultTags={defaultFilters} />
    </Wrapper>
  );
}
