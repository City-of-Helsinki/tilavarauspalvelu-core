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
  Application as ApplicationType,
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
import DataTable, { CellConfig, OrderTypes } from "../DataTable";
import Dialog from "../Dialog";
import { formatNumber, parseDuration } from "../../common/util";
import {
  prepareAllocationResults,
  processAllocationResult,
  getAllocationCapacity,
  IAllocationCapacity,
} from "../../common/AllocationResult";
import BigRadio from "../BigRadio";
import { getAllocationResults, getApplications } from "../../common/api";
import Loader from "../Loader";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
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

const BoldValue = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: 1.375rem;
  display: block;

  @media (min-width: ${breakpoints.m}) {
    display: inline;
  }
`;

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType | null,
  type: "unallocated" | "allocated"
): CellConfig => {
  const unallocatedCellConfig = {
    cols: [
      {
        title: "Application.headings.applicantName",
        key: "organisation.name",
        transform: ({
          applicantName,
          applicantType,
          organisation,
        }: ApplicationType) =>
          applicantType === "individual"
            ? applicantName || ""
            : organisation?.name || "",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
        transform: ({ applicantType }: ApplicationType) =>
          applicantType ? t(`Application.applicantTypes.${applicantType}`) : "",
      },
      {
        title: "Application.headings.recommendations",
        key: "id",
        transform: () => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{t("Recommendation.noRecommendations")}</span>
            <IconArrowRight />
          </div>
        ),
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc" as OrderTypes,
    rowLink: ({ id }: ApplicationType) => `/application/${id}/details`,
  };

  const allocatedCellConfig = {
    cols: [
      {
        title: "Application.headings.applicantName",
        key: "organisationName",
        transform: ({
          applicantType,
          applicantName,
          organisationName,
        }: AllocationResult) =>
          applicantName && applicantType === "individual"
            ? applicantName || ""
            : organisationName || "",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
        transform: ({ applicantType }: AllocationResult) =>
          applicantType ? t(`Application.applicantTypes.${applicantType}`) : "",
      },
      {
        title: "Recommendation.headings.resolution",
        key: "aggregatedData.reservationsTotal",
        transform: ({ aggregatedData, applicationEvent }: AllocationResult) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              {["validated"].includes(applicationEvent.status)
                ? trim(
                    `${formatNumber(
                      aggregatedData?.reservationsTotal,
                      t("common.volumeUnit")
                    )} / ${parseDuration(aggregatedData?.durationTotal)}`,
                    " / "
                  )
                : t("Recommendation.noRecommendations")}
            </span>
            <IconArrowRight />
          </div>
        ),
      },
    ],
    index: "applicationEventScheduleId",
    sorting: "organisation.name",
    order: "asc" as OrderTypes,
    rowLink: ({ applicationEventScheduleId }: AllocationResult) => {
      return applicationEventScheduleId && applicationRound
        ? `/applicationRound/${applicationRound.id}/recommendation/${applicationEventScheduleId}`
        : "";
    },
  };

  switch (type) {
    case "unallocated":
      return unallocatedCellConfig;
    case "allocated":
    default:
      return allocatedCellConfig;
  }
};

const getFilterConfig = (
  recommendations: AllocationResult[] | null,
  applications: ApplicationType[] | null,
  type: "unallocated" | "allocated",
  t: TFunction
): DataFilterConfig[] => {
  const getApplicantTypes = (input: AllocationResult[] | ApplicationType[]) =>
    uniq(
      input.map((n: AllocationResult | ApplicationType) => n.applicantType)
    ).sort();
  const getReservationUnits = (input: AllocationResult[]) =>
    uniq(input.map((n: AllocationResult) => n.unitName)).sort();

  const unallocatedFilterConfig = [
    {
      title: "Application.headings.applicantType",
      filters:
        applications &&
        getApplicantTypes(applications).map((value) => ({
          title: t(`Application.applicantTypes.${value}`),
          key: "applicantType",
          value: value || "",
        })),
    },
  ];

  const allocatedFilterConfig = [
    {
      title: "Application.headings.applicantType",
      filters:
        recommendations &&
        getApplicantTypes(recommendations).map((value) => ({
          title: t(`Application.applicantTypes.${value}`),
          key: "applicantType",
          value: value || "",
        })),
    },
    {
      title: "Recommendation.headings.reservationUnit",
      filters:
        recommendations &&
        getReservationUnits(recommendations).map((value) => ({
          title: value,
          key: "unitName",
          value: value || "",
        })),
    },
  ];

  switch (type) {
    case "unallocated":
      return unallocatedFilterConfig;
    case "allocated":
    default:
      return allocatedFilterConfig;
  }
};

function PreApproval({
  applicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [isConfirmationDialogVisible, setConfirmationDialogVisibility] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    AllocationResult[] | []
  >([]);
  const [unallocatedApplications, setUnallocatedApplications] = useState<
    ApplicationType[]
  >([]);
  const [unAllocatedFilterConfig, setUnallocatedFilterConfig] = useState<
    DataFilterConfig[] | null
  >(null);
  const [allocatedFilterConfig, setAllocatedFilterConfig] = useState<
    DataFilterConfig[] | null
  >(null);
  const [unAllocatedCellConfig, setUnallocatedCellConfig] =
    useState<CellConfig | null>(null);
  const [allocatedCellConfig, setAllocatedCellConfig] =
    useState<CellConfig | null>(null);
  const [capacity, setCapacity] = useState<IAllocationCapacity | null>(null);
  const [filteredApplicationsCount, setFilteredApplicationsCount] = useState<
    number | null
  >(null);
  const [activeFilter, setActiveFilter] = useState<string>("allocated");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async (arId: number, ssId: number) => {
      try {
        const allocationResults = await getAllocationResults({
          applicationRoundId: arId,
          serviceSectorId: ssId,
        });

        const applicationsResult = await getApplications({
          applicationRound: arId,
          status: "in_review,review_done,declined",
        });

        const processedResult = processAllocationResult(allocationResults);

        const allocatedApplicationIds = uniq(
          processedResult.map((result) => result.applicationId)
        );
        const unallocatedApps = applicationsResult.filter(
          (application: ApplicationType) =>
            !allocatedApplicationIds.includes(application.id)
        );

        setUnallocatedFilterConfig(
          getFilterConfig(processedResult, unallocatedApps, "unallocated", t)
        );
        setAllocatedFilterConfig(
          getFilterConfig(processedResult, unallocatedApps, "allocated", t)
        );
        setUnallocatedCellConfig(
          getCellConfig(t, applicationRound, "unallocated")
        );
        setAllocatedCellConfig(getCellConfig(t, applicationRound, "allocated"));
        setRecommendations(processedResult || []);
        setUnallocatedApplications(unallocatedApps);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchData(applicationRound.id, applicationRound.serviceSectorId);
    }
  }, [applicationRound, t]);

  const hasBeenSentForApproval = applicationRound.status === "validated";

  const filteredResults =
    activeFilter === "unallocated"
      ? unallocatedApplications
      : recommendations.filter((n) =>
          ["validated"].includes(n.applicationEvent.status)
        );

  if (isLoading) {
    return <Loader />;
  }

  const calculateCapacity = (
    rows: AllocationResult[],
    ar: ApplicationRoundType
  ): void => {
    const result: IAllocationCapacity | null = getAllocationCapacity(
      rows,
      ar?.aggregatedData.totalHourCapacity,
      ar?.aggregatedData.totalReservationDuration
    );
    setCapacity(result);
  };

  return (
    <Wrapper>
      <Heading />
      {recommendations &&
        unAllocatedCellConfig &&
        allocatedCellConfig &&
        unAllocatedFilterConfig &&
        allocatedFilterConfig && (
          <>
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
                      hasBeenSentForApproval
                        ? "approval"
                        : "approvalPreparation"
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
                {activeFilter === "unallocated" && (
                  <div>
                    <BoldValue>
                      {formatNumber(
                        filteredApplicationsCount,
                        t("common.volumeUnit")
                      )}
                    </BoldValue>
                    <p className="label">
                      {t("ApplicationRound.unallocatedApplications")}
                    </p>
                  </div>
                )}
                {activeFilter === "allocated" && (
                  <div>
                    {capacity && (
                      <>
                        <p className="label">
                          {t("ApplicationRound.schedulesToBeGranted")}
                        </p>
                        <BoldValue>
                          {t("ApplicationRound.percentageOfCapacity", {
                            percentage: capacity.percentage,
                          })}
                        </BoldValue>
                        <span style={{ marginLeft: "var(--spacing-xs)" }}>
                          (
                          {trim(
                            `${formatNumber(capacity.volume)} ${t(
                              "common.volumeUnit"
                            )} / ${formatNumber(capacity.hours)} ${t(
                              "common.hoursUnit"
                            )}`,
                            " / "
                          )}
                          )
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <BigRadio
                    buttons={[
                      {
                        key: "unallocated",
                        text: "ApplicationRound.orphanApplications",
                      },
                      {
                        key: "allocated",
                        text: "ApplicationRound.handledApplications",
                      },
                    ]}
                    activeKey={activeFilter}
                    setActiveKey={setActiveFilter}
                  />
                </div>
              </IngressFooter>
            </IngressContainer>
            {activeFilter === "unallocated" && unAllocatedCellConfig && (
              <DataTable
                groups={[{ id: 1, data: filteredResults }]}
                hasGrouping={false}
                config={{
                  filtering: true,
                  rowFilters: true,
                }}
                cellConfig={unAllocatedCellConfig}
                filterConfig={unAllocatedFilterConfig}
                getActiveRows={(rows: ApplicationType[]) => {
                  setFilteredApplicationsCount(rows.length);
                }}
              />
            )}
            {activeFilter === "allocated" && allocatedCellConfig && (
              <DataTable
                groups={prepareAllocationResults(
                  filteredResults as AllocationResult[]
                )}
                hasGrouping={false}
                config={{
                  filtering: true,
                  rowFilters: true,
                }}
                cellConfig={allocatedCellConfig}
                filterConfig={allocatedFilterConfig}
                getActiveRows={(rows: AllocationResult[]) => {
                  calculateCapacity(rows, applicationRound);
                }}
              />
            )}
            {isConfirmationDialogVisible && (
              <Dialog
                closeDialog={() => setConfirmationDialogVisibility(false)}
                style={
                  {
                    "--padding": "var(--spacing-layout-s)",
                  } as React.CSSProperties
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

export default withMainMenu(PreApproval);
