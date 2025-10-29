import React, { type Dispatch, type SetStateAction } from "react";
import { gql } from "@apollo/client";
import { IconInfoCircle, IconLinkExternal, IconSize } from "hds-react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { ButtonLikeExternalLink } from "ui/src/components/ButtonLikeLink";
import { breakpoints } from "ui/src/modules/const";
import { Flex } from "ui/src/styled";
import { CustomTable } from "@/components/Table";
import { useEnvContext } from "@/context/EnvContext";
import type { SelectedRow } from "@/lib/reservation-units";
import { isBrowser, MAX_NAME_LENGTH } from "@/modules/const";
import { truncate } from "@/modules/helpers";
import { getOpeningHoursUrl, getReservationUnitUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import { type ReservationUnitTableElementFragment } from "@gql/gql-types";
import { ReservationUnitPublishingStatusLabel, ReservationUnitReservationStatusLabel } from "./[pk]/tags";

type ReservationUnitsTableProps = {
  sort: string;
  sortChanged: (field: string) => void;
  reservationUnits: ReservationUnitTableElementFragment[];
  isLoading?: boolean;
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
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
    transform: ({ publishingState }: ReservationUnitTableElementFragment) => (
      <ReservationUnitPublishingStatusLabel state={publishingState} slim />
    ),
  },
  {
    headerName: t("reservationUnit:headings.reservationState"),
    key: "reservationState",
    transform: ({ reservationState }: ReservationUnitTableElementFragment) => (
      <ReservationUnitReservationStatusLabel state={reservationState} slim />
    ),
  },
];

export function ReservationUnitsTable({
  sort,
  sortChanged: onSortChanged,
  reservationUnits,
  isLoading,
  selectedRows,
  setSelectedRows,
}: ReservationUnitsTableProps): JSX.Element {
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
      customActionButtons={[<ActionButtons selectedRows={selectedRows}></ActionButtons>]}
    />
  );
}

const Spacer = styled.div`
  flex-grow: 1;
  @media (min-width: ${breakpoints.m}) {
    margin-left: var(--spacing-s);
  }
`;

type ActionButtonsProps = {
  selectedRows: SelectedRow[];
};
function ActionButtons({ selectedRows }: ActionButtonsProps): React.ReactElement {
  const { env } = useEnvContext();
  const { t } = useTranslation();

  const selectedPks = selectedRows.map((id) => Number(id)).filter((id) => !isNaN(id));
  const redirectOnErrorUrl = isBrowser ? window.location.href : undefined;
  const openingHoursUrl = getOpeningHoursUrl(env.apiBaseUrl, selectedPks, redirectOnErrorUrl);
  const editLink = openingHoursUrl !== "" ? openingHoursUrl : undefined;
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
