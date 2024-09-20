import React from "react";
import { CustomTable } from "@/component/Table";
import { getApplicationUrl, getReservationUrl } from "@/common/urls";
import type { RejectedOccurrencesQuery } from "@gql/gql-types";
import { truncate } from "common/src/helpers";
import { IconLinkExternal } from "hds-react";
import { memoize } from "lodash";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getApplicantName } from "@/helpers";
import { toUIDate } from "common/src/common/util";
import { formatTime } from "@/common/util";
import { ExternalTableLink } from "@/styles/util";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type QueryData = NonNullable<RejectedOccurrencesQuery["rejectedOccurrences"]>;
type Edge = NonNullable<QueryData["edges"]>[0];
type Node = NonNullable<NonNullable<Edge>["node"]>;
type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  rejectedOccurrences: Node[];
  isLoading?: boolean;
};

type RejectedOccurrencesView = {
  key: string;
  applicationPk?: number;
  pk?: number;
  applicantName?: string;
  name: string;
  unitName?: string;
  allocatedReservationUnitName?: string;
  time: string;
  reason: string;
  link: string;
};

function timeSlotMapper(t: TFunction, slot: Node): RejectedOccurrencesView {
  const allocatedSlot = slot.recurringReservation?.allocatedTimeSlot;
  const allocatedReservationUnit =
    allocatedSlot?.reservationUnitOption.reservationUnit;
  const allocatedReservationUnitName = allocatedReservationUnit?.nameFi ?? "-";
  const allocatedUnit = allocatedReservationUnit?.unit?.nameFi ?? "-";

  const application =
    allocatedSlot?.reservationUnitOption.applicationSection?.application;
  const applicantName = getApplicantName(application);

  const date = toUIDate(new Date(slot?.beginDatetime));
  const begin = formatTime(slot?.beginDatetime);
  const end = formatTime(slot?.endDatetime);
  const timeString = `${date} ${begin}–${end}`;
  const name =
    allocatedSlot?.reservationUnitOption.applicationSection.name ?? "-";

  const applicationPk = application?.pk ?? 0;
  const reservationPk = slot.recurringReservation?.reservations[0]?.pk ?? null;
  const link = getReservationUrl(reservationPk);

  const reason =
    t(
      `MyUnits.RecurringReservation.Confirmation.RejectionReadinessChoice.${slot.rejectionReason}`
    ) ?? "-";
  return {
    key: `${applicationPk}-${slot.pk}`,
    applicationPk,
    pk: slot.pk ?? 0,
    applicantName,
    name,
    unitName: allocatedUnit,
    allocatedReservationUnitName,
    time: timeString,
    link,
    reason,
  };
}

const COLS = [
  {
    headerTKey: "ApplicationEvent.headings.id",
    isSortable: true,
    key: "application_id,application_event_id",
    transform: ({ pk, applicationPk }: RejectedOccurrencesView) =>
      `${applicationPk}-${pk}`,
  },
  {
    headerTKey: "ApplicationEvent.headings.customer",
    isSortable: true,
    key: "applicant",
    transform: ({
      applicantName,
      applicationPk,
      pk,
    }: RejectedOccurrencesView) => (
      <ExternalTableLink to={getApplicationUrl(applicationPk, pk)}>
        {truncate(applicantName ?? "-", applicantTruncateLen)}
        <IconLinkExternal size="xs" aria-hidden />
      </ExternalTableLink>
    ),
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.eventName",
    isSortable: true,
    key: "rejected_event_name_fi",
    transform: ({ name }: RejectedOccurrencesView) => {
      return <span>{truncate(name ?? "-", unitsTruncateLen)}</span>;
    },
  },
  {
    headerTKey: "ApplicationEvent.headings.unit",
    isSortable: true,
    key: "rejected_unit_name_fi",
    transform: ({ unitName }: RejectedOccurrencesView) => {
      return <span>{truncate(unitName ?? "-", unitsTruncateLen)}</span>;
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.reservationUnit",
    isSortable: true,
    key: "rejected_reservation_unit_name_fi",
    transform: ({ allocatedReservationUnitName }: RejectedOccurrencesView) => {
      return (
        <span>
          {truncate(allocatedReservationUnitName ?? "-", unitsTruncateLen)}
        </span>
      );
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.occurrenceTime",
    isSortable: true,
    key: "time_of_occurrence",
    transform: ({ time, link }: RejectedOccurrencesView) => {
      if (link !== "") {
        return <ExternalTableLink to={link}>{time}</ExternalTableLink>;
      }
      return <span>{time}</span>;
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.reason",
    isSortable: true,
    key: "rejection_reason",
    transform: ({ reason }: RejectedOccurrencesView) => <span>{reason}</span>,
  },
];

const getColConfig = (t: TFunction) =>
  COLS.map(({ headerTKey, ...col }) => ({
    ...col,
    headerName: t(headerTKey),
  }));

export const SORT_KEYS = COLS.filter((c) => c.isSortable).map((c) => c.key);

export function RejectedOccurrencesTable({
  rejectedOccurrences,
  isLoading,
  sort,
  sortChanged: onSortChanged,
}: Props) {
  const { t } = useTranslation();

  const rows = rejectedOccurrences.map((ro) => timeSlotMapper(t, ro));
  const cols = memoize(() => getColConfig(t))();

  if (rows.length === 0) {
    const name = t("ApplicationEvent.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }

  const sortField = sort?.replaceAll("-", "") ?? "";
  const sortDirection = sort?.startsWith("-") ? "desc" : "asc";
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      isLoading={isLoading}
      rows={rows}
      cols={cols}
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}
