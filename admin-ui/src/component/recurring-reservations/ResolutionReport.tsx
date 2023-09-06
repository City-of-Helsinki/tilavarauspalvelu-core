import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQuery as useApolloQuery } from "@apollo/client";
import {
  type Query,
  type QueryApplicationsArgs,
  ApplicationStatus,
  type ApplicationType,
} from "common/types/gql-types";
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
  Application as ApplicationTypeRest,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { APPLICATIONS_BY_APPLICATION_ROUND_QUERY } from "./queries";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { ContentHeading } from "../../styles/typography";
import DataTable, { CellConfig, OrderTypes } from "../DataTable";
import { formatNumber, formatDuration } from "../../common/util";
import {
  IAllocationCapacity,
  prepareAllocationResults,
  processAllocationResult,
  getAllocationCapacity,
} from "../../common/AllocationResult";
import BigRadio from "../BigRadio";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import { getAllocationResults, getApplicationRound } from "../../common/api";
import TimeframeStatus from "./TimeframeStatus";
import { applicationDetailsUrl, applicationRoundUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";

interface IProps {
  [key: string]: string;
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
  applicationRoundId: number | undefined,
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
        }: ApplicationTypeRest) =>
          applicantType === "individual"
            ? applicantName || ""
            : organisation?.name || "",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
        transform: ({ applicantType }: ApplicationTypeRest) =>
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
    rowLink: ({ id }: ApplicationTypeRest) => applicationDetailsUrl(id),
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
        transform: ({ applicantType }: ApplicationTypeRest) =>
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
                    )} / ${formatDuration(aggregatedData?.durationTotal)}`,
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
      return applicationEventScheduleId && applicationRoundId
        ? `${applicationRoundUrl(
            applicationRoundId
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

// TODO refactor this not to need the Application, just the ApplicationType
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
  const [activeFilter, setActiveFilter] = useState<string>("allocated");
  const [capacity, setCapacity] = useState<IAllocationCapacity | null>(null);
  const [filteredApplicationsCount, setFilteredApplicationsCount] = useState<
    number | null
  >(null);

  const { applicationRoundId } = useParams<IProps>();
  const { t } = useTranslation();

  const { data: applicationRound, isLoading: isRoundLoading } = useQuery({
    queryKey: ["applicationRound", Number(applicationRoundId) ?? 0],
    queryFn: () => getApplicationRound({ id: Number(applicationRoundId) }),
    enabled:
      applicationRoundId != null && !Number.isNaN(Number(applicationRoundId)),
    onError: (error: AxiosError) => {
      const msg =
        error?.response?.status === 404
          ? "errors.applicationRoundNotFound"
          : "errors.errorFetchingData";
      notifyError(t(msg));
    },
  });

  const { data: allocationResults, isLoading: isAllocationsLoading } = useQuery(
    {
      queryKey: [
        "allocationResults",
        applicationRoundId,
        applicationRound?.serviceSectorId,
      ],
      queryFn: () =>
        getAllocationResults({
          applicationRoundId: applicationRound?.id ?? 0,
          serviceSectorId: applicationRound?.serviceSectorId ?? 0,
        }),
      enabled:
        applicationRoundId != null && applicationRound?.serviceSectorId != null,
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

  const processedResult = processAllocationResult(allocationResults ?? []);
  const allocatedApplicationIds = uniq(
    processedResult.map((result) => result.applicationId)
  );

  const { loading: isApplicationsLoading, data: applicationsData } =
    useApolloQuery<Query, QueryApplicationsArgs>(
      APPLICATIONS_BY_APPLICATION_ROUND_QUERY,
      {
        skip: !applicationRound?.id,
        variables: {
          applicationRound: String(applicationRound?.id ?? 0),
          status: [
            // original REST status: "in_review,review_done,declined",
            // TODO check the map for them (or ask Krista / Elina what should be on this page)
            ApplicationStatus.Allocated,
            ApplicationStatus.Handled,
            ApplicationStatus.InReview,
            ApplicationStatus.ReviewDone,
          ],
        },
      }
    );

  const applicationsResult =
    applicationsData?.applications?.edges
      ?.map((x) => x?.node)
      ?.filter((x): x is ApplicationType => x != null) ?? [];

  const unallocatedApplications = applicationsResult.filter(
    (application) => !allocatedApplicationIds.includes(application?.pk ?? 0)
  );

  const unAllocatedFilterConfig = getFilterConfig(
    processedResult,
    unallocatedApplications,
    "unallocated",
    t
  );
  const allocatedFilterConfig = getFilterConfig(
    processedResult,
    unallocatedApplications,
    "allocated",
    t
  );
  const unAllocatedCellConfig = getCellConfig(
    t,
    applicationRound?.id,
    "unallocated"
  );
  const allocatedCellConfig = getCellConfig(
    t,
    applicationRound?.id,
    "allocated"
  );
  const recommendations = processAllocationResult(allocationResults ?? []);

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

  const isLoading =
    isRoundLoading || isAllocationsLoading || isApplicationsLoading;
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
                getActiveRows={(rows: ApplicationTypeRest[]) => {
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

export default ResolutionReport;
