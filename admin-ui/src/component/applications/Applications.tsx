import React, { useEffect, useState } from "react";
import { uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import styled from "styled-components";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { H1, H3 } from "common/src/common/typography";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import LinkPrev from "../LinkPrev";
import withMainMenu from "../withMainMenu";
import { getApplicationRound, getApplications } from "../../common/api";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
  ApplicationStatus,
  ApplicationEventStatus,
  Unit,
} from "../../common/types";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { formatNumber, parseDuration } from "../../common/util";
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
  units: Unit[];
  unitsSort: string;
  applicationCount: string;
  applicationCountSort: number;
  status: ApplicationStatus | ApplicationEventStatus;
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
        title: unit.name.fi,
        function: (application: ApplicationView) =>
          Boolean(application.units.find((u) => u.id === unit.id)),
      })),
    },
  ];
};

const appMapper = (
  round: ApplicationRoundType,
  app: ApplicationType,
  t: TFunction
): ApplicationView => {
  let applicationStatusView: ApplicationRoundStatus;
  switch (round.status) {
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }

  const units = uniqBy(
    app.applicationEvents
      .flatMap((ae) => ae.eventReservationUnits)
      .flatMap((eru) => eru.reservationUnitDetails.unit),
    "id"
  );

  return {
    id: app.id,
    applicant:
      app.applicantType === "individual"
        ? app.applicantName || ""
        : app.organisation?.name || "",
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "",
    unitsSort: units.find(() => true)?.name.fi || "",
    units,
    status: getNormalizedApplicationStatus(app.status, applicationStatusView),
    applicationCount: trim(
      `${formatNumber(
        app.aggregatedData?.appliedReservationsTotal,
        t("common.volumeUnit")
      )} / ${parseDuration(app.aggregatedData?.appliedMinDurationTotal)}`,
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
          units.map((u) => u.name.fi).join(", "),
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

function Applications(): JSX.Element {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [applications, setApplications] = useState<ApplicationView[] | []>([]);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const { applicationRoundId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: Number(applicationRoundId),
        });
        setApplicationRound(result);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        notifyError(t(msg));
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId, notifyError, t]);

  useEffect(() => {
    const fetchApplications = async (ar: ApplicationRoundType) => {
      setIsLoading(true);

      try {
        const result = await getApplications({
          applicationRound: ar.id,
          status: "in_review,review_done,declined,sent",
        });
        const mapped = result.map((app) => appMapper(ar, app, t));
        setCellConfig(getCellConfig(ar));
        setFilterConfig(getFilterConfig(mapped));
        setApplications(mapped);
      } catch (error) {
        notifyError(t("errors.errorFetchingApplications"));
      } finally {
        setIsLoading(false);
      }
    };

    if (applicationRound) {
      fetchApplications(applicationRound);
    }
  }, [applicationRound, notifyError, t]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound && (
        <>
          <ContentContainer>
            <LinkPrev />
          </ContentContainer>
          <IngressContainer>
            <Title>{t("Application.allApplications")}</Title>
            <ApplicationRoundTitle>
              {applicationRound.name}
            </ApplicationRoundTitle>
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
        </>
      )}
    </Wrapper>
  );
}

export default withMainMenu(Applications);
