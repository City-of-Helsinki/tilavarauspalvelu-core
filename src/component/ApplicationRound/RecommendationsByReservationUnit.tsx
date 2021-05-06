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
import uniq from "lodash/uniq";
import { TFunction } from "i18next";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1, H3 } from "../../styles/typography";
import { breakpoints, InlineRowLink } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import withMainMenu from "../withMainMenu";
import {
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
  AllocationResult,
  ReservationUnit,
} from "../../common/types";
import DataTable, { CellConfig } from "../DataTable";
import {
  getAllocationResults,
  getApplicationRound,
  getReservationUnit,
} from "../../common/api";
import Loader from "../Loader";
import {
  formatNumber,
  getNormalizedApplicationEventStatus,
  localizedValue,
  parseAddress,
  parseAgeGroups,
  parseDuration,
  prepareAllocationResults,
  processAllocationResult,
  modifyAllocationResults,
} from "../../common/util";
import StatusCell from "../StatusCell";
import StatusCircle from "../StatusCircle";
import RecommendationCount from "./RecommendationCount";
import i18n from "../../i18n";
import SelectionActionBar from "../SelectionActionBar";

interface IRouteParams {
  applicationRoundId: string;
  reservationUnitId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-2-xl);
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

const ReservationUnitImage = styled.img`
  width: 144px;
  height: 144px;
  border-radius: 50%;
`;

const ImageFiller = styled.div`
  width: 1px;
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
  gap: var(--spacing-m);

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
  gap: var(--spacing-m);

  ${H3} {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-m);
    margin: var(--spacing-xs) 0;
  }
`;

const getCellConfig = (
  t: TFunction,
  applicationRound: ApplicationRoundType
): CellConfig => {
  return {
    cols: [
      {
        title: "Application.headings.applicantName",
        key: "organisationName",
        transform: ({ organisationName, applicantId }: AllocationResult) => (
          <InlineRowLink
            to={`/applicationRound/${applicationRound.id}/applicant/${applicantId}`}
          >
            {organisationName}
          </InlineRowLink>
        ),
      },
      {
        title: "ApplicationRound.basket",
        key: "basketOrderNumber",
        transform: ({ basketName, basketOrderNumber }) => (
          <>{trim(`${basketOrderNumber || ""}. ${basketName || ""}`, ". ")}</>
        ),
      },
      {
        title: "Application.headings.purpose",
        key: "applicationEvent.purpose",
      },
      {
        title: "Application.headings.ageGroup",
        key: "applicationEvent.ageGroupDisplay.minimum",
        transform: ({ applicationEvent }: AllocationResult) => (
          <>{parseAgeGroups(applicationEvent.ageGroupDisplay)}</>
        ),
      },
      {
        title: "Recommendation.headings.recommendationCount",
        key: "applicationAggregatedData.reservationsTotal",
        transform: ({ applicationAggregatedData }: AllocationResult) => (
          <>
            {trim(
              `${formatNumber(
                applicationAggregatedData?.reservationsTotal,
                t("common.volumeUnit")
              )} / ${parseDuration(
                applicationAggregatedData?.minDurationTotal
              )}`,
              " / "
            )}
          </>
        ),
      },
      {
        title: "Recommendation.headings.status",
        key: "applicationEvent.status",
        transform: ({ applicationEvent }: AllocationResult) => {
          const normalizedStatus = getNormalizedApplicationEventStatus(
            applicationEvent.status
          );

          return (
            <StatusCell
              status={normalizedStatus}
              text={`Recommendation.statuses.${normalizedStatus}`}
              type="applicationEvent"
            />
          );
        },
      },
    ],
    index: "applicationEventScheduleId",
    sorting: "organisation.name",
    order: "asc",
    rowLink: ({ applicationEventScheduleId }: AllocationResult) => {
      return applicationEventScheduleId && applicationRound
        ? `/applicationRound/${applicationRound.id}/recommendation/${applicationEventScheduleId}`
        : "/foobar";
    },
  };
};

const getFilterConfig = (
  recommendations: AllocationResult[]
): DataFilterConfig[] => {
  const purposes = uniq(
    recommendations.map((rec) => rec.applicationEvent.purpose)
  ).sort();
  const statuses = uniq(
    recommendations.map((rec) => rec.applicationEvent.status)
  );
  const reservationUnits = uniq(
    recommendations.map((rec) => rec.unitName)
  ).sort();
  const baskets = uniq(
    recommendations.map((rec) => ({
      title: `${rec.basketOrderNumber}. ${rec.basketName}`,
      value: rec.basketName,
    }))
  );

  return [
    {
      title: "Recommendation.headings.reservationUnit",
      filters: reservationUnits.map((value) => ({
        title: value,
        key: "unitName",
        value: value || "",
      })),
    },
    {
      title: "Recommendation.headings.purpose",
      filters: purposes.map((value) => ({
        title: value,
        key: "applicationEvent.purpose",
        value: value || "",
      })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => {
        const normalizedStatus = getNormalizedApplicationEventStatus(status);
        return {
          title: `Recommendation.statuses.${normalizedStatus}`,
          key: "applicationEvent.status",
          value: status,
        };
      }),
    },
    {
      title: "Recommendation.headings.basket",
      filters: baskets.map(({ title, value }) => ({
        title,
        key: "basketName",
        value: value || "",
      })),
    },
  ];
};

function RecommendationsByReservationUnit(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AllocationResult[] | []
  >([]);
  const [
    reservationUnit,
    setReservationUnit,
  ] = useState<ReservationUnit | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [selections, setSelections] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { applicationRoundId, reservationUnitId } = useParams<IRouteParams>(); // eslint-disable-line @typescript-eslint/no-unused-vars

  const fetchRecommendations = async (
    ar: ApplicationRoundType,
    ruId: number
  ) => {
    try {
      const result = await getAllocationResults({
        applicationRoundId: ar.id,
        serviceSectorId: ar.serviceSectorId,
      });

      const filteredResult: AllocationResult[] = processAllocationResult(
        result
      ).filter((n: AllocationResult) => n.allocatedReservationUnitId === ruId);

      setFilterConfig(getFilterConfig(filteredResult));
      setCellConfig(getCellConfig(t, ar));
      setRecommendations(filteredResult || []);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplications");
    } finally {
      setIsLoading(false);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId, t]);

  useEffect(() => {
    if (typeof applicationRound?.id === "number") {
      fetchRecommendations(applicationRound, Number(reservationUnitId));
    }
  }, [applicationRound, reservationUnitId, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchReservationUnit = async (ruId: number) => {
      try {
        const result = await getReservationUnit(ruId);
        setReservationUnit(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservationUnit(Number(reservationUnitId));
  }, [recommendations, reservationUnitId]);

  const unhandledRecommendationCount = recommendations.filter((n) =>
    ["created", "allocating", "allocated"].includes(n.applicationEvent.status)
  ).length;

  const mainImage = reservationUnit?.images.find((n) => n.imageType === "main");

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound &&
        recommendations &&
        reservationUnit &&
        filterConfig &&
        cellConfig && (
          <>
            <ContentContainer>
              <LinkPrev route={`/applicationRound/${applicationRoundId}`} />
              <IngressContainer>
                <Ingress>
                  {mainImage ? (
                    <ReservationUnitImage src={mainImage.smallUrl} alt="" />
                  ) : (
                    <ImageFiller />
                  )}
                  <div>
                    <Title>
                      {localizedValue(reservationUnit.name, i18n.language)}
                    </Title>
                    {reservationUnit.location && (
                      <div>{parseAddress(reservationUnit.location)}</div>
                    )}
                    <Props>
                      <Prop>
                        <IconLocation /> {reservationUnit.building.name}
                      </Prop>
                      {reservationUnit.purposes && (
                        <Prop>
                          <IconLayers />{" "}
                          {t("ReservationUnit.purposeCount", {
                            count: reservationUnit.purposes?.length,
                          })}
                        </Prop>
                      )}
                      <Prop>
                        <IconHome /> {reservationUnit.reservationUnitType.name}
                      </Prop>
                      {reservationUnit.maxPersons && (
                        <Prop>
                          <IconGroup /> {reservationUnit.maxPersons}
                        </Prop>
                      )}
                    </Props>
                  </div>
                </Ingress>
                <TitleContainer>
                  <H1 as="h2">{applicationRound?.name}</H1>
                  <StatusContainer>
                    <StatusCircle status={0} />
                    <div>
                      <H3>{t("ApplicationRound.amountReservedOfSpace")}</H3>
                      <div>
                        {t("ApplicationRound.amountReservedOfSpaceSubtext")}
                      </div>
                    </div>
                  </StatusContainer>
                </TitleContainer>
                <RecommendationCount
                  recommendationCount={recommendations.length}
                  unhandledCount={unhandledRecommendationCount}
                />
              </IngressContainer>
            </ContentContainer>
            <DataTable
              groups={prepareAllocationResults(recommendations)}
              setSelections={setSelections}
              hasGrouping={false}
              config={{
                filtering: true,
                rowFilters: true,
                selection: true,
              }}
              cellConfig={cellConfig}
              filterConfig={filterConfig}
              areAllRowsDisabled={recommendations.every(
                (row) =>
                  row.applicationEvent.status === "ignored" || row.accepted
              )}
              isRowDisabled={(row: AllocationResult) => {
                return (
                  ["ignored"].includes(row.applicationEvent.status) ||
                  row.accepted
                );
              }}
            />
            {selections?.length > 0 && (
              <SelectionActionBar
                selections={selections}
                options={[
                  {
                    label: t("Recommendation.actionMassApprove"),
                    value: "approve",
                  },
                  {
                    label: t("Recommendation.actionMassDecline"),
                    value: "decline",
                  },
                  {
                    label: t("Recommendation.actionMassIgnoreReservationUnit"),
                    value: "ignore",
                  },
                ]}
                callback={(action: string) => {
                  setIsSaving(true);
                  setErrorMsg(null);
                  modifyAllocationResults({
                    data: recommendations,
                    selections,
                    action,
                    setErrorMsg,
                    callback: () => {
                      setTimeout(() => setIsSaving(false), 1000);
                      fetchRecommendations(
                        applicationRound,
                        Number(reservationUnitId)
                      );
                    },
                  });
                }}
                isSaving={isSaving}
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

export default withMainMenu(RecommendationsByReservationUnit);
