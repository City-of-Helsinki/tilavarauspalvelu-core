import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize } from "lodash-es";
import { OrderStatus, ReservationStateChoice, type ReservationTableElementFragment } from "@gql/gql-types";
import { truncate } from "@/helpers";
import { getReservationUrl } from "@/common/urls";
import { formatDateTime, formatDateTimeRange, getReserveeName } from "@/common/util";
import { CustomTable } from "@/component/Table";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styled";
import type { StatusLabelType } from "common/src/tags";
import StatusLabel from "common/src/components/StatusLabel";
import { IconCheck, IconCogwheel, IconCross, IconEuroSign, IconPen, IconQuestionCircleFill } from "hds-react";
import { gql } from "@apollo/client";

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

const getStatusLabelProps = (
  state: ReservationStateChoice | null | undefined
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (state) {
    case ReservationStateChoice.Created:
      return { type: "draft", icon: <IconPen aria-hidden="true" /> };
    case ReservationStateChoice.Denied:
      return { type: "error", icon: <IconCross aria-hidden="true" /> };
    case ReservationStateChoice.WaitingForPayment:
      return { type: "alert", icon: <IconEuroSign aria-hidden="true" /> };
    case ReservationStateChoice.Cancelled:
      return { type: "neutral", icon: <IconCross aria-hidden="true" /> };
    case ReservationStateChoice.Confirmed:
      return { type: "success", icon: <IconCheck aria-hidden="true" /> };
    case ReservationStateChoice.RequiresHandling:
      return { type: "info", icon: <IconCogwheel aria-hidden="true" /> };
    default:
      return {
        type: "info",
        icon: <IconQuestionCircleFill aria-hidden="true" />,
      };
  }
};

const getPaymentStatusLabelType = (status: OrderStatus | null | undefined): StatusLabelType => {
  switch (status) {
    case OrderStatus.Refunded:
    case OrderStatus.Paid:
      return "success";
    case OrderStatus.Expired:
      return "error";
    case OrderStatus.PaidManually:
    case OrderStatus.PaidByInvoice:
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
    transform: (reservation: ReservationTableElementFragment) => {
      const reservationDisplayName = getReserveeName(reservation, t, MAX_NAME_LENGTH);
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
    transform: ({ reservationUnit }: ReservationTableElementFragment) =>
      truncate(reservationUnit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.unit"),
    key: "unit_name_fi",
    isSortable: true,
    transform: ({ reservationUnit }: ReservationTableElementFragment) =>
      truncate(reservationUnit?.unit?.nameFi || "-", MAX_NAME_LENGTH),
  },
  {
    headerName: t("Reservations.headings.datetime"),
    key: "begin",
    isSortable: true,
    transform: ({ beginsAt, endsAt }: ReservationTableElementFragment) =>
      formatDateTimeRange(t, new Date(beginsAt), new Date(endsAt)),
  },
  {
    headerName: t("Reservations.headings.createdAt"),
    key: "created_at",
    isSortable: true,
    transform: ({ createdAt }: ReservationTableElementFragment) => (createdAt ? formatDateTime(createdAt) : "-"),
  },
  {
    headerName: t("Reservations.headings.paymentStatus"),
    key: "orderStatus",
    isSortable: true,
    transform: ({ paymentOrder }: ReservationTableElementFragment) => {
      if (!paymentOrder) {
        return "-";
      }
      const labelType = getPaymentStatusLabelType(paymentOrder.status);
      return (
        <StatusLabel type={labelType} icon={<IconEuroSign />} slim>
          {t(`Payment.status.${paymentOrder.status}`)}
        </StatusLabel>
      );
    },
  },
  {
    headerName: t("Reservations.headings.state"),
    key: "state",
    isSortable: true,
    transform: ({ state }: ReservationTableElementFragment) => {
      const labelProps = getStatusLabelProps(state);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`RequestedReservation.state.${state}`)}
        </StatusLabel>
      );
    },
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
