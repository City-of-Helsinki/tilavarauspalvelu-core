import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { IconArrowRight, IconClock, Notification } from "hds-react";
import {
  AllocationResult,
  ApplicationEvent,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import withMainMenu from "../withMainMenu";
import { ContentHeading, H3 } from "../../styles/typography";
import DataTable, { CellConfig } from "../DataTable";
import {
  formatNumber,
  parseDuration,
  prepareAllocationResults,
} from "../../common/util";
import BigRadio from "../BigRadio";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import { getAllocationResults } from "../../common/api";

interface IProps {
  applicationRound: ApplicationRoundType;
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

const ResolutionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-s);
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
        : "";
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

function ResolutionReport({ applicationRound }: IProps): JSX.Element {
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
    const fetchRecommendations = async (ar: ApplicationRoundType) => {
      try {
        const result = await getAllocationResults({
          applicationRoundId: ar.id,
          serviceSectorId: ar.serviceSectorId,
        });

        setFilterConfig(
          getFilterConfig(
            result.flatMap((n: AllocationResult) => n.applicationEvent)
          )
        );
        setCellConfig(getCellConfig(t, ar));
        setRecommendations(result || []);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchRecommendations(applicationRound);
    }
  }, [applicationRound, t]);

  const scheduledNumbers = {
    volume: 239048,
    hours: 2345,
  };

  const backLink = "/applicationRounds";

  const filteredResults =
    activeFilter === "orphans"
      ? recommendations.filter(
          (n) => !["validated"].includes(n.applicationEvent.status)
        )
      : recommendations.filter((n) =>
          ["validated"].includes(n.applicationEvent.status)
        );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound && cellConfig && filterConfig && (
        <>
          <ContentContainer>
            <LinkPrev route={backLink} />
          </ContentContainer>
          <IngressContainer>
            <TopIngress>
              <div>
                <ContentHeading>
                  {t("ApplicationRound.resolutionNumber", { no: "????" })}
                </ContentHeading>
                <Subheading>{applicationRound.name}</Subheading>
                <ResolutionStatus>
                  <IconClock /> {t("ApplicationRound.resolutionDate")} ???
                </ResolutionStatus>
              </div>
              <div />
            </TopIngress>
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
              }}
              cellConfig={cellConfig}
              filterConfig={filterConfig}
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

export default withMainMenu(ResolutionReport);
