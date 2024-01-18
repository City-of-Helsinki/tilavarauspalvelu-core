import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import { IconLinkExternal } from "hds-react";
import {
  ApplicationEventStatusChoice,
  type ApplicationEventScheduleNode,
} from "common/types/gql-types";
import { publicUrl } from "@/common/const";
import { truncate } from "@/helpers";
import { applicationDetailsUrl } from "@/common/urls";
import { CustomTable, ExternalTableLink } from "@/component/Table";
import { getApplicantName } from "app/component/applications/util";
import { ApplicationEventStatusCell } from "./StatusCell";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  schedules: ApplicationEventScheduleNode[];
  isLoading?: boolean;
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

function aesMapper(
  t: TFunction,
  aes: ApplicationEventScheduleNode
): ApplicationScheduleView {
  const allocatedReservationUnitName =
    aes.allocatedReservationUnit?.nameFi ?? "-";
  const allocatedUnit = aes.allocatedReservationUnit?.unit?.nameFi ?? "-";

  const ae = aes.applicationEvent;
  const application = ae?.application;
  const applicantName = getApplicantName(application);

  const { allocatedDay: day, allocatedBegin: begin, allocatedEnd: end } = aes;

  const isAllocated = aes.allocatedBegin && aes.allocatedEnd;
  const isDeclined = aes.declined;
  const status = isDeclined
    ? ApplicationEventStatusChoice.Declined
    : isAllocated
      ? ApplicationEventStatusChoice.Approved
      : undefined;

  const timeString = isAllocated
    ? `${t(`dayShort.${day}`)} ${begin} - ${end}`
    : "-";

  return {
    applicationPk: application?.pk ?? 0,
    pk: aes.applicationEvent.pk ?? 0,
    applicantName,
    allocatedReservationUnitName,
    unitName: allocatedUnit,
    time: timeString,
    name: ae.name ?? "-",
    statusView: <ApplicationEventStatusCell status={status} />,
  };
}

const COLS = [
  {
    headerTKey: "ApplicationEvent.headings.id",
    isSortable: true,
    key: "application_id,application_event_id",
    transform: ({ pk, applicationPk }: ApplicationScheduleView) =>
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
    }: ApplicationScheduleView) => (
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
    headerTKey: "ApplicationEventSchedules.headings.eventName",
    isSortable: true,
    key: "application_event_name_fi",
    transform: ({ name }: ApplicationScheduleView) => {
      return <span>{truncate(name ?? "-", unitsTruncateLen)}</span>;
    },
  },
  {
    headerTKey: "ApplicationEvent.headings.unit",
    isSortable: true,
    key: "allocated_unit_name_fi",
    transform: ({ unitName }: ApplicationScheduleView) => {
      return <span>{truncate(unitName ?? "-", unitsTruncateLen)}</span>;
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.reservationUnit",
    isSortable: true,
    key: "allocated_reservation_unit_name_fi",
    transform: ({ allocatedReservationUnitName }: ApplicationScheduleView) => {
      return (
        <span>
          {truncate(allocatedReservationUnitName ?? "-", unitsTruncateLen)}
        </span>
      );
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.time",
    isSortable: true,
    key: "allocated_time_of_week",
    transform: ({ time }: ApplicationScheduleView) => time,
  },
  {
    headerTKey: "ApplicationEvent.headings.phase",
    isSortable: true,
    key: "application_event_status",
    transform: ({ statusView }: ApplicationScheduleView) => statusView,
  },
];

const getColConfig = (t: TFunction) =>
  COLS.map(({ headerTKey, ...col }) => ({
    ...col,
    headerName: t(headerTKey),
  }));
export const SORT_KEYS = COLS.filter((c) => c.isSortable).map((c) => c.key);

export function AllocatedEventsTable({
  sort,
  sortChanged: onSortChanged,
  schedules,
  isLoading,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const views = schedules.map((aes) => aesMapper(t, aes));

  const cols = memoize(() => getColConfig(t))();

  if (views.length === 0) {
    const name = t("Application.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }

  const sortField = sort?.replaceAll("-", "") ?? "";
  const sortDirection = sort?.startsWith("-") ? "desc" : "asc";
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      isLoading={isLoading}
      rows={views}
      cols={cols}
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}
