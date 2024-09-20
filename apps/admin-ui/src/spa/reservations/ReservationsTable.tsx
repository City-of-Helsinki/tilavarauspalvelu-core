import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize } from "lodash";
import {
  OrderStatus,
  ReservationsQuery,
  ReservationStateChoice,
} from "@gql/gql-types";
import { truncate } from "@/helpers";
import { getReservationUrl } from "@/common/urls";
import {
  formatDateTime,
  formatDateTimeRange,
  getReserveeName,
} from "@/common/util";
import { CustomTable } from "@/component/Table";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink, TableStatusLabel } from "@/styles/util";
import type { StatusLabelType } from "common/src/tags";
import {
  IconCheck,
  IconCogwheel,
  IconCross,
  IconEuroSign,
  IconPen,
  IconQuestionCircleFill,
} from "hds-react";

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

const getStatusLabelProps = (
  state: ReservationStateChoice | null | undefined
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (state) {
    case ReservationStateChoice.Created:
      return { type: "draft", icon: <IconPen ariaHidden /> };
    case ReservationStateChoice.Denied:
      return { type: "error", icon: <IconCross ariaHidden /> };
    case ReservationStateChoice.WaitingForPayment:
      return { type: "alert", icon: <IconEuroSign ariaHidden /> };
    case ReservationStateChoice.Cancelled:
      return { type: "neutral", icon: <IconCross ariaHidden /> };
    case ReservationStateChoice.Confirmed:
      return { type: "success", icon: <IconCheck ariaHidden /> };
    case ReservationStateChoice.RequiresHandling:
      return { type: "info", icon: <IconCogwheel ariaHidden /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill ariaHidden /> };
  }
};

const getPaymentStatusLabelType = (
  status: OrderStatus | null | undefined
): StatusLabelType => {
  switch (status) {
    case OrderStatus.Refunded:
    case OrderStatus.Paid:
      return "success";
    case OrderStatus.Expired:
      return "error";
    case OrderStatus.PaidManually:
    case OrderStatus.Draft:
      return "alert";
    case OrderStatus.Cancelled:
    default:
      return "neutral";
  }
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
        <TableLink to={getReservationUrl(reservation.pk)}>
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
    transform: ({ paymentOrder }: ReservationType) => {
      const order = paymentOrder?.[0];
      if (!order) {
        return "-";
      }
      const labelType = getPaymentStatusLabelType(order.status);
      return (
        <TableStatusLabel type={labelType} icon={<IconEuroSign />}>
          {t(`Payment.status.${order.status}`)}
        </TableStatusLabel>
      );
    },
  },
  {
    headerName: t("Reservations.headings.state"),
    key: "state",
    isSortable: true,
    transform: ({ state }: ReservationType) => {
      const labelProps = getStatusLabelProps(state);
      return (
        <TableStatusLabel type={labelProps.type} icon={labelProps.icon}>
          {t(`RequestedReservation.state.${state}`)}
        </TableStatusLabel>
      );
    },
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
