import React from "react";
import { gql } from "@apollo/client";
import { IconLinkExternal, IconSize } from "hds-react";
import { memoize, orderBy, uniqBy } from "lodash-es";
import type { TFunction } from "next-i18next";
import { useTranslation } from "next-i18next";
import { ApplicationStatusLabel } from "ui/src/components/statuses";
import { filterNonNullable } from "ui/src/modules/helpers";
import { CustomTable } from "@/components/Table";
import { getApplicantName, translateReserveeType, truncate } from "@/modules/helpers";
import { getApplicationUrl } from "@/modules/urls";
import { ExternalTableLink } from "@/styled";
import type { ApplicationsTableElementFragment, ApplicationStatusChoice } from "@gql/gql-types";
import { calculateAppliedReservationTime, formatAppliedReservationTime } from "./utils";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

type UnitType = {
  pk: number;
  name: string;
};
type ApplicationView = {
  pk: number;
  sectionPk: number;
  key: string;
  applicantName?: string;
  name: string;
  applicantType: string;
  units: UnitType[];
  applicationCount: string;
  status: ApplicationStatusChoice | null;
};

export const SORT_KEYS = ["pk", "applicant", "applicantType", "preferredUnitNameFi", "application_status"];

const getColConfig = (t: TFunction) =>
  [
    {
      headerTKey: "application:headings.id",
      key: "pk",
      transform: ({ pk }: ApplicationView) => String(pk),
    },
    {
      headerTKey: "application:headings.customer",
      key: "applicant",
      transform: ({ applicantName, pk }: ApplicationView) => (
        <ExternalTableLink href={getApplicationUrl(pk)}>
          {truncate(applicantName ?? "-", applicantTruncateLen)}
          <IconLinkExternal size={IconSize.ExtraSmall} aria-hidden="true" />
        </ExternalTableLink>
      ),
    },
    {
      headerTKey: "application:applicantType",
      key: "applicantType",
    },
    {
      headerTKey: "application:headings.unit",
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
      headerTKey: "application:headings.applicationCount",
      key: "applicationCountSort",
      transform: ({ applicationCount }: ApplicationView) => applicationCount,
    },
    {
      headerTKey: "application:headings.phase",
      key: "application_status",
      transform: ({ status }: { status: ApplicationStatusChoice }) => (
        <ApplicationStatusLabel status={status} user="admin" slim />
      ),
    },
  ].map(({ headerTKey, key, ...col }) => ({
    ...col,
    key,
    headerName: t(headerTKey),
    isSortable: SORT_KEYS.includes(key) ?? undefined,
  }));

function appMapper(app: ApplicationsTableElementFragment, t: TFunction): ApplicationView {
  const applicationSections = (app.applicationSections ?? [])
    .flatMap((ae) => ae?.reservationUnitOptions)
    .flatMap((eru) => ({
      ...eru?.reservationUnit?.unit,
      priority: eru?.preferredOrder ?? 0,
    }));
  const units = orderBy(uniqBy(applicationSections, "pk"), "priority", "asc")
    .map(({ pk, nameFi }) => ({ pk, name: nameFi }))
    .filter((u): u is UnitType => u.pk != null && u.name != null);

  const name = app.applicationSections?.find(() => true)?.name || "-";
  const firstSection = app.applicationSections?.find(() => true);
  const sectionPk = firstSection?.pk ?? 0;
  const status = app.status;
  const applicantName = getApplicantName(app);
  const applicantType = translateReserveeType(t, app.applicantType, app.organisationIdentifier) || "-";

  const time = filterNonNullable(app.applicationSections?.map((ae) => calculateAppliedReservationTime(ae))).reduce<{
    count: number;
    hours: number;
  }>(
    (acc, { count, hours }) => ({
      count: acc.count + count,
      hours: acc.hours + hours,
    }),
    { count: 0, hours: 0 }
  );
  const applicationCount = formatAppliedReservationTime(time);

  return {
    key: `${app.pk}-${sectionPk || "-"} `,
    pk: app.pk ?? 0,
    sectionPk,
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
  applications: ApplicationsTableElementFragment[];
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
    const name = t("application:emptyFilterPageName");
    return <div>{t("common:noFilteredResults", { name })}</div>;
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
      initialSortingColumnKey={sortField}
      initialSortingOrder={sortDirection}
    />
  );
}

export const APPLICATIONS_TABLE_ELEMENT_FRAGMENT = gql`
  fragment ApplicationsTableElement on ApplicationNode {
    id
    pk
    status
    ...ApplicationName
    organisationIdentifier
    applicationSections {
      id
      pk
      name
      reservationsEndDate
      reservationsBeginDate
      appliedReservationsPerWeek
      reservationMinDuration
      reservationUnitOptions {
        id
        preferredOrder
        reservationUnit {
          id
          unit {
            id
            pk
            nameFi
          }
        }
      }
    }
  }
`;
