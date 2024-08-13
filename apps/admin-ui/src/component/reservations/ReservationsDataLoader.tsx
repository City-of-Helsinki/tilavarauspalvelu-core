import React, { useState } from "react";
import { type ApolloError } from "@apollo/client";
import {
  ReservationOrderingChoices,
  useReservationsQuery,
  ReservationStateChoice,
  OrderStatusWithFree,
  type ReservationsQueryVariables,
} from "@gql/gql-types";
import { More } from "@/component/More";
import { LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "../Loader";
import { ReservationsTable } from "./ReservationsTable";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { filterNonNullable, toNumber } from "common/src/helpers";
import { useSearchParams } from "react-router-dom";
import { transformReservationTypeSafe } from "common/src/conversion";

function transformPaymentStatusSafe(t: string): OrderStatusWithFree | null {
  switch (t) {
    case OrderStatusWithFree.Paid:
      return OrderStatusWithFree.Paid;
    case OrderStatusWithFree.PaidManually:
      return OrderStatusWithFree.PaidManually;
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

function mapFilterParams(
  searchParams: URLSearchParams
): ReservationsQueryVariables {
  const reservationUnitType = searchParams
    .getAll("reservationUnitType")
    .map(Number)
    .filter(Number.isInteger);

  const unit = searchParams.getAll("unit").map(Number).filter(Number.isInteger);

  const orderStatus = filterNonNullable(
    searchParams.getAll("orderStatus").map(transformPaymentStatusSafe)
  );

  const reservationUnit = searchParams
    .getAll("reservationUnit")
    .map(Number)
    .filter(Number.isInteger);

  const state = filterNonNullable(
    searchParams.getAll("state").map(transformStateSafe)
  );

  const reservationType = filterNonNullable(
    searchParams.getAll("reservationType").map(transformReservationTypeSafe)
  );

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
  const applyingForFreeOfCharge = freeOfCharge
    ? freeOfCharge === "true"
    : undefined;

  return {
    unit,
    reservationUnit,
    reservationUnitType,
    reservationType,
    state,
    orderStatus,
    textSearch,
    priceGte: minPrice ? toNumber(minPrice)?.toString() : undefined,
    priceLte: maxPrice ? toNumber(maxPrice)?.toString() : undefined,
    beginDate,
    endDate,
    createdAtGte,
    createdAtLte,
    isRecurring,
    applyingForFreeOfCharge,
  };
}

export function ReservationsDataLoader(): JSX.Element {
  const [sort, setSort] = useState<string>("-state");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const { notifyError } = useNotification();

  // TODO the sort string should be in the url
  const orderBy = transformSortString(sort);
  const [searchParams] = useSearchParams();
  const { fetchMore, loading, data, previousData } = useReservationsQuery({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    variables: {
      orderBy,
      first: LIST_PAGE_SIZE,
      ...mapFilterParams(searchParams),
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const currData = data ?? previousData;

  const reservations = filterNonNullable(
    currData?.reservations?.edges.map((edge) => edge?.node)
  );
  const totalCount = currData?.reservations?.totalCount;

  if (loading && reservations.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <ReservationsTable
        reservations={reservations}
        sort={sort}
        sortChanged={onSortChanged}
        isLoading={loading}
      />
      <More
        totalCount={totalCount ?? 0}
        count={reservations.length}
        pageInfo={data?.reservations?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformOrderBy(
  orderBy: string,
  desc: boolean
): ReservationOrderingChoices | null {
  switch (orderBy) {
    case "pk":
      return desc
        ? ReservationOrderingChoices.PkDesc
        : ReservationOrderingChoices.PkAsc;
    case "begin":
      return desc
        ? ReservationOrderingChoices.BeginDesc
        : ReservationOrderingChoices.BeginAsc;
    case "end":
      return desc
        ? ReservationOrderingChoices.EndDesc
        : ReservationOrderingChoices.EndAsc;
    case "created_at":
      return desc
        ? ReservationOrderingChoices.CreatedAtDesc
        : ReservationOrderingChoices.CreatedAtAsc;
    case "reservee_name":
      return desc
        ? ReservationOrderingChoices.ReserveeNameDesc
        : ReservationOrderingChoices.ReserveeNameAsc;
    case "reservation_unit_name_fi":
      return desc
        ? ReservationOrderingChoices.ReservationUnitNameFiDesc
        : ReservationOrderingChoices.ReservationUnitNameFiAsc;
    case "unit_name_fi":
      return desc
        ? ReservationOrderingChoices.UnitNameFiDesc
        : ReservationOrderingChoices.UnitNameFiAsc;
    // NOTE inconsistent naming
    case "orderStatus":
      return desc
        ? ReservationOrderingChoices.OrderStatusDesc
        : ReservationOrderingChoices.OrderStatusAsc;
    case "state":
      return desc
        ? ReservationOrderingChoices.StateDesc
        : ReservationOrderingChoices.StateAsc;
    default:
      return null;
  }
}

function transformSortString(
  orderBy: string | null
): ReservationOrderingChoices[] {
  const defaultSort = [
    ReservationOrderingChoices.StateDesc,
    ReservationOrderingChoices.BeginAsc,
    ReservationOrderingChoices.EndAsc,
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

  if (transformed === ReservationOrderingChoices.BeginAsc) {
    return [transformed, ReservationOrderingChoices.EndAsc];
  }
  if (transformed === ReservationOrderingChoices.BeginDesc) {
    return [transformed, ReservationOrderingChoices.EndDesc];
  }
  return [
    transformed,
    ReservationOrderingChoices.BeginAsc,
    ReservationOrderingChoices.EndAsc,
  ];
}
