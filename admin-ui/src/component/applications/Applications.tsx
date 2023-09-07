import React from "react";
import { useQuery as useApolloQuery } from "@apollo/client";
import { uniqBy } from "lodash";
import {
  type Query,
  type QueryApplicationsArgs,
  ApplicationStatus,
  type ApplicationType,
  type UnitType,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import styled from "styled-components";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { H1, H3 } from "common/src/common/typography";
import { useQuery } from "@tanstack/react-query";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import LinkPrev from "../LinkPrev";
import { getApplicationRound } from "../../common/api";
import { APPLICATIONS_BY_APPLICATION_ROUND_QUERY } from "../recurring-reservations/queries";
import {
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus as ApplicationRoundStatusRest,
  DataFilterConfig,
  ApplicationStatus as ApplicationStatusRest,
  ApplicationEventStatus,
} from "../../common/types";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { formatNumber, formatDuration } from "../../common/util";
import StatusCell from "../StatusCell";
import { applicationUrl } from "../../common/urls";
import { getNormalizedApplicationStatus } from "./util";
import { useNotification } from "../../context/NotificationContext";

interface IRouteParams {
  [key: string]: string;
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
`;

const Title = styled(H1).attrs({ $legacy: true })`
  margin: var(--spacing-layout-xl) 0 var(--spacing-2-xs);
`;

const ApplicationRoundTitle = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const ApplicationCount = styled(H3)`
  font-size: var(--fontsize-heading-s);
  text-transform: lowercase;
`;

type ApplicationView = {
  id: number;
  applicant: string;
  type: string;
  units: UnitType[];
  unitsSort: string;
  applicationCount: string;
  applicationCountSort: number;
  status: ApplicationStatusRest | ApplicationEventStatus;
};

const getFilterConfig = (
  applications: ApplicationView[]
): DataFilterConfig[] => {
  const applicantTypes = uniq(applications.map((app) => app.type));
  const statuses = uniq(applications.map((app) => app.status));
  const units = uniqBy(
    applications.flatMap((app) => app.units),
    "id"
  );

  return [
    {
      title: "Application.headings.applicantType",
      filters: applicantTypes
        .filter((n) => n)
        .map((value) => ({
          title: value,
          key: "type",
          value: value || "",
        })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => ({
        title: `Application.statuses.${status}`,
        key: "status",
        value: status,
      })),
    },
    {
      title: "Application.headings.unit",
      filters: units.map((unit) => ({
        key: "unit",
        title: unit.nameFi || "",
        function: (application: ApplicationView) =>
          Boolean(application.units.find((u) => u.id === unit.id)),
      })),
    },
  ];
};

const appMapper = (
  round: ApplicationRoundStatusRest | undefined,
  app: ApplicationType,
  t: TFunction
): ApplicationView => {
  let applicationStatusView: ApplicationRoundStatusRest;
  switch (round) {
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }

  const units = uniqBy(
    app?.applicationEvents
      ?.flatMap((ae) => ae?.eventReservationUnits)
      ?.flatMap((eru) => eru?.reservationUnit?.unit),
    "pk"
  ).filter((u): u is UnitType => u != null);

  return {
    id: app.pk ?? 0,
    applicant:
      app.applicantType ===
      ApplicationsApplicationApplicantTypeChoices.Individual
        ? app.applicantName || ""
        : app.organisation?.name || "",
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "",
    unitsSort: units.find(() => true)?.nameFi || "",
    units,
    // FIXME dangerous coercion: rewrite the normalization function to work on GQL types
    status: getNormalizedApplicationStatus(
      app.status as ApplicationStatusRest,
      applicationStatusView
    ),
    applicationCount: trim(
      `${formatNumber(
        app.aggregatedData?.appliedReservationsTotal,
        t("common.volumeUnit")
      )} / ${formatDuration(app.aggregatedData?.appliedMinDurationTotal)}`,
      " / "
    ),
    applicationCountSort: app.aggregatedData?.appliedReservationsTotal || 0,
  };
};

const getCellConfig = (applicationRound: ApplicationRoundType): CellConfig => {
  let statusTitle: string;
  switch (applicationRound.status) {
    case "approved":
      statusTitle = "Application.headings.resolutionStatus";
      break;
    default:
      statusTitle = "Application.headings.reviewStatus";
  }

  return {
    cols: [
      {
        title: "Application.headings.customer",
        key: "applicant",
      },
      {
        title: "Application.headings.applicantType",
        key: "type",
      },
      {
        title: "Application.headings.unit",
        key: "unitsSort",
        transform: ({ units }: ApplicationView) =>
          units.map((u) => u.nameFi).join(", "),
      },
      {
        title: "Application.headings.applicationCount",
        key: "applicationCountSort",
        transform: ({ applicationCount }: ApplicationView) => applicationCount,
      },
      {
        title: statusTitle,
        key: "status",
        transform: ({ status }: ApplicationView) => {
          return (
            <StatusCell
              status={status}
              text={`Application.statuses.${status}`}
              type="application"
            />
          );
        },
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc",
    rowLink: ({ id }) => applicationUrl(id),
  };
};

function Applications({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element {
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const { data: applicationRound, isLoading: isLoadingRound } = useQuery({
    queryFn: () => getApplicationRound({ id: Number(applicationRoundId) }),
    queryKey: ["applicationRound", { id: Number(applicationRoundId) }],
    enabled: applicationRoundId != null,
    onError: (error: unknown) => {
      const msg =
        (error as AxiosError).response?.status === 404
          ? "errors.applicationRoundNotFound"
          : "errors.errorFetchingData";
      notifyError(t(msg));
    },
  });

  const { loading: isApplicationsLoading, data } = useApolloQuery<
    Query,
    QueryApplicationsArgs
  >(APPLICATIONS_BY_APPLICATION_ROUND_QUERY, {
    skip: !applicationRound?.id,
    variables: {
      applicationRound: String(applicationRound?.id ?? 0),
      status: [
        ApplicationStatus.Allocated,
        ApplicationStatus.Handled,
        ApplicationStatus.InReview,
        ApplicationStatus.ReviewDone,
        ApplicationStatus.Sent,
      ],
    },
    onError: () => {
      notifyError(t("errors.errorFetchingApplications"));
    },
  });

  const status = applicationRound?.status;
  const applications =
    data?.applications?.edges
      ?.map((edge) => edge?.node)
      ?.filter((app): app is ApplicationType => app != null)
      ?.map((app) => appMapper(status, app, t)) ?? [];
  const cellConfig = applicationRound
    ? getCellConfig(applicationRound)
    : undefined;
  const filterConfig = getFilterConfig(applications);

  const isLoading = isLoadingRound || isApplicationsLoading;
  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev />
      </ContentContainer>
      <IngressContainer>
        <Title>{t("Application.allApplications")}</Title>
        <ApplicationRoundTitle>{applicationRound?.name}</ApplicationRoundTitle>
        <ApplicationCount data-testid="application-count">
          {applications.length} {t("common.volumeUnit")}
        </ApplicationCount>
      </IngressContainer>
      {cellConfig && filterConfig && (
        <DataTable
          groups={[{ id: 1, data: applications }]}
          hasGrouping={false}
          config={{
            filtering: true,
            rowFilters: true,
            selection: false,
          }}
          cellConfig={cellConfig}
          filterConfig={filterConfig}
        />
      )}
    </Wrapper>
  );
}

function ApplicationsRouted(): JSX.Element {
  const { applicationRoundId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return <Applications applicationRoundId={Number(applicationRoundId)} />;
}

export default ApplicationsRouted;
