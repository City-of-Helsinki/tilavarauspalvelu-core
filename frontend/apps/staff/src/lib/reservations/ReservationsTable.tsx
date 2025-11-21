import React from "react";
import { gql } from "@apollo/client";
import { type TFunction } from "i18next";
import { memoize } from "lodash-es";
import { useTranslation } from "next-i18next";
import { OrderStatusLabel, ReservationStatusLabel } from "ui/src/components/statuses";
import { formatDateTime, formatDateTimeRange, parseValidDateObject } from "ui/src/modules/date-utils";
import { CustomTable } from "@/components/Table";
import { MAX_NAME_LENGTH } from "@/modules/const";
import { getReserveeName, truncate } from "@/modules/helpers";
import { getReservationUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import { ReservationStateChoice, type ReservationTableElementFragment } from "@gql/gql-types";

type ReservationTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (reservationtype: ReservationTableElementFragment) => JSX.Element | string;
};

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  isLoading: boolean;
  reservations: ReservationTableElementFragment[];
};

const getColConfig = (t: TFunction): ReservationTableColumn[] => [
  {
    headerName: t("reservation:Table.headings.id"),
    key: "pk",
    isSortable: true,
  },
  {
    headerName: t("reservation:Table.headings.reserveeName"),
    key: "reservee_name",
    isSortable: true,
    transform: (reservation: ReservationTableElementFragment) => {
      const reservationDisplayName = getReserveeName(reservation, t, MAX_NAME_LENGTH);
      return (
        <TableLink href={getReservationUrl(reservation.pk)}>
          {reservationDisplayName || t("reservation:noName")}
        </TableLink>
      );
    },
  },
  {
    headerName: t("reservation:Table.headings.reservationUnit"),
    key: "reservation_unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnit }: ReservationTableElementFragment) =>
      truncate(reservationUnit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("reservation:Table.headings.unit"),
    key: "unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnit }: ReservationTableElementFragment) =>
      truncate(reservationUnit?.unit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("reservation:Table.headings.datetime"),
    key: "begin",
    isSortable: true,
    transform: ({ beginsAt, endsAt }: ReservationTableElementFragment) =>
      formatDateTimeRange(new Date(beginsAt), new Date(endsAt), { t }),
  },
  {
    headerName: t("reservation:Table.headings.createdAt"),
    key: "created_at",
    isSortable: true,
    transform: ({ createdAt }: ReservationTableElementFragment) =>
      createdAt ? formatDateTime(parseValidDateObject(createdAt), { t }) : "-",
  },
  {
    headerName: t("reservation:Table.headings.paymentStatus"),
    key: "orderStatus",
    isSortable: true,
    transform: ({ paymentOrder }: ReservationTableElementFragment) =>
      paymentOrder ? <OrderStatusLabel status={paymentOrder.status} /> : "-",
  },
  {
    headerName: t("reservation:Table.headings.state"),
    key: "state",
    isSortable: true,
    transform: ({ state }: ReservationTableElementFragment) => (
      <ReservationStatusLabel state={state ?? ReservationStateChoice.Created} />
    ),
  },
];

export function ReservationsTable({
  sort,
  sortChanged: onSortChanged,
  isLoading,
  reservations,
}: Readonly<Props>): JSX.Element {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();

  if (reservations.length === 0) {
    const name = t("reservation:emptyFilterPageName");
    return <div>{t("common:noFilteredResults", { name })}</div>;
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

export const RESERVATION_TABLE_ELEMENT_FRAGMENT = gql`
  fragment ReservationTableElement on ReservationNode {
    ...ReservationCommonFields
    name
    reservationUnit {
      id
      nameFi
      unit {
        id
        nameFi
      }
    }
  }
`;
