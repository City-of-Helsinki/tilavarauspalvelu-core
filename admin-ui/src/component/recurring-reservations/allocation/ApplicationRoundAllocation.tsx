import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQuery as useApolloQuery } from "@apollo/client";
import { Select, Tabs } from "hds-react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { H1, Strongish } from "common/src/common/typography";
import {
  ApplicationType,
  QueryApplicationsArgs,
  Query,
  ApplicationEventType,
  ReservationUnitType,
  ApplicationStatus,
} from "common/types/gql-types";
import { getApplicationRound } from "../../../common/api";
import { OptionType } from "../../../common/types";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import { APPLICATIONS_BY_APPLICATION_ROUND_QUERY } from "../queries";
import { getFilteredApplicationEvents } from "../modules/applicationRoundAllocation";
import ApplicationRoundAllocationApplicationEvents from "./ApplicationRoundAllocationApplicationEvents";
import LinkPrev from "../../LinkPrev";
import { useAllocationContext } from "../../../context/AllocationContext";

type IParams = {
  applicationRoundId: string;
};

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-m) 0 var(--spacing-layout-xl);
`;

const Heading = styled(H1).attrs({ $legacy: true })`
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-s);
`;

const Ingress = styled.p`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xl);
`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-l);
  margin-bottom: var(--spacing-l);
  padding-bottom: var(--spacing-l);
  border-bottom: 1px solid var(--color-black-30);

  label {
    ${Strongish};
  }
`;

const ReservationUnits = styled(Tabs.TabList)`
  ${Strongish};
`;

const Tab = styled(Tabs.Tab)`
  && > span:before {
    z-index: 1;
  }
`;

function ApplicationRoundAllocation({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element {
  const { refreshApplicationEvents, setRefreshApplicationEvents } =
    useAllocationContext();
  const { notifyError } = useNotification();
  const [selectedReservationUnit, setSelectedReservationUnit] =
    useState<ReservationUnitType | null>(null);

  const [unitFilter, setUnitFilter] = useState<OptionType | null>(null);
  const [timeFilter, setTimeFilter] = useState<OptionType[]>([]);
  const [orderFilter, setOrderFilter] = useState<OptionType[]>([]);

  const { t } = useTranslation();

  const { data: applicationRound, isLoading: isRoundLoading } = useQuery({
    queryKey: ["applicationRound", { id: Number(applicationRoundId) }],
    queryFn: () => getApplicationRound({ id: Number(applicationRoundId) }),
    enabled: !!applicationRoundId,
    onError: (error: AxiosError) => {
      const msg =
        error.response?.status === 404
          ? "errors.applicationRoundNotFound"
          : "errors.errorFetchingData";
      notifyError(t(msg));
    },
  });

  // TODO autoload 2000 elements by default (same as in ReservationUnitFilter) or provide pagination
  const {
    loading: loadingApplications,
    data: applicationsData,
    refetch,
  } = useApolloQuery<Query, QueryApplicationsArgs>(
    APPLICATIONS_BY_APPLICATION_ROUND_QUERY,
    {
      variables: {
        applicationRound: applicationRoundId,
        status: [
          ApplicationStatus.Allocated,
          ApplicationStatus.Expired,
          ApplicationStatus.Handled,
          ApplicationStatus.InReview,
          ApplicationStatus.Received,
          ApplicationStatus.ReviewDone,
          ApplicationStatus.Sent,
        ],
      },
    }
  );

  const applications =
    applicationsData?.applications?.edges
      .map((e) => e?.node)
      ?.filter((x): x is ApplicationType => x != null) ?? [];

  const units = uniqBy(
    applications.flatMap((application) =>
      application?.applicationEvents?.flatMap((applicationEvent) =>
        applicationEvent?.eventReservationUnits
          ?.flatMap(
            (eventReservationUnit) =>
              eventReservationUnit?.reservationUnit?.unit
          )
          .filter((n) => !!n)
      )
    ),
    "pk"
  );

  const unitOptions = units.map((unit) => ({
    value: unit?.pk,
    label: unit?.nameFi,
  }));

  const timeOptions = [300, 200].map((n) => ({
    value: n,
    label: t(`ApplicationEvent.priority.${n}`),
  }));

  const orderOptions = [
    {
      value: 1,
      label: `1. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 2,
      label: `2. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 3,
      label: `3. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 4,
      label: `4. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
  ];

  const reservationUnits: ReservationUnitType[] = uniqBy(
    applications.flatMap((application) =>
      application?.applicationEvents?.flatMap((applicationEvent) =>
        applicationEvent?.eventReservationUnits
          ?.flatMap((evtRu) => evtRu?.reservationUnit)
          .filter((ru): ru is ReservationUnitType => ru != null)
      )
    ),
    "pk"
  )
    .filter((ru) => unitFilter?.value === ru?.unit?.pk)
    .filter((ru): ru is ReservationUnitType => ru != null);

  // NOTE rather sketchy: this is the context event listener
  useEffect(() => {
    if (refreshApplicationEvents) {
      refetch();
      setRefreshApplicationEvents(false);
    }
  }, [refetch, refreshApplicationEvents, setRefreshApplicationEvents]);

  const applicationEvents: ApplicationEventType[] =
    getFilteredApplicationEvents(
      applications,
      unitFilter,
      timeFilter,
      orderFilter,
      selectedReservationUnit || reservationUnits[0]
    );

  if (isRoundLoading || loadingApplications) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <LinkPrev />
      <Heading>{t("Allocation.allocationTitle")}</Heading>
      <Ingress>{applicationRound?.name}</Ingress>
      <Filters>
        <Select
          clearButtonAriaLabel={t("common.clearAllSelections")}
          label={t("Allocation.filters.unit")}
          onChange={(val: OptionType) => {
            setUnitFilter(val);
            setSelectedReservationUnit(null);
          }}
          options={unitOptions as OptionType[]}
          value={unitFilter}
          placeholder={t("Allocation.filters.selectUnits")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          onChange={(val) => {
            setTimeFilter(val);
          }}
          options={timeOptions}
          multiselect
          value={[...timeFilter]}
          label={t("Allocation.filters.schedules")}
          placeholder={t("Allocation.filters.selectSchedules")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          onChange={(val) => {
            setOrderFilter(val);
          }}
          label={t("Allocation.filters.reservationUnitOrder")}
          multiselect
          options={orderOptions}
          value={[...orderFilter]}
          placeholder={t("Allocation.filters.selectReservationUnitOrder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
      </Filters>
      <Tabs>
        <ReservationUnits>
          {reservationUnits?.map((reservationUnit) => (
            <Tab
              onClick={() => {
                setSelectedReservationUnit(reservationUnit);
              }}
              key={reservationUnit?.pk}
            >
              {reservationUnit?.nameFi}
            </Tab>
          ))}
        </ReservationUnits>
      </Tabs>
      {applicationEvents && applicationEvents.length && unitFilter ? (
        <ApplicationRoundAllocationApplicationEvents
          applications={applications}
          applicationEvents={applicationEvents}
          reservationUnit={selectedReservationUnit || reservationUnits[0]}
        />
      ) : null}
    </Wrapper>
  );
}

function ApplicationRoundAllocationRouted(): JSX.Element {
  const { applicationRoundId } = useParams<IParams>();
  const { t } = useTranslation();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("ApplicationRoundAllocationRouted.error")}</div>;
  }
  return (
    <ApplicationRoundAllocation
      applicationRoundId={Number(applicationRoundId)}
    />
  );
}

export default ApplicationRoundAllocationRouted;
