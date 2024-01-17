import React from "react";
import { useTranslation } from "react-i18next";
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
import { getApplicantName } from "@/component/applications/util";
import { formatNumber } from "@/common/util";
import { CustomTable, ExternalTableLink } from "@/component/Table";
import { ApplicationEventStatusCell } from "./StatusCell";

const formatters = getFormatters("fi");

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  applicationEvents: ApplicationEventNode[];
  isLoading?: boolean;
};

type UnitType = {
  pk: number;
  name: string;
};
type ApplicationEventView = {
  applicationPk?: number;
  pk?: number;
  applicantName?: string;
  nameFi: string;
  units: UnitType[];
  statusView: JSX.Element;
  applicationCount: string;
};

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

  const begin = appEvent.begin ? fromApiDate(appEvent.begin) : undefined;
  const end = appEvent.end ? fromApiDate(appEvent.end) : undefined;

  const biW = appEvent.biweekly;
  const evtPerW = appEvent.eventsPerWeek ?? 0;
  const turns =
    begin && end
      ? (differenceInWeeks(end, begin) / (biW ? 2 : 1)) * evtPerW
      : 0;

  const minDuration = appEvent.minDuration ?? 0;
  const totalHours = (turns * minDuration) / 3600;

  return {
    applicationPk: appEvent.application.pk ?? undefined,
    pk: appEvent.pk ?? undefined,
    applicantName,
    units,
    nameFi: name,
    applicationCount: trim(
      `${formatNumber(turns, "")} / ${formatters.oneDecimal.format(
        totalHours
      )} t`,
      " / "
    ),
    statusView: <ApplicationEventStatusCell status={status} />,
  };
};

const COLS = [
  {
    headerTKey: "ApplicationEvent.headings.id",
    isSortable: true,
    key: "application_id,pk",
    transform: ({ pk, applicationPk }: ApplicationEventView) =>
      `${applicationPk}-${pk}`,
  },
  {
    headerTKey: "ApplicationEvent.headings.customer",
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
    headerTKey: "ApplicationEvent.headings.name",
    isSortable: true,
    key: "nameFi",
  },
  {
    headerTKey: "ApplicationEvent.headings.unit",
    isSortable: true,
    key: "preferredUnitNameFi",
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
    headerTKey: "ApplicationEvent.headings.stats",
    key: "applicationCount",
    transform: ({ applicationCount }: ApplicationEventView) => applicationCount,
  },
  {
    headerTKey: "ApplicationEvent.headings.phase",
    isSortable: true,
    key: "status",
    transform: ({ statusView }: ApplicationEventView) => statusView,
  },
];

const getColConfig = (t: TFunction) =>
  COLS.map(({ headerTKey, ...col }) => ({
    ...col,
    headerName: t(headerTKey),
  }));
export const SORT_KEYS = COLS.filter((c) => c.isSortable).map((c) => c.key);

export function ApplicationEventsTable({
  sort,
  sortChanged: onSortChanged,
  applicationEvents,
  isLoading,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const views = applicationEvents.map((ae) => appEventMapper(ae));

  const cols = memoize(() => getColConfig(t))();

  if (views.length === 0) {
    return <div>{t("ReservationUnits.noFilteredReservationUnits")}</div>;
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
