import React, { type Dispatch, type SetStateAction } from "react";
import { gql } from "@apollo/client";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconEyeCrossed,
  IconInfoCircle,
  IconLinkExternal,
  IconLock,
  IconPen,
  IconQuestionCircleFill,
  IconSize,
} from "hds-react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ButtonLikeExternalLink } from "ui/src/components/ButtonLikeLink";
import StatusLabel, { type StatusLabelType } from "ui/src/components/StatusLabel";
import { breakpoints } from "ui/src/modules/const";
import { Flex } from "ui/src/styled";
import { CustomTable } from "@/components/Table";
import type { SelectedRow } from "@/lib/reservation-units";
import { isBrowser, MAX_NAME_LENGTH } from "@/modules/const";
import { truncate } from "@/modules/helpers";
import { getOpeningHoursUrl, getReservationUnitUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import {
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  type ReservationUnitTableElementFragment,
} from "@gql/gql-types";

type Props = {
  sort: string;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitTableElementFragment[];
  isLoading?: boolean;
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
  apiBaseUrl: string;
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
    headerName: "Select checkbox heading - not rendered",
    key: "pk",
  },
  {
    headerName: t("reservationUnit:headings.name"),
    key: "nameFi",
    transform: ({ nameFi, pk }: ReservationUnitTableElementFragment) => (
      <TableLink href={getReservationUnitUrl(null, pk)}>{truncate(nameFi ?? "-", MAX_NAME_LENGTH)}</TableLink>
    ),
    isSortable: true,
  },
  {
    headerName: t("reservationUnit:headings.unitName"),
    key: "unitNameFi",
    isSortable: true,
    transform: (resUnit: ReservationUnitTableElementFragment) => resUnit.unit?.nameFi ?? "-",
  },
  {
    headerName: t("reservationUnit:headings.reservationUnitType"),
    key: "typeFi",
    isSortable: true,
    transform: ({ reservationUnitType }: ReservationUnitTableElementFragment) => (
      <span>{reservationUnitType?.nameFi ?? "-"}</span>
    ),
  },
  {
    headerName: t("reservationUnit:headings.maxPersons"),
    key: "maxPersons",
    isSortable: true,
    transform: ({ maxPersons }: ReservationUnitTableElementFragment) => <span>{maxPersons || "-"}</span>,
  },
  {
    headerName: t("reservationUnit:headings.surfaceArea"),
    key: "surfaceArea",
    isSortable: true,
    transform: ({ surfaceArea }: ReservationUnitTableElementFragment) =>
      surfaceArea != null ? (
        <span>
          {Number(surfaceArea).toLocaleString("fi") || "-"}
          {t("common:areaUnitSquareMeter")}
        </span>
      ) : (
        "-"
      ),
  },
  {
    headerName: t("reservationUnit:headings.state"),
    key: "state",
    transform: ({ publishingState }: ReservationUnitTableElementFragment) => {
      const labelProps = getPublishingStateProps(publishingState);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`reservationUnit:state.${publishingState}`)}
        </StatusLabel>
      );
    },
  },
  {
    headerName: t("reservationUnit:headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitTableElementFragment) => {
      const labelProps = getStatusLabelProps(reservationState);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`reservationUnit:reservationState.${reservationState}`)}
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
  selectedRows,
  setSelectedRows,
  apiBaseUrl,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const cols = getColConfig(t);

  if (reservationUnits.length === 0) {
    const name = t("reservationUnit:emptyFilterPageName");
    return <div>{t("common:noFilteredResults", { name })}</div>;
  }
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      renderIndexCol={false}
      rows={reservationUnits}
      cols={cols}
      initialSortingColumnKey={sort.startsWith("-") ? sort.slice(1) : sort}
      initialSortingOrder={sort.startsWith("-") ? "desc" : "asc"}
      isLoading={isLoading}
      checkboxSelection
      ariaLabelCheckboxSelection={t("common:select")}
      selectedRows={selectedRows}
      selectAllRowsText={t("common:selectAllRows")}
      clearSelectionsText={t("common:clearAllSelections")}
      setSelectedRows={setSelectedRows}
      customActionButtons={[<ActionButtons t={t} selectedRows={selectedRows} apiBaseUrl={apiBaseUrl}></ActionButtons>]}
    />
  );
}

const Spacer = styled.div`
  flex-grow: 1;
  @media (min-width: ${breakpoints.m}) {
    margin-left: var(--spacing-s);
  }
`;

function ActionButtons({
  t,
  selectedRows,
  apiBaseUrl,
}: {
  t: TFunction;
  selectedRows: SelectedRow[];
  apiBaseUrl: string;
}): JSX.Element {
  const selectedPks = selectedRows.map((id) => Number(id)).filter((id) => !isNaN(id));
  const redirectOnErrorUrl = isBrowser ? window.location.href : undefined;
  const editLink =
    getOpeningHoursUrl(apiBaseUrl, selectedPks, redirectOnErrorUrl) !== ""
      ? getOpeningHoursUrl(apiBaseUrl, selectedPks, redirectOnErrorUrl)
      : undefined;
  return (
    <Spacer>
      <Flex $gap={"xs"} $direction={"row"} $wrap={"wrap"}>
        <Flex
          $gap={"xs"}
          $direction={"row"}
          $alignItems={"center"}
          style={{ flexShrink: "1", maxWidth: "490px", marginRight: "auto" }}
        >
          <IconInfoCircle size={IconSize.Medium} />
          <div>{t("reservationUnit:editInfoText")}</div>
        </Flex>
        <ButtonLikeExternalLink disabled={!editLink} href={editLink} target={"_blank"}>
          {t("reservationUnit:goToMassEdit")}
          <IconLinkExternal />
        </ButtonLikeExternalLink>
      </Flex>
    </Spacer>
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
