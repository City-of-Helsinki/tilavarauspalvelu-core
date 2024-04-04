import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ReservationUnitNode } from "common/types/gql-types";
import { truncate } from "@/helpers";
import { reservationUnitUrl } from "@/common/urls";
import { CustomTable, TableLink } from "@/component/Table";

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitNode[];
  isLoading?: boolean;
};

const MAX_NAME_LENGTH = 22;
const getColConfig = (t: TFunction) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitNode) => (
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
    transform: (resUnit: ReservationUnitNode) => resUnit.unit?.nameFi ?? "-",
  },
  {
    headerName: t("ReservationUnits.headings.reservationUnitType"),
    key: "typeFi",
    isSortable: true,
    transform: ({ reservationUnitType }: ReservationUnitNode) => (
      <span>{reservationUnitType?.nameFi ?? "-"}</span>
    ),
  },
  {
    headerName: t("ReservationUnits.headings.maxPersons"),
    key: "maxPersons",
    isSortable: true,
    transform: ({ maxPersons }: ReservationUnitNode) => (
      <span>{maxPersons || "-"}</span>
    ),
  },
  {
    headerName: t("ReservationUnits.headings.surfaceArea"),
    key: "surfaceArea",
    isSortable: true,
    transform: ({ surfaceArea }: ReservationUnitNode) =>
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
    transform: ({ state }: ReservationUnitNode) =>
      t(`ReservationUnits.state.${state}`),
  },
  {
    headerName: t("ReservationUnits.headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitNode) =>
      t(`ReservationUnits.reservationState.${reservationState}`),
  },
];

export function ReservationUnitsTable({
  sort,
  sortChanged: onSortChanged,
  reservationUnits,
  isLoading,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const cols = getColConfig(t);

  if (reservationUnits.length === 0) {
    const name = t("ReservationUnits.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      rows={reservationUnits}
      cols={cols}
      initialSortingColumnKey={sort.startsWith("-") ? sort.slice(1) : sort}
      initialSortingOrder={sort.startsWith("-") ? "desc" : "asc"}
      isLoading={isLoading}
    />
  );
}
