import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  SearchReservationUnitsQuery,
} from "@gql/gql-types";
import { truncate } from "@/helpers";
import { getReservationUnitUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink, TableStatusLabel } from "@/styles/util";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconEyeCrossed,
  IconLock,
  IconPen,
  IconQuestionCircleFill,
} from "hds-react";
import type { StatusLabelType } from "common/src/tags";

type ReservationUnitList = NonNullable<
  SearchReservationUnitsQuery["reservationUnits"]
>;
type ReservationUnitNode = NonNullable<
  NonNullable<ReservationUnitList["edges"][0]>["node"]
>;
type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitNode[];
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
      return { type: "info", icon: <IconClock ariaHidden /> };
    case ReservationUnitPublishingState.Published:
      return { type: "success", icon: <IconCheck ariaHidden /> };
    case ReservationUnitPublishingState.Draft:
      return { type: "draft", icon: <IconPen ariaHidden /> };
    case ReservationUnitPublishingState.Hidden:
      return { type: "neutral", icon: <IconEyeCrossed ariaHidden /> };
    default:
      return { type: "neutral", icon: <IconQuestionCircleFill ariaHidden /> };
  }
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ReservationUnits.headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk, unit }: ReservationUnitNode) => (
      <TableLink to={getReservationUnitUrl(pk, unit?.pk)}>
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
    transform: ({ publishingState }: ReservationUnitNode) => {
      const labelProps = getPublishingStateProps(publishingState);
      return (
        <TableStatusLabel type={labelProps.type} icon={labelProps.icon}>
          {t(`ReservationUnits.state.${publishingState}`)}
        </TableStatusLabel>
      );
    },
  },
  {
    headerName: t("ReservationUnits.headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitNode) => {
      const labelProps = getStatusLabelProps(reservationState);
      return (
        <TableStatusLabel type={labelProps.type} icon={labelProps.icon}>
          {t(`ReservationUnits.reservationState.${reservationState}`)}
        </TableStatusLabel>
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
