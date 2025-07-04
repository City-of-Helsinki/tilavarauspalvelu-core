import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ShowAllContainer from "common/src/components/ShowAllContainer";
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
import { fromUIDate, isValidDate } from "common/src/common/util";

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
      label: t(`RequestedReservation.state.${s}`),
    }));

  const paymentStatusOptions = Object.values(OrderStatusWithFree).map((s) => ({
    value: s,
    label: t(`orderStatus.${s}`),
  }));

  const reservationTypeOptions = Object.values(ReservationTypeChoice).map((s) => ({
    value: s,
    label: t(`filters.reservationTypeChoice.${s}`),
  }));

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
          type: reservationUnitTypeOptions.find((x) => x.value === Number(val))?.label,
        });
      case "state":
        return t("filters.tag.state", {
          state: stateOptions.find((x) => x.value === val)?.label ?? "",
        });
      case "reservationUnit":
        return reservationUnitOptions.find((x) => x.value === Number(val))?.label ?? "";
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
    <Flex>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={4}
      >
        <MultiSelectFilter options={reservationTypeOptions} name="reservationType" />
        <MultiSelectFilter options={stateOptions} name="state" />
        <MultiSelectFilter options={reservationUnitOptions} name="reservationUnit" />
        <SearchFilter name="search" labelKey="searchReservation" />
        <DateRangeFilter name="date" />
        <MultiSelectFilter options={unitOptions} name="unit" />
        <MultiSelectFilter options={reservationUnitTypeOptions} name="reservationUnitType" />
        <RangeNumberFilter label={t("filters.label.price")} minName="minPrice" maxName="maxPrice" />
        <MultiSelectFilter name="orderStatus" options={paymentStatusOptions} />
        <DateRangeFilter name="createdAt" />
        <SelectFilter name="recurring" options={recurringOptions} clearable />
        <CheckboxFilter name="freeOfCharge" />
      </MoreWrapper>
      <SearchTags
        translateTag={translateTag}
        defaultTags={defaultFilters}
        clearButtonLabel={clearButtonLabel}
        clearButtonAriaLabel={clearButtonAriaLabel}
      />
    </Flex>
  );
}
