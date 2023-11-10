import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { TFunction } from "i18next";
import { memoize, orderBy, trim, uniqBy } from "lodash";
import { IconLinkExternal } from "hds-react";
import { differenceInWeeks } from "date-fns";
import { fromApiDate } from "common/src/common/util";
import type { ApplicationEventNode } from "common/types/gql-types";
import { formatters as getFormatters } from "common";
import { publicUrl } from "@/common/const";
import { truncate } from "@/helpers";
import { applicationDetailsUrl } from "@/common/urls";
import StatusCell from "@/component/StatusCell";
import { getApplicantName } from "@/component/applications/util";
import { formatNumber } from "@/common/util";
import { CustomTable, ExternalTableLink } from "../../lists/components";

const formatters = getFormatters("fi");

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

const numTurns = (
  startDate: string,
  endDate: string,
  biWeekly: boolean,
  eventsPerWeek: number
): number =>
  (differenceInWeeks(new Date(endDate), new Date(startDate)) /
    (biWeekly ? 2 : 1)) *
  eventsPerWeek;

const appEventHours = (
  startDate: string,
  endDate: string,
  biWeekly: boolean,
  eventsPerWeek: number,
  minDuration: number
): number => {
  const turns = numTurns(startDate, endDate, biWeekly, eventsPerWeek);
  return (turns * minDuration) / 3600;
};

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  applicationEvents: ApplicationEventNode[];
};

type UnitType = {
  pk: number;
  name: string;
};
type ApplicationEventView = {
  applicationPk?: number;
  pk?: number;
  applicantName?: string;
  name: string;
  units: UnitType[];
  statusView: JSX.Element;
  applicationCount: string;
};

const StyledStatusCell = styled(StatusCell)`
  gap: 0 !important;
  > div {
    gap: 0 !important;
  }
`;

const appEventMapper = (
  appEvent: ApplicationEventNode
): ApplicationEventView => {
  const resUnits = appEvent.eventReservationUnits?.flatMap((eru) => ({
    ...eru?.reservationUnit?.unit,
    priority: eru?.preferredOrder ?? 0,
  }));
  const units = orderBy(uniqBy(resUnits, "pk"), "priority", "asc")
    .map((unit) => ({
      pk: unit.pk ?? 0,
      name: unit.nameFi,
    }))
    .filter((unit): unit is UnitType => !!unit.pk && !!unit.name);

  const status = appEvent.status ?? undefined;
  const name = appEvent.name || "-";

  const applicantName = getApplicantName(appEvent.application);

  const turns =
    appEvent.begin && appEvent.end
      ? numTurns(
          appEvent.begin,
          appEvent.end,
          appEvent.biweekly,
          appEvent.eventsPerWeek ?? 0
        )
      : 0;

  const totalHours =
    appEvent.begin && appEvent.end
      ? appEventHours(
          fromApiDate(appEvent.begin).toISOString(),
          fromApiDate(appEvent.end).toISOString(),
          appEvent.biweekly,
          appEvent.eventsPerWeek ?? 0,
          appEvent.minDuration ?? 0
        )
      : 0;

  return {
    applicationPk: appEvent.application.pk ?? undefined,
    pk: appEvent.pk ?? undefined,
    applicantName,
    units,
    name,
    applicationCount: trim(
      `${formatNumber(turns, "")} / ${formatters.oneDecimal.format(
        totalHours
      )} t`,
      " / "
    ),
    statusView: (
      <StyledStatusCell
        status={status}
        text={`Application.statuses.${status}`}
        type="applicationEvent"
        withArrow={false}
      />
    ),
  };
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ApplicationEvent.headings.id"),
    isSortable: true,
    key: "pk",
    transform: ({ pk }: ApplicationEventView) => String(pk),
  },
  {
    headerName: t("ApplicationEvent.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicantName, applicationPk, pk }: ApplicationEventView) => (
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
    headerName: t("ApplicationEvent.headings.name"),
    key: "name",
  },
  {
    headerName: t("ApplicationEvent.headings.unit"),
    key: "units",
    transform: ({ units }: ApplicationEventView) => {
      const allUnits = units.map((u) => u.name).join(", ");

      return (
        <span title={allUnits}>
          {truncate(
            units
              .filter((_u, i) => i < 2)
              .map((u) => u.name)
              .join(", "),
            unitsTruncateLen
          )}
        </span>
      );
    },
  },
  {
    headerName: t("ApplicationEvent.headings.stats"),
    key: "applicationCount",
    transform: ({ applicationCount }: ApplicationEventView) => applicationCount,
  },
  {
    headerName: t("ApplicationEvent.headings.phase"),
    key: "status",
    transform: ({ statusView }: ApplicationEventView) => statusView,
  },
];

const ApplicationEventsTable = ({
  sort,
  sortChanged: onSortChanged,
  applicationEvents,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const views = applicationEvents.map((ae) => appEventMapper(ae));

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
};

export default ApplicationEventsTable;
