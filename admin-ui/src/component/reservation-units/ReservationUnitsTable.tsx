import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { memoize, truncate } from "lodash";
import { ReservationUnitType } from "../../common/gql-types";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";
import { LocalizationLanguages } from "../../common/types";
import { reservationUnitUrl } from "../../common/urls";
import { localizedPropValue } from "../../common/util";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitType[];
};

const getColConfig = (t: TFunction, language: LocalizationLanguages) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitType) => (
      <TableLink href={reservationUnitUrl(pk as number, unit?.pk as number)}>
        {truncate(nameFi as string, {
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
    transform: (resUnit: ReservationUnitType) =>
      localizedPropValue(resUnit, "unit.name", language),
  },
  {
    headerName: t("ReservationUnits.headings.reservationUnitType"),
    key: "typeFi",
    isSortable: true,
    transform: ({ reservationUnitType }: ReservationUnitType) => (
      <span>{localizedPropValue(reservationUnitType, "name", language)}</span>
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
];

const ReservationUnitsTable = ({
  sort,
  sortChanged: onSortChanged,
  reservationUnits,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const cols = memoize(() =>
    getColConfig(t, i18n.language as LocalizationLanguages)
  )();

  return (
    <>
      <DataOrMessage
        filteredData={reservationUnits}
        noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
      >
        <>
          <CustomTable
            setSort={onSortChanged}
            indexKey="pk"
            rows={reservationUnits}
            cols={cols}
            initialSortingColumnKey={
              sort === undefined ? undefined : sort.field
            }
            initialSortingOrder={
              sort === undefined ? undefined : (sort.sort && "asc") || "desc"
            }
          />
        </>
      </DataOrMessage>
    </>
  );
};

export default ReservationUnitsTable;
