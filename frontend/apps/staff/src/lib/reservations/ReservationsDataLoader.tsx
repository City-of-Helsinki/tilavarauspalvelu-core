import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  ReservationOrderingChoices,
  useReservationListQuery,
  type ReservationListQueryVariables,
} from "@gql/gql-types";
import { More } from "@/components/More";
import { LIST_PAGE_SIZE } from "@/modules/const";
import { ReservationsTable } from "./ReservationsTable";
import { parseUIDate, formatApiDate } from "ui/src/modules/date-utils";
import { filterEmptyArray, filterNonNullable } from "ui/src/modules/helpers";
import { errorToast } from "ui/src/components/toast";
import { CenterSpinner } from "ui/src/styled";
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
  const dateBegin = uiDateBegin ? (parseUIDate(uiDateBegin) ?? undefined) : undefined;
  const beginDate = dateBegin ? (formatApiDate(dateBegin) ?? undefined) : undefined;

  const uiDateEnd = dateLteFilter;
  const dateEnd = uiDateEnd ? (parseUIDate(uiDateEnd) ?? undefined) : undefined;
  const endDate = dateEnd ? (formatApiDate(dateEnd) ?? undefined) : undefined;

  const uiCreatedBegin = createdAtGteFilter;
  const createdBegin = uiCreatedBegin ? (parseUIDate(uiCreatedBegin) ?? undefined) : undefined;
  const createdAtGte = createdBegin ? (formatApiDate(createdBegin) ?? undefined) : undefined;

  const uiCreatedEnd = createdAtLteFilter;
  const createdEnd = uiCreatedEnd ? (parseUIDate(uiCreatedEnd) ?? undefined) : undefined;
  const createdAtLte = createdEnd ? (formatApiDate(createdEnd) ?? undefined) : undefined;

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

  const reservations = filterNonNullable(currData?.reservations?.edges.map((edge) => edge?.node));
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

function transformOrderBy(orderBy: string, desc: boolean): ReservationOrderingChoices | null {
  switch (orderBy) {
    case "pk":
      return desc ? ReservationOrderingChoices.PkDesc : ReservationOrderingChoices.PkAsc;
    case "begin":
      return desc ? ReservationOrderingChoices.BeginsAtDesc : ReservationOrderingChoices.BeginsAtAsc;
    case "end":
      return desc ? ReservationOrderingChoices.EndsAtDesc : ReservationOrderingChoices.EndsAtAsc;
    case "created_at":
      return desc ? ReservationOrderingChoices.CreatedAtDesc : ReservationOrderingChoices.CreatedAtAsc;
    case "reservee_name":
      return desc ? ReservationOrderingChoices.ReserveeNameDesc : ReservationOrderingChoices.ReserveeNameAsc;
    case "reservation_unit_name_fi":
      return desc
        ? ReservationOrderingChoices.ReservationUnitNameFiDesc
        : ReservationOrderingChoices.ReservationUnitNameFiAsc;
    case "unit_name_fi":
      return desc ? ReservationOrderingChoices.UnitNameFiDesc : ReservationOrderingChoices.UnitNameFiAsc;
    // NOTE inconsistent naming
    case "orderStatus":
      return desc ? ReservationOrderingChoices.OrderStatusDesc : ReservationOrderingChoices.OrderStatusAsc;
    case "state":
      return desc ? ReservationOrderingChoices.StateDesc : ReservationOrderingChoices.StateAsc;
    default:
      return null;
  }
}

function transformSortString(orderBy: string | null): ReservationOrderingChoices[] {
  const defaultSort = [
    ReservationOrderingChoices.StateDesc,
    ReservationOrderingChoices.BeginsAtAsc,
    ReservationOrderingChoices.EndsAtAsc,
  ];
  if (!orderBy) {
    return defaultSort;
  }

  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  const transformed = transformOrderBy(rest, desc);
  if (transformed == null) {
    return defaultSort;
  }

  if (transformed === ReservationOrderingChoices.BeginsAtAsc) {
    return [transformed, ReservationOrderingChoices.EndsAtAsc];
  }
  if (transformed === ReservationOrderingChoices.BeginsAtDesc) {
    return [transformed, ReservationOrderingChoices.EndsAtDesc];
  }
  return [transformed, ReservationOrderingChoices.BeginsAtAsc, ReservationOrderingChoices.EndsAtAsc];
}

export const RESERVATION_LIST_QUERY = gql`
  query ReservationList(
    $first: Int
    $after: String
    $orderBy: [ReservationOrderingChoices]
    $unit: [Int]
    $reservationUnits: [Int]
    $reservationUnitType: [Int]
    $reservationType: [ReservationTypeChoice]
    $state: [ReservationStateChoice]
    $orderStatus: [OrderStatusWithFree]
    $textSearch: String
    $priceLte: Decimal
    $priceGte: Decimal
    $beginDate: Date
    $endDate: Date
    $createdAtGte: Date
    $createdAtLte: Date
    $applyingForFreeOfCharge: Boolean
    $isRecurring: Boolean
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
      unit: $unit
      reservationUnits: $reservationUnits
      reservationUnitType: $reservationUnitType
      reservationType: $reservationType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
      createdAtGte: $createdAtGte
      createdAtLte: $createdAtLte
      isRecurring: $isRecurring
      applyingForFreeOfCharge: $applyingForFreeOfCharge
      onlyWithPermission: true
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
