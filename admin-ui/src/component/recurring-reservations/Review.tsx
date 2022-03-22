import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Button, Checkbox, Notification } from "hds-react";
import uniq from "lodash/uniq";
import trim from "lodash/trim";
import { uniqBy } from "lodash";
import withMainMenu from "../withMainMenu";
import Heading from "./Heading";
import { ContentHeading, H2 } from "../../styles/typography";
import { breakpoints } from "../../styles/util";
import { IngressContainer } from "../../styles/layout";
import DataTable, { CellConfig } from "../DataTable";
import {
  getApplications,
  setApplicationStatuses,
  ApplicationStatusPayload,
} from "../../common/api";
import {
  Application as ApplicationType,
  ApplicationEventStatus,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  ApplicationStatus,
  DataFilterConfig,
  Unit,
} from "../../common/types";
import TimeframeStatus from "./TimeframeStatus";
import Loader from "../Loader";
import StatusCell from "../StatusCell";
import {
  formatNumber,
  getNormalizedApplicationStatus,
  parseDuration,
} from "../../common/util";
import StatusRecommendation from "../applications/StatusRecommendation";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import { applicationUrl } from "../../common/urls";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
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
  applications: ApplicationView[]
): DataFilterConfig[] => {
  const applicantTypes = uniq(applications.map((app) => app.type));
  const statuses = uniq(applications.map((app) => app.status));
  const units = uniqBy(
    applications.flatMap((app) => app.units),
    "id"
  );

  return [
    {
      title: "Application.headings.applicantType",
      filters: applicantTypes
        .filter((n) => n)
        .map((value) => ({
          title: value,
          key: "type",
          value: value || "",
        })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => ({
        title: `Application.statuses.${status}`,
        key: "status",
        value: status,
      })),
    },
    {
      title: "Application.headings.unit",
      filters: units.map((unit) => ({
        title: unit.name.fi,
        key: "unit",
        function: (application: ApplicationView) =>
          Boolean(application.units.find((u) => u.id === unit.id)),
      })),
    },
  ];
};

const getCellConfig = (applicationRound: ApplicationRoundType): CellConfig => {
  let statusTitle: string;
  switch (applicationRound.status) {
    case "approved":
      statusTitle = "Application.headings.resolutionStatus";
      break;
    default:
      statusTitle = "Application.headings.reviewStatus";
  }

  return {
    cols: [
      {
        title: "Application.headings.customer",
        key: "applicant",
      },
      {
        title: "Application.headings.applicantType",
        key: "type",
      },
      {
        title: "Application.headings.unit",
        key: "unitsSort",
        transform: ({ units }: ApplicationView) =>
          units.map((u) => u.name.fi).join(", "),
      },
      {
        title: "Application.headings.applicationCount",
        key: "applicationCountSort",
        transform: ({ applicationCount }: ApplicationView) => applicationCount,
      },
      {
        title: statusTitle,
        key: "status",
        transform: ({ status }: ApplicationView) => {
          return (
            <StatusCell
              status={status}
              text={`Application.statuses.${status}`}
              type="application"
            />
          );
        },
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc",
    rowLink: ({ id }) => applicationUrl(id),
  };
};
type ApplicationView = {
  id: number;
  applicant: string;
  type: string;
  units: Unit[];
  unitsSort: string;
  applicationCount: string;
  applicationCountSort: number;
  status: ApplicationStatus | ApplicationEventStatus;
  statusType: ApplicationStatus;
};

const appMapper = (
  round: ApplicationRoundType,
  app: ApplicationType,
  t: TFunction
): ApplicationView => {
  let applicationStatusView: ApplicationRoundStatus;
  switch (round.status) {
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }

  const units = uniqBy(
    app.applicationEvents
      .flatMap((ae) => ae.eventReservationUnits)
      .flatMap((eru) => eru.reservationUnitDetails.unit),
    "id"
  );

  return {
    id: app.id,
    applicant:
      app.applicantType === "individual"
        ? app.applicantName || ""
        : app.organisation?.name || "",
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "",
    unitsSort: units.find(() => true)?.name.fi || "",
    units,
    status: getNormalizedApplicationStatus(app.status, applicationStatusView),
    statusType: app.status,
    applicationCount: trim(
      `${formatNumber(
        app.aggregatedData?.appliedReservationsTotal,
        t("common.volumeUnit")
      )} / ${parseDuration(app.aggregatedData?.appliedMinDurationTotal)}`,
      " / "
    ),
    applicationCountSort: app.aggregatedData?.appliedReservationsTotal || 0,
  };
};

function Review({
  applicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplicationChecked, toggleIsApplicationChecked] = useState(false);

  const { t } = useTranslation();

  const setApplicationRoundAsReviewed = async (applicationIds: number[]) => {
    const payload = applicationIds.map(
      (applicationId: number): ApplicationStatusPayload => ({
        status: "review_done" as ApplicationStatus,
        applicationId,
      })
    );
    await setApplicationRoundStatus("review_done");
    await setApplicationStatuses(payload);
  };

  useEffect(() => {
    const fetchApplications = async (ar: ApplicationRoundType) => {
      try {
        const result = await getApplications({
          applicationRound: ar.id,
          status: "in_review,review_done,declined",
        });
        const mapped = result.map((app) => appMapper(ar, app, t));
        setCellConfig(getCellConfig(ar));
        setFilterConfig(getFilterConfig(mapped));
        setApplications(mapped);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchApplications(applicationRound);
    }
  }, [applicationRound, t]);

  if (isLoading) {
    return <Loader />;
  }

  const greenApplicationIds: number[] = applications
    .filter((application) => !["declined"].includes(application.statusType))
    .map((application) => application.id);

  return (
    <Wrapper>
      <Heading />
      {applicationRound && cellConfig && filterConfig && (
        <>
          <IngressContainer>
            <ApplicationRoundNavi
              applicationRoundId={applicationRound.id}
              hideAllApplications
            />
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
                    onClick={() =>
                      setApplicationRoundAsReviewed(greenApplicationIds)
                    }
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
