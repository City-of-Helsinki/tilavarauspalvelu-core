import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { memoize, orderBy, uniqBy } from "lodash";
import { IconLinkExternal } from "hds-react";
import type { ApplicationSectionsQuery } from "@gql/gql-types";
import { MAX_APPLICATION_ROUND_NAME_LENGTH, PUBLIC_URL } from "@/common/const";
import { getApplicantName, truncate } from "@/helpers";
import { applicationDetailsUrl } from "@/common/urls";
import { CustomTable, ExternalTableLink } from "@/component/Table";
import { ApplicationSectionStatusCell } from "./StatusCell";
import {
  calculateAppliedReservationTime,
  formatAppliedReservationTime,
} from "./utils";

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
  statusView: JSX.Element;
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
    statusView: <ApplicationSectionStatusCell status={status} />,
  };
}

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
    headerTKey: "ApplicationEvent.headings.name",
    isSortable: true,
    key: "nameFi",
    transform: ({ nameFi }: ApplicationEventView) =>
      truncate(nameFi, MAX_APPLICATION_ROUND_NAME_LENGTH),
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
      disableKey
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
