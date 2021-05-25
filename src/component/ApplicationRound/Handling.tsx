import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  Button,
  IconArrowRedo,
  IconCheckCircle,
  Notification,
} from "hds-react";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import trim from "lodash/trim";
import Loader from "../Loader";
import {
  AllocationResult,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { InlineRowLink, breakpoints, BasicLink } from "../../styles/util";
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
  getNormalizedApplicationEventStatus,
  modifyAllocationResults,
  normalizeApplicationEventStatus,
  parseAgeGroups,
  parseDuration,
  prepareAllocationResults,
  processAllocationResult,
  secondsToHms,
} from "../../common/util";
import StatusCell from "../StatusCell";
import {
  getAllocationResults,
  getApplicationRound,
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

const getFilterConfig = (
  recommendations: AllocationResult[]
): DataFilterConfig[] => {
  const purposes = uniq(
    recommendations.map((rec) => rec.applicationEvent.purpose)
  ).sort();
  const statuses = uniq(
    recommendations.map((rec) => rec.applicationEvent.status)
  );
  const reservationUnits = uniq(
    recommendations.map((rec) => rec.unitName)
  ).sort();
  const baskets = uniq(
    recommendations
      .filter((n) => n.basketName)
      .map((rec) => ({
        title: `${rec.basketOrderNumber}. ${rec.basketName}`,
        value: rec.basketName,
      }))
  );

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

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType
): CellConfig => {
  return {
    cols: [
      {
        title: "Application.headings.applicantName",
        key: "organisationName",
        transform: ({
          applicantType,
          applicantName,
          organisationId,
          organisationName,
          applicantId,
        }: AllocationResult) => {
          const index = organisationId || applicantId;
          const title =
            applicantType === "individual" ? applicantName : organisationName;
          return index ? (
            <InlineRowLink
              to={`/applicationRound/${applicationRound.id}/${
                organisationId ? "organisation" : "applicant"
              }/${index}`}
            >
              {title}
            </InlineRowLink>
          ) : (
            title || ""
          );
        },
      },
      {
        title: "ApplicationRound.basket",
        key: "basketOrderNumber",
        transform: ({ basketName, basketOrderNumber }: AllocationResult) => (
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
  const isApplicationRoundApproved = ["approved"].includes(
    applicationRound.status
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [recommendations, setRecommendations] = useState<AllocationResult[]>(
    []
  );
  const [
    isResolutionNotificationVisible,
    setIsResolutionNotificationVisible,
  ] = useState<boolean>(isApplicationRoundApproved);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selections, setSelections] = useState<number[]>([]);

  const { t } = useTranslation();

  const fetchRecommendations = async () => {
    try {
      const result = await getAllocationResults({
        applicationRoundId: applicationRound.id,
        serviceSectorId: applicationRound.serviceSectorId,
      });

      const processedResult = processAllocationResult(result);

      setFilterConfig(getFilterConfig(processedResult));
      setCellConfig(getCellConfig(t, applicationRound));
      setRecommendations(processedResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplications");
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (typeof applicationRound?.id === "number") {
      fetchRecommendations();
    }
  }, [applicationRound, t]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const getReservationHours = (allocationResults: AllocationResult[]) => {
    const appEvents = uniqBy(allocationResults, (n) => n.applicationEvent.id);
    const seconds = appEvents.reduce((acc: number, cur: AllocationResult) => {
      const isStatusOk = ["validated"].includes(
        normalizeApplicationEventStatus(cur)
      );
      return cur.applicationEvent.aggregatedData
        .allocationResultsDurationTotal && isStatusOk
        ? acc +
            cur.applicationEvent.aggregatedData.allocationResultsDurationTotal
        : acc;
    }, 0);
    const hms = secondsToHms(seconds);
    return hms.h || 0;
  };

  const reservedHours =
    getReservationHours(recommendations) +
    applicationRound.aggregatedData.totalReservationDuration;

  return (
    <Wrapper>
      <Heading />
      {applicationRound && (
        <>
          {!isApplicationRoundApproved && (
            <StyledKorosHeading
              heading={`${unhandledRecommendationCount} ${t(
                "common.volumeUnit"
              )}`}
              subheading={t("ApplicationRound.suffixUnhandledSuggestions")}
            />
          )}
          <IngressContainer>
            <ApplicationRoundNavi
              applicationRoundId={applicationRound.id}
              applicationRoundStatus={applicationRound.status}
            />
            <TopIngress>
              <div>
                <ContentHeading>{applicationRound.name}</ContentHeading>
                <TimeframeStatus
                  applicationPeriodBegin={
                    applicationRound.applicationPeriodBegin
                  }
                  applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                  isResolved={isApplicationRoundApproved}
                  resolutionDate={applicationRound.statusTimestamp}
                />
              </div>
              <div>
                {applicationRound.aggregatedData.totalHourCapacity &&
                  reservedHours && (
                    <>
                      <StatusCircle
                        status={
                          (reservedHours /
                            applicationRound.aggregatedData.totalHourCapacity) *
                          100
                        }
                      />
                      <H3>{t("ApplicationRound.amountReserved")}</H3>
                    </>
                  )}
              </div>
            </TopIngress>
          </IngressContainer>
          <NarrowContainer style={{ marginBottom: "var(--spacing-4-xl)" }}>
            {!isApplicationRoundApproved && (
              <>
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
                    disabled={unhandledRecommendationCount > 0 || isSaving}
                  >
                    {t("ApplicationRound.navigateToApprovalPreparation")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={() => startAllocation()}
                    iconLeft={<IconArrowRedo />}
                    disabled={isSaving}
                  >
                    {t("ApplicationRound.allocateAction")}
                  </Button>
                </ActionContainer>
              </>
            )}
            {isResolutionNotificationVisible && (
              <StyledNotification
                type="success"
                label=""
                dismissible
                closeButtonLabelText={`${t("common.close")}`}
                onClose={() => setIsResolutionNotificationVisible(false)}
              >
                <H3>
                  <IconCheckCircle size="m" />{" "}
                  {t("ApplicationRound.notificationResolutionDoneHeading")}
                </H3>
                <p>
                  <BasicLink
                    to={`/applicationRound/${applicationRound.id}/applications`}
                    style={{ textDecoration: "underline" }}
                  >
                    {t("ApplicationRound.notificationResolutionDoneBody")}
                  </BasicLink>
                </p>
              </StyledNotification>
            )}
          </NarrowContainer>
          {cellConfig && (
            <DataTable
              groups={prepareAllocationResults(recommendations)}
              setSelections={setSelections}
              hasGrouping
              config={{
                filtering: true,
                rowFilters: true,
                handledStatuses: isApplicationRoundApproved
                  ? []
                  : ["ignored", "validated", "handled"],
                selection: !isApplicationRoundApproved,
              }}
              filterConfig={filterConfig}
              cellConfig={cellConfig}
              areAllRowsDisabled={recommendations.every(
                (row) =>
                  row.applicationEvent.status === "ignored" ||
                  row.accepted ||
                  row.declined
              )}
              isRowDisabled={(row: AllocationResult) => {
                return (
                  ["ignored", "declined"].includes(
                    row.applicationEvent.status
                  ) || row.accepted
                );
              }}
              statusField="applicationEvent.status"
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
                fetchRecommendations();
              },
            });
          }}
          isSaving={isSaving}
        />
      )}
    </Wrapper>
  );
}

export default withMainMenu(Handling);
