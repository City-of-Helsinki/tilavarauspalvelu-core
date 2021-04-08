import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Button, Checkbox, Notification } from "hds-react";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import withMainMenu from "../withMainMenu";
import Heading from "../Application/Heading";
import { ContentHeading, H2 } from "../../styles/typography";
import { breakpoints } from "../../styles/util";
import { IngressContainer } from "../../styles/layout";
import DataTable, { CellConfig } from "../DataTable";
import { getApplications } from "../../common/api";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  DataFilterConfig,
} from "../../common/types";
import TimeframeStatus from "./TimeframeStatus";
import Loader from "../Loader";
import StatusCell from "../StatusCell";
import {
  formatNumber,
  getNormalizedApplicationStatus,
  parseDuration,
} from "../../common/util";
import StatusRecommendation from "../Application/StatusRecommendation";
import ApplicationRoundNavi from "./ApplicationRoundNavi";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
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
  const applicantTypes = uniq(applications.map((app) => app.applicantType));
  const statuses = uniq(applications.map((app) => app.status));

  return [
    {
      title: "Application.headings.applicantType",
      filters: applicantTypes.map((value) => ({
        title: `Application.applicantTypes.${value}`,
        key: "applicantType",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedApplicationStatus(
          status,
          "review"
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
        title: "Application.headings.applicantType",
        key: "applicantType",
        transform: ({ applicantType }: ApplicationType) =>
          applicantType ? t(`Application.applicantTypes.${applicantType}`) : "",
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
              )} / ${parseDuration(aggregatedData?.minDurationTotal)}`,
              " / "
            )}
          </>
        ),
      },
      {
        title: "Application.headings.applicationStatus",
        key: "status",
        transform: ({ status }: ApplicationType) => {
          const normalizedStatus = getNormalizedApplicationStatus(
            status,
            "review"
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
    rowLink: ({ id }) => `/application/${id}`,
  };
};

function Review({
  applicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplicationChecked, toggleIsApplicationChecked] = useState(false);

  const { t } = useTranslation();

  const setApplicationRoundAsReviewed = () => {
    setApplicationRoundStatus("review_done");
  };

  useEffect(() => {
    const fetchApplications = async (applicationId: number) => {
      try {
        const result = await getApplications({
          applicationRound: applicationId,
          status: "in_review,review_done,declined",
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
            <ApplicationRoundNavi applicationRoundId={applicationRound.id} />
            <Content>
              <ContentHeading>{applicationRound.name}</ContentHeading>
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
                      <StatusRecommendation
                        status="in_review"
                        applicationRound={applicationRound}
                      />
                    </RecommendationValue>
                  </Recommendation>
                </div>
                <div>
                  <SubmitButton
                    disabled={!isApplicationChecked}
                    onClick={setApplicationRoundAsReviewed}
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
              <ApplicationCount data-testid="application-count">
                {applications.length}{" "}
                {t("Application.application", { count: applications.length })}
              </ApplicationCount>
            </Content>
          </IngressContainer>
          <DataTable
            groups={[{ id: 1, data: applications }]}
            hasGrouping={false}
            config={{
              filtering: true,
              rowFilters: true,
              hideHandled: false,
              selection: false,
            }}
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

export default withMainMenu(Review);
