import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
  AllocationResult,
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
  formatDuration,
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
import IconBulletList from "../../images/icon_list-bullet.svg";
import StatusCircle from "../StatusCircle";
import { applicationRoundUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";

interface IRouteParams {
  [key: string]: string;
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
  applicationRound?: ApplicationRoundType
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
          return index && applicationRound ? (
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
              )} / ${formatDuration(aggregatedData?.durationTotal)}`,
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

function RecommendationsByReservationUnit({
  applicationRoundId,
  reservationUnitId,
}: {
  applicationRoundId: number;
  reservationUnitId: number;
}): JSX.Element | null {
  const { notifyError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [selections, setSelections] = useState<number[]>([]);

  const { t } = useTranslation();

  const { data: applicationRound, isLoading: applicationRoundLoading } =
    useQuery({
      queryKey: ["applicationRound", applicationRoundId],
      queryFn: async () =>
        getApplicationRound({ id: Number(applicationRoundId) }),
      onError: (error: AxiosError) => {
        const msg =
          error.response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        notifyError(t(msg));
      },
    });

  const { data: reservationUnit, isLoading: reservationUnitLoading } = useQuery(
    {
      queryKey: ["reservationUnit", reservationUnitId],
      queryFn: () => getReservationUnit(Number(reservationUnitId)),
      enabled: applicationRound != null,
      onError: () => {
        notifyError(t("errors.errorFetchingApplications"));
      },
    }
  );

  const {
    data: reservationUnitCapacity,
    isLoading: reservationUnitCapacityLoading,
  } = useQuery({
    queryKey: [
      "reservationUnitCapacity",
      reservationUnit?.id,
      applicationRound,
    ],
    queryFn: () => {
      const ar = applicationRound;
      const ruId = reservationUnit?.id;
      return getReservationUnitCapacity({
        reservationUnit: ruId ?? 0,
        periodStart: ar?.reservationPeriodBegin ?? "",
        periodEnd: ar?.reservationPeriodEnd ?? "",
      });
    },
    enabled: applicationRound != null && reservationUnit != null,
    onError: () => {
      console.error(t("errors.errorFetchingCapacity")); // eslint-disable-line no-console
    },
  });

  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ["recommendations", applicationRound, reservationUnitId],
    queryFn: async () => {
      const result = await getAllocationResults({
        applicationRoundId: applicationRound?.id ?? 0,
        serviceSectorId: applicationRound?.serviceSectorId ?? 0,
      });
      const filteredResult = processAllocationResult(result).filter(
        (n) => n.allocatedReservationUnitId === Number(reservationUnitId)
      );
      return filteredResult;
    },
    onError: () => {
      notifyError(t("errors.errorFetchingApplications"));
    },
  });

  const { data: reservationUnitCalendarUrl } = useQuery({
    queryKey: ["reservationUnitCalendarUrl", reservationUnit?.id ?? 0],
    queryFn: async () => {
      const res = await getReservationUnitCalendarUrl(reservationUnit?.id ?? 0);
      return res.calendarUrl;
    },
    enabled: reservationUnit != null,
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const unhandledRecommendationCount = recommendations
    ? recommendations.filter((n) =>
        ["created", "allocating", "allocated"].includes(
          n.applicationEvent.status
        )
      ).length
    : 0;

  const mainImage = reservationUnit?.images.find((n) => n.imageType === "main");

  const isLoading =
    applicationRoundLoading ||
    reservationUnitLoading ||
    recommendationsLoading ||
    reservationUnitCapacityLoading;
  if (isLoading) {
    return <Loader />;
  }

  const isApplicationRoundApproved =
    applicationRound && applicationRound.status === "approved";

  if (!applicationRound || !recommendations || !reservationUnit) {
    return null;
  }

  const filterConfig = getFilterConfig(recommendations ?? []);
  const cellConfig = getCellConfig(t, applicationRound ?? undefined);

  return (
    <>
      <ContentContainer style={{ paddingBottom: "var(--spacing-s)" }}>
        {applicationRoundId ? (
          <LinkPrev route={applicationRoundUrl(applicationRoundId)} />
        ) : null}
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
                  <IconLocation aria-hidden /> {reservationUnit.unit?.name.fi}
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
                      <H3>{t("ApplicationRound.amountReservedOfSpace")}</H3>
                      <div>
                        {t("ApplicationRound.amountReservedOfSpaceSubtext")}
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
            {applicationRound.status === "approved" && applicationRoundId ? (
              <ReservationLink
                to={`${applicationRoundUrl(
                  applicationRoundId
                )}/reservationUnit/${reservationUnitId}/reservations`}
              >
                <IconBulletList aria-hidden />
                {t("Reservation.showSummaryOfReservationsByReservationUnit")}
                <IconArrowRight aria-hidden />
              </ReservationLink>
            ) : null}
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
            ["ignored", "declined"].includes(row.applicationEvent.status) ||
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

            modifyAllocationResults({
              data: recommendations,
              selections,
              action,
              t,
              notifyError,
              callback: () => {
                setTimeout(() => setIsSaving(false), 1000);
                refetchRecommendations();
              },
            });
          }}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

function RecommendationsByReservationUnitRouted(): JSX.Element {
  const { applicationRoundId, reservationUnitId } = useParams<IRouteParams>(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();

  if (
    !applicationRoundId ||
    !reservationUnitId ||
    Number.isNaN(Number(applicationRoundId)) ||
    Number.isNaN(Number(reservationUnitId))
  ) {
    return <div>{t("errors.router.invalidPath")}</div>;
  }

  return (
    <Wrapper>
      <RecommendationsByReservationUnit
        applicationRoundId={Number(applicationRoundId)}
        reservationUnitId={Number(reservationUnitId)}
      />
    </Wrapper>
  );
}

export default RecommendationsByReservationUnitRouted;
