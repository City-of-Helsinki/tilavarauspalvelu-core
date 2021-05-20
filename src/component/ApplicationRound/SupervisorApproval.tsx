import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { Button, Checkbox, IconArrowRight, Notification } from "hds-react";
import {
  Application as ApplicationType,
  AllocationResult,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
  ApplicationEventStatus,
} from "../../common/types";
import {
  ContentContainer,
  IngressContainer,
  NarrowContainer,
} from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import StatusRecommendation from "../Application/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ContentHeading, H3 } from "../../styles/typography";
import DataTable, { CellConfig, OrderTypes } from "../DataTable";
import Dialog from "../Dialog";
import {
  formatNumber,
  parseDuration,
  prepareAllocationResults,
  processAllocationResult,
} from "../../common/util";
import BigRadio from "../BigRadio";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import {
  getApplicationRound,
  getAllocationResults,
  getApplications,
  setApplicationEventStatuses,
  patchApplicationRoundStatus,
} from "../../common/api";

interface IProps {
  applicationRoundId: string;
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
    width: 100%;
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.s}) {
    button {
      width: auto;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    & > * {
      &:last-child {
        margin-right: 0;
      }

      margin-right: var(--spacing-m);
    }

    flex-direction: row;

    button {
      height: var(--spacing-3-xl);
    }
  }
`;

const ConfirmationCheckbox = styled(Checkbox)`
  margin: var(--spacing-m) 0;

  label {
    user-select: none;
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

// const ScheduleCount = styled.span`
//   font-size: var(--fontsize-body-s);
//   display: block;

//   @media (min-width: ${breakpoints.m}) {
//     margin-left: var(--spacing-xs);
//     display: inline;
//   }
// `;

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
          t(`Application.applicantTypes.${applicantType}`),
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
    rowLink: ({ id }: ApplicationType) => `/application/${id}`,
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
          t(`Application.applicantTypes.${applicantType}`),
      },
      {
        title: "Recommendation.headings.resolution",
        key: "applicationAggregatedData.reservationsTotal",
        transform: ({
          applicationAggregatedData,
          applicationEvent,
        }: AllocationResult) => (
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
                      applicationAggregatedData?.reservationsTotal,
                      t("common.volumeUnit")
                    )} / ${parseDuration(
                      applicationAggregatedData?.minDurationTotal
                    )}`,
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

function SupervisorApproval({ applicationRoundId }: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmationChecked, toggleIsConfirmationChecked] = useState(false);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [isCancelDialogVisible, setCancelDialogVisibility] = useState<boolean>(
    false
  );
  const [
    isConfirmationDialogVisible,
    setConfirmationDialogVisibility,
  ] = useState<boolean>(false);
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
  const [
    unAllocatedCellConfig,
    setUnallocatedCellConfig,
  ] = useState<CellConfig | null>(null);
  const [
    allocatedCellConfig,
    setAllocatedCellConfig,
  ] = useState<CellConfig | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("allocated");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  const setApplicationRoundStatus = async (
    id: number,
    status: ApplicationRoundStatus,
    followupUrl?: string
  ) => {
    try {
      const result = await patchApplicationRoundStatus(id, status);
      setApplicationRound(result);
      if (followupUrl) {
        history.push(followupUrl);
      }
    } catch (error) {
      setErrorMsg("errors.errorSavingData");
    }
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: Number(applicationRoundId),
        });
        setApplicationRound(result);
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
    const fetchRecommendationsAndApplications = async (
      ar: ApplicationRoundType
    ) => {
      try {
        const allocationResults = await getAllocationResults({
          applicationRoundId: ar.id,
          serviceSectorId: ar.serviceSectorId,
        });

        const applicationsResult = await getApplications({
          applicationRound: ar.id,
          status: "draft,in_review,review_done,declined",
        });

        const processedResult = processAllocationResult(allocationResults);

        const allocatedApplicationIds = uniq(
          processedResult.map((result) => result.applicationId)
        );
        const unallocatedApps = applicationsResult.filter(
          (application) => !allocatedApplicationIds.includes(application.id)
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
        setRecommendations(processAllocationResult(allocationResults) || []);
        setUnallocatedApplications(unallocatedApps);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendationsAndApplications(applicationRound);
    }
  }, [applicationRound, t]);

  const backLink = "/applicationRounds";

  const validatedRecommendations = recommendations.filter((n) =>
    ["validated"].includes(n.applicationEvent.status)
  );

  const filteredResults =
    activeFilter === "unallocated"
      ? unallocatedApplications
      : validatedRecommendations;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {recommendations &&
        applicationRound &&
        unAllocatedCellConfig &&
        allocatedCellConfig &&
        unAllocatedFilterConfig &&
        allocatedFilterConfig && (
          <>
            <ContentContainer>
              <LinkPrev route={backLink} />
            </ContentContainer>
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
            <NarrowContainer style={{ marginBottom: "var(--spacing-xl)" }}>
              <Recommendation>
                <RecommendationLabel>
                  {t("Application.recommendedStage")}:
                </RecommendationLabel>
                <RecommendationValue>
                  <StatusRecommendation
                    status="supervisorApproval"
                    applicationRound={applicationRound}
                  />
                </RecommendationValue>
              </Recommendation>
              <ActionContainer>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCancelDialogVisibility(true)}
                  >
                    {t("ApplicationRound.cancelSupervisorApproval")}
                  </Button>
                </div>
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={() => setConfirmationDialogVisibility(true)}
                    disabled={!isConfirmationChecked}
                  >
                    {t("ApplicationRound.approveAndSendToCustomers")}
                  </Button>
                  <div>
                    <ConfirmationCheckbox
                      id="applicationsChecked"
                      checked={isConfirmationChecked}
                      onClick={() =>
                        toggleIsConfirmationChecked(!isConfirmationChecked)
                      }
                      label={t("Application.iHaveCheckedApplications")}
                    />
                  </div>
                </div>
              </ActionContainer>
            </NarrowContainer>
            <IngressContainer>
              <IngressFooter>
                <div>
                  {activeFilter === "unallocated" && (
                    <>
                      <BoldValue>
                        {formatNumber(
                          unallocatedApplications.length,
                          t("common.volumeUnit")
                        )}
                      </BoldValue>
                      <p className="label">
                        {t("ApplicationRound.unallocatedApplications")}
                      </p>
                    </>
                  )}
                </div>
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
              />
            )}
            {isCancelDialogVisible && (
              <Dialog
                closeDialog={() => setCancelDialogVisibility(false)}
                style={
                  {
                    "--padding": "var(--spacing-layout-s)",
                  } as React.CSSProperties
                }
              >
                <H3>
                  {t("ApplicationRound.cancelSupervisorApprovalDialogHeader")}
                </H3>
                <p>
                  {t("ApplicationRound.cancelSupervisorApprovalDialogBody")}
                </p>
                <ActionContainer>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCancelDialogVisibility(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={() => {
                      setApplicationRoundStatus(
                        Number(applicationRoundId),
                        "allocated",
                        `/applicationRounds/approvals?cancelled`
                      );
                    }}
                  >
                    {t("ApplicationRound.returnListToHandling")}
                  </Button>
                </ActionContainer>
              </Dialog>
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
                <H3>
                  {t("ApplicationRound.approveRecommendationsDialogHeader")}
                </H3>
                <p>{t("ApplicationRound.approveRecommendationsDialogBody")}</p>
                <ActionContainer>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmationDialogVisibility(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={async () => {
                      try {
                        const payload = uniq(
                          validatedRecommendations.map(
                            (n: AllocationResult) => n.applicationEvent.id
                          )
                        ).map((n: number) => ({
                          status: "approved" as ApplicationEventStatus,
                          applicationEventId: n,
                        }));
                        await setApplicationEventStatuses(payload);
                        await setApplicationRoundStatus(
                          Number(applicationRoundId),
                          "approved",
                          `/applicationRounds/approvals?approved&applicationRoundId=${applicationRoundId}`
                        );
                      } catch (error) {
                        setConfirmationDialogVisibility(false);
                        setErrorMsg("errors.errorSavingRecommendations");
                      }
                    }}
                  >
                    {t("common.approve")}
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

export default withMainMenu(SupervisorApproval);
