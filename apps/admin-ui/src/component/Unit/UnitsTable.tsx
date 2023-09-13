import React from "react";
import { useTranslation } from "react-i18next";
import { memoize } from "lodash";
import { UnitType } from "common/types/gql-types";
import { TFunction } from "i18next";
import { myUnitUrl, unitUrl } from "../../common/urls";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  units: UnitType[];
  isMyUnits?: boolean;
};

function truncateMaybeString(
  str: string | undefined,
  maxLength: number
): string {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

const MAX_NAME_LENGTH = 40;

const getColConfig = (t: TFunction, isMyUnits?: boolean) => [
  {
    headerName: t("Units.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk }: UnitType) => (
      <TableLink href={isMyUnits ? myUnitUrl(pk ?? 0) : unitUrl(pk ?? 0)}>
        {truncateMaybeString(nameFi ?? undefined, MAX_NAME_LENGTH)}
      </TableLink>
    ),
    width: "50%",
    isSortable: true,
  },
  {
    headerName: t("Units.headings.serviceSector"),
    key: "serviceSector",
    isSortable: false,
    transform: (unit: UnitType) =>
      (unit?.serviceSectors || [])
        .map((serviceSector) => serviceSector?.nameFi)
        .join(","),
    width: "25%",
  },
  {
    headerName: t("Units.headings.reservationUnitCount"),
    key: "typeFi",
    isSortable: false,
    transform: (unit: UnitType) => <> {unit?.reservationUnits?.length || 0} </>,
    width: "25%",
  },
];

const UnitsTable = ({
  sort,
  sortChanged: onSortChanged,
  units,
  isMyUnits,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t, isMyUnits))();

  return (
    <DataOrMessage
      filteredData={units}
      noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
    >
      <CustomTable
        setSort={onSortChanged}
        indexKey="pk"
        rows={units}
        cols={cols}
        initialSortingColumnKey={sort === undefined ? undefined : sort.field}
        initialSortingOrder={
          sort === undefined ? undefined : (sort.sort && "asc") || "desc"
        }
      />
    </DataOrMessage>
  );
};

export default UnitsTable;
