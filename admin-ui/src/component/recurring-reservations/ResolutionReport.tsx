import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { TFunction } from "i18next";
import styled from "styled-components";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { IconArrowRight } from "hds-react";
import { AxiosError } from "axios";
import { H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import { ContentHeading } from "../../styles/typography";
import DataTable, { CellConfig, OrderTypes } from "../DataTable";
import { formatNumber, parseDuration } from "../../common/util";
import {
  IAllocationCapacity,
  prepareAllocationResults,
  processAllocationResult,
  getAllocationCapacity,
} from "../../common/AllocationResult";
import BigRadio from "../BigRadio";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import {
  getAllocationResults,
  getApplicationRound,
  getApplications,
} from "../../common/api";
import TimeframeStatus from "./TimeframeStatus";
import { applicationDetailsUrl, applicationRoundUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";

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
  margin-bottom: var(--spacing-layout-xl);

  ${ContentHeading} {
    width: 100%;
    padding: 0;
    margin: var(--spacing-layout-m) 0 var(--spacing-3-xs) 0;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1.8fr 1fr;
    grid-gap: var(--spacing-layout-m);
  }
`;

const Subheading = styled.div`
  margin-bottom: var(--spacing-l);
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
    rowLink: ({ id }: ApplicationType) => applicationDetailsUrl(id),
  };

  const allocatedCellConfig = {
    cols: [
      {
        title: "Application.headings.applicantName",
        key: "organisationName",
        transform: ({
          applicantName,
          applicantType,
          organisationName,
        }: AllocationResult) =>
          applicantType === "individual"
            ? applicantName || ""
            : organisationName || "",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
        transform: ({ applicantType }: ApplicationType) =>
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
        ? `${applicationRoundUrl(
            applicationRound.id
          )}/recommendation/${applicationEventScheduleId}`
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

function ResolutionReport(): JSX.Element {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
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
  const [activeFilter, setActiveFilter] = useState<string>("allocated");
  const [capacity, setCapacity] = useState<IAllocationCapacity | null>(null);
  const [filteredApplicationsCount, setFilteredApplicationsCount] = useState<
    number | null
  >(null);

  const { applicationRoundId } = useParams<IProps>();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplicationRound = async (id: number) => {
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id,
        });
        setApplicationRound(result);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        notifyError(t(msg));
        setIsLoading(false);
      }
    };

    fetchApplicationRound(Number(applicationRoundId));
  }, [applicationRoundId, notifyError, t]);

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
          status: "in_review,review_done,declined",
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
        notifyError(t("errors.errorFetchingApplications"));
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendationsAndApplications(applicationRound);
    }
  }, [applicationRound, notifyError, t]);

  const filteredResults =
    activeFilter === "unallocated"
      ? unallocatedApplications
      : recommendations.filter((n) =>
          ["validated"].includes(n.applicationEvent.status)
        );

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
              <LinkPrev route={applicationRoundUrl(applicationRound.id)} />
            </ContentContainer>
            <IngressContainer>
              <TopIngress>
                <div>
                  <ContentHeading>
                    {t("ApplicationRound.resolutionNumber", { no: "????" })}
                  </ContentHeading>
                  <Subheading>{applicationRound.name}</Subheading>
                  <TimeframeStatus
                    applicationPeriodBegin={
                      applicationRound.applicationPeriodBegin
                    }
                    applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                    isResolved={["approved"].includes(applicationRound.status)}
                    resolutionDate={applicationRound.statusTimestamp}
                  />
                </div>
                <div />
              </TopIngress>
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
          </>
        )}
    </Wrapper>
  );
}

export default withMainMenu(ResolutionReport);
