import React from "react";
import { ApolloError, gql, useQuery } from "@apollo/client";

import { Query, QueryUnitsArgs, UnitType } from "../../common/gql-types";
import { FilterArguments } from "./Filters";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import UnitsTable from "./UnitsTable";
import { LIST_PAGE_SIZE } from "../../common/const";
import { More } from "../lists/More";
import { combineResults } from "../../common/util";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
};

const mapFilterParams = (params: FilterArguments) => ({
  nameFi: params.nameFi,
  serviceSector: params.serviceSector?.value as number,
});

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "units");
};

const UNITS_QUERY = gql`
  query units(
    $first: Int
    $offset: Int
    $orderBy: String
    $serviceSector: Float
    $nameFi: String
  ) {
    units(
      first: $first
      offset: $offset
      orderBy: $orderBy
      serviceSector: $serviceSector
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          nameFi
          pk
          serviceSectors {
            nameFi
          }
          reservationUnits {
            pk
          }
        }
      }
      totalCount
    }
  }
`;

const UnitsDataLoader = ({
  filters,
  sort,
  sortChanged: onSortChanged,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  let sortString;
  if (sort) {
    sortString = (sort?.sort ? "" : "-") + sort.field;
  }

  const { fetchMore, loading, data } = useQuery<Query, QueryUnitsArgs>(
    UNITS_QUERY,
    {
      variables: {
        orderBy: sortString,
        offset: 0,
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

  const units = (data?.units?.edges || []).map(
    (edge) => edge?.node as UnitType
  );

  return (
    <>
      <UnitsTable units={units} sort={sort} sortChanged={onSortChanged} />
      <More
        key={units.length}
        totalCount={data?.units?.totalCount || 0}
        count={units.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.units?.edges.length || 0,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default UnitsDataLoader;
