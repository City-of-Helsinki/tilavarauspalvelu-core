import React from "react";
import { useTranslation } from "react-i18next";
import { memoize, orderBy, uniqBy } from "lodash";
import { TFunction } from "i18next";
import { IconLinkExternal } from "hds-react";
import type {
  ApplicationNode,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import { publicUrl } from "@/common/const";
import { applicationDetailsUrl } from "@/common/urls";
import { truncate } from "@/helpers";
import { getApplicantName } from "@/component/applications/util";
import { CustomTable, ExternalTableLink } from "@/component/lists/components";
import { ApplicationStatusCell } from "./StatusCell";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

export type Sort = {
  field: string;
  sort: boolean;
};

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
  type: string;
  units: UnitType[];
  applicationCount: string;
  status?: ApplicationStatusChoice;
  statusView: JSX.Element;
  statusType?: ApplicationStatusChoice;
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("Application.headings.id"),
    isSortable: true,
    key: "id",
    transform: ({ pk }: ApplicationView) => String(pk),
  },
  {
    headerName: t("Application.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicantName, pk }: ApplicationView) =>
      pk ? (
        <ExternalTableLink
          href={`${publicUrl}${applicationDetailsUrl(pk)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {truncate(applicantName ?? "-", applicantTruncateLen)}
          <IconLinkExternal size="xs" aria-hidden />
        </ExternalTableLink>
      ) : (
        <span>{truncate(applicantName ?? "-", applicantTruncateLen)}</span>
      ),
  },
  {
    headerName: t("Application.headings.applicantType"),
    key: "type",
  },
  {
    headerName: t("Application.headings.unit"),
    key: "unitsSort",
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
    headerName: t("Application.headings.applicationCount"),
    key: "applicationCountSort",
    transform: ({ applicationCount }: ApplicationView) => applicationCount,
  },
  {
    headerName: t("Application.headings.phase"),
    key: "status",
    transform: ({ statusView }: ApplicationView) => statusView,
  },
];

const appMapper = (app: ApplicationNode, t: TFunction): ApplicationView => {
  const applicationEvents = (app.applicationEvents || [])
    .flatMap((ae) => ae?.eventReservationUnits)
    .flatMap((eru) => ({
      ...eru?.reservationUnit?.unit,
      priority: eru?.preferredOrder ?? 0,
    }));
  const units = orderBy(uniqBy(applicationEvents, "pk"), "priority", "asc").map(
    (u) => ({ pk: u.pk ?? 0, name: u.nameFi ?? "-" })
  );

  const name = app.applicationEvents?.find(() => true)?.name || "-";
  const firstEvent = app.applicationEvents?.find(() => true);
  const eventPk = firstEvent?.pk ?? 0;

  const status = app.status ?? undefined;

  const applicantName = getApplicantName(app);

  return {
    key: `${app.pk}-${eventPk || "-"} `,
    pk: app.pk ?? 0,
    eventPk,
    applicantName,
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "",
    units,
    name,
    status,
    statusView: <ApplicationStatusCell status={status} />,
    statusType: app.status ?? undefined,
    applicationCount: "NA",
  };
};

type ApplicationsTableProps = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  applications: ApplicationNode[];
};

export function ApplicationsTable({
  sort,
  sortChanged: onSortChanged,
  applications,
}: ApplicationsTableProps): JSX.Element {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();
  const rows = applications.map((app) => appMapper(app, t));

  if (rows.length === 0) {
    return <div>{t("ReservationUnits.noFilteredReservationUnits")}</div>;
  }

  return (
    <CustomTable
      setSort={onSortChanged}
      indexKey="pk"
      rows={rows}
      cols={cols}
      initialSortingColumnKey={sort === undefined ? undefined : sort.field}
      initialSortingOrder={
        sort === undefined ? undefined : (sort.sort && "asc") || "desc"
      }
    />
  );
}
