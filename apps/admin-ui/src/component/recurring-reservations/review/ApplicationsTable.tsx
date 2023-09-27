import React from "react";
import { useTranslation } from "react-i18next";
import { memoize, orderBy, trim, uniqBy } from "lodash";
import styled from "styled-components";
import { TFunction } from "i18next";
import { IconLinkExternal } from "hds-react";
import { formatters as getFormatters } from "common";
import { ApplicationType } from "common/types/gql-types";
import { publicUrl } from "@/common/const";
import { applicationDetailsUrl } from "@/common/urls";
import { formatNumber } from "@/common/util";
import { truncate } from "@/helpers";
import {
  applicationStatusFromGqlToRest,
  applicantName as getApplicantName,
} from "@/component/applications/util";
import { ApplicationStatus } from "@/common/types";
import StatusCell from "@/component/StatusCell";
import { CustomTable, ExternalTableLink } from "../../lists/components";

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
  status: ApplicationStatus;
  statusView: JSX.Element;
  statusType: ApplicationStatus;
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

const StyledStatusCell = styled(StatusCell)`
  gap: 0 !important;
  > div {
    gap: 0 !important;
  }
`;

const formatters = getFormatters("fi");

const appMapper = (app: ApplicationType, t: TFunction): ApplicationView => {
  /*
  let applicationStatusView: ApplicationRoundStatus;
  switch (round.status) {
    case ApplicationRoundStatus.
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }
  */

  // const unitMap = applicationEvents?.flatMap((ae) => ae?.eventReservationUnits?.map((eru) => eru?.reservationUnit?.unit)) ?? []
  // const units = unitMap.filter((u): u is NonNullable<typeof u> => u != null)
  const applicationEvents = (app.applicationEvents || [])
    .flatMap((ae) => ae?.eventReservationUnits)
    .flatMap((eru) => ({
      ...eru?.reservationUnit?.unit,
      priority: eru?.priority ?? 0,
    }));
  const units = orderBy(uniqBy(applicationEvents, "pk"), "priority", "asc").map(
    (u) => ({ pk: u.pk ?? 0, name: u.nameFi ?? "-" })
  );

  const name = app.applicationEvents?.find(() => true)?.name || "-";
  const firstEvent = app.applicationEvents?.find(() => true);
  const eventPk = firstEvent?.pk ?? 0;

  const status = applicationStatusFromGqlToRest(app.status ?? undefined);

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
    statusView: (
      <StyledStatusCell
        status={status}
        text={`Application.statuses.${status}`}
        type="application"
        withArrow={false}
      />
    ),
    statusType: app.status as ApplicationStatus,
    applicationCount: trim(
      `${formatNumber(
        app.aggregatedData?.appliedReservationsTotal,
        ""
      )} / ${formatters.oneDecimal.format(
        Number(app.aggregatedData?.appliedMinDurationTotal) / 3600
      )} t`,
      " / "
    ),
  };
};

type ApplicationsTableProps = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  applications: ApplicationType[];
};

const ApplicationsTable = ({
  sort,
  sortChanged: onSortChanged,
  applications,
}: ApplicationsTableProps): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();
  const views = applications.map((app) => appMapper(app, t));

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

export default ApplicationsTable;
