import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import trim from "lodash/trim";
import get from "lodash/get";
import { Notification } from "hds-react";
import { TFunction } from "i18next";
import {
  getAllocationResults,
  getApplication,
  getApplicationRound,
} from "../../common/api";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import { BasicLink, breakpoints, InlineRowLink } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import ApplicationRoundStatusBlock from "./ApplicationRoundStatusBlock";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import DataTable, { CellConfig } from "../DataTable";
import RecommendationCount from "./RecommendationCount";
import StatusCell from "../StatusCell";
import SelectionActionBar from "../SelectionActionBar";
import {
  formatNumber,
  getNormalizedApplicationEventStatus,
  parseAgeGroups,
  parseDuration,
} from "../../common/util";
import {
  modifyAllocationResults,
  processAllocationResult,
} from "../../common/AllocationResult";

interface IRouteParams {
  applicationRoundId: string;
  organisationId?: string;
  applicantId?: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-2-xl);
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
  applicationRound: ApplicationRoundType
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
        key: "applicationAggregatedData.appliedReservationsTotal",
        transform: ({ applicationAggregatedData }: AllocationResult) => (
          <>
            {trim(
              `${formatNumber(
                applicationAggregatedData?.appliedReservationsTotal,
                t("common.volumeUnit")
              )} / ${parseDuration(
                applicationAggregatedData?.appliedMinDurationTotal
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
          allocatedReservationUnitId,
          unitName,
          allocatedReservationUnitName,
        }: AllocationResult) => {
          return (
            <InlineRowLink
              to={`/applicationRound/${applicationRound.id}/reservationUnit/${allocatedReservationUnitId}`}
            >
              {unitName}, {allocatedReservationUnitName}
            </InlineRowLink>
          );
        },
      },
      {
        title: "Recommendation.headings.status",
        key: "applicationEvent.status",
        transform: ({ applicationEvent }: AllocationResult) => {
          const normalizedStatus = getNormalizedApplicationEventStatus(
            applicationEvent.status
          );
          return (
            <StatusCell
              status={normalizedStatus}
              text={`Recommendation.statuses.${normalizedStatus}`}
              type="applicationEvent"
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
  recommendations: AllocationResult[]
): DataFilterConfig[] => {
  const purposes = uniq(
    recommendations.map((rec: AllocationResult) => rec.applicationEvent.purpose)
  ).sort();
  const statuses = uniq(
    recommendations.map((rec: AllocationResult) => rec.applicationEvent.status)
  );
  const reservationUnits = uniq(
    recommendations.map((rec: AllocationResult) => rec.unitName)
  ).sort();
  const baskets = uniqBy(
    recommendations,
    (rec: AllocationResult) => rec.basketName
  )
    .filter((rec: AllocationResult) => rec.basketName)
    .map((rec: AllocationResult) => ({
      title: `${rec.basketOrderNumber}. ${rec.basketName}`,
      value: rec.basketName,
    }));

  return [
    {
      title: "Recommendation.headings.reservationUnit",
      filters: reservationUnits.map((value) => ({
        title: value,
        key: "unitName",
        value: value || "",
      })),
    },
    {
      title: "Recommendation.headings.purpose",
      filters: purposes.map((value) => ({
        title: value,
        key: "applicationEvent.purpose",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedApplicationEventStatus(status);
        return {
          title: `Recommendation.statuses.${normalizedStatus}`,
          key: "applicationEvent.status",
          value: status,
        };
      }),
    },
    {
      title: "Recommendation.headings.basket",
      filters: baskets.map(({ title, value }) => ({
        title,
        key: "basketName",
        value: value || "",
      })),
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
  const {
    applicationRoundId,
    organisationId,
    applicantId,
  } = useParams<IRouteParams>();

  const viewType = organisationId ? "organisation" : "individual";

  const viewIndex = organisationId
    ? Number(organisationId)
    : Number(applicantId);

  const fetchRecommendations = async (
    ar: ApplicationRoundType,
    type: string,
    index: number
  ) => {
    try {
      const result = await getAllocationResults({
        applicationRoundId: ar.id,
        serviceSectorId: ar.serviceSectorId,
        applicant: type === "individual" ? index : undefined,
      });

      const processedResult =
        type === "organisation"
          ? processAllocationResult(result).filter(
              (n) => n.organisationId === index
            )
          : processAllocationResult(result);

      setFilterConfig(getFilterConfig(processedResult));
      setCellConfig(getCellConfig(t, ar));
      setRecommendations(processedResult || []);
      if (result.length < 1) setIsLoading(false);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplications");
      setIsLoading(false);
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
    if (typeof applicationRound?.id === "number") {
      fetchRecommendations(applicationRound, viewType, viewIndex);
    }
  }, [applicationRound, viewIndex, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchApplication = async (id: number) => {
      try {
        const result = await getApplication(id);
        setApplication(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
        setIsLoading(false);
      }
    };

    const aId =
      viewType === "organisation"
        ? get(recommendations, "[0].applicationId")
        : get(
            recommendations.filter(
              (n: AllocationResult) => n.applicantType === "individual"
            ),
            "0.applicationId"
          );
    if (aId) {
      fetchApplication(aId);
    }
  }, [recommendations, viewType]);

  useEffect(() => {
    setIsLoading(false);
  }, [application, recommendations]);

  const applicantName =
    viewType === "organisation"
      ? get(recommendations, "[0].organisationName")
      : get(recommendations, "[0].applicantName");

  const unhandledRecommendationCount = recommendations.filter((n) =>
    ["created", "allocating", "allocated"].includes(n.applicationEvent.status)
  ).length;

  if (isLoading) {
    return <Loader />;
  }

  const isApplicationRoundApproved =
    applicationRound && ["approved"].includes(applicationRound.status);

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
                  applicationRound={applicationRound}
                />
              </div>
              <div>
                {application && (
                  <ApplicantBox
                    application={application}
                    type={applicantId && "individual"}
                  />
                )}
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
              selection: !isApplicationRoundApproved,
              handledStatuses: isApplicationRoundApproved
                ? []
                : ["ignored", "validated", "handled"],
            }}
            cellConfig={cellConfig}
            filterConfig={filterConfig}
            areAllRowsDisabled={recommendations.every(
              (row) =>
                row.applicationEvent.status === "ignored" ||
                row.accepted ||
                row.declined
            )}
            isRowDisabled={(row: AllocationResult) => {
              return (
                ["ignored", "declined"].includes(row.applicationEvent.status) ||
                row.accepted
              );
            }}
            statusField="applicationEvent.status"
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
                  label: t("Recommendation.actionMassIgnoreReservationUnit"),
                  value: "ignore",
                },
              ]}
              callback={(action: string) => {
                setIsSaving(true);
                setErrorMsg(null);
                modifyAllocationResults({
                  data: recommendations,
                  selections,
                  action,
                  setErrorMsg,
                  callback: () => {
                    setTimeout(() => setIsSaving(false), 1000);
                    fetchRecommendations(applicationRound, viewType, viewIndex);
                  },
                });
              }}
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
