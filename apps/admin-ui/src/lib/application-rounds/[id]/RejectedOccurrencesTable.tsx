import React from "react";
import { CustomTable } from "@/component/Table";
import { getApplicationUrl, getReservationUrl } from "@/common/urls";
import type { RejectedOccurrencesTableElementFragment } from "@gql/gql-types";
import { truncate } from "common/src/helpers";
import { IconLinkExternal, IconSize } from "hds-react";
import { memoize } from "lodash-es";
import { useTranslation, type TFunction } from "next-i18next";
import { getApplicantName } from "@/helpers";
import { formatDate, formatTime, toValidDateObject } from "common/src/date-utils";
import { ExternalTableLink } from "@/styled";
import { gql } from "@apollo/client";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  rejectedOccurrences: RejectedOccurrencesTableElementFragment[];
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

function timeSlotMapper(t: TFunction, slot: RejectedOccurrencesTableElementFragment): RejectedOccurrencesView {
  const allocatedSlot = slot.reservationSeries?.allocatedTimeSlot;
  const allocatedReservationUnit = allocatedSlot?.reservationUnitOption.reservationUnit;
  const allocatedReservationUnitName = allocatedReservationUnit?.nameFi ?? "-";
  const allocatedUnit = allocatedReservationUnit?.unit?.nameFi ?? "-";

  const application = allocatedSlot?.reservationUnitOption.applicationSection?.application;
  const applicantName = application != null ? getApplicantName(application) : "-";

  const date = formatDate(toValidDateObject(slot?.beginDatetime));
  const begin = formatTime(toValidDateObject(slot?.beginDatetime));
  const end = formatTime(toValidDateObject(slot?.endDatetime));
  const timeString = `${date} ${begin}–${end}`;
  const name = allocatedSlot?.reservationUnitOption.applicationSection.name ?? "-";

  const applicationPk = application?.pk ?? 0;
  const reservationPk = slot.reservationSeries?.reservations[0]?.pk ?? null;
  const link = getReservationUrl(reservationPk);

  const reason = t(`myUnits:ReservationSeries.Confirmation.RejectionReadinessChoice.${slot.rejectionReason}`) ?? "-";
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
    headerTKey: "applicationSection:headings.id",
    isSortable: true,
    key: "application_id,application_section_id",
    transform: ({ pk, applicationPk }: RejectedOccurrencesView) => `${applicationPk}-${pk}`,
  },
  {
    headerTKey: "applicationSection:headings.customer",
    isSortable: true,
    key: "applicant",
    transform: ({ applicantName, applicationPk, pk }: RejectedOccurrencesView) => (
      <ExternalTableLink href={getApplicationUrl(applicationPk, pk)}>
        {truncate(applicantName ?? "-", applicantTruncateLen)}
        <IconLinkExternal size={IconSize.ExtraSmall} />
      </ExternalTableLink>
    ),
  },
  {
    headerTKey: "applicationSection:schedule.headings.eventName",
    isSortable: true,
    key: "rejected_event_name_fi",
    transform: ({ name }: RejectedOccurrencesView) => <span>{truncate(name ?? "-", unitsTruncateLen)}</span>,
  },
  {
    headerTKey: "applicationSection:headings.unit",
    isSortable: true,
    key: "rejected_unit_name_fi",
    transform: ({ unitName }: RejectedOccurrencesView) => <span>{truncate(unitName ?? "-", unitsTruncateLen)}</span>,
  },
  {
    headerTKey: "applicationSection:schedule.headings.reservationUnit",
    isSortable: true,
    key: "rejected_reservation_unit_name_fi",
    transform: ({ allocatedReservationUnitName }: RejectedOccurrencesView) => (
      <span>{truncate(allocatedReservationUnitName ?? "-", unitsTruncateLen)}</span>
    ),
  },
  {
    headerTKey: "applicationSection:schedule..headings.occurrenceTime",
    isSortable: true,
    key: "time_of_occurrence",
    transform: ({ time, link }: RejectedOccurrencesView) => {
      if (link !== "") {
        return <ExternalTableLink href={link}>{time}</ExternalTableLink>;
      }
      return <span>{time}</span>;
    },
  },
  {
    headerTKey: "applicationSection:schedule.headings.reason",
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
}: Readonly<Props>) {
  const { t } = useTranslation();

  const rows = rejectedOccurrences.map((ro) => timeSlotMapper(t, ro));
  const cols = memoize(() => getColConfig(t))();

  if (rows.length === 0) {
    const name = t("applicationSection:emptyFilterPageName");
    return <div>{t("common:noFilteredResults", { name })}</div>;
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

export const REJECTED_OCCURRENCES_TABLE_ELEMENT_FRAGMENT = gql`
  fragment RejectedOccurrencesTableElement on RejectedOccurrenceNode {
    id
    pk
    beginDatetime
    endDatetime
    rejectionReason
    reservationSeries {
      id
      allocatedTimeSlot {
        id
        pk
        dayOfTheWeek
        beginTime
        endTime
        reservationUnitOption {
          id
          applicationSection {
            id
            name
            application {
              id
              pk
              ...ApplicantNameFields
            }
          }
          reservationUnit {
            id
            nameFi
            pk
            unit {
              id
              nameFi
            }
          }
        }
      }
      reservations {
        id
        pk
      }
    }
  }
`;
