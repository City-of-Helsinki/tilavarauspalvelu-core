import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import trim from "lodash/trim";
import { Notification } from "hds-react";
import { TFunction } from "i18next";
import { getApplication, getApplicationRound } from "../../common/api";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import { BasicLink, breakpoints, Strong } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import ApplicationStatusBlock from "../Application/ApplicationStatusBlock";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import DataTable, { CellConfig } from "../DataTable";
import RecommendationCount from "./RecommendationCount";
import {
  formatNumber,
  getNormalizedApplicationStatus,
  parseDuration,
} from "../../common/util";
import StatusCell from "../StatusCell";

interface IRouteParams {
  applicationRoundId: string;
  applicationId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Top = styled.div`
  & > div {
    &:nth-of-type(even) {
      padding-right: var(--spacing-3-xl);
    }
  }

  display: grid;

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        max-width: 400px;
        justify-self: right;
      }
    }

    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-l);
  }
`;

const LinkToOthers = styled(BasicLink)`
  text-decoration: none;
  display: block;
  margin-bottom: var(--spacing-xs);
`;

const Heading = styled(H1)`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledApplicationStatusBlock = styled(ApplicationStatusBlock)`
  margin-top: var(--spacing-xl);
`;

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      {
        title: "Recommendation.headings.part",
        key: "part",
        transform: ({ id }: ApplicationType) =>
          `${t("Recommendation.headings.part")}${id}`,
      },
      {
        title: "Application.headings.purpose",
        key: "purpose",
      },
      {
        title: "Application.headings.ageGroup",
        key: "ageGroup",
      },
      {
        title: "Recommendation.headings.recommendationCount",
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
        title: "Recommendation.headings.spaceName",
        key: "space.name",
        transform: (
          { space, reservationUnit }: any // eslint-disable-line @typescript-eslint/no-explicit-any
        ) => <Strong>{`${reservationUnit}, ${space.name}`.trim()}</Strong>,
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

const getFilterConfig = (): DataFilterConfig[] => {
  return [];
};

// TODO: clean up route
function RecommendationsByApplicant(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { applicationRoundId, applicationId } = useParams<IRouteParams>();

  useEffect(() => {
    const fetchData = async (appRoundId: number) => {
      try {
        const result = await getApplicationRound({
          id: appRoundId,
        });

        setApplicationRound(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
        setIsLoading(false);
      }
    };

    fetchData(Number(applicationRoundId));
  }, [applicationRoundId]);

  useEffect(() => {
    const fetchApplication = async (id: number) => {
      try {
        const result = await getApplication(id);
        setApplication(result);
        setCellConfig(getCellConfig(t));
        setFilterConfig(getFilterConfig());
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication(Number(applicationId));
  }, [applicationId, t]);

  const applicantName =
    application?.applicantType === "individual"
      ? trim(
          `${application?.contactPerson?.firstName || ""} ${
            application?.contactPerson?.lastName || ""
          }`
        )
      : application?.organisation?.name;

  if (isLoading || !cellConfig || !filterConfig) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/applicationRound/${applicationRoundId}?allocated`} />
      </ContentContainer>
      <IngressContainer style={{ marginBottom: "var(--spacing-l)" }}>
        <Top>
          <div>
            <LinkToOthers to="/">
              {t("Recommendation.showOriginalApplication")} TODO
            </LinkToOthers>
            <div>
              {t("Application.applicationId")} <Strong>???????</Strong>{" "}
            </div>
            <Heading>{applicantName}</Heading>
            <div>{applicationRound?.name}</div>
            <StyledApplicationStatusBlock status="allocated" />
          </div>
          <div>{application && <ApplicantBox application={application} />}</div>
        </Top>
        <RecommendationCount recommendationCount={54} unhandledCount={43} />
      </IngressContainer>
      <DataTable
        groups={[]}
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

export default withMainMenu(RecommendationsByApplicant);
