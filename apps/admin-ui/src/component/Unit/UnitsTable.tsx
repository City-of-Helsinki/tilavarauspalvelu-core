import React from "react";
import { useTranslation } from "react-i18next";
import { memoize } from "lodash";
import type { UnitNode } from "common/types/gql-types";
import type { TFunction } from "i18next";
import { truncate } from "@/helpers";
import { myUnitUrl, unitUrl } from "@/common/urls";
import { CustomTable, TableLink } from "@/component/Table";
import { MAX_UNIT_NAME_LENGTH } from "@/common/const";

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  units: UnitNode[];
  isMyUnits?: boolean;
  isLoading?: boolean;
};

const getColConfig = (t: TFunction, isMyUnits?: boolean) => [
  {
    headerName: t("Units.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk }: UnitNode) => (
      <TableLink href={isMyUnits ? myUnitUrl(pk ?? 0) : unitUrl(pk ?? 0)}>
        {truncate(nameFi ?? "-", MAX_UNIT_NAME_LENGTH)}
      </TableLink>
    ),
    width: "50%",
    isSortable: true,
  },
  {
    headerName: t("Units.headings.serviceSector"),
    key: "serviceSector",
    isSortable: false,
    transform: (unit: UnitNode) =>
      (unit?.serviceSectors || [])
        .map((serviceSector) => serviceSector?.nameFi)
        .join(","),
    width: "25%",
  },
  {
    headerName: t("Units.headings.reservationUnitCount"),
    key: "typeFi",
    isSortable: false,
    transform: (unit: UnitNode) => (
      <> {unit?.reservationunitSet?.length ?? 0} </>
    ),
    width: "25%",
  },
];

export function UnitsTable({
  sort,
  sortChanged: onSortChanged,
  units,
  isMyUnits,
  isLoading,
}: Props): JSX.Element {
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
