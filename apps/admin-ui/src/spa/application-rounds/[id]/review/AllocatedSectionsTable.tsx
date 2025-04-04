import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize } from "lodash-es";
import { IconLinkExternal, IconSize, Tooltip } from "hds-react";
import type { AllocatedSectionsTableElementFragment } from "@gql/gql-types";
import { convertWeekday } from "common/src/conversion";
import { getApplicantName, truncate } from "@/helpers";
import { getApplicationUrl, getReservationUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { ExternalTableLink, TableLink } from "@/styled";
import styled from "styled-components";
import { gql } from "@apollo/client";
import { formatTimeRange, timeToMinutes } from "common/src/helpers";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  schedules: AllocatedSectionsTableElementFragment[];
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
  link: string;
  accessCodeActiveAlert?: string;
};

function timeSlotMapper(
  t: TFunction,
  slot: AllocatedSectionsTableElementFragment
): ApplicationScheduleView {
  const allocatedReservationUnit = slot.reservationUnitOption.reservationUnit;
  const allocatedReservationUnitName = allocatedReservationUnit.nameFi ?? "-";
  const allocatedUnit = allocatedReservationUnit.unit?.nameFi ?? "-";

  const application =
    slot.reservationUnitOption.applicationSection?.application;
  const applicantName = getApplicantName(application);

  // TODO should this check the state directly?
  const isAllocated = !slot.reservationUnitOption.rejected;

  const day = convertWeekday(slot.dayOfTheWeek);
  const timeRange = formatTimeRange(
    timeToMinutes(slot.beginTime),
    timeToMinutes(slot.endTime)
  );
  const timeString = isAllocated ? `${t("dayShort." + day)} ${timeRange}` : "-";
  const name = slot.reservationUnitOption.applicationSection.name;

  const applicationPk = application.pk ?? 0;
  const reservationPk = slot.recurringReservation?.reservations[0]?.pk ?? null;
  const link = getReservationUrl(reservationPk);
  const accessCodeActiveAlert =
    slot.recurringReservation?.shouldHaveActiveAccessCode &&
    !slot.recurringReservation?.isAccessCodeIsActiveCorrect
      ? t("RequestedReservation.accessCodesNotActive")
      : "";
  return {
    key: `${applicationPk}-${slot.pk}`,
    applicationPk,
    pk: slot.reservationUnitOption.applicationSection.pk ?? 0,
    applicantName,
    allocatedReservationUnitName,
    unitName: allocatedUnit,
    time: timeString,
    name,
    link,
    accessCodeActiveAlert,
  };
}

const StyledTooltip = styled(Tooltip)`
  position: absolute;
  left: calc(var(--spacing-l) * -1);
  top: 0;
`;

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
      <ExternalTableLink to={getApplicationUrl(applicationPk, pk)}>
        {truncate(applicantName ?? "-", applicantTruncateLen)}
        <IconLinkExternal size={IconSize.ExtraSmall} aria-hidden="true" />
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
    transform: ({
      allocatedReservationUnitName,
      accessCodeActiveAlert,
    }: ApplicationScheduleView) => {
      return (
        <span style={{ position: "relative" }}>
          {truncate(allocatedReservationUnitName ?? "-", unitsTruncateLen)}
          {accessCodeActiveAlert !== "" && (
            <StyledTooltip>{accessCodeActiveAlert}</StyledTooltip>
          )}
        </span>
      );
    },
  },
  {
    headerTKey: "ApplicationEventSchedules.headings.time",
    isSortable: true,
    key: "allocated_time_of_week",
    transform: ({ time, link }: ApplicationScheduleView) => {
      if (link !== "") {
        return <TableLink to={link}>{time}</TableLink>;
      }
      return <span>{time}</span>;
    },
  },
];

const getColConfig = (t: TFunction) =>
  COLS.map(({ headerTKey, ...col }) => ({
    ...col,
    headerName: t(headerTKey),
  }));
export const SORT_KEYS = COLS.filter((c) => c.isSortable).map((c) => c.key);

export function AllocatedSectionsTable({
  sort,
  sortChanged: onSortChanged,
  schedules,
  isLoading,
}: Readonly<Props>): JSX.Element {
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

export const ALLOCATED_SECTIONS_TABLE_ELEMENT_FRAGMENT = gql`
  fragment AllocatedSectionsTableElement on AllocatedTimeSlotNode {
    id
    pk
    dayOfTheWeek
    endTime
    beginTime
    recurringReservation {
      id
      pk
      shouldHaveActiveAccessCode
      isAccessCodeIsActiveCorrect
      reservations {
        id
        pk
      }
    }
    reservationUnitOption {
      id
      rejected
      locked
      preferredOrder
      applicationSection {
        id
        pk
        name
        reservationsEndDate
        reservationsBeginDate
        reservationMinDuration
        reservationMaxDuration
        application {
          pk
          id
          ...ApplicationName
        }
      }
      reservationUnit {
        id
        nameFi
        unit {
          id
          nameFi
        }
      }
    }
  }
`;
