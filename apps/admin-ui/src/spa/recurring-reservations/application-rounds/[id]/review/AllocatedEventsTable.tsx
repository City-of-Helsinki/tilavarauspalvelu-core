import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import { IconLinkExternal } from "hds-react";
import type { ApplicationEventScheduleNode } from "common/types/gql-types";
import { publicUrl } from "@/common/const";
import { truncate } from "@/helpers";
import { applicationDetailsUrl } from "@/common/urls";
import { CustomTable, ExternalTableLink } from "@/component/lists/components";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  schedules: ApplicationEventScheduleNode[];
};

type ApplicationScheduleView = {
  applicationPk?: number;
  pk?: number;
  applicantName?: string;
  name: string;
  unitName?: string;
  allocatedReservationUnitName?: string;
  time: string;
  statusView: JSX.Element;
};

const appScheduleMapper = (
  aes: ApplicationEventScheduleNode
): ApplicationScheduleView => {
  const isDeclined = aes.declined
  const allocatedReservationUnit = aes.allocatedReservationUnit?.nameFi ?? "-"
  const allocatedUnit = aes.allocatedReservationUnit?.unit?.nameFi ?? "-"

  // TODO there is no application in the schedule
  const applicantName = "-" //  getApplicantName(appEvent.application);

  const { begin, end } = aes;
  const timeString = `${begin} - ${end}`
  const isAllocated = aes.allocatedBegin && aes.allocatedEnd;
  const status = isDeclined ? "declined" : isAllocated ?  "allocated" : "-";

  return {
    // TODO missing
    applicationPk: 0,
    pk: aes.pk ?? undefined,
    applicantName,
    allocatedReservationUnitName: allocatedReservationUnit,
    unitName: allocatedUnit,
    time: timeString,
    name: "foobar",
    // TODO implement the JSX element
    statusView: <span>{status}</span>,
  };
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ApplicationEvent.headings.id"),
    isSortable: true,
    key: "pk",
    transform: ({ pk, applicationPk }: ApplicationScheduleView) => `${applicationPk}-${pk}`,
  },
  {
    headerName: t("ApplicationEvent.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicantName, applicationPk, pk }: ApplicationScheduleView) => (
      <ExternalTableLink
        href={`${publicUrl}${applicationDetailsUrl(applicationPk ?? 0)}#${
          pk ?? 0
        }`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {truncate(applicantName ?? "-", applicantTruncateLen)}
        <IconLinkExternal size="xs" aria-hidden />
      </ExternalTableLink>
    ),
  },
  {
    headerName: t("ApplicationEventSchedules.headings.eventName"),
    key: "name",
  },
  {
    headerName: t("ApplicationEvent.headings.unit"),
    key: "units",
    transform: ({ unitName }: ApplicationScheduleView) => {
      return (
        <span>
          {truncate(unitName ?? "-", unitsTruncateLen)}
        </span>
      );
    },
  },
  {
    headerName: t("ApplicationEventSchedules.headings.reservationUnit"),
    key: "reservationUnit",
    transform: ({ allocatedReservationUnitName }: ApplicationScheduleView) => {
      return (
        <span>
          {truncate(allocatedReservationUnitName ?? "-", unitsTruncateLen)}
        </span>
      );
    },
  },
  {
    headerName: t("ApplicationEventSchedules.headings.time"),
    key: "time",
  },
  {
    headerName: t("ApplicationEvent.headings.phase"),
    key: "status",
    transform: ({ statusView }: ApplicationScheduleView) => statusView,
  },
];

export function AllocatedEventsTable({
  sort,
  sortChanged: onSortChanged,
  schedules,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const views = schedules.map((aes) => appScheduleMapper(aes));

  const cols = memoize(() => getColConfig(t))();

  if (views.length === 0) {
    return <div>{t("ReservationUnits.noFilteredReservationUnits")}</div>;
  }

  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      rows={views}
      cols={cols}
      initialSortingColumnKey={sort === undefined ? undefined : sort.field}
      initialSortingOrder={
        sort === undefined ? undefined : (sort.sort && "asc") || "desc"
      }
    />
  );
}
