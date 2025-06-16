import React from "react";
import { useTranslation } from "react-i18next";
import { memoize } from "lodash-es";
import type { UnitTableElementFragment } from "@gql/gql-types";
import type { TFunction } from "i18next";
import { truncate } from "@/helpers";
import { getMyUnitUrl, getUnitUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { MAX_UNIT_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styled";
import { gql } from "@apollo/client";

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  units: UnitTableElementFragment[];
  isMyUnits?: boolean;
  isLoading?: boolean;
};

type ColumnType = {
  headerName: string;
  key: string;
  transform?: (unit: UnitTableElementFragment) => JSX.Element | string;
  width: string;
  isSortable: boolean;
};

function getColConfig(t: TFunction, isMyUnits?: boolean): ColumnType[] {
  return [
    {
      headerName: t("Units.headings.name"),
      key: "nameFi",
      transform: ({ nameFi, pk }: UnitTableElementFragment) => (
        <TableLink to={isMyUnits ? getMyUnitUrl(pk) : getUnitUrl(pk)}>
          {truncate(nameFi ?? "-", MAX_UNIT_NAME_LENGTH)}
        </TableLink>
      ),
      width: "75%",
      isSortable: true,
    },
    {
      headerName: t("Units.headings.reservationUnitCount"),
      key: "reservationUnitCount",
      isSortable: true,
      transform: (unit: UnitTableElementFragment) => (unit?.reservationUnits?.length ?? 0).toString(),
      width: "25%",
    },
    {
      headerName: t("Units.headings.unitGroup"),
      key: "unitGroup",
      isSortable: true,
      transform: (unit: UnitTableElementFragment) =>
        (unit?.unitGroups ?? []).map((unitGroup) => unitGroup?.nameFi).join(", "),
      width: "25%",
    },
  ];
}

export function UnitsTable({ sort, sortChanged: onSortChanged, units, isMyUnits, isLoading }: Props): JSX.Element {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t, isMyUnits))();

  if (units.length === 0) {
    const name = t("Unit.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      rows={units}
      cols={cols}
      initialSortingColumnKey={sort.startsWith("-") ? sort.slice(1) : sort}
      initialSortingOrder={sort.startsWith("-") ? "desc" : "asc"}
      isLoading={isLoading}
    />
  );
}

export const UNIT_TABLE_ELEMET_FRAGMENT = gql`
  fragment UnitTableElement on UnitNode {
    id
    nameFi
    pk
    unitGroups {
      id
      nameFi
    }
    reservationUnits {
      id
      pk
    }
  }
`;
