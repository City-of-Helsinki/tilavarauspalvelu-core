import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import {
  ReservationsReservationTypeChoices,
  ReservationType,
} from "common/types/gql-types";
import { truncate } from "@/helpers";
import { reservationUrl } from "@/common/urls";
import { formatDateTime } from "@/common/util";
import { CustomTable, TableLink } from "@/component/Table";
import { getReserveeName, reservationDateTimeString } from "./requested/util";

export type Sort = {
  field: string;
  asc: boolean;
};

type ReservationTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (reservationtype: ReservationType) => JSX.Element | string;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  reservations: ReservationType[];
};

const MAX_NAME_LENGTH = 22;
const getColConfig = (t: TFunction): ReservationTableColumn[] => [
  {
    headerName: t("Reservations.headings.id"),
    key: "pk",
    isSortable: true,
  },
  {
    headerName: t("Reservations.headings.reserveeName"),
    key: "reservee_name",
    isSortable: true,
    transform: (reservation: ReservationType) => {
      const staffPrefix =
        reservation.type === ReservationsReservationTypeChoices.Staff
          ? t("Reservations.prefixes.staff")
          : "";
      const prefix =
        reservation.type === ReservationsReservationTypeChoices.Behalf
          ? t("Reservations.prefixes.behalf")
          : staffPrefix;
      return (
        <TableLink href={reservationUrl(reservation.pk as number)}>
          {getReserveeName(reservation, 22, prefix) ||
            t("RequestedReservation.noName")}
        </TableLink>
      );
    },
  },
  {
    headerName: t("Reservations.headings.reservationUnit"),
    key: "reservation_unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnits }: ReservationType) =>
      truncate(reservationUnits?.[0]?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.unit"),
    key: "unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnits }: ReservationType) =>
      truncate(reservationUnits?.[0]?.unit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.datetime"),
    key: "begin",
    isSortable: true,
    transform: ({ begin, end }: ReservationType) =>
      reservationDateTimeString(begin, end, t),
  },
  {
    headerName: t("Reservations.headings.createdAt"),
    key: "created_at",
    isSortable: true,
    transform: ({ createdAt }: ReservationType) =>
      createdAt ? formatDateTime(createdAt) : "-",
  },
  {
    headerName: t("Reservations.headings.paymentStatus"),
    key: "orderStatus",
    isSortable: true,
    transform: ({ order }: ReservationType) =>
      order?.status == null ? "-" : t(`Payment.status.${order.status}`),
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

  if (reservations.length === 0) {
    const name = t("Reservations.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }

  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      rows={reservations}
      cols={cols}
      initialSortingColumnKey={sort === undefined ? undefined : sort.field}
      initialSortingOrder={
        sort === undefined ? undefined : (sort.asc && "asc") || "desc"
      }
    />
  );
};

export default ReservationsTable;
