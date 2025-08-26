import React, { useState } from "react";
import { gql } from "@apollo/client";
import { ReservationOrderSet, useReservationListQuery, type ReservationListQueryVariables } from "@gql/gql-types";
import { More } from "@/component/More";
import { LIST_PAGE_SIZE } from "@/common/const";
import { ReservationsTable } from "./ReservationsTable";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { filterEmptyArray, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "next-i18next";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";

function mapFilterParams(searchParams: ReadonlyURLSearchParams): ReservationListQueryVariables {
  const {
    unitFilter,
    reservationUnitTypeFilter,
    reservationUnitFilter,
    reservationTypeFilter,
    orderStatusFilter,
    reservationStatusFilter,
    textFilter: textSearch,
    maxPriceFilter,
    minPriceFilter,
    recurringFilter,
    createdAtGteFilter,
    createdAtLteFilter,
    dateGteFilter,
    dateLteFilter,
    freeOfChargeFilter,
  } = getFilterSearchParams({ searchParams });

  const uiDateBegin = dateGteFilter;
  const dateBegin = uiDateBegin ? (fromUIDate(uiDateBegin) ?? undefined) : undefined;
  const beginDate = dateBegin ? (toApiDate(dateBegin) ?? undefined) : undefined;

  const uiDateEnd = dateLteFilter;
  const dateEnd = uiDateEnd ? (fromUIDate(uiDateEnd) ?? undefined) : undefined;
  const endDate = dateEnd ? (toApiDate(dateEnd) ?? undefined) : undefined;

  const uiCreatedBegin = createdAtGteFilter;
  const createdBegin = uiCreatedBegin ? (fromUIDate(uiCreatedBegin) ?? undefined) : undefined;
  const createdAtGte = createdBegin ? (toApiDate(createdBegin) ?? undefined) : undefined;

  const uiCreatedEnd = createdAtLteFilter;
  const createdEnd = uiCreatedEnd ? (fromUIDate(uiCreatedEnd) ?? undefined) : undefined;
  const createdAtLte = createdEnd ? (toApiDate(createdEnd) ?? undefined) : undefined;

  let isRecurring: boolean | undefined = undefined;
  if (recurringFilter === "only") {
    isRecurring = true;
  }
  if (recurringFilter === "onlyNot") {
    isRecurring = false;
  }

  return {
    unit: unitFilter,
    reservationUnits: reservationUnitFilter,
    reservationUnitType: reservationUnitTypeFilter,
    reservationType: reservationTypeFilter,
    state: reservationStatusFilter,
    orderStatus: orderStatusFilter,
    textSearch,
    priceGte: minPriceFilter?.toString(),
    priceLte: maxPriceFilter?.toString(),
    beginDate,
    endDate,
    createdAtGte,
    createdAtLte,
    isRecurring,
    applyingForFreeOfCharge: freeOfChargeFilter,
  };
}

export function ReservationsDataLoader(): JSX.Element {
  const { t } = useTranslation();
  const [sort, setSort] = useState<string>("-state");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  // TODO the sort string should be in the url
  const orderBy = filterEmptyArray(transformSortString(sort));
  const searchParams = useSearchParams();
  const { fetchMore, loading, data, previousData } = useReservationListQuery({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    variables: {
      orderBy,
      first: LIST_PAGE_SIZE,
      ...mapFilterParams(searchParams),
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const currData = data ?? previousData;

  const reservations = filterNonNullable(currData?.reservations?.edges?.map((edge) => edge?.node));
  const totalCount = currData?.reservations?.totalCount;

  if (loading && reservations.length === 0) {
    return <CenterSpinner />;
  }

  return (
    <>
      <ReservationsTable reservations={reservations} sort={sort} sortChanged={onSortChanged} isLoading={loading} />
      <More
        totalCount={totalCount ?? 0}
        count={reservations.length}
        pageInfo={data?.reservations?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformOrderBy(orderBy: string, desc: boolean): ReservationOrderSet | null {
  switch (orderBy) {
    case "pk":
      return desc ? ReservationOrderSet.PkDesc : ReservationOrderSet.PkAsc;
    case "begin":
      return desc ? ReservationOrderSet.BeginsAtDesc : ReservationOrderSet.BeginsAtAsc;
    case "end":
      return desc ? ReservationOrderSet.EndsAtDesc : ReservationOrderSet.EndsAtAsc;
    case "created_at":
      return desc ? ReservationOrderSet.CreatedAtDesc : ReservationOrderSet.CreatedAtAsc;
    case "reservee_name":
      return desc ? ReservationOrderSet.ReserveeNameDesc : ReservationOrderSet.ReserveeNameAsc;
    case "reservation_unit_name_fi":
      return desc ? ReservationOrderSet.ReservationUnitNameFiDesc : ReservationOrderSet.ReservationUnitNameFiAsc;
    case "unit_name_fi":
      return desc ? ReservationOrderSet.UnitNameFiDesc : ReservationOrderSet.UnitNameFiAsc;
    // NOTE inconsistent naming
    case "orderStatus":
      return desc ? ReservationOrderSet.OrderStatusDesc : ReservationOrderSet.OrderStatusAsc;
    case "state":
      return desc ? ReservationOrderSet.StateDesc : ReservationOrderSet.StateAsc;
    default:
      return null;
  }
}

function transformSortString(orderBy: string | null): ReservationOrderSet[] {
  const defaultSort = [ReservationOrderSet.StateDesc, ReservationOrderSet.BeginsAtAsc, ReservationOrderSet.EndsAtAsc];
  if (!orderBy) {
    return defaultSort;
  }

  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  const transformed = transformOrderBy(rest, desc);
  if (transformed == null) {
    return defaultSort;
  }

  if (transformed === ReservationOrderSet.BeginsAtAsc) {
    return [transformed, ReservationOrderSet.EndsAtAsc];
  }
  if (transformed === ReservationOrderSet.BeginsAtDesc) {
    return [transformed, ReservationOrderSet.EndsAtDesc];
  }
  return [transformed, ReservationOrderSet.BeginsAtAsc, ReservationOrderSet.EndsAtAsc];
}

export const RESERVATION_LIST_QUERY = gql`
  query ReservationList(
    $first: Int
    $after: String
    $orderBy: [ReservationOrderSet!]
    # Filter
    $applyingForFreeOfCharge: Boolean
    $beginDate: Date
    $createdAtGte: Date
    $createdAtLte: Date
    $endDate: Date
    $isRecurring: Boolean
    $orderStatus: [OrderStatusWithFree!]
    $priceGte: Decimal
    $priceLte: Decimal
    $reservationType: [ReservationTypeChoice!]
    $reservationUnitType: [Int!]
    $reservationUnits: [Int!]
    $state: [ReservationStateChoice!]
    $textSearch: String
    $unit: [Int!]
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: {
        applyingForFreeOfCharge: $applyingForFreeOfCharge
        beginDate: $beginDate
        createdAfter: $createdAtGte
        createdBefore: $createdAtLte
        endDate: $endDate
        isRecurring: $isRecurring
        onlyWithPermission: true
        orderStatus: $orderStatus
        priceGte: $priceGte
        priceLte: $priceLte
        reservationType: $reservationType
        reservationUnit: $reservationUnits
        reservationUnitType: $reservationUnitType
        state: $state
        textSearch: $textSearch
        unit: $unit
      }
    ) {
      edges {
        node {
          ...ReservationTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
