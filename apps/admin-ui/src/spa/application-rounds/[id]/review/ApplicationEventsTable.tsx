import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize, orderBy, uniqBy } from "lodash";
import {
  IconArrowBottomRight,
  IconCheck,
  IconCogwheel,
  IconCross,
  IconLinkExternal,
  IconQuestionCircle,
} from "hds-react";
import {
  ApplicationSectionsQuery,
  ApplicationSectionStatusChoice,
} from "@gql/gql-types";
import { MAX_APPLICATION_ROUND_NAME_LENGTH } from "@/common/const";
import { getApplicantName, truncate } from "@/helpers";
import { getApplicationUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import {
  calculateAppliedReservationTime,
  formatAppliedReservationTime,
} from "./utils";
import { ExternalTableLink } from "@/styles/util";
import type { StatusLabelType } from "common/src/tags";
import StatusLabel from "common/src/components/StatusLabel";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type QueryDate = NonNullable<ApplicationSectionsQuery["applicationSections"]>;
type Edge = NonNullable<QueryDate["edges"]>[0];
type Node = NonNullable<NonNullable<Edge>["node"]>;
type Props = {
  sort: string | null;
  sortChanged: (field: string) => void;
  applicationSections: Node[];
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
  status?: ApplicationSectionStatusChoice;
  applicationCount: string;
};

function appEventMapper(appEvent: Node): ApplicationEventView {
  // TODO why is this modified?
  const resUnits = appEvent.reservationUnitOptions?.flatMap((eru) => ({
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
  const time = calculateAppliedReservationTime(appEvent);
  const applicationCount = formatAppliedReservationTime(time);

  return {
    applicationPk: appEvent.application.pk ?? undefined,
    pk: appEvent.pk ?? undefined,
    applicantName,
    units,
    nameFi: name,
    applicationCount,
    status,
  };
}

const getStatusProps = (
  status?: ApplicationSectionStatusChoice
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (status) {
    case ApplicationSectionStatusChoice.Unallocated:
      return {
        type: "alert",
        icon: <IconArrowBottomRight aria-hidden="true" />,
      };
    case ApplicationSectionStatusChoice.InAllocation:
      return { type: "info", icon: <IconCogwheel aria-hidden="true" /> };
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck aria-hidden="true" /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross aria-hidden="true" /> };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle aria-hidden="true" />,
      };
  }
};

export const SORT_KEYS = [
  "application_id,pk",
  "applicant",
  "nameFi",
  "preferredUnitNameFi",
  "status",
];

const getColConfig = (t: TFunction) =>
  [
    {
      headerTKey: "ApplicationEvent.headings.id",
      key: "application_id,pk",
      transform: ({ pk, applicationPk }: ApplicationEventView) =>
        `${applicationPk}-${pk}`,
    },
    {
      headerTKey: "ApplicationEvent.headings.customer",
      key: "applicant",
      transform: ({
        applicantName,
        applicationPk,
        pk,
      }: ApplicationEventView) => (
        <ExternalTableLink to={getApplicationUrl(applicationPk, pk)}>
          {truncate(applicantName ?? "-", applicantTruncateLen)}
          <IconLinkExternal size="xs" aria-hidden />
        </ExternalTableLink>
      ),
    },
    {
      headerTKey: "ApplicationEvent.headings.name",
      key: "nameFi",
      transform: ({ nameFi }: ApplicationEventView) =>
        truncate(nameFi, MAX_APPLICATION_ROUND_NAME_LENGTH),
    },
    {
      headerTKey: "ApplicationEvent.headings.unit",
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
      transform: ({ applicationCount }: ApplicationEventView) =>
        applicationCount,
    },
    {
      headerTKey: "ApplicationEvent.headings.phase",
      key: "status",
      transform: ({ status }: { status: ApplicationSectionStatusChoice }) => {
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

export function ApplicationEventsTable({
  sort,
  sortChanged: onSortChanged,
  applicationSections,
  isLoading,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const views = applicationSections.map((ae) => appEventMapper(ae));

  const cols = memoize(() => getColConfig(t))();

  if (views.length === 0) {
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
      rows={views}
      cols={cols}
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}
