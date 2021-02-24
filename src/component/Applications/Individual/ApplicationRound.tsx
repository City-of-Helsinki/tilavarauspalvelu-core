import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useParams } from "react-router-dom";
import { Button, Checkbox, Notification } from "hds-react";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import withMainMenu from "../../withMainMenu";
import Heading from "../Heading";
import { ContentHeading, H2 } from "../../../styles/typography";
import { breakpoints, BasicLink } from "../../../styles/util";
import { IngressContainer } from "../../../styles/layout";
import DataTable, { CellConfig } from "../../DataTable";
import { getApplicationRound, getApplications } from "../../../common/api";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../../common/types";
import TimeframeStatus from "../TimeframeStatus";
import Loader from "../../../common/Loader";
import StatusCell from "../../StatusCell";
import { formatNumber, getNormalizedStatus } from "../../../common/util";
import StatusRecommendation from "../StatusRecommendation";

interface IRouteParams {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const ApplicationNavi = styled.div`
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: flex-end;
  }
`;

const NaviItem = styled(BasicLink)`
  &:first-of-type {
    margin-left: 0;
  }

  margin-left: 2rem;
`;

const Content = styled.div``;

const Details = styled.div`
  & > div {
    margin-bottom: var(--spacing-3-xl);
  }

  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-s);

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        justify-self: end;
      }
    }

    grid-template-columns: 1fr 1fr;
  }
`;

const Recommendation = styled.div`
  margin: var(--spacing-m) 0 0 var(--spacing-xl);
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

const SubmitButton = styled(Button)`
  margin-bottom: var(--spacing-s);
`;

const StyledCheckbox = styled(Checkbox)`
  label {
    user-select: none;
  }
`;

const ApplicationCount = styled(H2)`
  text-transform: lowercase;
`;

const getFilterConfig = (
  applications: ApplicationType[]
): DataFilterConfig[] => {
  const coreBusinessValues = uniq(
    applications
      .map((app) => app.organisation?.coreBusiness)
      .filter((app) => app && app.length)
  );
  const statuses = uniq(applications.map((app) => app.status));

  return [
    {
      title: "Application.headings.customerType",
    },
    {
      title: "Application.headings.coreActivity",
      filters:
        coreBusinessValues &&
        coreBusinessValues.map((coreBusiness) => ({
          title: coreBusiness || "",
          key: "organisation.coreBusiness",
          value: coreBusiness || "",
        })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedStatus(status, 1);
        return {
          title: `Application.statuses.${normalizedStatus}`,
          key: "status",
          value: status,
        };
      }),
    },
  ];
};

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      { title: "Application.headings.customer", key: "organisation.name" },
      {
        title: "Application.headings.participants",
        key: "organisation.activeMembers",
        transform: ({ organisation }: ApplicationType) => (
          <>{`${formatNumber(
            organisation?.activeMembers,
            t("common.volumeUnit")
          )}`}</>
        ),
      },
      {
        title: "Application.headings.customerType",
        key: "organisation.customerType",
      },
      {
        title: "Application.headings.coreActivity",
        key: "organisation.coreBusiness",
      },
      {
        title: "Application.headings.applicationCount",
        key: "aggregatedData.reservationsTotal",
        transform: ({ aggregatedData }: ApplicationType) => (
          <>
            {trim(
              `${formatNumber(
                aggregatedData?.reservationsTotal,
                t("common.volumeUnit")
              )} / ${formatNumber(
                aggregatedData?.minDurationTotal,
                t("common.hoursUnit")
              )}`,
              " / "
            )}
          </>
        ),
      },
      {
        title: "Application.headings.applicationStatus",
        key: "status",
        transform: ({ status }: ApplicationType) => {
          const normalizedStatus = getNormalizedStatus(status, 1);
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
    rowLink: (id) => `/application/${id}`,
  };
};

function ApplicationRound(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplicationChecked, toggleIsApplicationChecked] = useState(false);

  const { applicationRoundId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
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
  }, [applicationRoundId]);

  useEffect(() => {
    const fetchApplications = async (applicationId: number) => {
      try {
        const result = await getApplications({
          applicationRound: applicationId,
          status: "in_review,draft",
        });
        setCellConfig(getCellConfig(t));
        setFilterConfig(getFilterConfig(result));
        setApplications(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchApplications(applicationRound.id);
    }
  }, [applicationRound, t]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      {applicationRound && cellConfig && filterConfig && (
        <>
          <IngressContainer>
            <ApplicationNavi>
              <NaviItem to="#">
                {t("Application.showAllApplications")} TODO
              </NaviItem>
              <NaviItem to="#">
                {t("Application.settingsAndQuotas")} TODO
              </NaviItem>
            </ApplicationNavi>
            <Content>
              <ContentHeading>{applicationRound?.name}</ContentHeading>
              <Details>
                <div>
                  <TimeframeStatus
                    applicationPeriodBegin={
                      applicationRound.applicationPeriodBegin
                    }
                    applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                  />
                  <Recommendation>
                    <RecommendationLabel>
                      {t("Application.recommendedStage")}:
                    </RecommendationLabel>
                    <RecommendationValue>
                      <StatusRecommendation status={applicationRound.status} />
                    </RecommendationValue>
                  </Recommendation>
                </div>
                <div>
                  <SubmitButton
                    disabled={!isApplicationChecked}
                    onClick={() => alert("TODO")} // eslint-disable-line no-alert
                  >
                    {t("Application.gotoSplitPreparation")}
                  </SubmitButton>
                  <div>
                    <StyledCheckbox
                      id="applicationsChecked"
                      checked={isApplicationChecked}
                      onClick={() =>
                        toggleIsApplicationChecked(!isApplicationChecked)
                      }
                      label={t("Application.iHaveCheckedApplications")}
                    />
                  </div>
                </div>
              </Details>
              <ApplicationCount>
                {applications.length}{" "}
                {t("Application.application", { count: applications.length })}
              </ApplicationCount>
            </Content>
          </IngressContainer>
          <DataTable
            data={applications}
            cellConfig={cellConfig}
            filterConfig={filterConfig}
          />
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

export default withMainMenu(ApplicationRound);
