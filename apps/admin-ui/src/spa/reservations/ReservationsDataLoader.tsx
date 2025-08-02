import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  ReservationOrderSet,
  useReservationListQuery,
  ReservationStateChoice,
  OrderStatusWithFree,
  type ReservationListQueryVariables,
} from "@gql/gql-types";
import { More } from "@/component/More";
import { LIST_PAGE_SIZE } from "@/common/const";
import { ReservationsTable } from "./ReservationsTable";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { filterNonNullable, toNumber } from "common/src/helpers";
import { useSearchParams } from "react-router-dom";
import { transformReservationTypeSafe } from "common/src/conversion";
import { errorToast } from "common/src/common/toast";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "react-i18next";

function transformPaymentStatusSafe(t: string): OrderStatusWithFree | null {
  switch (t) {
    case OrderStatusWithFree.Paid:
      return OrderStatusWithFree.Paid;
    case OrderStatusWithFree.PaidManually:
      return OrderStatusWithFree.PaidManually;
    case OrderStatusWithFree.PaidByInvoice:
      return OrderStatusWithFree.PaidByInvoice;
    case OrderStatusWithFree.Draft:
      return OrderStatusWithFree.Draft;
    case OrderStatusWithFree.Expired:
      return OrderStatusWithFree.Expired;
    case OrderStatusWithFree.Refunded:
      return OrderStatusWithFree.Refunded;
    case OrderStatusWithFree.Cancelled:
      return OrderStatusWithFree.Cancelled;
    case OrderStatusWithFree.Free:
      return OrderStatusWithFree.Free;
    default:
      return null;
  }
}

function transformStateSafe(t: string): ReservationStateChoice | null {
  switch (t) {
    case ReservationStateChoice.Cancelled:
      return ReservationStateChoice.Cancelled;
    case ReservationStateChoice.Denied:
      return ReservationStateChoice.Denied;
    case ReservationStateChoice.Created:
      return ReservationStateChoice.Created;
    case ReservationStateChoice.Confirmed:
      return ReservationStateChoice.Confirmed;
    case ReservationStateChoice.RequiresHandling:
      return ReservationStateChoice.RequiresHandling;
    case ReservationStateChoice.WaitingForPayment:
      return ReservationStateChoice.WaitingForPayment;
    default:
      return null;
  }
}

function mapFilterParams(searchParams: URLSearchParams): ReservationListQueryVariables {
  const reservationUnitType = searchParams.getAll("reservationUnitType").map(Number).filter(Number.isInteger);

  const unit = searchParams.getAll("unit").map(Number).filter(Number.isInteger);

  const orderStatus = filterNonNullable(searchParams.getAll("orderStatus").map(transformPaymentStatusSafe));

  const reservationUnits = searchParams.getAll("reservationUnit").map(Number).filter(Number.isInteger);

  const state = filterNonNullable(searchParams.getAll("state").map(transformStateSafe));

  const reservationType = filterNonNullable(searchParams.getAll("reservationType").map(transformReservationTypeSafe));

  const textSearch = searchParams.get("search");

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const uiDateBegin = searchParams.get("dateGte");
  const dateBegin = uiDateBegin ? fromUIDate(uiDateBegin) : undefined;
  const beginDate = dateBegin ? toApiDate(dateBegin) : undefined;

  const uiDateEnd = searchParams.get("dateLte");
  const dateEnd = uiDateEnd ? fromUIDate(uiDateEnd) : undefined;
  const endDate = dateEnd ? toApiDate(dateEnd) : undefined;

  const uiCreatedBegin = searchParams.get("createdAtGte");
  const createdBegin = uiCreatedBegin ? fromUIDate(uiCreatedBegin) : undefined;
  const createdAtGte = createdBegin ? toApiDate(createdBegin) : undefined;

  const uiCreatedEnd = searchParams.get("createdAtLte");
  const createdEnd = uiCreatedEnd ? fromUIDate(uiCreatedEnd) : undefined;
  const createdAtLte = createdEnd ? toApiDate(createdEnd) : undefined;

  const recurringKey = searchParams.get("recurring");
  let isRecurring;
  if (recurringKey === "only") {
    isRecurring = true;
  }
  if (recurringKey === "onlyNot") {
    isRecurring = false;
  }

  const freeOfCharge = searchParams.get("freeOfCharge");
  const applyingForFreeOfCharge = freeOfCharge ? freeOfCharge === "true" : undefined;

  return {
    unit,
    reservationUnits,
    reservationUnitType,
    // FIXME this should be an array
    reservationType: reservationType.length > 0 ? reservationType[0] : undefined,
    state,
    orderStatus,
    textSearch,
    priceGte: toNumber(minPrice)?.toString(),
    priceLte: toNumber(maxPrice)?.toString(),
    beginDate,
    endDate,
    createdAfter: createdAtGte,
    createdBefore: createdAtLte,
    isRecurring,
    applyingForFreeOfCharge,
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
  const orderBy = transformSortString(sort);
  const [searchParams] = useSearchParams();
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
      errorToast({ text: t("errors.errorFetchingData") });
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
      return desc
        ? ReservationOrderSet.ReservationUnitNameFiDesc
        : ReservationOrderSet.ReservationUnitNameFiAsc;
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
  const defaultSort = [
    ReservationOrderSet.StateDesc,
    ReservationOrderSet.BeginsAtAsc,
    ReservationOrderSet.EndsAtAsc,
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
    $unit: [Int!]
    $reservationUnits: [Int!]
    $reservationUnitType: [Int!]
    $reservationType: ReservationTypeChoice
    $state: [ReservationStateChoice!]
    $orderStatus: [OrderStatusWithFree!]
    $textSearch: String
    $priceLte: Decimal
    $priceGte: Decimal
    $beginDate: Date
    $endDate: Date
    $createdAfter: Date
    $createdBefore: Date
    $applyingForFreeOfCharge: Boolean
    $isRecurring: Boolean
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
filter: {
      unit: $unit
      reservationUnit: $reservationUnits
      reservationUnitType: $reservationUnitType
      reservationType: $reservationType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
      createdAfter: $createdAfter
      createdBefore: $createdBefore
      isRecurring: $isRecurring
      applyingForFreeOfCharge: $applyingForFreeOfCharge
      onlyWithPermission: true
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
