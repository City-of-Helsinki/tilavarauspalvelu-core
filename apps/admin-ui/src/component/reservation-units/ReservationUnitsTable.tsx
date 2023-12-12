import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ReservationUnitType } from "common/types/gql-types";
import { truncate } from "@/helpers";
import { reservationUnitUrl } from "@/common/urls";
import { CustomTable, TableLink } from "../lists/components";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitType[];
};

const MAX_NAME_LENGTH = 22;
const getColConfig = (t: TFunction) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitType) => (
      <TableLink href={reservationUnitUrl(pk ?? 0, unit?.pk ?? 0)}>
        {truncate(nameFi ?? "-", MAX_NAME_LENGTH)}
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
      surfaceArea != null ? (
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

  if (reservationUnits.length === 0) {
    <div>{t("ReservationUnits.noFilteredReservationUnits")}</div>;
  }
  return (
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
  );
};

export default ReservationUnitsTable;
