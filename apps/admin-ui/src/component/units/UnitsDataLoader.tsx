import React, { useState } from "react";
import { gql } from "@apollo/client";
import { UnitOrderSet, useUnitListQuery } from "@gql/gql-types";
import { filterEmptyArray, filterNonNullable, mapParamToInterger } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { More } from "@/component/More";
import { UnitsTable } from "./UnitsTable";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";

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

  const orderBy = filterEmptyArray(transformSortString(sort));

  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const unitGroupFilter = filterEmptyArray(mapParamToInterger(searchParams.getAll("unitGroup"), 1));
  const nameFilter = searchParams.get("search") ?? undefined;

  const { fetchMore, loading, data, previousData } = useUnitListQuery({
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      nameFi: nameFilter,
      unitGroup: unitGroupFilter,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
    fetchPolicy: "cache-and-network",
  });

  const { units } = data ?? previousData ?? {};
  const unitsArr = filterNonNullable(units?.edges?.map((e) => e?.node));

  if (loading && unitsArr.length === 0) {
    return <CenterSpinner />;
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

function transformSortString(orderBy: string | null): UnitOrderSet[] {
  if (!orderBy) {
    return [];
  }
  switch (orderBy) {
    case "nameFi":
      return [UnitOrderSet.NameFiAsc];
    case "-nameFi":
      return [UnitOrderSet.NameFiDesc];
    case "reservationUnitCount":
      return [UnitOrderSet.ReservationUnitsCountAsc];
    case "-reservationUnitCount":
      return [UnitOrderSet.ReservationUnitsCountDesc];
    case "unitGroup":
      return [UnitOrderSet.UnitGroupNameFiAsc];
    case "-unitGroup":
      return [UnitOrderSet.UnitGroupNameFiDesc];
    default:
      return [];
  }
}

export const UNIT_LIST_QUERY = gql`
  query UnitList(
    $first: Int
    $after: String
    $orderBy: [UnitOrderSet!]
    # Filter
    $nameFi: String
    $unitGroup: [Int!]
  ) {
    units(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: { nameFiStartswith: $nameFi, unitGroup: $unitGroup, onlyWithPermission: true }
    ) {
      edges {
        node {
          ...UnitTableElement
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
