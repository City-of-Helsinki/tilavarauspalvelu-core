import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import styled from "styled-components";
import {
  IconLocation,
  IconLayers,
  IconHome,
  IconGroup,
  IconArrowRight,
  IconCalendarPlus,
} from "hds-react";
import trim from "lodash/trim";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { TFunction } from "i18next";
import { H1, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { BasicLink, InlineRowLink } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import withMainMenu from "../withMainMenu";
import {
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
  AllocationResult,
  ReservationUnit,
  ReservationUnitCapacity,
} from "../../common/types";
import DataTable, { CellConfig } from "../DataTable";
import {
  getAllocationResults,
  getApplicationRound,
  getReservationUnit,
  getReservationUnitCapacity,
  getReservationUnitCalendarUrl,
} from "../../common/api";
import Loader from "../Loader";
import {
  formatNumber,
  getNormalizedApplicationEventStatus,
  localizedValue,
  parseAddress,
  parseAgeGroups,
  parseDuration,
} from "../../common/util";
import {
  prepareAllocationResults,
  processAllocationResult,
  modifyAllocationResults,
} from "../../common/AllocationResult";
import StatusCell from "../StatusCell";
import RecommendationCount from "./RecommendationCount";
import i18n from "../../i18n";
import SelectionActionBar from "../SelectionActionBar";
import { ReactComponent as IconBulletList } from "../../images/icon_list-bullet.svg";
import StatusCircle from "../StatusCircle";
import { applicationRoundUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";

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

const Title = styled(H1).attrs({ $legacy: true })`
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
    margin-bottom: var(--spacing-l);
  }
`;

const CalendarLink = styled.a`
  color: var(--color-bus);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  font-size: var(--fontsize-body-s);
  display: flex;
  align-items: center;
  gap: var(--spacing-s);

  svg {
    color: var(--color-black);
  }
`;

const BottomContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: space-between;
  }
`;

const ReservationLink = styled(BasicLink)`
  display: inline-flex;
  gap: var(--spacing-s);
  justify-content: space-between;
  margin-top: var(--spacing-m);
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
        transform: ({
          applicantType,
          applicantName,
          organisationId,
          organisationName,
          applicantId,
        }: AllocationResult) => {
          const index = organisationId || applicantId;
          const title =
            applicantType === "individual" ? applicantName : organisationName;
          return index ? (
            <InlineRowLink
              to={`${applicationRoundUrl(applicationRound.id)}/${
                organisationId ? "organisation" : "applicant"
              }/${index}`}
            >
              {title}
            </InlineRowLink>
          ) : (
            title || ""
          );
        },
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
        key: "aggregatedData.appliedReservationsTotal",
        transform: ({ aggregatedData }: AllocationResult) => (
          <>
            {trim(
              `${formatNumber(
                aggregatedData?.reservationsTotal,
                t("common.volumeUnit")
              )} / ${parseDuration(aggregatedData?.durationTotal)}`,
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
        ? `${applicationRoundUrl(
            applicationRound.id
          )}/recommendation/${applicationEventScheduleId}`
        : "";
    },
  };
};

const getFilterConfig = (
  recommendations: AllocationResult[]
): DataFilterConfig[] => {
  const purposes = uniq(
    recommendations.map((rec: AllocationResult) => rec.applicationEvent.purpose)
  ).sort();
  const statuses = uniq(
    recommendations.map((rec: AllocationResult) => rec.applicationEvent.status)
  );
  const reservationUnits = uniq(
    recommendations.map((rec: AllocationResult) => rec.unitName)
  ).sort();
  const baskets = uniqBy(
    recommendations,
    (rec: AllocationResult) => rec.basketName
  )
    .filter((rec: AllocationResult) => rec.basketName)
    .map((rec: AllocationResult) => ({
      title: `${rec.basketOrderNumber}. ${rec.basketName}`,
      value: rec.basketName,
    }));

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
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AllocationResult[] | null
  >(null);
  const [reservationUnit, setReservationUnit] =
    useState<ReservationUnit | null>(null);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [reservationUnitCapacity, setReservationUnitCapacity] =
    useState<ReservationUnitCapacity | null>(null);
  const [reservationUnitCalendarUrl, setReservationUnitCalendarUrl] = useState<
    string | null
  >(null);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [selections, setSelections] = useState<number[]>([]);

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
      notifyError(t("errors.errorFetchingApplications"));
      setIsLoading(false);
    }
  };

  const fetchReservationUnitCapacity = async (
    ruId: number,
    ar: ApplicationRoundType
  ) => {
    try {
      const result = await getReservationUnitCapacity({
        reservationUnit: ruId,
        periodStart: ar.reservationPeriodBegin,
        periodEnd: ar.reservationPeriodEnd,
      });
      setReservationUnitCapacity(result);
    } catch (error) {
      console.error(t("errors.errorFetchingCapacity")); // eslint-disable-line no-console
    }
  };

  const fetchReservationUnitCalendarUrl = async (ruId: number) => {
    try {
      const result = await getReservationUnitCalendarUrl(ruId);
      setReservationUnitCalendarUrl(result.calendarUrl);
    } catch (error) {
      notifyError(t("errors.errorFetchingData"));
    }
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: Number(applicationRoundId),
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

    fetchApplicationRound();
  }, [applicationRoundId, notifyError, t]);

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
        notifyError(t("errors.errorFetchingApplications"));
        setIsLoading(false);
      }
    };

    fetchReservationUnit(Number(reservationUnitId));
  }, [notifyError, recommendations, reservationUnitId, t]);

  useEffect(() => {
    if (reservationUnit && applicationRound) {
      fetchReservationUnitCapacity(reservationUnit.id, applicationRound);
      fetchReservationUnitCalendarUrl(reservationUnit.id);
    }
  }, [reservationUnit, applicationRound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recommendations && reservationUnit && applicationRound) {
      setIsLoading(false);
    }
  }, [recommendations, reservationUnit, applicationRound]);

  const unhandledRecommendationCount = recommendations
    ? recommendations.filter((n) =>
        ["created", "allocating", "allocated"].includes(
          n.applicationEvent.status
        )
      ).length
    : 0;

  const mainImage = reservationUnit?.images.find((n) => n.imageType === "main");

  if (isLoading) {
    return <Loader />;
  }

  const isApplicationRoundApproved =
    applicationRound && ["approved"].includes(applicationRound.status);

  return (
    <Wrapper>
      {applicationRound &&
        recommendations &&
        reservationUnit &&
        filterConfig &&
        cellConfig && (
          <>
            <ContentContainer style={{ paddingBottom: "var(--spacing-s)" }}>
              <LinkPrev route={applicationRoundUrl(applicationRoundId)} />
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
                        <IconLocation aria-hidden />{" "}
                        {reservationUnit.unit?.name.fi}
                      </Prop>
                      {reservationUnit.purposes && (
                        <Prop>
                          <IconLayers aria-hidden />{" "}
                          {t("ReservationUnit.purposeCount", {
                            count: reservationUnit.purposes?.length,
                          })}
                        </Prop>
                      )}
                      <Prop>
                        <IconHome aria-hidden />{" "}
                        {reservationUnit.reservationUnitType.name}
                      </Prop>
                      {reservationUnit.maxPersons && (
                        <Prop>
                          <IconGroup aria-hidden /> {reservationUnit.maxPersons}
                        </Prop>
                      )}
                    </Props>
                  </div>
                </Ingress>
                <TitleContainer>
                  <div>
                    <H1 as="h2" $legacy>
                      {applicationRound?.name}
                    </H1>
                    {["approved"].includes(applicationRound?.status) &&
                      reservationUnitCalendarUrl && (
                        <CalendarLink
                          href={reservationUnitCalendarUrl}
                          target="_blank"
                        >
                          <IconCalendarPlus aria-hidden />{" "}
                          {t("ReservationUnit.downloadSpaceCalendar")}
                        </CalendarLink>
                      )}
                  </div>
                  <StatusContainer>
                    {reservationUnitCapacity?.reservationDurationTotal &&
                      reservationUnitCapacity?.hourCapacity && (
                        <>
                          <StatusCircle
                            status={
                              (reservationUnitCapacity.reservationDurationTotal /
                                reservationUnitCapacity.hourCapacity) *
                              100
                            }
                          />
                          <div>
                            <H3>
                              {t("ApplicationRound.amountReservedOfSpace")}
                            </H3>
                            <div>
                              {t(
                                "ApplicationRound.amountReservedOfSpaceSubtext"
                              )}
                            </div>
                          </div>
                        </>
                      )}
                  </StatusContainer>
                </TitleContainer>
                <BottomContainer>
                  <RecommendationCount
                    recommendationCount={recommendations.length}
                    unhandledCount={unhandledRecommendationCount}
                  />
                  {["approved"].includes(applicationRound.status) && (
                    <ReservationLink
                      to={`${applicationRoundUrl(
                        applicationRoundId
                      )}/reservationUnit/${reservationUnitId}/reservations`}
                    >
                      <IconBulletList aria-hidden />
                      {t(
                        "Reservation.showSummaryOfReservationsByReservationUnit"
                      )}
                      <IconArrowRight aria-hidden />
                    </ReservationLink>
                  )}
                </BottomContainer>
              </IngressContainer>
            </ContentContainer>
            <DataTable
              groups={prepareAllocationResults(recommendations)}
              setSelections={setSelections}
              hasGrouping={false}
              config={{
                filtering: true,
                rowFilters: true,
                selection: !isApplicationRoundApproved,
              }}
              cellConfig={cellConfig}
              filterConfig={filterConfig}
              areAllRowsDisabled={recommendations.every(
                (row) =>
                  row.applicationEvent.status === "ignored" ||
                  row.accepted ||
                  row.declined
              )}
              isRowDisabled={(row: AllocationResult) => {
                return (
                  ["ignored", "declined"].includes(
                    row.applicationEvent.status
                  ) || row.accepted
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

                  modifyAllocationResults({
                    data: recommendations,
                    selections,
                    action,
                    t,
                    notifyError,
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
    </Wrapper>
  );
}

export default withMainMenu(RecommendationsByReservationUnit);
