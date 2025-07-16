import React, { useState } from "react";
import { gql } from "@apollo/client";
import { UnitOrderingChoices, useUnitListQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { More } from "@/component/More";
import { UnitsTable } from "./UnitsTable";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "next-i18next";
import { mapParamToNumber } from "@/helpers";
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

  const orderBy = transformSortString(sort);

  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const unitGroupFilter = mapParamToNumber(searchParams.getAll("unitGroup"), 1);
  const nameFilter = searchParams.get("search");

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

export const UNIT_LIST_QUERY = gql`
  query UnitList($first: Int, $after: String, $orderBy: [UnitOrderingChoices], $nameFi: String, $unitGroup: [Int]) {
    units(
      first: $first
      after: $after
      orderBy: $orderBy
      nameFi: $nameFi
      onlyWithPermission: true
      unitGroup: $unitGroup
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
