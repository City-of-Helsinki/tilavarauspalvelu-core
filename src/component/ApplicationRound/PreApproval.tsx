import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import {
  Button,
  IconArrowRight,
  IconCheckCircle,
  Notification,
} from "hds-react";
import trim from "lodash/trim";
import uniq from "lodash/uniq";
import {
  AllocationResult,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
  ApplicationEvent,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Heading from "./Heading";
import StatusRecommendation from "../Application/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ContentHeading, H3 } from "../../styles/typography";
import DataTable, { CellConfig } from "../DataTable";
import Dialog from "../Dialog";
import {
  formatNumber,
  parseDuration,
  prepareAllocationResults,
} from "../../common/util";
import BigRadio from "../BigRadio";
import { getAllocationResults } from "../../common/api";
import Loader from "../Loader";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
`;

const TopIngress = styled.div`
  & > div:last-of-type {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: var(--spacing-l);

    ${H3} {
      margin-left: var(--spacing-m);
      width: 50px;
      line-height: var(--lineheight-l);
    }
  }

  display: grid;

  ${ContentHeading} {
    width: 100%;
    padding: 0;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1.8fr 1fr;
    grid-gap: var(--spacing-layout-m);
  }
`;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-l);
  padding-left: var(--spacing-xl);

  h3 {
    display: flex;
    align-items: center;

    svg {
      margin-right: var(--spacing-2-xs);
    }
  }

  div[role="heading"] {
    display: none;
  }
`;

const Recommendation = styled.div`
  margin: var(--spacing-m) 0;
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

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const IngressFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  margin-bottom: var(--spacing-m);
  padding-top: var(--spacing-l);
  grid-gap: var(--spacing-m);

  .label {
    font-size: var(--fontsize-body-s);
    margin: var(--spacing-3-xs) 0 var(--spacing-2-xs) 0;
    color: var(--color-black-70);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;

    & > div:last-of-type {
      text-align: right;
    }
  }
`;

const SchedulePercentage = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: 1.375rem;
  display: block;

  @media (min-width: ${breakpoints.m}) {
    display: inline;
  }
`;

const ScheduleCount = styled.span`
  font-size: var(--fontsize-body-s);
  display: block;

  @media (min-width: ${breakpoints.m}) {
    margin-left: var(--spacing-xs);
    display: inline;
  }
`;

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType | null
): CellConfig => {
  return {
    cols: [
      { title: "Application.headings.applicantName", key: "organisationName" },
      {
        title: "Application.headings.participants",
        key: "organisation.activeMembers",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
      },
      {
        title: "Recommendation.headings.resolution",
        key: "applicationAggregatedData.reservationsTotal",
        transform: ({ applicationAggregatedData }: AllocationResult) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              {trim(
                `${formatNumber(
                  applicationAggregatedData?.reservationsTotal,
                  t("common.volumeUnit")
                )} / ${parseDuration(
                  applicationAggregatedData?.minDurationTotal
                )}`,
                " / "
              )}
            </span>
            <IconArrowRight />
          </div>
        ),
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

  return [
    {
      title: "Application.headings.purpose",
      filters: purposes.map((value) => ({
        title: value,
        key: "applicationEvent.purpose",
        value: value || "",
      })),
    },
  ];
};

function PreApproval({
  applicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [
    isConfirmationDialogVisible,
    setConfirmationDialogVisibility,
  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    AllocationResult[] | []
  >([]);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("handled");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchRecommendations = async (arId: number) => {
      try {
        const result = await getAllocationResults({
          applicationRoundId: arId,
        });

        setFilterConfig(
          getFilterConfig(result.flatMap((n) => n.applicationEvent))
        );
        setCellConfig(getCellConfig(t, applicationRound));
        setRecommendations(result || []);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendations(applicationRound.id);
    }
  }, [applicationRound, t]);

  const scheduledNumbers = {
    volume: 239048,
    hours: 2345,
  };

  const hasBeenSentForApproval = applicationRound.status === "validated";

  const filteredResults =
    activeFilter === "orphans"
      ? recommendations.filter(
          (n) => !["validated"].includes(n.applicationEvent.status)
        )
      : recommendations.filter((n) =>
          ["validated"].includes(n.applicationEvent.status)
        );

  if (isLoading || !recommendations || !cellConfig || !filterConfig) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      <IngressContainer>
        <ApplicationRoundNavi applicationRoundId={applicationRound.id} />
        <TopIngress>
          <div>
            <ContentHeading>{applicationRound.name}</ContentHeading>
            <TimeframeStatus
              applicationPeriodBegin={applicationRound.applicationPeriodBegin}
              applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            />
          </div>
          <div />
        </TopIngress>
      </IngressContainer>
      <NarrowContainer style={{ marginBottom: "var(--spacing-4-xl)" }}>
        {hasBeenSentForApproval && (
          <StyledNotification
            type="success"
            label=""
            dismissible
            closeButtonLabelText={`${t("common.close")}`}
          >
            <H3>
              <IconCheckCircle size="m" />{" "}
              {t("ApplicationRound.sentForApprovalNotificationHeader")}
            </H3>
            <p>{t("ApplicationRound.sentForApprovalNotificationBody")}</p>
          </StyledNotification>
        )}
        <Recommendation>
          <RecommendationLabel>
            {t("Application.recommendedStage")}:
          </RecommendationLabel>
          <RecommendationValue>
            <StatusRecommendation
              status={
                hasBeenSentForApproval ? "approval" : "approvalPreparation"
              }
              applicationRound={applicationRound}
            />
          </RecommendationValue>
        </Recommendation>
        {!hasBeenSentForApproval && (
          <ActionContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setApplicationRoundStatus("allocated");
              }}
            >
              {t("ApplicationRound.navigateBackToHandling")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => setConfirmationDialogVisibility(true)}
            >
              {t("ApplicationRound.sendForApproval")}
            </Button>
          </ActionContainer>
        )}
      </NarrowContainer>
      <IngressContainer>
        <IngressFooter>
          <div>
            <p className="label">
              {t("ApplicationRound.schedulesToBeGranted")}
            </p>{" "}
            <SchedulePercentage>
              {t("ApplicationRound.percentageOfCapacity", {
                percentage: 76,
              })}
            </SchedulePercentage>
            <ScheduleCount>
              {`(${formatNumber(
                scheduledNumbers.volume,
                t("common.volumeUnit")
              )} / ${formatNumber(
                scheduledNumbers.hours,
                t("common.hoursUnit")
              )})`}
            </ScheduleCount>
          </div>
          <div>
            <BigRadio
              buttons={[
                {
                  key: "orphans",
                  text: "ApplicationRound.orphanApplications",
                },
                {
                  key: "handled",
                  text: "ApplicationRound.handledApplications",
                },
              ]}
              activeKey={activeFilter}
              setActiveKey={setActiveFilter}
            />
          </div>
        </IngressFooter>
      </IngressContainer>
      {cellConfig && (
        <DataTable
          groups={prepareAllocationResults(filteredResults)}
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
      {isConfirmationDialogVisible && (
        <Dialog
          closeDialog={() => setConfirmationDialogVisibility(false)}
          style={
            { "--padding": "var(--spacing-layout-s)" } as React.CSSProperties
          }
        >
          <H3>{t("ApplicationRound.sentForApprovalDialogHeader")}</H3>
          <p>{t("ApplicationRound.sentForApprovalDialogBody")}</p>
          <ActionContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmationDialogVisibility(false)}
            >
              {t("Navigation.goBack")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                setApplicationRoundStatus("validated");
                setConfirmationDialogVisibility(false);
              }}
            >
              {t("ApplicationRound.deliverAction")}
            </Button>
          </ActionContainer>
        </Dialog>
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

export default withMainMenu(PreApproval);
