import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import { IconLinkExternal } from "hds-react";
import type { AllocatedTimeSlotNode } from "common/types/gql-types";
import { convertWeekday } from "common/src/conversion";
import { PUBLIC_URL } from "@/common/const";
import { truncate } from "@/helpers";
import { applicationDetailsUrl } from "@/common/urls";
import { CustomTable, ExternalTableLink } from "@/component/Table";
import { getApplicantName } from "@/component/applications/util";
import { TimeSlotStatusCell } from "./StatusCell";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  schedules: AllocatedTimeSlotNode[];
  isLoading?: boolean;
};

type ApplicationScheduleView = {
  key: string;
  applicationPk?: number;
  pk?: number;
  applicantName?: string;
  name: string;
  unitName?: string;
  allocatedReservationUnitName?: string;
  time: string;
  statusView: JSX.Element;
};

function timeSlotMapper(
  t: TFunction,
  slot: AllocatedTimeSlotNode
): ApplicationScheduleView {
  const allocatedReservationUnit = slot.reservationUnitOption?.reservationUnit;
  const allocatedReservationUnitName = allocatedReservationUnit?.nameFi ?? "-";
  const allocatedUnit = allocatedReservationUnit?.unit?.nameFi ?? "-";

  const application =
    slot.reservationUnitOption.applicationSection?.application;
  const applicantName = getApplicantName(application);

  // TODO should this check the state directly?
  const isAllocated = !slot.reservationUnitOption.rejected;
  const isDeclined = slot.reservationUnitOption.rejected;

  const day = slot?.dayOfTheWeek ? convertWeekday(slot?.dayOfTheWeek) : 0;
  const begin = slot?.beginTime ?? "";
  const end = slot?.endTime ?? "";
  const timeString = isAllocated
    ? `${t(`dayShort.${day}`)} ${begin.slice(0, 5)} - ${end.slice(0, 5)}`
    : "-";
  const name = slot.reservationUnitOption.applicationSection.name ?? "-";

  const applicationPk = application.pk ?? 0;
  return {
    key: `${applicationPk}-${slot.pk}`,
    applicationPk,
    pk: slot.reservationUnitOption.applicationSection.pk ?? 0,
    applicantName,
    allocatedReservationUnitName,
    unitName: allocatedUnit,
    time: timeString,
    name,
    statusView: (
      <TimeSlotStatusCell status={isDeclined ? "declined" : "approved"} />
    ),
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
        // TODO use url builder
        href={`${PUBLIC_URL}${applicationDetailsUrl(applicationPk ?? 0)}#${
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

  const views = schedules.map((aes) => timeSlotMapper(t, aes));

  const cols = memoize(() => getColConfig(t))();

  if (views.length === 0) {
    const name = t("ApplicationEvent.allocated.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }

  const sortField = sort?.replaceAll("-", "") ?? "";
  const sortDirection = sort?.startsWith("-") ? "desc" : "asc";
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="key"
      isLoading={isLoading}
      rows={views}
      cols={cols}
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}
