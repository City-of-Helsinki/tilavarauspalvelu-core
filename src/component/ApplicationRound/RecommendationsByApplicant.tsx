import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import get from "lodash/get";
import { Notification } from "hds-react";
import { TFunction } from "i18next";
import {
  getAllocationResults,
  getApplication,
  getApplicationRound,
  setApplicationEventStatuses,
} from "../../common/api";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
  ApplicationEvent,
  ApplicationEventStatus,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import { BasicLink, breakpoints, Strong } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import ApplicationRoundStatusBlock from "./ApplicationRoundStatusBlock";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import DataTable, { CellConfig } from "../DataTable";
import RecommendationCount from "./RecommendationCount";
import {
  formatNumber,
  getNormalizedRecommendationStatus,
  parseAgeGroups,
  parseDuration,
} from "../../common/util";
import StatusCell from "../StatusCell";
import SelectionActionBar from "../SelectionActionBar";

interface IRouteParams {
  applicationRoundId: string;
  applicantId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Top = styled.div`
  & > div {
    &:nth-of-type(even) {
      padding-right: var(--spacing-3-xl);
    }
  }

  display: grid;

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        max-width: 400px;
        justify-self: right;
      }
    }

    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-l);
  }
`;

const LinkToOthers = styled(BasicLink)`
  text-decoration: none;
  display: block;
  margin-bottom: var(--spacing-xs);
`;

const Heading = styled(H1)`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledApplicationRoundStatusBlock = styled(ApplicationRoundStatusBlock)`
  margin-top: var(--spacing-xl);
`;

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType | null
): CellConfig => {
  return {
    cols: [
      {
        title: "Recommendation.headings.applicationEventName",
        key: "applicationEvent.name",
      },
      {
        title: "ApplicationRound.basket",
        key: "basketOrderNumber",
        transform: ({ basketName, basketOrderNumber }) => (
          <>{trim(`${basketOrderNumber || ""}. ${basketName || ""}`, ". ")}</>
        ),
      },
      {
        title: "Application.headings.purpose",
        key: "applicationEvent.purpose",
      },
      {
        title: "Application.headings.ageGroup",
        key: "applicationEvent.ageGroupDisplay.minimum",
        transform: ({ applicationEvent }: AllocationResult) => (
          <>{parseAgeGroups(applicationEvent.ageGroupDisplay)}</>
        ),
      },
      {
        title: "Recommendation.headings.recommendationCount",
        key: "applicationAggregatedData.reservationsTotal",
        transform: ({ applicationAggregatedData }: AllocationResult) => (
          <>
            {trim(
              `${formatNumber(
                applicationAggregatedData?.reservationsTotal,
                t("common.volumeUnit")
              )} / ${parseDuration(
                applicationAggregatedData?.minDurationTotal
              )}`,
              " / "
            )}
          </>
        ),
      },
      {
        title: "Recommendation.headings.spaceName",
        key: "unitName",
        transform: ({
          unitName,
          allocatedReservationUnitName,
        }: AllocationResult) => {
          return (
            <Strong>
              {unitName}, {allocatedReservationUnitName}
            </Strong>
          );
        },
      },
      {
        title: "Recommendation.headings.status",
        key: "applicationEvent.status",
        transform: ({ applicationEvent }: AllocationResult) => {
          const normalizedStatus = getNormalizedRecommendationStatus(
            applicationEvent.status
          );
          return (
            <StatusCell
              status={normalizedStatus}
              text={`Recommendation.statuses.${normalizedStatus}`}
            />
          );
        },
      },
    ],
    index: "applicationEventScheduleId",
    sorting: "organisation.name",
    order: "asc",
    rowLink: ({ applicationEventScheduleId }: AllocationResult) => {
      return applicationEventScheduleId && applicationRound
        ? `/applicationRound/${applicationRound.id}/recommendation/${applicationEventScheduleId}`
        : "/foobar";
    },
    groupLink: ({ space }) =>
      applicationRound
        ? `/applicationRound/${applicationRound.id}/space/${space?.id}`
        : "",
  };
};

const getFilterConfig = (
  recommendations: ApplicationEvent[]
): DataFilterConfig[] => {
  const purposes = uniq(recommendations.map((app) => app.purpose));
  const statuses = uniq(recommendations.map((app) => app.status));

  return [
    {
      title: "Application.headings.purpose",
      filters: purposes.map((value) => ({
        title: value,
        key: "applicationEvent.purpose",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedRecommendationStatus(status);
        return {
          title: `Recommendation.statuses.${normalizedStatus}`,
          key: "applicationEvent.status",
          value: status,
        };
      }),
    },
  ];
};

function RecommendationsByApplicant(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AllocationResult[] | []
  >([]);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [selections, setSelections] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { applicationRoundId, applicantId } = useParams<IRouteParams>();

  const modifyRecommendations = async (action: string) => {
    let status: ApplicationEventStatus;
    switch (action) {
      case "approve":
        status = "approved";
        break;
      case "decline":
        status = "declined";
        break;
      case "ignore":
      default:
    }

    try {
      setIsSaving(true);
      await setApplicationEventStatuses(
        selections.map((selection) => ({
          status,
          applicationEventId: selection,
        }))
      );
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg("errors.errorSavingApplication");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  useEffect(() => {
    const fetchData = async (appRoundId: number) => {
      try {
        const result = await getApplicationRound({
          id: appRoundId,
        });

        setApplicationRound(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
        setIsLoading(false);
      }
    };

    fetchData(Number(applicationRoundId));
  }, [applicationRoundId]);

  useEffect(() => {
    const fetchRecommendations = async (
      ar: ApplicationRoundType,
      apId: number
    ) => {
      try {
        const result = await getAllocationResults({
          applicationRoundId: ar.id,
          serviceSectorId: ar.serviceSectorId,
          applicant: apId,
        });

        setFilterConfig(
          getFilterConfig(result.flatMap((n) => n.applicationEvent))
        );
        setCellConfig(getCellConfig(t, ar));
        setRecommendations(result || []);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendations(applicationRound, Number(applicantId));
    }
  }, [applicationRound, applicantId, t]);

  useEffect(() => {
    const fetchApplication = async (id: number) => {
      try {
        const result = await getApplication(id);
        setApplication(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
      } finally {
        setIsLoading(false);
      }
    };

    const aId = get(recommendations, "[0].applicationId");
    if (aId) {
      fetchApplication(aId);
    }
  }, [recommendations]);

  const applicantName =
    get(recommendations, "[0].organisationName") ||
    get(recommendations, "[0].applicantName");

  const unhandledRecommendationCount = recommendations.filter(
    (n) => n.applicationEvent.status === "created"
  ).length;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/applicationRound/${applicationRoundId}`} />
      </ContentContainer>
      {recommendations && applicationRound && cellConfig && filterConfig && (
        <>
          <IngressContainer style={{ marginBottom: "var(--spacing-l)" }}>
            <Top>
              <div>
                <LinkToOthers
                  to={`/application/${get(
                    recommendations,
                    "[0].applicationId"
                  )}/details`}
                >
                  {t("Recommendation.showOriginalApplication")}
                </LinkToOthers>
                <Heading>{applicantName}</Heading>
                <div>{applicationRound?.name}</div>
                <StyledApplicationRoundStatusBlock
                  status={applicationRound.status}
                />
              </div>
              <div>
                {application && <ApplicantBox application={application} />}
              </div>
            </Top>
            <RecommendationCount
              recommendationCount={recommendations.length}
              unhandledCount={unhandledRecommendationCount}
            />
          </IngressContainer>
          <DataTable
            groups={[{ id: 1, data: recommendations }]}
            setSelections={setSelections}
            hasGrouping={false}
            config={{
              filtering: true,
              rowFilters: true,
              selection: true,
              handledStatuses: ["accepted"],
            }}
            cellConfig={cellConfig}
            filterConfig={filterConfig}
          />
          {selections?.length > 0 && (
            <SelectionActionBar
              selections={selections}
              options={[
                {
                  label: t("Recommendation.actionMassApprove"),
                  value: "approve",
                },
                {
                  label: t("Recommendation.actionMassDecline"),
                  value: "decline",
                },
                {
                  label: t("Recommendation.actionMassIgnoreSpace"),
                  value: "ignore",
                },
              ]}
              callback={(option: string) => modifyRecommendations(option)}
              isSaving={isSaving}
            />
          )}
        </>
      )}
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
}

export default withMainMenu(RecommendationsByApplicant);
