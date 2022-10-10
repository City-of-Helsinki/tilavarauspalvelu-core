import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { memoize, truncate } from "lodash";
import { ReservationType } from "../../common/gql-types";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";
import { reservationUrl } from "../../common/urls";
import { getReserveeName, reservationDateTime } from "./requested/util";

export type Sort = {
  field: string;
  asc: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  reservations: ReservationType[];
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("Reservations.headings.id"),
    key: "pk",
    isSortable: true,
  },
  {
    headerName: t("Reservations.headings.reserveeName"),
    key: "reservee_name",
    isSortable: true,
    transform: (reservation: ReservationType) => (
      <TableLink href={reservationUrl(reservation.pk as number)}>
        {getReserveeName(reservation, 22) || t("RequestedReservation.noName")}
      </TableLink>
    ),
  },
  {
    headerName: t("Reservations.headings.reservationUnit"),
    key: "reservation_unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnits }: ReservationType) =>
      truncate(reservationUnits?.[0]?.nameFi || "-", {
        length: 22,
        omission: "...",
      }),
  },
  {
    headerName: t("Reservations.headings.unit"),
    key: "unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnits }: ReservationType) =>
      truncate(reservationUnits?.[0]?.unit?.nameFi || "-", {
        length: 22,
        omission: "...",
      }),
  },
  {
    headerName: t("Reservations.headings.datetime"),
    key: "begin",
    isSortable: true,
    transform: ({ begin, end }: ReservationType) =>
      reservationDateTime(begin, end, t),
  },
  {
    headerName: t("Reservations.headings.state"),
    key: "state",
    isSortable: true,
    transform: ({ state }: ReservationType) =>
      t(`RequestedReservation.state.${state}`),
  },
];

const ReservationsTable = ({
  sort,
  sortChanged: onSortChanged,
  reservations,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();

  return (
    <>
      <DataOrMessage
        filteredData={reservations}
        noFilteredData={t("Reservations.noFilteredReservations")}
      >
        <>
          <CustomTable
            setSort={onSortChanged}
            indexKey="pk"
            rows={reservations}
            cols={cols}
            initialSortingColumnKey={
              sort === undefined ? undefined : sort.field
            }
            initialSortingOrder={
              sort === undefined ? undefined : (sort.asc && "asc") || "desc"
            }
          />
        </>
      </DataOrMessage>
    </>
  );
};

export default ReservationsTable;
