import React, { useEffect, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, IconArrowRedo, Notification } from "hds-react";
import { useHistory } from "react-router-dom";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Heading from "../Application/Heading";
import StatusRecommendation from "../Application/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ContentHeading, H3 } from "../../styles/typography";
import KorosHeading from "../KorosHeading";
import StatusCircle from "../StatusCircle";
import AllocatingDialogContent from "./AllocatingDialogContent";
import DataTable, { CellConfig } from "../DataTable";
import {
  formatNumber,
  getNormalizedApplicationStatus,
  parseDuration,
} from "../../common/util";
import StatusCell from "../StatusCell";

interface IProps {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
`;

const StyledKorosHeading = styled(KorosHeading)`
  margin-bottom: var(--spacing-layout-l);
`;

const TopIngress = styled.div`
  & > div:last-of-type {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: var(--spacing-l);

    ${H3} {
      font-size: var(--fontsize-heading-s);
      margin-left: var(--spacing-m);
      width: 50px;
      line-height: var(--lineheight-m);
    }
  }

  display: grid;
  padding-right: var(--spacing-m);

  ${ContentHeading} {
    width: 100%;
    padding: 0;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1.8fr 1fr;
    grid-gap: var(--spacing-layout-m);
  }
`;

const Recommendation = styled.div`
  margin: var(--spacing-m) 0 0 0;
`;

const RecommendationLabel = styled.label`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: 1.375rem;
  font-weight: bold;
`;

const RecommendationValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: var(--spacing-3-xs);
`;

const ActionContainer = styled.div`
  button {
    margin-top: var(--spacing-s);
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;
  margin-top: var(--spacing-s);

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFilterConfig = (recommendations: any[]): DataFilterConfig[] => {
  const purposes = uniq(recommendations.map((app) => app.purpose));
  const statuses = uniq(recommendations.map((app) => app.status));

  return [
    {
      title: "Application.headings.purpose",
      filters: purposes.map((value) => ({
        title: value,
        key: "purpose",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedApplicationStatus(
          status,
          "handling"
        );
        return {
          title: `Application.statuses.${normalizedStatus}`,
          key: "status",
          value: status,
        };
      }),
    },
  ];
};

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType | null
): CellConfig => {
  return {
    cols: [
      { title: "Application.headings.applicantName", key: "organisation.name" },
      {
        title: "Application.headings.purpose",
        key: "purpose",
      },
      {
        title: "Application.headings.ageGroup",
        key: "ageGroup",
      },
      {
        title: "Recommendation.headings.recommendationCount",
        key: "aggregatedData.reservationsTotal",
        transform: ({ aggregatedData }: ApplicationType) => (
          <>
            {trim(
              `${formatNumber(
                aggregatedData?.reservationsTotal,
                t("common.volumeUnit")
              )} / ${parseDuration(aggregatedData?.minDurationTotal)}`,
              " / "
            )}
          </>
        ),
      },
      {
        title: "Application.headings.applicationStatus",
        key: "status",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: ({ status }: any) => {
          const normalizedStatus = getNormalizedApplicationStatus(
            status,
            "handling"
          );
          return (
            <StatusCell
              status={normalizedStatus}
              text={`Application.statuses.${normalizedStatus}`}
            />
          );
        },
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc",
    rowLink: ({ id }) =>
      applicationRound
        ? `/applicationRound/${applicationRound.id}/recommendation/${id}`
        : "",
    groupLink: ({ space }) =>
      applicationRound
        ? `/applicationRound/${applicationRound.id}/space/${space.id}`
        : "",
  };
};

function Handling({ applicationRoundId }: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]); // eslint-disable-line
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  const startAllocation = (id: string): void => {
    console.log(id); // eslint-disable-line
    setIsAllocating(true);
  };

  const finishAllocation = (): void => {
    setIsAllocating(false);
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
        setCellConfig(getCellConfig(t, result));
        setIsLoading(false);
      } catch (error) {
        const msg =
          error.response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId, t]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const result = [
          {
            id: 1,
            space: {
              id: 23,
              name: "Suuri sali",
            },
            reservationUnit: {
              name: "Fallkullan tila",
            },
            data: [
              {
                id: 2,
                purpose: "Purpose",
                ageGroup: "4-5",
                status: "review_done",
                organisation: {
                  name: "Org Name",
                  identifier: null,
                  yearEstablished: 1980,
                  activeMembers: 13,
                  coreBusiness: null,
                  address: null,
                },
                aggregatedData: {},
              },
              {
                id: 3,
                purpose: "Purpose #2",
                ageGroup: "2-3",
                status: "review_done",
                organisation: {
                  name: "Org Name #2",
                  identifier: null,
                  yearEstablished: 1980,
                  activeMembers: 13,
                  coreBusiness: null,
                  address: null,
                },
                aggregatedData: {},
              },
            ],
          },
          {
            id: 2,
            space: {
              id: 22,
              name: "Pieni sali",
            },
            reservationUnit: {
              name: "Haltialan tila",
            },
            data: [
              {
                id: 4,
                purpose: "Purpose #3",
                ageGroup: "14-15",
                status: "review_done",
                organisation: {
                  name: "Org Name #3",
                  identifier: null,
                  yearEstablished: 1980,
                  activeMembers: 13,
                  coreBusiness: null,
                  address: null,
                },
                aggregatedData: {},
              },
              {
                id: 13,
                purpose: "Purpose #4",
                ageGroup: "12-13",
                status: "review_done",
                organisation: {
                  name: "Org Name #4",
                  identifier: null,
                  yearEstablished: 1980,
                  activeMembers: 13,
                  coreBusiness: null,
                  address: null,
                },
                aggregatedData: {},
              },
            ],
          },
        ];
        setFilterConfig(getFilterConfig(result.flatMap((n) => n.data)));
        setRecommendations(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendations();
    }
  }, [applicationRound]);

  const unhandledRecommendationCount: number = recommendations
    .flatMap((recommendation) => recommendation.data)
    .map((recommendation) => recommendation.status)
    .filter((status) => ["in_review", "review_done"].includes(status)).length;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      {applicationRound && (
        <>
          <StyledKorosHeading
            heading={`${unhandledRecommendationCount} ${t(
              "common.volumeUnit"
            )}`}
            subheading={t("ApplicationRound.suffixUnhandledSuggestions")}
          />
          <IngressContainer>
            <ApplicationRoundNavi applicationRoundId={applicationRoundId} />
            <TopIngress>
              <div>
                <ContentHeading>{applicationRound.name}</ContentHeading>
                <TimeframeStatus
                  applicationPeriodBegin={
                    applicationRound.applicationPeriodBegin
                  }
                  applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                />
              </div>
              <div>
                <StatusCircle status={0} />
                <H3>{t("ApplicationRound.amountReserved")}</H3>
              </div>
            </TopIngress>
          </IngressContainer>
          <NarrowContainer style={{ marginBottom: "var(--spacing-4-xl)" }}>
            <Recommendation>
              <RecommendationLabel>
                {t("Application.recommendedStage")}:
              </RecommendationLabel>
              <RecommendationValue>
                <StatusRecommendation
                  status="allocated"
                  applicationRound={applicationRound}
                />
              </RecommendationValue>
            </Recommendation>
            <ActionContainer>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  history.push(
                    `/applicationRound/${applicationRoundId}?preapproval`
                  )
                }
              >
                {t("ApplicationRound.navigateToApprovalPreparation")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                onClick={() => startAllocation(applicationRoundId)}
                iconLeft={<IconArrowRedo />}
              >
                {t("ApplicationRound.allocateAction")}
              </Button>
            </ActionContainer>
          </NarrowContainer>
          {cellConfig && (
            <DataTable
              groups={recommendations}
              hasGrouping
              config={{
                filtering: true,
                rowFilters: true,
                hideHandled: true,
                selection: true,
              }}
              filterConfig={filterConfig}
              cellConfig={cellConfig}
            />
          )}
        </>
      )}
      {isAllocating && <AllocatingDialogContent callback={finishAllocation} />}
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

export default withMainMenu(Handling);
