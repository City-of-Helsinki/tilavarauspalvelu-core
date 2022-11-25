import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { memoize } from "lodash";
import { UnitType } from "common/types/gql-types";

import { unitUrl } from "../../common/urls";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  units: UnitType[];
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("Units.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk }: UnitType) => (
      <TableLink href={unitUrl(pk as number)}>{nameFi}</TableLink>
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
    transform: (unit: UnitType) => <>{unit?.reservationUnits?.length || 0}</>,
    width: "25%",
  },
];

const UnitsTable = ({
  sort,
  sortChanged: onSortChanged,
  units,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();

  return (
    <>
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
    </>
  );
};

export default UnitsTable;
