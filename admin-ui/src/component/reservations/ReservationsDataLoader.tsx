import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { parse } from "date-fns";
import { trim } from "lodash";
import {
  Query,
  QueryReservationsArgs,
  ReservationType,
} from "../../common/gql-types";

import { LIST_PAGE_SIZE } from "../../common/const";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import { More } from "../lists/More";
import Loader from "../Loader";
import { FilterArguments } from "./Filters";
import { RESERVATIONS_QUERY } from "./queries";
import ReservationsTable from "./ReservationsTable";

export type Sort = {
  field: string;
  asc: boolean;
};

type Props = {
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
};

const parseDate = (hdsDate: string) => {
  if (trim(hdsDate) === "") {
    return undefined;
  }

  return parse(hdsDate, "d.M.yyyy", new Date()).toISOString();
};

const mapFilterParams = (params: FilterArguments) => ({
  unit: params.unit?.map((u) => u.value as string),
  reservationUnitType: params.reservationUnitType?.map(
    (u) => u.value as string
  ),
  reservationUnit: params.reservationUnit?.map((ru) => ru.value as string),
  state:
    params.reservationState.length > 0
      ? params.reservationState?.map((ru) => ru.value as string)
      : ["DENIED", "CONFIRMED", "REQUIRES_HANDLING"],
  textSearch: params.textSearch || undefined,
  begin: parseDate(params.begin),
  end: parseDate(params.end),
  minPrice: params.minPrice !== "" ? Number(params.minPrice) : undefined,
  maxPrice: params.maxPrice !== "" ? Number(params.maxPrice) : undefined,
});

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "reservations");
};

const ReservationUnitsDataReader = ({
  filters,
  sort,
  sortChanged: onSortChanged,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  let sortString;

  if (sort) {
    if (sort.field === "begin") {
      if (sort.asc) {
        sortString = "begin,end";
      } else {
        sortString = "-begin,-end";
      }
    } else {
      sortString = `${(sort?.asc ? "" : "-") + sort.field},begin,end`;
    }
  } else {
    sortString = "state";
  }

  const { fetchMore, loading, data } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_QUERY,
    {
      variables: {
        orderBy: sortString,
        first: LIST_PAGE_SIZE,
        ...mapFilterParams(filters),
      },
      onError: (err: ApolloError) => {
        notifyError(err.message);
      },
      fetchPolicy: "cache-and-network",
    }
  );

  if (loading) {
    return <Loader />;
  }

  const reservations = (data?.reservations?.edges || []).map(
    (edge) => edge?.node as ReservationType
  );

  return (
    <>
      <ReservationsTable
        reservations={reservations}
        sort={sort}
        sortChanged={onSortChanged}
      />
      <More
        key={reservations.length}
        totalCount={data?.reservations?.totalCount || 0}
        count={reservations.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.reservations?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default ReservationUnitsDataReader;
