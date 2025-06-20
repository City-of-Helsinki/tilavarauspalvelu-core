import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  type ReservationUnitTableElementFragment,
} from "@gql/gql-types";
import { truncate } from "@/helpers";
import { getReservationUnitUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styled";
import { IconCheck, IconClock, IconEye, IconEyeCrossed, IconLock, IconPen, IconQuestionCircleFill } from "hds-react";
import type { StatusLabelType } from "common/src/tags";
import StatusLabel from "common/src/components/StatusLabel";
import { gql } from "@apollo/client";

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitTableElementFragment[];
  isLoading?: boolean;
};

const getStatusLabelProps = (
  state: ReservationUnitReservationState | null | undefined
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (state) {
    case ReservationUnitReservationState.Reservable:
      return { type: "success", icon: <IconEye /> };
    case ReservationUnitReservationState.ReservationClosed:
      return { type: "neutral", icon: <IconLock /> };
    case ReservationUnitReservationState.ScheduledReservation:
    case ReservationUnitReservationState.ScheduledClosing:
    case ReservationUnitReservationState.ScheduledPeriod:
      return { type: "info", icon: <IconClock /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill /> };
  }
};

const getPublishingStateProps = (
  state: ReservationUnitPublishingState | null | undefined
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (state) {
    case ReservationUnitPublishingState.ScheduledHiding:
    case ReservationUnitPublishingState.ScheduledPeriod:
    case ReservationUnitPublishingState.ScheduledPublishing:
      return { type: "info", icon: <IconClock aria-hidden="true" /> };
    case ReservationUnitPublishingState.Published:
      return { type: "success", icon: <IconCheck aria-hidden="true" /> };
    case ReservationUnitPublishingState.Draft:
      return { type: "draft", icon: <IconPen aria-hidden="true" /> };
    case ReservationUnitPublishingState.Hidden:
      return { type: "neutral", icon: <IconEyeCrossed aria-hidden="true" /> };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircleFill aria-hidden="true" />,
      };
  }
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitTableElementFragment) => (
      <TableLink to={getReservationUnitUrl(pk, unit?.pk)}>{truncate(nameFi ?? "-", MAX_NAME_LENGTH)}</TableLink>
    ),
    isSortable: true,
  },
  {
    headerName: t("ReservationUnits.headings.unitName"),
    key: "unitNameFi",
    isSortable: true,
    transform: (resUnit: ReservationUnitTableElementFragment) => resUnit.unit?.nameFi ?? "-",
  },
  {
    headerName: t("ReservationUnits.headings.reservationUnitType"),
    key: "typeFi",
    isSortable: true,
    transform: ({ reservationUnitType }: ReservationUnitTableElementFragment) => (
      <span>{reservationUnitType?.nameFi ?? "-"}</span>
    ),
  },
  {
    headerName: t("ReservationUnits.headings.maxPersons"),
    key: "maxPersons",
    isSortable: true,
    transform: ({ maxPersons }: ReservationUnitTableElementFragment) => <span>{maxPersons || "-"}</span>,
  },
  {
    headerName: t("ReservationUnits.headings.surfaceArea"),
    key: "surfaceArea",
    isSortable: true,
    transform: ({ surfaceArea }: ReservationUnitTableElementFragment) =>
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
    transform: ({ publishingState }: ReservationUnitTableElementFragment) => {
      const labelProps = getPublishingStateProps(publishingState);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`ReservationUnits.state.${publishingState}`)}
        </StatusLabel>
      );
    },
  },
  {
    headerName: t("ReservationUnits.headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitTableElementFragment) => {
      const labelProps = getStatusLabelProps(reservationState);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`ReservationUnits.reservationState.${reservationState}`)}
        </StatusLabel>
      );
    },
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

export const RESERVATION_UNIT_TABLE_ELEMENT_FRAGMENT = gql`
  fragment ReservationUnitTableElement on ReservationUnitNode {
    id
    pk
    nameFi
    unit {
      id
      nameFi
      pk
    }
    reservationUnitType {
      id
      nameFi
    }
    maxPersons
    surfaceArea
    publishingState
    reservationState
  }
`;
