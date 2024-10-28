import React from "react";
import { useTranslation } from "react-i18next";
import { memoize, orderBy, uniqBy } from "lodash";
import type { TFunction } from "i18next";
import {
  IconArrowTopRight,
  IconCheck,
  IconClock,
  IconCogwheel,
  IconEnvelope,
  IconLinkExternal,
  IconQuestionCircle,
} from "hds-react";
import { ApplicationsQuery, ApplicationStatusChoice } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { getApplicantName, truncate } from "@/helpers";
import { CustomTable } from "@/component/Table";
import {
  calculateAppliedReservationTime,
  formatAppliedReservationTime,
} from "./utils";
import { getApplicationUrl } from "@/common/urls";
import { ExternalTableLink } from "@/styles/util";
import type { StatusLabelType } from "common/src/tags";
import StatusLabel from "common/src/components/StatusLabel";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type QueryData = NonNullable<ApplicationsQuery["applications"]>;
type Edge = NonNullable<QueryData["edges"]>[0];
type Node = NonNullable<NonNullable<Edge>["node"]>;
type UnitType = {
  pk: number;
  name: string;
};
type ApplicationView = {
  pk: number;
  eventPk: number;
  key: string;
  applicantName?: string;
  name: string;
  applicantType: string;
  units: UnitType[];
  applicationCount: string;
  status?: ApplicationStatusChoice;
};

const getStatusProps = (
  status?: ApplicationStatusChoice
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (status) {
    case ApplicationStatusChoice.Draft:
      return { type: "draft", icon: <IconArrowTopRight aria-hidden /> };
    case ApplicationStatusChoice.InAllocation:
      return { type: "alert", icon: <IconClock aria-hidden /> };
    case ApplicationStatusChoice.Received:
      return { type: "info", icon: <IconCogwheel aria-hidden /> };
    case ApplicationStatusChoice.Handled:
      return { type: "success", icon: <IconCheck aria-hidden /> };
    case ApplicationStatusChoice.ResultsSent:
      return { type: "success", icon: <IconEnvelope aria-hidden /> };
    default:
      return { type: "neutral", icon: <IconQuestionCircle aria-hidden /> };
  }
};

export const SORT_KEYS = [
  "pk",
  "applicant",
  "applicantType",
  "preferredUnitNameFi",
  "application_status",
];

const getColConfig = (t: TFunction) =>
  [
    {
      headerTKey: "Application.headings.id",
      key: "pk",
      transform: ({ pk }: ApplicationView) => String(pk),
    },
    {
      headerTKey: "Application.headings.customer",
      key: "applicant",
      transform: ({ applicantName, pk }: ApplicationView) => (
        <ExternalTableLink to={getApplicationUrl(pk)}>
          {truncate(applicantName ?? "-", applicantTruncateLen)}
          <IconLinkExternal size="xs" aria-hidden />
        </ExternalTableLink>
      ),
    },
    {
      headerTKey: "Application.applicantType",
      key: "applicantType",
    },
    {
      headerTKey: "Application.headings.unit",
      key: "preferredUnitNameFi",
      transform: ({ units }: ApplicationView) => {
        const allUnits = units.map((u) => u.name).join(", ");

        return (
          <span title={allUnits}>
            {truncate(
              units
                .filter((_, i) => i < 2)
                .map((u) => u.name)
                .join(", "),
              unitsTruncateLen
            )}
          </span>
        );
      },
    },
    {
      headerTKey: "Application.headings.applicationCount",
      key: "applicationCountSort",
      transform: ({ applicationCount }: ApplicationView) => applicationCount,
    },
    {
      headerTKey: "Application.headings.phase",
      key: "application_status",
      transform: ({ status }: { status: ApplicationStatusChoice }) => {
        const statusProps = getStatusProps(status);
        return (
          <StatusLabel type={statusProps.type} icon={statusProps.icon} slim>
            {t(`Application.statuses.${status}`)}
          </StatusLabel>
        );
      },
    },
  ].map(({ headerTKey, key, ...col }) => ({
    ...col,
    key,
    headerName: t(headerTKey),
    isSortable: SORT_KEYS.includes(key) ?? undefined,
  }));

function appMapper(app: Node, t: TFunction): ApplicationView {
  const applicationEvents = (app.applicationSections || [])
    .flatMap((ae) => ae?.reservationUnitOptions)
    .flatMap((eru) => ({
      ...eru?.reservationUnit?.unit,
      priority: eru?.preferredOrder ?? 0,
    }));
  const units = orderBy(uniqBy(applicationEvents, "pk"), "priority", "asc").map(
    (u) => ({ pk: u.pk ?? 0, name: u.nameFi ?? "-" })
  );

  const name = app.applicationSections?.find(() => true)?.name || "-";
  const firstEvent = app.applicationSections?.find(() => true);
  const eventPk = firstEvent?.pk ?? 0;
  const status = app.status ?? undefined;
  const applicantName = getApplicantName(app);
  const applicantType =
    app.applicantType != null
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "-";

  const time = filterNonNullable(
    app.applicationSections?.map((ae) => calculateAppliedReservationTime(ae))
  ).reduce<{ count: number; hours: number }>(
    (acc, { count, hours }) => ({
      count: acc.count + count,
      hours: acc.hours + hours,
    }),
    { count: 0, hours: 0 }
  );
  const applicationCount = formatAppliedReservationTime(time);

  return {
    key: `${app.pk}-${eventPk || "-"} `,
    pk: app.pk ?? 0,
    eventPk,
    applicantName,
    applicantType,
    units,
    name,
    status,
    applicationCount,
  };
}

type ApplicationsTableProps = {
  sort: string | null;
  sortChanged: (field: string) => void;
  applications: Node[];
  isLoading?: boolean;
};

export function ApplicationsTable({
  sort,
  sortChanged: onSortChanged,
  applications,
  isLoading,
}: ApplicationsTableProps): JSX.Element {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();
  const rows = applications.map((app) => appMapper(app, t));

  if (rows.length === 0) {
    const name = t("Application.emptyFilterPageName");
    return <div>{t("common.noFilteredResults", { name })}</div>;
  }

  const sortField = sort?.replace(/-/, "") ?? "";
  const sortDirection = sort?.startsWith("-") ? "desc" : "asc";
  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      isLoading={isLoading}
      rows={rows}
      cols={cols}
      // TODO refactor maybe so we can use a string, -field for desc, field for asc
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}
