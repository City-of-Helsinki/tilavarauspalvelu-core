import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, IconArrowRedo, Notification } from "hds-react";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import Loader from "../Loader";
import {
  AllocationResult,
  ApplicationEvent,
  ApplicationEventStatus,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Heading from "./Heading";
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
  getNormalizedRecommendationStatus,
  parseAgeGroups,
  parseDuration,
  prepareAllocationResults,
} from "../../common/util";
import StatusCell from "../StatusCell";
import {
  getAllocationResults,
  getApplicationRound,
  setApplicationEventStatuses,
  triggerAllocation,
} from "../../common/api";
import SelectionActionBar from "../SelectionActionBar";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRound: Dispatch<SetStateAction<ApplicationRoundType | null>>;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-2-xl);
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
        key: "purpose",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedRecommendationStatus(status);
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
      { title: "Application.headings.applicantName", key: "organisationName" },
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
        // TODO
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
        title: "Recommendation.headings.status",
        key: "applicationEvent.status",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: ({ applicationEvent }: any) => {
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
        : "";
    },
    groupLink: ({ space }) =>
      applicationRound
        ? `/applicationRound/${applicationRound.id}/reservationUnit/${space?.id}`
        : "",
  };
};

function Handling({
  applicationRound,
  setApplicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [recommendations, setRecommendations] = useState<AllocationResult[]>(
    []
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selections, setSelections] = useState<number[]>([]);

  const { t } = useTranslation();

  const startAllocation = async () => {
    if (!applicationRound) return;

    setErrorMsg(null);

    try {
      const allocation = await triggerAllocation({
        applicationRoundId: applicationRound.id,
        applicationRoundBasketIds: applicationRound.applicationRoundBaskets.map(
          (n) => n.id
        ),
      });
      setIsAllocating(!!allocation?.id);
    } catch (error) {
      const msg = "errors.errorStartingAllocation";
      setErrorMsg(msg);
    }
  };

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
    const fetchRecommendations = async () => {
      try {
        const result = await getAllocationResults({
          applicationRoundId: applicationRound.id,
          serviceSectorId: applicationRound.serviceSectorId,
        });

        setFilterConfig(
          getFilterConfig(
            result.flatMap((n: AllocationResult) => n.applicationEvent)
          )
        );
        setCellConfig(getCellConfig(t, applicationRound));
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
  }, [applicationRound, t]);

  useEffect(() => {
    const poller = setInterval(async () => {
      if (isAllocating) {
        const result = await getApplicationRound({ id: applicationRound.id });
        if (result.allocating === false) {
          setApplicationRound(result);
          setIsAllocating(false);
        }
      }
    }, 2000);

    return () => {
      clearInterval(poller);
    };
  }, [isAllocating, applicationRound, setApplicationRound]);

  const unhandledRecommendationCount: number = recommendations
    .flatMap((recommendation) => recommendation.applicationEvent)
    .map((recommendation) => recommendation.status)
    .filter((status) => ["created", "allocating", "allocated"].includes(status))
    .length;

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
            <ApplicationRoundNavi applicationRoundId={applicationRound.id} />
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
                onClick={() => {
                  setApplicationRoundStatus("handled");
                }}
              >
                {t("ApplicationRound.navigateToApprovalPreparation")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                onClick={() => startAllocation()}
                iconLeft={<IconArrowRedo />}
              >
                {t("ApplicationRound.allocateAction")}
              </Button>
            </ActionContainer>
          </NarrowContainer>
          {cellConfig && (
            <DataTable
              groups={prepareAllocationResults(recommendations)}
              setSelections={setSelections}
              hasGrouping
              config={{
                filtering: true,
                rowFilters: true,
                handledStatuses: ["validated", "handled"],
                selection: true,
              }}
              filterConfig={filterConfig}
              cellConfig={cellConfig}
            />
          )}
        </>
      )}
      {isAllocating && <AllocatingDialogContent />}
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
      {selections?.length > 0 && (
        <SelectionActionBar
          selections={selections}
          options={[
            { label: t("Recommendation.actionMassApprove"), value: "approve" },
            { label: t("Recommendation.actionMassDecline"), value: "decline" },
            {
              label: t("Recommendation.actionMassIgnoreSpace"),
              value: "ignore",
            },
          ]}
          callback={(option: string) => modifyRecommendations(option)}
          isSaving={isSaving}
        />
      )}
    </Wrapper>
  );
}

export default withMainMenu(Handling);
