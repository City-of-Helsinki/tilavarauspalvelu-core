import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  IconLocation,
  IconLayers,
  IconHome,
  IconGroup,
  Notification,
} from "hds-react";
import trim from "lodash/trim";
import { TFunction } from "i18next";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1, H3 } from "../../styles/typography";
import { breakpoints } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import withMainMenu from "../withMainMenu";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
} from "../../common/types";
import DataTable, { CellConfig } from "../DataTable";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import {
  formatNumber,
  getNormalizedApplicationStatus,
  parseDuration,
} from "../../common/util";
import StatusCell from "../StatusCell";
import StatusCircle from "../StatusCircle";
import RecommendationCount from "./RecommendationCount";

interface IRouteParams {
  applicationRoundId: string;
  spaceId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Ingress = styled.div`
  margin: var(--spacing-layout-l) 0 var(--spacing-layout-xl)
    calc(var(--spacing-layout-s) * -1);
  display: grid;

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: auto 1fr;
    grid-gap: var(--spacing-l);
  }
`;

const SpaceImage = styled.img`
  width: 144px;
  height: 144px;
  border-radius: 50%;
`;

const Title = styled(H1)`
  margin: var(--spacing-s) 0 var(--spacing-2-xs) 0;
`;

const Props = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: var(--spacing-xs) 0;
`;

const Prop = styled.div`
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  margin: 0 var(--spacing-m) var(--spacing-xs) 0;

  svg {
    margin-right: var(--spacing-2-xs);
  }
`;

const TitleContainer = styled.div`
  display: grid;
  padding-right: var(--spacing-m);

  ${H1} {
    margin: 0 0 var(--spacing-m);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

const StatusContainer = styled.div`
  display: flex;
  align-content: center;
  margin-bottom: var(--spacing-m);

  ${H3} {
    font-size: var(--fontsize-heading-s);
    margin-left: var(--spacing-m);
    width: 50px;
    line-height: var(--lineheight-m);
  }
`;

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

const getFilterConfig = (): DataFilterConfig[] => {
  return [];
};

function RecommendationsBySpace(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
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
  const { applicationRoundId, spaceId } = useParams<IRouteParams>(); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
        setCellConfig(getCellConfig(t));
        setFilterConfig(getFilterConfig());
        setIsLoading(false);
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

  if (isLoading || !applicationRound || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/applicationRound/${applicationRoundId}?allocated`} />
        <IngressContainer>
          <Ingress>
            <SpaceImage src="//placehold.it/144x144" alt="" />
            <div>
              <Title>Tilan nimi</Title>
              <div>Tilan osoite, Kaupunki</div>
              <Props>
                <Prop>
                  <IconLocation /> Resource Unit
                </Prop>
                <Prop>
                  <IconLayers />{" "}
                  {t("ReservationUnit.purposeCount", { count: 1 })} TODO
                </Prop>
                <Prop>
                  <IconHome /> Tilan tyyppi
                </Prop>
                <Prop>
                  <IconGroup /> 13
                </Prop>
              </Props>
            </div>
          </Ingress>
          <H1 as="h2">{t("ReservationUnit.reservationStatus")}</H1>
          <TitleContainer>
            <H1 as="h2">{applicationRound?.name}</H1>
            <StatusContainer>
              <StatusCircle status={0} />
              <H3>{t("ApplicationRound.amountReserved")}</H3>
            </StatusContainer>
          </TitleContainer>
          <RecommendationCount recommendationCount={13} unhandledCount={3} />
        </IngressContainer>
      </ContentContainer>
      <DataTable
        groups={[]}
        hasGrouping={false}
        config={{
          filtering: true,
          rowFilters: true,
          hideHandled: true,
          selection: true,
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

export default withMainMenu(RecommendationsBySpace);
