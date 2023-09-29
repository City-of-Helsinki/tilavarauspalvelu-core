import React from "react";
import { useTranslation } from "react-i18next";
import { truncate } from "lodash";
import { ReservationUnitType } from "common/types/gql-types";
import { TFunction } from "i18next";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";
import { reservationUnitUrl } from "../../common/urls";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitType[];
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitType) => (
      <TableLink href={reservationUnitUrl(pk ?? 0, unit?.pk ?? 0)}>
        {truncate(nameFi ?? "-", {
          length: 22,
          omission: "...",
        })}
      </TableLink>
    ),
    isSortable: true,
  },
  {
    headerName: t("ReservationUnits.headings.unitName"),
    key: "unitNameFi",
    isSortable: true,
    transform: (resUnit: ReservationUnitType) => resUnit.unit?.nameFi ?? "-",
  },
  {
    headerName: t("ReservationUnits.headings.reservationUnitType"),
    key: "typeFi",
    isSortable: true,
    transform: ({ reservationUnitType }: ReservationUnitType) => (
      <span>{reservationUnitType?.nameFi ?? "-"}</span>
    ),
  },
  {
    headerName: t("ReservationUnits.headings.maxPersons"),
    key: "maxPersons",
    isSortable: true,
    transform: ({ maxPersons }: ReservationUnitType) => (
      <span>{maxPersons || "-"}</span>
    ),
  },
  {
    headerName: t("ReservationUnits.headings.surfaceArea"),
    key: "surfaceArea",
    isSortable: true,
    transform: ({ surfaceArea }: ReservationUnitType) =>
      surfaceArea !== null ? (
        <span>
          {Number(surfaceArea).toLocaleString("fi") || "-"}
          {t("common.areaUnitSquareMeter")}
        </span>
      ) : (
        "-"
      ),
  },
  {
    headerName: t("ReservationUnits.headings.state"),
    key: "state",
    transform: ({ state }: ReservationUnitType) =>
      t(`ReservationUnits.state.${state}`),
  },
  {
    headerName: t("ReservationUnits.headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitType) =>
      t(`ReservationUnits.reservationState.${reservationState}`),
  },
];

const ReservationUnitsTable = ({
  sort,
  sortChanged: onSortChanged,
  reservationUnits,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = getColConfig(t);

  return (
    <DataOrMessage
      filteredData={reservationUnits}
      noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
    >
      <CustomTable
        setSort={onSortChanged}
        indexKey="pk"
        rows={reservationUnits}
        cols={cols}
        initialSortingColumnKey={sort === undefined ? undefined : sort.field}
        initialSortingOrder={
          sort === undefined ? undefined : (sort.sort && "asc") || "desc"
        }
      />
    </DataOrMessage>
  );
};

export default ReservationUnitsTable;
