import React, { useState } from "react";
import { type ApolloError } from "@apollo/client";
import { UnitOrderingChoices, useUnitsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { More } from "@/component/More";
import Loader from "../Loader";
import { UnitsTable } from "./UnitsTable";
import { useSearchParams } from "react-router-dom";

type Props = {
  isMyUnits?: boolean;
};

export function UnitsDataLoader({ isMyUnits }: Props): JSX.Element {
  const [sort, setSort] = useState<string>("nameFi");
  const handleSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const orderBy = transformSortString(sort);

  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get("search");

  const { fetchMore, loading, data, previousData } = useUnitsQuery({
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      nameFi: searchFilter,
    },
    onError: (err: ApolloError) => {
      errorToast({ text: err.message });
    },
    fetchPolicy: "cache-and-network",
  });

  const { units } = data ?? previousData ?? {};
  const unitsArr = filterNonNullable(units?.edges?.map((e) => e?.node));

  if (loading && unitsArr.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <UnitsTable
        units={unitsArr}
        sort={sort}
        sortChanged={handleSortChanged}
        isMyUnits={isMyUnits}
        isLoading={loading}
      />
      <More
        totalCount={data?.units?.totalCount ?? 0}
        count={unitsArr.length}
        pageInfo={data?.units?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformSortString(orderBy: string | null): UnitOrderingChoices[] {
  if (!orderBy) {
    return [];
  }
  switch (orderBy) {
    case "nameFi":
      return [UnitOrderingChoices.NameFiAsc];
    case "-nameFi":
      return [UnitOrderingChoices.NameFiDesc];
    case "reservationUnitCount":
      return [UnitOrderingChoices.ReservationUnitsCountAsc];
    case "-reservationUnitCount":
      return [UnitOrderingChoices.ReservationUnitsCountDesc];
    case "unitGroup":
      return [UnitOrderingChoices.UnitGroupNameFiAsc];
    case "-unitGroup":
      return [UnitOrderingChoices.UnitGroupNameFiDesc];
    default:
      return [];
  }
}
