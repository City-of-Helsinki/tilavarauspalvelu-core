import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Select, Tabs } from "hds-react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { getApplicationRound } from "../../../common/api";
import {
  ApplicationType,
  QueryApplicationsArgs,
  Query,
  ApplicationEventType,
  ReservationUnitType,
  ApplicationStatus,
} from "../../../common/gql-types";
import { ApplicationRound, OptionType } from "../../../common/types";
import { useNotification } from "../../../context/NotificationContext";
import { H1 } from "../../../styles/new-typography";
import Loader from "../../Loader";
import { APPLICATIONS_BY_APPLICATION_ROUND_QUERY } from "../queries";
import { getFilteredApplicationEvents } from "../modules/applicationRoundAllocation";
import ApplicationRoundAllocationApplicationEvents from "./ApplicationRoundAllocationApplicationEvents";
import LinkPrev from "../../LinkPrev";
import { FontMedium } from "../../../styles/typography";
import { useAllocationContext } from "../../../context/AllocationContext";

type Props = {
  applicationRoundId: string;
};

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-m) 0 var(--spacing-layout-xl);
`;

const Heading = styled(H1)`
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
    ${FontMedium};
  }
`;

const ReservationUnits = styled(Tabs.TabList)`
  ${FontMedium};
`;

const Tab = styled(Tabs.Tab)`
  && > span:before {
    z-index: 1;
  }
`;

function ApplicationRoundAllocation(): JSX.Element {
  const { refreshApplicationEvents, setRefreshApplicationEvents } =
    useAllocationContext();

  const [isLoading, setIsLoading] = useState(true);
  const { notifyError } = useNotification();
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRound | null>(null);
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [applicationEvents, setApplicationEvents] = useState<
    ApplicationEventType[] | null
  >(null);
  const [selectedReservationUnit, setSelectedReservationUnit] =
    useState<ReservationUnitType | null>(null);

  const [unitFilter, setUnitFilter] = useState<OptionType | null>(null);
  const [timeFilter, setTimeFilter] = useState<OptionType[]>([]);
  const [orderFilter, setOrderFilter] = useState<OptionType[]>([]);

  const { applicationRoundId } = useParams<Props>();
  const { t } = useTranslation();

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRoundId, t]);

  const {
    loading: loadingApplications,
    data: applicationsData,
    refetch,
  } = useQuery<Query, QueryApplicationsArgs>(
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

  useEffect(() => {
    const loadedApplications =
      applicationsData?.applications?.edges.map((n) => n?.node) || [];
    setApplications(loadedApplications as ApplicationType[]);
  }, [applicationsData]);

  const units = useMemo(
    () =>
      uniqBy(
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
      ),
    [applications]
  );

  const unitOptions = useMemo(() => {
    return units.map((unit) => ({
      value: unit?.pk,
      label: unit?.nameFi,
    }));
  }, [units]);

  const timeOptions = useMemo(
    () =>
      [300, 200].map((n) => ({
        value: n,
        label: t(`ApplicationEvent.priority.${n}`),
      })),
    [t]
  );

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

  const reservationUnits: ReservationUnitType[] = useMemo(
    () =>
      uniqBy(
        applications.flatMap((application) =>
          application?.applicationEvents?.flatMap((applicationEvent) =>
            applicationEvent?.eventReservationUnits?.flatMap(
              (eventReservationUnit) =>
                eventReservationUnit?.reservationUnit as ReservationUnitType
            )
          )
        ),
        "pk"
      ).filter(
        (reservationUnit) => unitFilter?.value === reservationUnit?.unit?.pk
      ) as ReservationUnitType[],
    [applications, unitFilter]
  );

  useEffect(() => {
    if (refreshApplicationEvents) {
      refetch();
      setRefreshApplicationEvents(false);
    }
  }, [refetch, refreshApplicationEvents, setRefreshApplicationEvents]);

  useEffect(() => {
    setApplicationEvents(
      getFilteredApplicationEvents(
        applications,
        unitFilter,
        timeFilter,
        orderFilter,
        selectedReservationUnit || reservationUnits[0]
      ) as ApplicationEventType[]
    );
  }, [
    applications,
    unitFilter,
    timeFilter,
    orderFilter,
    selectedReservationUnit,
    reservationUnits,
  ]);

  if (isLoading || loadingApplications) {
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
      {Object.prototype.hasOwnProperty.call(applicationEvents, "length") &&
      unitFilter ? (
        <ApplicationRoundAllocationApplicationEvents
          applications={applications}
          applicationEvents={applicationEvents}
          reservationUnit={selectedReservationUnit || reservationUnits[0]}
        />
      ) : null}
    </Wrapper>
  );
}

export default ApplicationRoundAllocation;
