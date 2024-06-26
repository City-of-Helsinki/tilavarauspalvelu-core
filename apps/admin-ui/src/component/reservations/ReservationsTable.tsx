import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize } from "lodash";
import type { ReservationsQuery } from "@gql/gql-types";
import { truncate } from "@/helpers";
import { reservationUrl } from "@/common/urls";
import { formatDateTime, formatDateTimeRange } from "@/common/util";
import { CustomTable, TableLink } from "@/component/Table";
import { getReserveeName } from "./requested/util";
import { MAX_NAME_LENGTH } from "@/common/const";

type ReservationTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (reservationtype: ReservationType) => JSX.Element | string;
};

type ReservationListType = NonNullable<ReservationsQuery["reservations"]>;
type ReservationType = NonNullable<
  NonNullable<ReservationListType["edges"][0]>["node"]
>;
type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  isLoading: boolean;
  reservations: ReservationType[];
};

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
      const reservationDisplayName = getReserveeName(
        reservation,
        t,
        MAX_NAME_LENGTH
      );
      return (
        <TableLink href={reservationUrl(reservation.pk as number)}>
          {reservationDisplayName || t("RequestedReservation.noName")}
        </TableLink>
      );
    },
  },
  {
    headerName: t("Reservations.headings.reservationUnit"),
    key: "reservation_unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnit }: ReservationType) =>
      truncate(reservationUnit?.[0]?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.unit"),
    key: "unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnit }: ReservationType) =>
      truncate(reservationUnit?.[0]?.unit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.datetime"),
    key: "begin",
    isSortable: true,
    transform: ({ begin, end }: ReservationType) =>
      formatDateTimeRange(t, new Date(begin), new Date(end)),
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

export function ReservationsTable({
  sort,
  sortChanged: onSortChanged,
  isLoading,
  reservations,
}: Props): JSX.Element {
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
      isLoading={isLoading}
      initialSortingColumnKey={sort.startsWith("-") ? sort.slice(1) : sort}
      initialSortingOrder={sort.startsWith("-") ? "desc" : "asc"}
    />
  );
}
